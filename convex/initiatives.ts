import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole, requireUser } from "./lib/auth";
import { logAuditEvent } from "./lib/audit";

export const listInitiatives = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const enriched = await Promise.all(
      initiatives.map(async (init) => {
        const goals = await ctx.db
          .query("goals")
          .withIndex("by_initiative", (q) => q.eq("initiativeId", init._id))
          .collect();

        const contentLinks = await ctx.db
          .query("initiativeContentLinks")
          .withIndex("by_initiative", (q) => q.eq("initiativeId", init._id))
          .collect();

        const outcomes = await ctx.db
          .query("outcomes")
          .withIndex("by_initiative", (q) => q.eq("initiativeId", init._id))
          .collect();

        // Calculate rollups
        let totalImpressions = 0;
        let totalReach = 0;
        let totalShares = 0;
        let totalSaves = 0;

        for (const link of contentLinks) {
          const item = await ctx.db.get(link.contentItemId);
          if (item?.metrics) {
            totalImpressions += item.metrics.impressions ?? 0;
            totalReach += item.metrics.reach ?? 0;
            totalShares += item.metrics.shares ?? 0;
            totalSaves += item.metrics.saves ?? 0;
          }
        }

        const meaningfulActions = totalShares + totalSaves;
        const meaningfulRate =
          totalImpressions > 0
            ? parseFloat(((meaningfulActions / totalImpressions) * 1000).toFixed(1))
            : 0;

        return {
          ...init,
          goalCount: goals.length,
          contentCount: contentLinks.length,
          outcomeCount: outcomes.length,
          performance: {
            totalImpressions,
            totalReach,
            totalShares,
            totalSaves,
            meaningfulActions,
            meaningfulRate,
          },
        };
      })
    );

    return enriched;
  },
});

export const getInitiativeWorkspace = query({
  args: {
    organizationId: v.id("organizations"),
    initiativeId: v.id("initiatives"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    const init = await ctx.db.get(args.initiativeId);
    if (!init || init.organizationId !== args.organizationId) {
      return null;
    }

    // 1. Goals with Indicators
    const rawGoals = await ctx.db
      .query("goals")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", init._id))
      .collect();

    const goals = await Promise.all(
      rawGoals.map(async (goal) => {
        const indicators = await ctx.db
          .query("goalIndicators")
          .withIndex("by_goal", (q) => q.eq("goalId", goal._id))
          .collect();
        return {
          ...goal,
          indicators,
        };
      })
    );

    // 2. Linked Content Items with metrics
    const contentLinks = await ctx.db
      .query("initiativeContentLinks")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", init._id))
      .collect();

    const contentItems = await Promise.all(
      contentLinks.map(async (l) => {
        const item = await ctx.db.get(l.contentItemId);
        if (!item) return null;
        return {
          ...item,
          linkId: l._id,
          linkedAt: l.createdAt,
        };
      })
    );

    const validContent = contentItems.filter((c): c is NonNullable<typeof c> => c !== null);

    // Rollup analytics
    let totalImpressions = 0;
    let totalReach = 0;
    let totalViews = 0;
    let totalShares = 0;
    let totalSaves = 0;
    let totalClicks = 0;

    const formatTally: Record<string, number> = {};
    const platformTally: Record<string, number> = {};

    for (const item of validContent) {
      const imp = item.metrics?.impressions ?? 0;
      const reach = item.metrics?.reach ?? 0;
      const views = item.metrics?.views ?? 0;
      const shares = item.metrics?.shares ?? 0;
      const saves = item.metrics?.saves ?? 0;
      const clicks = item.metrics?.clicks ?? 0;

      totalImpressions += imp;
      totalReach += reach;
      totalViews += views;
      totalShares += shares;
      totalSaves += saves;
      totalClicks += clicks;

      formatTally[item.contentType] = (formatTally[item.contentType] ?? 0) + 1;
      platformTally[item.provider] = (platformTally[item.provider] ?? 0) + 1;
    }

    const meaningfulActions = totalShares + totalSaves + totalClicks;
    const meaningfulRate =
      totalImpressions > 0
        ? parseFloat(((meaningfulActions / totalImpressions) * 1000).toFixed(1))
        : 0;

    // 3. Outcomes with Evidence
    const rawOutcomes = await ctx.db
      .query("outcomes")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", init._id))
      .collect();

    const outcomes = await Promise.all(
      rawOutcomes.map(async (outcome) => {
        const evidence = await ctx.db
          .query("evidenceItems")
          .withIndex("by_outcome", (q) => q.eq("outcomeId", outcome._id))
          .collect();
        return {
          ...outcome,
          evidence,
        };
      })
    );

    return {
      initiative: init,
      goals,
      content: validContent,
      outcomes,
      performance: {
        totalImpressions,
        totalReach,
        totalViews,
        totalShares,
        totalSaves,
        totalClicks,
        meaningfulActions,
        meaningfulRate,
        formatTally,
        platformTally,
      },
    };
  },
});

export const listAvailableContentForInitiative = query({
  args: {
    organizationId: v.id("organizations"),
    initiativeId: v.id("initiatives"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    // Get IDs already linked
    const existingLinks = await ctx.db
      .query("initiativeContentLinks")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
      .collect();

    const linkedIds = new Set(existingLinks.map((l) => l.contentItemId));

    // Get organization content items
    const allItems = await ctx.db
      .query("contentItems")
      .withIndex("by_organization_publishedAt", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(100);

    return allItems
      .filter((i) => !linkedIds.has(i._id))
      .map((i) => ({
        _id: i._id,
        title: i.title,
        provider: i.provider,
        contentType: i.contentType,
        publishedAt: i.publishedAt,
        metrics: i.metrics,
      }));
  },
});

export const createInitiative = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    primaryGoal: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    startDate: v.optional(v.number()),
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
    const initiativeId = await ctx.db.insert("initiatives", {
      ...args,
      status: "active",
      ownerUserId: user._id,
      startDate: args.startDate ?? now,
      createdAt: now,
      updatedAt: now,
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "create_initiative",
      entityType: "initiative",
      entityId: initiativeId,
      metadata: { name: args.name },
    });

    return initiativeId;
  },
});

export const updateInitiativeStatus = mutation({
  args: {
    organizationId: v.id("organizations"),
    initiativeId: v.id("initiatives"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const init = await ctx.db.get(args.initiativeId);
    if (!init || init.organizationId !== args.organizationId) {
      throw new Error("Initiative not found or tenant mismatch");
    }

    await ctx.db.patch(args.initiativeId, {
      status: args.status,
      updatedAt: Date.now(),
      archivedAt: args.status === "archived" ? Date.now() : undefined,
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "update_initiative_status",
      entityType: "initiative",
      entityId: args.initiativeId,
      metadata: { newStatus: args.status },
    });
  },
});

export const linkContent = mutation({
  args: {
    organizationId: v.id("organizations"),
    initiativeId: v.id("initiatives"),
    contentItemId: v.id("contentItems"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const existing = await ctx.db
      .query("initiativeContentLinks")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
      .filter((q) => q.eq(q.field("contentItemId"), args.contentItemId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("initiativeContentLinks", {
      organizationId: args.organizationId,
      initiativeId: args.initiativeId,
      contentItemId: args.contentItemId,
      createdAt: Date.now(),
      createdBy: user._id,
    });
  },
});

export const unlinkContent = mutation({
  args: {
    organizationId: v.id("organizations"),
    initiativeId: v.id("initiatives"),
    contentItemId: v.id("contentItems"),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const link = await ctx.db
      .query("initiativeContentLinks")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
      .filter((q) => q.eq(q.field("contentItemId"), args.contentItemId))
      .first();

    if (link) {
      await ctx.db.delete(link._id);
    }
  },
});

export const createGoal = mutation({
  args: {
    organizationId: v.id("organizations"),
    initiativeId: v.id("initiatives"),
    title: v.string(),
    description: v.optional(v.string()),
    goalType: v.union(
      v.literal("awareness"),
      v.literal("engagement"),
      v.literal("audience_growth"),
      v.literal("behavior_change"),
      v.literal("media_attention"),
      v.literal("policy_change"),
      v.literal("institutional_change"),
      v.literal("capacity"),
      v.literal("fundraising"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();
    return await ctx.db.insert("goals", {
      organizationId: args.organizationId,
      initiativeId: args.initiativeId,
      title: args.title,
      description: args.description,
      goalType: args.goalType,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addGoalIndicator = mutation({
  args: {
    organizationId: v.id("organizations"),
    goalId: v.id("goals"),
    metricKey: v.string(),
    description: v.string(),
    baselineValue: v.number(),
    targetValue: v.number(),
    currentValue: v.optional(v.number()),
    direction: v.union(
      v.literal("increase"),
      v.literal("decrease"),
      v.literal("maintain"),
      v.literal("qualitative")
    ),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    return await ctx.db.insert("goalIndicators", {
      organizationId: args.organizationId,
      goalId: args.goalId,
      metricKey: args.metricKey,
      description: args.description,
      baselineValue: args.baselineValue,
      targetValue: args.targetValue,
      currentValue: args.currentValue ?? args.baselineValue,
      direction: args.direction,
    });
  },
});

export const updateIndicatorCurrentValue = mutation({
  args: {
    organizationId: v.id("organizations"),
    indicatorId: v.id("goalIndicators"),
    currentValue: v.number(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const indicator = await ctx.db.get(args.indicatorId);
    if (!indicator || indicator.organizationId !== args.organizationId) {
      throw new Error("Indicator not found");
    }

    await ctx.db.patch(args.indicatorId, {
      currentValue: args.currentValue,
    });
  },
});
