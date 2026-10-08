import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole } from "./lib/auth";

export const getPostAnalysis = query({
  args: {
    organizationId: v.id("organizations"),
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const analysis = await ctx.db
      .query("postAnalysis")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .first();

    return analysis;
  },
});

export const listPendingPosts = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_org_analysisStatus", (q) =>
        q.eq("organizationId", args.organizationId).eq("analysisStatus", "pending")
      )
      .take(args.limit ?? 20);

    return posts;
  },
});

export const savePostAnalysis = mutation({
  args: {
    organizationId: v.id("organizations"),
    postId: v.id("socialPosts"),
    primaryTopic: v.optional(v.string()),
    topics: v.optional(v.array(v.string())),
    contentFormat: v.optional(v.string()),
    contentPurpose: v.optional(v.string()),
    tone: v.optional(v.array(v.string())),
    hookType: v.optional(v.string()),
    ctaType: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    narrativeStyle: v.optional(v.string()),
    containsStatistic: v.optional(v.boolean()),
    containsQuote: v.optional(v.boolean()),
    containsPerson: v.optional(v.boolean()),
    containsQuestion: v.optional(v.boolean()),
    containsExternalLink: v.optional(v.boolean()),
    campaignCandidate: v.optional(v.string()),
    summary: v.optional(v.string()),
    explanation: v.optional(v.string()),
    analysisVersion: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();

    // Check existing analysis
    const existing = await ctx.db
      .query("postAnalysis")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        primaryTopic: args.primaryTopic,
        topics: args.topics,
        contentFormat: args.contentFormat,
        contentPurpose: args.contentPurpose,
        tone: args.tone,
        hookType: args.hookType,
        ctaType: args.ctaType,
        targetAudience: args.targetAudience,
        narrativeStyle: args.narrativeStyle,
        containsStatistic: args.containsStatistic,
        containsQuote: args.containsQuote,
        containsPerson: args.containsPerson,
        containsQuestion: args.containsQuestion,
        containsExternalLink: args.containsExternalLink,
        campaignCandidate: args.campaignCandidate,
        summary: args.summary,
        explanation: args.explanation,
        analysisVersion: args.analysisVersion,
        analyzedAt: now,
      });
    } else {
      await ctx.db.insert("postAnalysis", {
        organizationId: args.organizationId,
        postId: args.postId,
        primaryTopic: args.primaryTopic,
        topics: args.topics,
        contentFormat: args.contentFormat,
        contentPurpose: args.contentPurpose,
        tone: args.tone,
        hookType: args.hookType,
        ctaType: args.ctaType,
        targetAudience: args.targetAudience,
        narrativeStyle: args.narrativeStyle,
        containsStatistic: args.containsStatistic,
        containsQuote: args.containsQuote,
        containsPerson: args.containsPerson,
        containsQuestion: args.containsQuestion,
        containsExternalLink: args.containsExternalLink,
        campaignCandidate: args.campaignCandidate,
        summary: args.summary,
        explanation: args.explanation,
        analysisVersion: args.analysisVersion,
        analyzedAt: now,
      });
    }

    // Mark post status as complete
    await ctx.db.patch(args.postId, {
      analysisStatus: "complete",
      updatedAt: now,
    });

    return true;
  },
});
