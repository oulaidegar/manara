import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember } from "./lib/auth";

export const listSyncJobs = query({
  args: {
    organizationId: v.id("organizations"),
    accountId: v.optional(v.id("socialAccounts")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    let jobs = await ctx.db
      .query("syncJobs")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();

    if (args.accountId) {
      jobs = jobs.filter((j) => j.accountId === args.accountId);
    }

    if (args.limit) {
      jobs = jobs.slice(0, args.limit);
    }

    return jobs;
  },
});

export const getLatestSyncJob = query({
  args: {
    organizationId: v.id("organizations"),
    accountId: v.id("socialAccounts"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const job = await ctx.db
      .query("syncJobs")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .order("desc")
      .first();

    return job;
  },
});

export const createSyncJob = mutation({
  args: {
    organizationId: v.id("organizations"),
    accountId: v.id("socialAccounts"),
    type: v.union(
      v.literal("profile_sync"),
      v.literal("post_backfill"),
      v.literal("post_sync"),
      v.literal("metric_refresh"),
      v.literal("ai_analysis")
    ),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("syncJobs", {
      organizationId: args.organizationId,
      accountId: args.accountId,
      type: args.type,
      status: "queued",
      attempts: 0,
      createdAt: Date.now(),
    });

    return jobId;
  },
});

export const updateSyncJobStatus = mutation({
  args: {
    jobId: v.id("syncJobs"),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed")
    ),
    recordsProcessed: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const patch: {
      status: "queued" | "running" | "complete" | "failed";
      startedAt?: number;
      completedAt?: number;
      recordsProcessed?: number;
      error?: string;
    } = {
      status: args.status,
    };

    if (args.status === "running") {
      patch.startedAt = now;
    } else if (args.status === "complete" || args.status === "failed") {
      patch.completedAt = now;
    }

    if (args.recordsProcessed !== undefined) {
      patch.recordsProcessed = args.recordsProcessed;
    }

    if (args.error !== undefined) {
      patch.error = args.error;
    }

    await ctx.db.patch(args.jobId, patch);
  },
});
