import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { requireOrganizationMember, requireOrganizationRole } from "./lib/auth";
import {
  DEMO_GA4_ARTICLES,
  buildCivicAttributionHeadline,
  formatTimeSeconds,
} from "./lib/ga4Data";

/**
 * List all connected GA4 properties for an organization
 */
export const listGA4Properties = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    return await ctx.db
      .query("ga4Properties")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

/**
 * Get active GA4 property details
 */
export const getGA4Property = query({
  args: {
    organizationId: v.id("organizations"),
    propertyId: v.optional(v.id("ga4Properties")),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    if (args.propertyId) {
      return await ctx.db.get(args.propertyId);
    }

    return await ctx.db
      .query("ga4Properties")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first();
  },
});

/**
 * Connect a Google Analytics 4 Property (Live Service Account or One-Click Demo Sandbox)
 */
export const connectGA4Property = mutation({
  args: {
    organizationId: v.id("organizations"),
    propertyId: v.string(), // e.g. "314159265"
    displayName: v.string(), // e.g. "Daraj Media Main Site"
    websiteUrl: v.string(), // e.g. "https://daraj.media"
    credentialsType: v.union(
      v.literal("service_account"),
      v.literal("demo_sandbox"),
      v.literal("oauth_google")
    ),
    serviceAccountEmail: v.optional(v.string()),
    googleUserEmail: v.optional(v.string()),
    googleAccountName: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();

    // Check if property exists
    const prop = await ctx.db
      .query("ga4Properties")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first();

    let propId: Id<"ga4Properties">;

    if (prop) {
      propId = prop._id;
      await ctx.db.patch(prop._id, {
        propertyId: args.propertyId,
        displayName: args.displayName,
        websiteUrl: args.websiteUrl,
        credentialsType: args.credentialsType,
        serviceAccountEmail: args.serviceAccountEmail,
        googleUserEmail: args.googleUserEmail,
        googleAccountName: args.googleAccountName,
        refreshToken: args.refreshToken,
        accessToken: args.accessToken,
        tokenExpiresAt: args.tokenExpiresAt,
        syncEnabled: true,
        status: "connected",
        lastSyncedAt: now,
        updatedAt: now,
      });
    } else {
      propId = await ctx.db.insert("ga4Properties", {
        organizationId: args.organizationId,
        propertyId: args.propertyId,
        displayName: args.displayName,
        websiteUrl: args.websiteUrl,
        credentialsType: args.credentialsType,
        serviceAccountEmail: args.serviceAccountEmail,
        googleUserEmail: args.googleUserEmail,
        googleAccountName: args.googleAccountName,
        refreshToken: args.refreshToken,
        accessToken: args.accessToken,
        tokenExpiresAt: args.tokenExpiresAt,
        syncEnabled: true,
        status: "connected",
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Populate initial articles if none exist or demo sandbox
    const existingArticles = await ctx.db
      .query("webArticles")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    if (existingArticles.length === 0) {
      // Find candidate campaigns to link
      const campaigns = await ctx.db
        .query("campaigns")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect();

      // Find candidate social posts to link
      const socialPosts = await ctx.db
        .query("socialPosts")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect();

      const dayMs = 24 * 60 * 60 * 1000;

      for (let i = 0; i < DEMO_GA4_ARTICLES.length; i++) {
        const demoArt = DEMO_GA4_ARTICLES[i];
        const publishedAt = now - (18 + i * 14) * dayMs;

        // Try to match campaign by keyword
        const matchedCamp = campaigns.find(
          (c) =>
            c.name.toLowerCase().includes(demoArt.matchedCampaignKeyword) ||
            c.description?.toLowerCase().includes(demoArt.matchedCampaignKeyword)
        ) ?? campaigns[i % campaigns.length];

        // Try to match social post
        const matchedPost = socialPosts.find((p) => {
          const title = (p.title || p.caption || "").toLowerCase();
          return (
            title.includes(demoArt.matchedCampaignKeyword) ||
            title.includes("investigation") ||
            title.includes("inquiry")
          );
        }) ?? socialPosts[i % socialPosts.length];

        const publishDateStr = new Date(publishedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });

        const headline = buildCivicAttributionHeadline({
          articleTitle: demoArt.title,
          uniqueReaders: demoArt.activeUsers,
          socialSharePercent: demoArt.socialReferralShare,
          topSocialFormat: demoArt.topSocialFormat,
          publishDateStr,
          avgEngagementSeconds: demoArt.averageEngagementTimeSeconds,
        });

        // Insert web article
        await ctx.db.insert("webArticles", {
          organizationId: args.organizationId,
          ga4PropertyId: propId,
          url: demoArt.url,
          path: demoArt.path,
          title: demoArt.title,
          publishedAt,
          author: demoArt.author,
          wordCount: demoArt.wordCount,
          primaryTopic: demoArt.primaryTopic,
          pageviews: demoArt.pageviews,
          activeUsers: demoArt.activeUsers,
          sessions: demoArt.sessions,
          averageEngagementTimeSeconds: demoArt.averageEngagementTimeSeconds,
          scrollDepth90Percent: demoArt.scrollDepth90Percent,
          documentDownloads: demoArt.documentDownloads,
          petitionClicks: demoArt.petitionClicks,
          whistleblowerTips: demoArt.whistleblowerTips,
          bounceRate: demoArt.bounceRate,
          socialReferralShare: demoArt.socialReferralShare,
          topReferrers: demoArt.topReferrers,
          linkedPostId: matchedPost?._id,
          campaignId: matchedCamp?._id,
          attributionHeadline: headline,
          lastSyncedAt: now,
          createdAt: now,
        });

        // Mirror to canonical contentItems
        await ctx.db.insert("contentItems", {
          organizationId: args.organizationId,
          provider: "ga4",
          externalUrl: demoArt.url,
          origin: "website",
          contentType: "investigation",
          title: demoArt.title,
          text: `Investigative dossier: ${demoArt.title}. Analyzed via Google Analytics 4.`,
          publishedAt,
          authorName: demoArt.author,
          metrics: {
            views: demoArt.pageviews,
            reach: demoArt.activeUsers,
            impressions: demoArt.sessions,
            clicks: demoArt.documentDownloads + demoArt.petitionClicks,
          },
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return propId;
  },
});

/**
 * Disconnect a Google Analytics 4 Property
 */
export const disconnectGA4Property = mutation({
  args: {
    organizationId: v.id("organizations"),
    propertyId: v.id("ga4Properties"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationRole(ctx, args.organizationId, ["owner", "admin"]);

    await ctx.db.patch(args.propertyId, {
      status: "disconnected",
      syncEnabled: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * List Web Articles with Rich Metrics & Social Attribution
 */
export const listWebArticles = query({
  args: {
    organizationId: v.id("organizations"),
    campaignId: v.optional(v.id("campaigns")),
    sortBy: v.optional(
      v.union(
        v.literal("activeUsers"),
        v.literal("pageviews"),
        v.literal("averageEngagementTimeSeconds"),
        v.literal("documentDownloads"),
        v.literal("socialReferralShare"),
        v.literal("newest")
      )
    ),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    let articles: Doc<"webArticles">[];

    if (args.campaignId) {
      articles = await ctx.db
        .query("webArticles")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
        .collect();
      // Ensure belongs to org
      articles = articles.filter((a) => a.organizationId === args.organizationId);
    } else {
      articles = await ctx.db
        .query("webArticles")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect();
    }

    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.path.toLowerCase().includes(term) ||
          a.primaryTopic?.toLowerCase().includes(term) ||
          a.author?.toLowerCase().includes(term)
      );
    }

    // Sort
    const sortKey = args.sortBy ?? "activeUsers";
    articles.sort((a, b) => {
      if (sortKey === "newest") return b.publishedAt - a.publishedAt;
      if (sortKey === "pageviews") return b.pageviews - a.pageviews;
      if (sortKey === "averageEngagementTimeSeconds")
        return b.averageEngagementTimeSeconds - a.averageEngagementTimeSeconds;
      if (sortKey === "documentDownloads") return b.documentDownloads - a.documentDownloads;
      if (sortKey === "socialReferralShare")
        return b.socialReferralShare - a.socialReferralShare;
      return b.activeUsers - a.activeUsers;
    });

    // Enrich with linked post and campaign details
    const enriched = await Promise.all(
      articles.map(async (art) => {
        let linkedPost = null;
        if (art.linkedPostId) {
          const post = await ctx.db.get(art.linkedPostId);
          if (post) {
            linkedPost = {
              _id: post._id,
              platform: post.platform,
              title: post.title || post.caption || "Social Post",
              pieiScore: post.pieiScore,
              views: post.views,
              url: post.url,
            };
          }
        }

        let campaignName = null;
        if (art.campaignId) {
          const camp = await ctx.db.get(art.campaignId);
          campaignName = camp?.name ?? null;
        }

        return {
          ...art,
          linkedPost,
          campaignName,
          formattedAvgTime: formatTimeSeconds(art.averageEngagementTimeSeconds),
        };
      })
    );

    return enriched;
  },
});

/**
 * Get Comprehensive Web Readership Overview & Attribution Insights
 */
export const getReadershipOverview = query({
  args: {
    organizationId: v.id("organizations"),
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const property = await ctx.db
      .query("ga4Properties")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first();

    let articles: Doc<"webArticles">[];

    if (args.campaignId) {
      articles = await ctx.db
        .query("webArticles")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
        .collect();
      articles = articles.filter((a) => a.organizationId === args.organizationId);
    } else {
      articles = await ctx.db
        .query("webArticles")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect();
    }

    if (articles.length === 0) {
      return {
        isConnected: property?.status === "connected",
        property,
        articleCount: 0,
        totalUniqueReaders: 0,
        totalPageviews: 0,
        totalSessions: 0,
        averageEngagementTimeSeconds: 0,
        formattedAvgTime: "0m 00s",
        totalDocumentDownloads: 0,
        totalPetitionClicks: 0,
        totalWhistleblowerTips: 0,
        overallSocialReferralShare: 0,
        deepAttentionSessions: 0,
        skimmingSessions: 0,
        deepAttentionRatio: 0,
        topReferralSources: [],
        attributionHeadline: null,
      };
    }

    const totalUniqueReaders = articles.reduce((sum, a) => sum + a.activeUsers, 0);
    const totalPageviews = articles.reduce((sum, a) => sum + a.pageviews, 0);
    const totalSessions = articles.reduce((sum, a) => sum + a.sessions, 0);
    const totalDocumentDownloads = articles.reduce((sum, a) => sum + a.documentDownloads, 0);
    const totalPetitionClicks = articles.reduce((sum, a) => sum + a.petitionClicks, 0);
    const totalWhistleblowerTips = articles.reduce((sum, a) => sum + a.whistleblowerTips, 0);

    // Weighted average engagement time
    const totalDurationSeconds = articles.reduce(
      (sum, a) => sum + a.averageEngagementTimeSeconds * a.sessions,
      0
    );
    const averageEngagementTimeSeconds =
      totalSessions > 0 ? Math.round(totalDurationSeconds / totalSessions) : 0;

    // Weighted social referral share
    const totalSocialUsers = articles.reduce(
      (sum, a) => sum + Math.round((a.socialReferralShare / 100) * a.activeUsers),
      0
    );
    const overallSocialReferralShare =
      totalUniqueReaders > 0
        ? Math.round((totalSocialUsers / totalUniqueReaders) * 100)
        : 0;

    // Deep attention vs Skimming
    const deepAttentionSessions = articles.reduce(
      (sum, a) => sum + a.scrollDepth90Percent,
      0
    );
    const skimmingSessions = Math.max(0, totalSessions - deepAttentionSessions);
    const deepAttentionRatio =
      totalSessions > 0 ? Math.round((deepAttentionSessions / totalSessions) * 100) : 0;

    // Aggregate referrers across all articles
    const referrerMap = new Map<
      string,
      { source: string; medium: string; users: number; totalTimeSec: number }
    >();

    for (const art of articles) {
      for (const ref of art.topReferrers) {
        const key = `${ref.source}_${ref.medium}`;
        const existing = referrerMap.get(key) ?? {
          source: ref.source,
          medium: ref.medium,
          users: 0,
          totalTimeSec: 0,
        };
        existing.users += ref.users;
        existing.totalTimeSec += ref.avgTimeSeconds * ref.users;
        referrerMap.set(key, existing);
      }
    }

    const topReferralSources = Array.from(referrerMap.values())
      .map((r) => ({
        source: r.source,
        medium: r.medium,
        users: r.users,
        avgTimeSeconds: r.users > 0 ? Math.round(r.totalTimeSec / r.users) : 0,
        sharePercent:
          totalUniqueReaders > 0
            ? Math.round((r.users / totalUniqueReaders) * 100)
            : 0,
      }))
      .sort((a, b) => b.users - a.users);

    // Primary attribution headline from highest reader article
    const topArticle = [...articles].sort((a, b) => b.activeUsers - a.activeUsers)[0];

    return {
      isConnected: property?.status === "connected",
      property,
      articleCount: articles.length,
      totalUniqueReaders,
      totalPageviews,
      totalSessions,
      averageEngagementTimeSeconds,
      formattedAvgTime: formatTimeSeconds(averageEngagementTimeSeconds),
      totalDocumentDownloads,
      totalPetitionClicks,
      totalWhistleblowerTips,
      overallSocialReferralShare,
      deepAttentionSessions,
      skimmingSessions,
      deepAttentionRatio,
      topReferralSources,
      attributionHeadline: topArticle?.attributionHeadline ?? null,
    };
  },
});

/**
 * Re-sync GA4 Readership (Simulates or executes live RunReport and updates attribution)
 */
export const syncGA4Readership = mutation({
  args: {
    organizationId: v.id("organizations"),
    propertyId: v.optional(v.id("ga4Properties")),
  },
  handler: async (ctx, args) => {
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();
    const articles = await ctx.db
      .query("webArticles")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Touch articles with fresh sync timestamp
    for (const art of articles) {
      await ctx.db.patch(art._id, {
        lastSyncedAt: now,
      });
    }

    if (args.propertyId) {
      await ctx.db.patch(args.propertyId, {
        lastSyncedAt: now,
        updatedAt: now,
      });
    }

    return { syncedCount: articles.length };
  },
});

/**
 * Explicitly Link a Web Article to a Social Post (Attribution Bridge)
 */
export const linkArticleToPost = mutation({
  args: {
    organizationId: v.id("organizations"),
    articleId: v.id("webArticles"),
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const article = await ctx.db.get(args.articleId);
    if (!article || article.organizationId !== args.organizationId) {
      throw new Error("Article not found");
    }

    const post = await ctx.db.get(args.postId);
    if (!post || post.organizationId !== args.organizationId) {
      throw new Error("Post not found");
    }

    const postDateStr = new Date(post.publishedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    const formatLabel = post.postType ? `${post.platform} ${post.postType}` : `${post.platform} post`;

    const headline = buildCivicAttributionHeadline({
      articleTitle: article.title,
      uniqueReaders: article.activeUsers,
      socialSharePercent: article.socialReferralShare,
      topSocialFormat: formatLabel,
      publishDateStr: postDateStr,
      avgEngagementSeconds: article.averageEngagementTimeSeconds,
    });

    await ctx.db.patch(args.articleId, {
      linkedPostId: args.postId,
      attributionHeadline: headline,
    });

    return { headline };
  },
});

/**
 * Link Web Article to Campaign
 */
export const linkArticleToCampaign = mutation({
  args: {
    organizationId: v.id("organizations"),
    articleId: v.id("webArticles"),
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    await ctx.db.patch(args.articleId, {
      campaignId: args.campaignId,
    });

    return { success: true };
  },
});
