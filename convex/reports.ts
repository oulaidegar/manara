import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole, requireUser } from "./lib/auth";
import { logAuditEvent } from "./lib/audit";

export const listReports = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(v.string()),
    reportType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();

    let filtered = reports;
    if (args.status && args.status !== "all") {
      filtered = filtered.filter((r) => r.status === args.status);
    }
    if (args.reportType && args.reportType !== "all") {
      filtered = filtered.filter((r) => r.reportType === args.reportType);
    }

    const enriched = await Promise.all(
      filtered.map(async (r) => {
        const blocks = await ctx.db
          .query("reportBlocks")
          .withIndex("by_report", (q) => q.eq("reportId", r._id))
          .collect();

        const author = await ctx.db.get(r.createdBy);
        return {
          ...r,
          blockCount: blocks.length,
          authorName: author?.name ?? "Team Member",
        };
      })
    );

    return enriched;
  },
});

export const getReport = query({
  args: {
    organizationId: v.id("organizations"),
    reportId: v.id("reports"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const report = await ctx.db.get(args.reportId);
    if (!report || report.organizationId !== args.organizationId) {
      return null;
    }

    const org = await ctx.db.get(args.organizationId);

    const blocks = await ctx.db
      .query("reportBlocks")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    blocks.sort((a, b) => a.position - b.position);

    const author = await ctx.db.get(report.createdBy);

    return {
      report,
      organizationName: org?.name ?? "Organization",
      organizationType: org?.organizationType ?? "ngo",
      blocks,
      authorName: author?.name ?? "Team Member",
      authorEmail: author?.email ?? "",
    };
  },
});

export const getPublicReport = query({
  args: {
    reportId: v.id("reports"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report || report.status !== "published") {
      return null;
    }

    const org = await ctx.db.get(report.organizationId);

    const blocks = await ctx.db
      .query("reportBlocks")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    blocks.sort((a, b) => a.position - b.position);

    const author = await ctx.db.get(report.createdBy);

    return {
      report,
      organizationName: org?.name ?? "Organization",
      organizationType: org?.organizationType ?? "ngo",
      blocks,
      authorName: author?.name ?? "Team Member",
    };
  },
});

export const createReport = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    reportType: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("annual"),
      v.literal("campaign"),
      v.literal("donor"),
      v.literal("board"),
      v.literal("editorial"),
      v.literal("custom")
    ),
    periodStart: v.number(),
    periodEnd: v.number(),
    initiativeId: v.optional(v.id("initiatives")),
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

    // 1. Fetch content items for snapshot calculation
    const allContent = await ctx.db
      .query("contentItems")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Filter by period
    let periodContent = allContent.filter(
      (it) => it.publishedAt >= args.periodStart && it.publishedAt <= args.periodEnd
    );

    // If filtered by initiative, intersect
    let initiativeTitle: string | null = null;
    if (args.initiativeId) {
      const init = await ctx.db.get(args.initiativeId);
      initiativeTitle = init?.name ?? null;

      const links = await ctx.db
        .query("initiativeContentLinks")
        .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId!))
        .collect();
      const linkedContentIds = new Set(links.map((l) => l.contentItemId));
      periodContent = periodContent.filter((it) => linkedContentIds.has(it._id));
    }

    // Compute live performance rollups to freeze into snapshot
    let totalImpressions = 0;
    let totalReach = 0;
    let totalViews = 0;
    let totalShares = 0;
    let totalSaves = 0;
    let totalClicks = 0;

    for (const item of periodContent) {
      if (item.metrics) {
        totalImpressions += item.metrics.impressions ?? 0;
        totalReach += item.metrics.reach ?? 0;
        totalViews += item.metrics.views ?? 0;
        totalShares += item.metrics.shares ?? 0;
        totalSaves += item.metrics.saves ?? 0;
        totalClicks += item.metrics.clicks ?? 0;
      }
    }

    const meaningfulActions = totalShares + totalSaves + totalClicks;
    const meaningfulRate =
      totalImpressions > 0
        ? Number(((meaningfulActions / totalImpressions) * 1000).toFixed(1))
        : 0;

    // Top 3 outputs by meaningful actions
    const sortedOutputs = [...periodContent]
      .sort((a, b) => {
        const maA = (a.metrics?.shares ?? 0) + (a.metrics?.saves ?? 0);
        const maB = (b.metrics?.shares ?? 0) + (b.metrics?.saves ?? 0);
        return maB - maA;
      })
      .slice(0, 3)
      .map((it) => ({
        id: it._id,
        title: it.title,
        contentType: it.contentType,
        provider: it.provider,
        publishedAt: it.publishedAt,
        impressions: it.metrics?.impressions ?? 0,
        reach: it.metrics?.reach ?? 0,
        shares: it.metrics?.shares ?? 0,
        saves: it.metrics?.saves ?? 0,
      }));

    // 2. Fetch outcomes & attached evidence items
    let outcomes = await ctx.db
      .query("outcomes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    if (args.initiativeId) {
      outcomes = outcomes.filter((o) => o.initiativeId === args.initiativeId);
    } else {
      outcomes = outcomes.filter(
        (o) => o.occurredAt >= args.periodStart && o.occurredAt <= args.periodEnd
      );
    }

    // Enrich each outcome with attached evidence items
    const snapshotOutcomes = await Promise.all(
      outcomes.map(async (o) => {
        const evidence = await ctx.db
          .query("evidenceItems")
          .withIndex("by_outcome", (q) => q.eq("outcomeId", o._id))
          .collect();

        return {
          id: o._id,
          title: o.title,
          description: o.description,
          changeType: o.changeType,
          significance: o.significance,
          contributionStatement: o.contributionStatement,
          contributionStrength: o.contributionStrength,
          verificationStatus: o.verificationStatus,
          occurredAt: o.occurredAt,
          evidenceItems: evidence.map((e) => ({
            id: e._id,
            title: e.title,
            type: e.type,
            publisher: e.publisher,
            url: e.url,
            excerpt: e.excerpt,
          })),
        };
      })
    );

    // 3. Fetch validated practices (Learning Engine)
    const practices = await ctx.db
      .query("practices")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const snapshotPractices = await Promise.all(
      practices.map(async (p) => {
        const evals = await ctx.db
          .query("practiceEvaluations")
          .withIndex("by_practice", (q) => q.eq("practiceId", p._id))
          .order("desc")
          .take(1);
        const latest = evals[0] ?? null;

        return {
          id: p._id,
          title: p.title,
          hypothesis: p.hypothesis,
          metricKey: p.metricKey,
          status: p.status,
          difference: latest?.difference ?? 0,
          confidenceLabel: latest?.confidenceLabel ?? "insufficient_data",
          matchingSampleSize: latest?.matchingSampleSize ?? 0,
        };
      })
    );

    // 4. Create the report record
    const reportId = await ctx.db.insert("reports", {
      organizationId: args.organizationId,
      title: args.title,
      description: args.description,
      reportType: args.reportType,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      status: "published",
      publishedAt: now,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    // 5. Build and insert tamper-proof report blocks (Section 16 & Section 39)

    // Block 1: Executive Summary
    await ctx.db.insert("reportBlocks", {
      organizationId: args.organizationId,
      reportId,
      type: "executive_summary",
      position: 1,
      generatedText:
        args.description ||
        `This report documents communications reach, public engagement, and verified external outcomes achieved between ${new Date(
          args.periodStart
        ).toLocaleDateString()} and ${new Date(
          args.periodEnd
        ).toLocaleDateString()}.${
          initiativeTitle ? ` Special focus on initiative: ${initiativeTitle}.` : ""
        } Across ${periodContent.length} published outputs, the organization reached approximately ${totalReach.toLocaleString()} unique individuals and recorded ${snapshotOutcomes.length} documented real-world changes backed by corroborating artifacts.`,
      snapshotAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Block 2: KPI Performance Scorecard (Frozen Snapshot)
    await ctx.db.insert("reportBlocks", {
      organizationId: args.organizationId,
      reportId,
      type: "kpi_scorecard",
      position: 2,
      snapshotData: {
        totalImpressions,
        totalReach,
        totalViews,
        totalShares,
        totalSaves,
        meaningfulActions,
        meaningfulRate,
        outputsCount: periodContent.length,
        outcomesCount: snapshotOutcomes.length,
      },
      snapshotAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Block 3: Content Highlights
    if (sortedOutputs.length > 0) {
      await ctx.db.insert("reportBlocks", {
        organizationId: args.organizationId,
        reportId,
        type: "content_highlights",
        position: 3,
        snapshotData: {
          items: sortedOutputs,
        },
        snapshotAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Block 4: Documented Real-World Outcomes & Evidence
    if (snapshotOutcomes.length > 0) {
      await ctx.db.insert("reportBlocks", {
        organizationId: args.organizationId,
        reportId,
        type: "outcome",
        position: 4,
        snapshotData: {
          outcomes: snapshotOutcomes,
        },
        snapshotAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Block 5: Learning Practices & Organizational Memory
    if (snapshotPractices.length > 0) {
      await ctx.db.insert("reportBlocks", {
        organizationId: args.organizationId,
        reportId,
        type: "learning",
        position: 5,
        snapshotData: {
          practices: snapshotPractices,
        },
        snapshotAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Block 6: Methodology & Contribution Standard Note
    await ctx.db.insert("reportBlocks", {
      organizationId: args.organizationId,
      reportId,
      type: "methodology",
      position: 6,
      generatedText:
        "Radar Contribution Standard: In accordance with Section 2 of Radar's institutional principles, all observed outcomes are documented as plausible contributions based on verifiable external citations rather than assertions of sole causation. All data points in this document represent an immutable frozen snapshot captured at publication.",
      snapshotAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Audit log
    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "create_report",
      entityType: "report",
      entityId: reportId,
      metadata: { title: args.title, reportType: args.reportType },
    });

    return reportId;
  },
});

export const updateReportStatus = mutation({
  args: {
    organizationId: v.id("organizations"),
    reportId: v.id("reports"),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
    ]);

    const report = await ctx.db.get(args.reportId);
    if (!report || report.organizationId !== args.organizationId) {
      throw new Error("Report not found");
    }

    await ctx.db.patch(args.reportId, {
      status: args.status,
      updatedAt: Date.now(),
      publishedAt: args.status === "published" ? Date.now() : report.publishedAt,
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "update_report_status",
      entityType: "report",
      entityId: args.reportId,
      metadata: { status: args.status },
    });
  },
});

export const deleteReport = mutation({
  args: {
    organizationId: v.id("organizations"),
    reportId: v.id("reports"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
    ]);

    const report = await ctx.db.get(args.reportId);
    if (!report || report.organizationId !== args.organizationId) {
      throw new Error("Report not found");
    }

    // Delete associated report blocks
    const blocks = await ctx.db
      .query("reportBlocks")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    for (const b of blocks) {
      await ctx.db.delete(b._id);
    }

    await ctx.db.delete(args.reportId);

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "delete_report",
      entityType: "report",
      entityId: args.reportId,
      metadata: { title: report.title },
    });
  },
});
