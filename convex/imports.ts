import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole, requireUser } from "./lib/auth";
import { logAuditEvent } from "./lib/audit";

export const listImportRuns = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    const limit = args.limit ?? 20;

    const runs = await ctx.db
      .query("importRuns")
      .withIndex("by_organization_createdAt", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(limit);

    const enriched = await Promise.all(
      runs.map(async (run) => {
        const user = await ctx.db.get(run.createdBy);
        return {
          ...run,
          createdByName: user?.name ?? "Team Member",
        };
      })
    );

    return enriched;
  },
});

export const getImportRun = query({
  args: {
    organizationId: v.id("organizations"),
    runId: v.id("importRuns"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    const run = await ctx.db.get(args.runId);
    if (!run || run.organizationId !== args.organizationId) {
      return null;
    }
    const user = await ctx.db.get(run.createdBy);
    return {
      ...run,
      createdByName: user?.name ?? "Team Member",
    };
  },
});

export const executeImport = mutation({
  args: {
    organizationId: v.id("organizations"),
    fileName: v.string(),
    sourcePlatform: v.string(),
    rows: v.array(
      v.object({
        date: v.string(),
        platform: v.optional(v.string()),
        externalId: v.optional(v.string()),
        url: v.optional(v.string()),
        title: v.string(),
        text: v.optional(v.string()),
        contentType: v.optional(v.string()),
        impressions: v.optional(v.number()),
        reach: v.optional(v.number()),
        views: v.optional(v.number()),
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        shares: v.optional(v.number()),
        saves: v.optional(v.number()),
        clicks: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, ["owner", "admin", "analyst"]);

    const now = Date.now();
    let importedCount = 0;
    let updatedCount = 0;
    const errors: Array<{ rowNumber: number; field?: string; message: string; rawData?: string }> = [];

    // Pre-fetch all organization content items to support fast memory-deduplication
    const existingItems = await ctx.db
      .query("contentItems")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(1000);

    const itemsByExternalId = new Map<string, (typeof existingItems)[0]>();
    const itemsByUrl = new Map<string, (typeof existingItems)[0]>();
    const itemsByKey = new Map<string, (typeof existingItems)[0]>();

    for (const item of existingItems) {
      if (item.externalId) itemsByExternalId.set(item.externalId, item);
      if (item.externalUrl) itemsByUrl.set(item.externalUrl, item);
      const key = `${item.provider}_${item.publishedAt}_${item.title.toLowerCase().trim()}`;
      itemsByKey.set(key, item);
    }

    for (let i = 0; i < args.rows.length; i++) {
      const row = args.rows[i];
      const rowNumber = i + 1;

      // Validate date
      const timestamp = Date.parse(row.date);
      if (isNaN(timestamp)) {
        errors.push({
          rowNumber,
          field: "date",
          message: `Invalid date format: "${row.date}"`,
          rawData: JSON.stringify(row),
        });
        continue;
      }

      const provider = (row.platform || args.sourcePlatform || "general").toLowerCase();
      const rawType = (row.contentType || "post").toLowerCase();
      const validTypes = [
        "post",
        "video",
        "short_video",
        "article",
        "report",
        "investigation",
        "newsletter",
        "podcast",
        "event",
        "research",
        "press_release",
        "other",
      ] as const;
      type ValidContentType = (typeof validTypes)[number];

      const isContentType = (val: string): val is ValidContentType =>
        (validTypes as readonly string[]).includes(val);

      const contentType: ValidContentType = isContentType(rawType) ? rawType : "post";

      // Deduplication Matching Algorithm (Section 21)
      let match = null;
      if (row.externalId && itemsByExternalId.has(row.externalId)) {
        match = itemsByExternalId.get(row.externalId);
      } else if (row.url && itemsByUrl.has(row.url)) {
        match = itemsByUrl.get(row.url);
      } else {
        const key = `${provider}_${timestamp}_${row.title.toLowerCase().trim()}`;
        if (itemsByKey.has(key)) {
          match = itemsByKey.get(key);
        }
      }

      const metricsObj = {
        impressions: row.impressions,
        reach: row.reach,
        views: row.views,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        saves: row.saves,
        clicks: row.clicks,
      };

      if (match) {
        // Update existing item metrics
        await ctx.db.patch(match._id, {
          metrics: {
            ...match.metrics,
            ...metricsObj,
          },
          updatedAt: now,
        });
        updatedCount++;
      } else {
        // Insert new content item
        const newItemId = await ctx.db.insert("contentItems", {
          organizationId: args.organizationId,
          provider,
          origin: "csv_import",
          contentType,
          title: row.title,
          text: row.text,
          externalId: row.externalId,
          externalUrl: row.url,
          publishedAt: timestamp,
          metrics: metricsObj,
          createdAt: now,
          updatedAt: now,
        });

        // Insert metric observations for granular analytics tracking
        if (row.impressions !== undefined) {
          await ctx.db.insert("contentMetricObservations", {
            organizationId: args.organizationId,
            contentItemId: newItemId,
            metricKey: "impressions",
            providerMetricName: "raw_impressions",
            value: row.impressions,
            observedAt: now,
          });
        }

        if (row.shares !== undefined) {
          await ctx.db.insert("contentMetricObservations", {
            organizationId: args.organizationId,
            contentItemId: newItemId,
            metricKey: "shares",
            providerMetricName: "raw_shares",
            value: row.shares,
            observedAt: now,
          });
        }

        importedCount++;
      }
    }

    const runStatus = errors.length === args.rows.length ? "failed" : "completed";

    // Record import run
    const runId = await ctx.db.insert("importRuns", {
      organizationId: args.organizationId,
      fileName: args.fileName,
      sourcePlatform: args.sourcePlatform,
      status: runStatus,
      rowCount: args.rows.length,
      importedCount,
      updatedCount,
      skippedCount: 0,
      errorCount: errors.length,
      errors: errors.slice(0, 50),
      createdBy: user._id,
      createdAt: now,
      completedAt: Date.now(),
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "execute_csv_import",
      entityType: "importRun",
      entityId: runId,
      metadata: {
        fileName: args.fileName,
        importedCount,
        updatedCount,
        errorCount: errors.length,
      },
    });

    return {
      runId,
      rowCount: args.rows.length,
      importedCount,
      updatedCount,
      errorCount: errors.length,
      status: runStatus,
    };
  },
});
