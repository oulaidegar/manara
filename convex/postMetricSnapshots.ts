import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember } from "./lib/auth";

export const listSnapshotsForPost = query({
  args: {
    organizationId: v.id("organizations"),
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const snapshots = await ctx.db
      .query("postMetricSnapshots")
      .withIndex("by_post_capturedAt", (q) => q.eq("postId", args.postId))
      .order("asc")
      .collect();

    return snapshots;
  },
});

export const recordSnapshot = mutation({
  args: {
    organizationId: v.id("organizations"),
    postId: v.id("socialPosts"),
    capturedAt: v.optional(v.number()),
    views: v.optional(v.number()),
    impressions: v.optional(v.number()),
    reach: v.optional(v.number()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    saves: v.optional(v.number()),
    reposts: v.optional(v.number()),
    clicks: v.optional(v.number()),
    watchTimeSeconds: v.optional(v.number()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const capturedAt = args.capturedAt ?? Date.now();

    const snapshotId = await ctx.db.insert("postMetricSnapshots", {
      organizationId: args.organizationId,
      postId: args.postId,
      capturedAt,
      views: args.views,
      impressions: args.impressions,
      reach: args.reach,
      likes: args.likes,
      comments: args.comments,
      shares: args.shares,
      saves: args.saves,
      reposts: args.reposts,
      clicks: args.clicks,
      watchTimeSeconds: args.watchTimeSeconds,
      provider: args.provider,
    });

    return snapshotId;
  },
});
