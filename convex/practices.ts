import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole, requireUser } from "./lib/auth";
import { logAuditEvent } from "./lib/audit";

export const listPractices = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const practices = await ctx.db
      .query("practices")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();

    const filtered = args.status && args.status !== "all"
      ? practices.filter((p) => p.status === args.status)
      : practices;

    const enriched = await Promise.all(
      filtered.map(async (practice) => {
        const evaluations = await ctx.db
          .query("practiceEvaluations")
          .withIndex("by_practice", (q) => q.eq("practiceId", practice._id))
          .order("desc")
          .collect();

        const latestEvaluation = evaluations[0] ?? null;

        return {
          ...practice,
          latestEvaluation,
          evaluationCount: evaluations.length,
        };
      })
    );

    return enriched;
  },
});

export const getPractice = query({
  args: {
    organizationId: v.id("organizations"),
    practiceId: v.id("practices"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const practice = await ctx.db.get(args.practiceId);
    if (!practice || practice.organizationId !== args.organizationId) {
      return null;
    }

    const evaluations = await ctx.db
      .query("practiceEvaluations")
      .withIndex("by_practice", (q) => q.eq("practiceId", practice._id))
      .order("desc")
      .collect();

    return {
      practice,
      evaluations,
    };
  },
});

export const createPractice = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    hypothesis: v.string(),
    metricKey: v.string(),
    status: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();
    const practiceId = await ctx.db.insert("practices", {
      organizationId: args.organizationId,
      title: args.title,
      description: args.description,
      hypothesis: args.hypothesis,
      metricKey: args.metricKey,
      status: args.status,
      source: args.source,
      createdAt: now,
      updatedAt: now,
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "create_practice",
      entityType: "practice",
      entityId: practiceId,
      metadata: { title: args.title },
    });

    return practiceId;
  },
});

export const evaluatePractice = mutation({
  args: {
    organizationId: v.id("organizations"),
    practiceId: v.id("practices"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
    ]);

    const practice = await ctx.db.get(args.practiceId);
    if (!practice || practice.organizationId !== args.organizationId) {
      throw new Error("Practice not found");
    }

    // Fetch all content items for this organization
    const contentItems = await ctx.db
      .query("contentItems")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Partition content items heuristically or based on keywords/title
    // For demonstration and realistic simulation:
    // Items that mention keywords in title/text or have high engagement matching hypothesis
    const keywords = practice.title.toLowerCase().split(" ").filter((w) => w.length > 3);
    const matching = contentItems.filter((item) => {
      const text = (item.title + " " + (item.text ?? "")).toLowerCase();
      return keywords.some((k) => text.includes(k));
    });

    const nonMatching = contentItems.filter((item) => !matching.includes(item));

    const getMetricVal = (item: (typeof contentItems)[0], key: string) => {
      const m = item.metrics;
      if (!m) return 0;
      if (key === "shares") return m.shares ?? 0;
      if (key === "saves") return m.saves ?? 0;
      if (key === "reach") return m.reach ?? 0;
      if (key === "views") return m.views ?? 0;
      if (key === "clicks") return m.clicks ?? 0;
      return (m.shares ?? 0) + (m.saves ?? 0);
    };

    const matchingSampleSize = matching.length;
    const comparisonSampleSize = nonMatching.length;

    let matchingMetricValue = 0;
    if (matchingSampleSize > 0) {
      const sum = matching.reduce((acc, it) => acc + getMetricVal(it, practice.metricKey), 0);
      matchingMetricValue = Math.round(sum / matchingSampleSize);
    }

    let comparisonMetricValue = 0;
    if (comparisonSampleSize > 0) {
      const sum = nonMatching.reduce((acc, it) => acc + getMetricVal(it, practice.metricKey), 0);
      comparisonMetricValue = Math.round(sum / comparisonSampleSize);
    }

    const difference =
      comparisonMetricValue > 0
        ? Math.round(((matchingMetricValue - comparisonMetricValue) / comparisonMetricValue) * 100)
        : matchingMetricValue > 0
        ? 100
        : 0;

    let confidenceLabel:
      | "insufficient_data"
      | "weak_signal"
      | "positive_signal"
      | "negative_signal"
      | "strong_signal";

    if (matchingSampleSize < 3) {
      confidenceLabel = "insufficient_data";
    } else if (difference > 20 && matchingSampleSize >= 8) {
      confidenceLabel = "strong_signal";
    } else if (difference > 10) {
      confidenceLabel = "positive_signal";
    } else if (difference < -10) {
      confidenceLabel = "negative_signal";
    } else {
      confidenceLabel = "weak_signal";
    }

    const now = Date.now();
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    const evaluationId = await ctx.db.insert("practiceEvaluations", {
      organizationId: args.organizationId,
      practiceId: args.practiceId,
      periodStart: ninetyDaysAgo,
      periodEnd: now,
      matchingSampleSize,
      comparisonSampleSize,
      matchingMetricValue,
      comparisonMetricValue,
      difference,
      confidenceLabel,
      calculatedAt: now,
    });

    // Update practice status to validated if positive/strong
    if (confidenceLabel === "strong_signal" || confidenceLabel === "positive_signal") {
      await ctx.db.patch(args.practiceId, {
        status: "validated",
        updatedAt: now,
      });
    }

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "evaluate_practice",
      entityType: "practice",
      entityId: args.practiceId,
      metadata: { confidenceLabel, difference },
    });

    return evaluationId;
  },
});

export const deletePractice = mutation({
  args: {
    organizationId: v.id("organizations"),
    practiceId: v.id("practices"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
    ]);

    const practice = await ctx.db.get(args.practiceId);
    if (!practice || practice.organizationId !== args.organizationId) {
      throw new Error("Practice not found");
    }

    // Delete child evaluations
    const evaluations = await ctx.db
      .query("practiceEvaluations")
      .withIndex("by_practice", (q) => q.eq("practiceId", args.practiceId))
      .collect();

    for (const ev of evaluations) {
      await ctx.db.delete(ev._id);
    }

    await ctx.db.delete(args.practiceId);

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "delete_practice",
      entityType: "practice",
      entityId: args.practiceId,
      metadata: { title: practice.title },
    });
  },
});
