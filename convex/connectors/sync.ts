import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole } from "../lib/auth";
import { logAuditEvent } from "../lib/audit";
import { NotFoundError } from "../lib/errors";
import { youtubeConnector } from "./youtube";
import { linkedInConnector } from "./linkedin";
import { metaConnector } from "./meta";
import { tikTokConnector } from "./tiktok";
import { PlatformConnector } from "./shared/types";

const connectors: Record<string, PlatformConnector> = {
  youtube: youtubeConnector,
  linkedin: linkedInConnector,
  meta: metaConnector,
  tiktok: tikTokConnector,
};

export const listSyncRuns = query({
  args: {
    organizationId: v.id("organizations"),
    accountId: v.optional(v.id("socialAccounts")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    const limit = args.limit ?? 20;

    let syncs;
    if (args.accountId) {
      syncs = await ctx.db
        .query("syncRuns")
        .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
        .order("desc")
        .take(limit);
    } else {
      syncs = await ctx.db
        .query("syncRuns")
        .withIndex("by_organization_createdAt", (q) =>
          q.eq("organizationId", args.organizationId)
        )
        .order("desc")
        .take(limit);
    }

    // Enrich with account names
    const enriched = await Promise.all(
      syncs.map(async (run) => {
        let accountName = undefined;
        let accountHandle = undefined;
        if (run.accountId) {
          const account = await ctx.db.get(run.accountId);
          if (account) {
            accountName = account.name;
            accountHandle = account.handle;
          }
        }
        return {
          ...run,
          accountName,
          accountHandle,
        };
      })
    );

    return enriched;
  },
});

export const runAccountSync = mutation({
  args: {
    organizationId: v.id("organizations"),
    accountId: v.id("socialAccounts"),
    syncType: v.union(
      v.literal("content"),
      v.literal("metrics"),
      v.literal("full"),
      v.literal("manual")
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
    ]);

    const account = await ctx.db.get(args.accountId);
    if (!account || account.organizationId !== args.organizationId) {
      throw new NotFoundError("SocialAccount", args.accountId);
    }

    const now = Date.now();
    const connector = connectors[account.provider];

    // Create sync run record in 'running' state
    const syncRunId = await ctx.db.insert("syncRuns", {
      organizationId: args.organizationId,
      accountId: args.accountId,
      provider: account.provider,
      syncType: args.syncType,
      status: "running",
      startedAt: now,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      attempt: 1,
      createdAt: now,
    });

    try {
      if (!connector) {
        throw new Error(`Connector for provider ${account.provider} not supported`);
      }

      // Execute connector synchronization
      const syncResult = await connector.syncContent({
        externalAccountId: account.externalAccountId,
      });

      let createdCount = 0;
      let updatedCount = 0;

      // Ingest normalized content
      for (const item of syncResult.items) {
        // Deduplication Tier 1: Check by externalId + provider
        const existing = await ctx.db
          .query("contentItems")
          .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
          .filter((q) =>
            q.and(
              q.eq(q.field("provider"), account.provider),
              q.eq(q.field("externalId"), item.externalId)
            )
          )
          .first();

        let contentItemId;
        if (existing) {
          await ctx.db.patch(existing._id, {
            title: item.title,
            text: item.text,
            metrics: item.metrics,
            updatedAt: now,
          });
          contentItemId = existing._id;
          updatedCount++;
        } else {
          contentItemId = await ctx.db.insert("contentItems", {
            organizationId: args.organizationId,
            accountId: args.accountId,
            provider: account.provider,
            externalId: item.externalId,
            externalUrl: item.externalUrl,
            origin: "social",
            contentType: item.contentType,
            title: item.title,
            text: item.text,
            publishedAt: item.publishedAt,
            mediaType: item.mediaType,
            durationSeconds: item.durationSeconds,
            metrics: item.metrics,
            createdAt: now,
            updatedAt: now,
          });
          createdCount++;
        }

        // Record observations for each metric
        if (item.metrics) {
          for (const [key, val] of Object.entries(item.metrics)) {
            if (typeof val === "number") {
              await ctx.db.insert("contentMetricObservations", {
                organizationId: args.organizationId,
                contentItemId,
                metricKey: key,
                providerMetricName: key,
                value: val,
                observedAt: now,
              });
            }
          }
        }
      }

      // Mark sync as successful
      await ctx.db.patch(syncRunId, {
        status: "success",
        completedAt: Date.now(),
        recordsProcessed: syncResult.items.length,
        recordsCreated: createdCount,
        recordsUpdated: updatedCount,
      });

      await logAuditEvent(ctx, {
        organizationId: args.organizationId,
        actorUserId: user._id,
        action: "run_account_sync",
        entityType: "sync_run",
        entityId: syncRunId,
        metadata: {
          provider: account.provider,
          recordsCreated: createdCount,
          recordsUpdated: updatedCount,
        },
      });

      return {
        syncRunId,
        status: "success",
        recordsCreated: createdCount,
        recordsUpdated: updatedCount,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sync execution failed";
      await ctx.db.patch(syncRunId, {
        status: "failed",
        completedAt: Date.now(),
        errorMessage: message,
      });

      return {
        syncRunId,
        status: "failed",
        errorMessage: message,
      };
    }
  },
});
