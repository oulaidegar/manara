import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole } from "./lib/auth";
import { NotFoundError } from "./lib/errors";

export const listCampaigns = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    if (campaigns.length === 0) return [];

    // Batch fetch campaign content links to eliminate N+1 queries
    const allLinks = await ctx.db
      .query("campaignContent")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const uniquePostIds = Array.from(new Set(allLinks.map((l) => l.postId)));
    const postsList = await Promise.all(uniquePostIds.map((id) => ctx.db.get(id)));
    const postMap = new Map<string, NonNullable<(typeof postsList)[0]>>();
    for (const p of postsList) {
      if (p) postMap.set(p._id, p);
    }

    const linksByCampaign = new Map<string, typeof allLinks>();
    for (const link of allLinks) {
      const campId = link.campaignId;
      const list = linksByCampaign.get(campId) ?? [];
      list.push(link);
      linksByCampaign.set(campId, list);
    }

    const enriched = campaigns.map((camp) => {
      const links = linksByCampaign.get(camp._id) ?? [];
      const validPosts = links
        .map((l) => postMap.get(l.postId))
        .filter((p): p is NonNullable<typeof p> => p !== undefined && p !== null);

      const totalViews = validPosts.reduce((sum, p) => sum + (p.views ?? 0), 0);
      const totalShares = validPosts.reduce((sum, p) => sum + (p.shares ?? 0), 0);
      const totalEngagement = validPosts.reduce((sum, p) => sum + (p.engagementCount ?? 0), 0);

      const avgEngagementRate =
        validPosts.length > 0
          ? Number(
              (
                validPosts.reduce((sum, p) => sum + (p.engagementRate ?? 0), 0) /
                validPosts.length
              ).toFixed(4)
            )
          : 0;

      return {
        ...camp,
        postCount: validPosts.length,
        totalViews,
        totalShares,
        totalEngagement,
        avgEngagementRate,
      };
    });

    return enriched;
  },
});

export const getCampaign = query({
  args: {
    organizationId: v.id("organizations"),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.organizationId !== args.organizationId) {
      throw new NotFoundError("Campaign", args.campaignId);
    }

    const links = await ctx.db
      .query("campaignContent")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
      .collect();

    const posts = await Promise.all(
      links.map(async (link) => {
        const post = await ctx.db.get(link.postId);
        return {
          ...post,
          linkId: link._id,
          associationType: link.associationType,
        };
      })
    );

    const validPosts = posts.filter((p) => p !== null && p._id !== undefined);

    const totalViews = validPosts.reduce((sum, p) => sum + (p.views ?? 0), 0);
    const totalShares = validPosts.reduce((sum, p) => sum + (p.shares ?? 0), 0);
    const totalEngagement = validPosts.reduce((sum, p) => sum + (p.engagementCount ?? 0), 0);

    const avgEngagementRate =
      validPosts.length > 0
        ? Number(
            (
              validPosts.reduce((sum, p) => sum + (p.engagementRate ?? 0), 0) /
              validPosts.length
            ).toFixed(4)
          )
        : 0;

    // Platform breakdown
    const platformBreakdown: Record<string, { count: number; views: number; shares: number }> = {};
    const formatBreakdown: Record<string, number> = {};

    for (const p of validPosts) {
      const plat = p.platform || "other";
      if (!platformBreakdown[plat]) {
        platformBreakdown[plat] = { count: 0, views: 0, shares: 0 };
      }
      platformBreakdown[plat].count++;
      platformBreakdown[plat].views += p.views ?? 0;
      platformBreakdown[plat].shares += p.shares ?? 0;

      const fmt = p.postType || "post";
      formatBreakdown[fmt] = (formatBreakdown[fmt] ?? 0) + 1;
    }

    // Impact Events for this campaign (Section 36 & 42)
    const impactEvents = await ctx.db
      .query("impactEvents")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
      .collect();

    const enrichedImpactEvents = await Promise.all(
      impactEvents.map(async (ev) => {
        const evidence = await ctx.db
          .query("impactEvidence")
          .withIndex("by_impactEvent", (q) => q.eq("impactEventId", ev._id))
          .collect();
        return {
          ...ev,
          evidence,
        };
      })
    );

    return {
      campaign,
      posts: validPosts,
      totalViews,
      totalShares,
      totalEngagement,
      avgEngagementRate,
      postCount: validPosts.length,
      platformBreakdown,
      formatBreakdown,
      impactEvents: enrichedImpactEvents,
    };
  },
});

export const unlinkPostFromCampaign = mutation({
  args: {
    organizationId: v.id("organizations"),
    campaignId: v.id("campaigns"),
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const existing = await ctx.db
      .query("campaignContent")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});

export const listUnlinkedPosts = query({
  args: {
    organizationId: v.id("organizations"),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const links = await ctx.db
      .query("campaignContent")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const linkedPostIds = new Set(links.map((l) => l.postId));

    const allPosts = await ctx.db
      .query("socialPosts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(100);

    return allPosts.filter((p) => !linkedPostIds.has(p._id));
  },
});

export const createCampaignImpactEvent = mutation({
  args: {
    organizationId: v.id("organizations"),
    campaignId: v.id("campaigns"),
    type: v.union(
      v.literal("media_mention"),
      v.literal("institutional_mention"),
      v.literal("policy_discussion"),
      v.literal("public_response"),
      v.literal("formal_commitment"),
      v.literal("institutional_action"),
      v.literal("policy_change"),
      v.literal("other")
    ),
    title: v.string(),
    summary: v.string(),
    occurredAt: v.optional(v.number()),
    confidence: v.number(),
    status: v.union(
      v.literal("candidate"),
      v.literal("verified"),
      v.literal("rejected")
    ),
    evidenceUrl: v.string(),
    evidenceTitle: v.optional(v.string()),
    publisher: v.optional(v.string()),
    evidenceText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();
    const eventId = await ctx.db.insert("impactEvents", {
      organizationId: args.organizationId,
      campaignId: args.campaignId,
      type: args.type,
      title: args.title,
      summary: args.summary,
      occurredAt: args.occurredAt ?? now,
      discoveredAt: now,
      confidence: args.confidence,
      status: args.status,
    });

    await ctx.db.insert("impactEvidence", {
      organizationId: args.organizationId,
      impactEventId: eventId,
      sourceUrl: args.evidenceUrl,
      sourceTitle: args.evidenceTitle,
      publisher: args.publisher,
      evidenceText: args.evidenceText,
      retrievedAt: now,
      sourceType: "web",
    });

    return eventId;
  },
});

export const createCampaign = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    objectives: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();
    const campaignId = await ctx.db.insert("campaigns", {
      organizationId: args.organizationId,
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      objectives: args.objectives,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });

    return campaignId;
  },
});

export const linkPostToCampaign = mutation({
  args: {
    organizationId: v.id("organizations"),
    campaignId: v.id("campaigns"),
    postId: v.id("socialPosts"),
    associationType: v.optional(
      v.union(
        v.literal("manual"),
        v.literal("ai_suggested"),
        v.literal("rule_based")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    // Check if already linked
    const existing = await ctx.db
      .query("campaignContent")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
      .first();

    if (existing) return existing._id;

    const linkId = await ctx.db.insert("campaignContent", {
      organizationId: args.organizationId,
      campaignId: args.campaignId,
      postId: args.postId,
      associationType: args.associationType ?? "manual",
      createdAt: Date.now(),
    });

    return linkId;
  },
});
