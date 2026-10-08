import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember } from "./lib/auth";
import { NotFoundError } from "./lib/errors";

export const upsertSocialPost = mutation({
  args: {
    organizationId: v.id("organizations"),
    accountId: v.id("socialAccounts"),
    platform: v.string(),
    externalPostId: v.string(),
    url: v.string(),
    publishedAt: v.number(),
    caption: v.optional(v.string()),
    title: v.optional(v.string()),
    postType: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
    authorName: v.optional(v.string()),
    authorHandle: v.optional(v.string()),

    // Raw metrics
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
    averageWatchTimeSeconds: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),

    // Derived metrics
    engagementCount: v.optional(v.number()),
    engagementRate: v.optional(v.number()),
    engagementRateBasis: v.optional(
      v.union(
        v.literal("impressions"),
        v.literal("reach"),
        v.literal("views"),
        v.literal("followers")
      )
    ),
    viewToFollowerRate: v.optional(v.number()),
    shareRate: v.optional(v.number()),
    commentRate: v.optional(v.number()),
    saveRate: v.optional(v.number()),

    provider: v.string(),
    rawProviderData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Deduplication check: accountId + externalPostId
    const existing = await ctx.db
      .query("socialPosts")
      .withIndex("by_account_externalPostId", (q) =>
        q.eq("accountId", args.accountId).eq("externalPostId", args.externalPostId)
      )
      .first();

    let postId;
    let isNew = false;

    if (existing) {
      postId = existing._id;
      await ctx.db.patch(existing._id, {
        url: args.url,
        caption: args.caption ?? existing.caption,
        title: args.title ?? existing.title,
        postType: args.postType ?? existing.postType,
        thumbnailUrl: args.thumbnailUrl ?? existing.thumbnailUrl,
        mediaUrls: args.mediaUrls ?? existing.mediaUrls,
        views: args.views ?? existing.views,
        impressions: args.impressions ?? existing.impressions,
        reach: args.reach ?? existing.reach,
        likes: args.likes ?? existing.likes,
        comments: args.comments ?? existing.comments,
        shares: args.shares ?? existing.shares,
        saves: args.saves ?? existing.saves,
        reposts: args.reposts ?? existing.reposts,
        clicks: args.clicks ?? existing.clicks,
        watchTimeSeconds: args.watchTimeSeconds ?? existing.watchTimeSeconds,
        averageWatchTimeSeconds: args.averageWatchTimeSeconds ?? existing.averageWatchTimeSeconds,
        engagementCount: args.engagementCount ?? existing.engagementCount,
        engagementRate: args.engagementRate ?? existing.engagementRate,
        engagementRateBasis: args.engagementRateBasis ?? existing.engagementRateBasis,
        shareRate: args.shareRate ?? existing.shareRate,
        commentRate: args.commentRate ?? existing.commentRate,
        saveRate: args.saveRate ?? existing.saveRate,
        lastMetricsSyncAt: now,
        updatedAt: now,
      });
    } else {
      isNew = true;
      postId = await ctx.db.insert("socialPosts", {
        organizationId: args.organizationId,
        accountId: args.accountId,
        platform: args.platform,
        externalPostId: args.externalPostId,
        url: args.url,
        publishedAt: args.publishedAt,
        caption: args.caption,
        title: args.title,
        postType: args.postType ?? "post",
        thumbnailUrl: args.thumbnailUrl,
        mediaUrls: args.mediaUrls,
        authorName: args.authorName,
        authorHandle: args.authorHandle,
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
        averageWatchTimeSeconds: args.averageWatchTimeSeconds,
        durationSeconds: args.durationSeconds,
        engagementCount: args.engagementCount,
        engagementRate: args.engagementRate,
        engagementRateBasis: args.engagementRateBasis,
        viewToFollowerRate: args.viewToFollowerRate,
        shareRate: args.shareRate,
        commentRate: args.commentRate,
        saveRate: args.saveRate,
        analysisStatus: "pending",
        lastMetricsSyncAt: now,
        provider: args.provider,
        rawProviderData: args.rawProviderData,
        createdAt: now,
        updatedAt: now,
      });

      // Insert initial metric snapshot (Section 10)
      await ctx.db.insert("postMetricSnapshots", {
        organizationId: args.organizationId,
        postId,
        capturedAt: now,
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
    }

    return { postId, isNew };
  },
});

export const batchUpsertPosts = mutation({
  args: {
    organizationId: v.id("organizations"),
    accountId: v.id("socialAccounts"),
    posts: v.array(
      v.object({
        platform: v.string(),
        externalPostId: v.string(),
        url: v.string(),
        publishedAt: v.number(),
        caption: v.optional(v.string()),
        title: v.optional(v.string()),
        postType: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        mediaUrls: v.optional(v.array(v.string())),
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
        durationSeconds: v.optional(v.number()),
        engagementCount: v.optional(v.number()),
        engagementRate: v.optional(v.number()),
        engagementRateBasis: v.optional(
          v.union(
            v.literal("impressions"),
            v.literal("reach"),
            v.literal("views"),
            v.literal("followers")
          )
        ),
        shareRate: v.optional(v.number()),
        commentRate: v.optional(v.number()),
        saveRate: v.optional(v.number()),
        provider: v.string(),
        rawProviderData: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let createdCount = 0;
    let updatedCount = 0;
    const now = Date.now();

    for (const post of args.posts) {
      const existing = await ctx.db
        .query("socialPosts")
        .withIndex("by_account_externalPostId", (q) =>
          q.eq("accountId", args.accountId).eq("externalPostId", post.externalPostId)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          url: post.url,
          caption: post.caption ?? existing.caption,
          title: post.title ?? existing.title,
          views: post.views ?? existing.views,
          impressions: post.impressions ?? existing.impressions,
          reach: post.reach ?? existing.reach,
          likes: post.likes ?? existing.likes,
          comments: post.comments ?? existing.comments,
          shares: post.shares ?? existing.shares,
          saves: post.saves ?? existing.saves,
          reposts: post.reposts ?? existing.reposts,
          clicks: post.clicks ?? existing.clicks,
          engagementCount: post.engagementCount ?? existing.engagementCount,
          engagementRate: post.engagementRate ?? existing.engagementRate,
          engagementRateBasis: post.engagementRateBasis ?? existing.engagementRateBasis,
          shareRate: post.shareRate ?? existing.shareRate,
          commentRate: post.commentRate ?? existing.commentRate,
          saveRate: post.saveRate ?? existing.saveRate,
          lastMetricsSyncAt: now,
          updatedAt: now,
        });
        updatedCount++;
      } else {
        const postId = await ctx.db.insert("socialPosts", {
          organizationId: args.organizationId,
          accountId: args.accountId,
          platform: post.platform,
          externalPostId: post.externalPostId,
          url: post.url,
          publishedAt: post.publishedAt,
          caption: post.caption,
          title: post.title,
          postType: post.postType ?? "post",
          thumbnailUrl: post.thumbnailUrl,
          mediaUrls: post.mediaUrls,
          views: post.views,
          impressions: post.impressions,
          reach: post.reach,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          saves: post.saves,
          reposts: post.reposts,
          clicks: post.clicks,
          watchTimeSeconds: post.watchTimeSeconds,
          durationSeconds: post.durationSeconds,
          engagementCount: post.engagementCount,
          engagementRate: post.engagementRate,
          engagementRateBasis: post.engagementRateBasis,
          shareRate: post.shareRate,
          commentRate: post.commentRate,
          saveRate: post.saveRate,
          analysisStatus: "pending",
          lastMetricsSyncAt: now,
          provider: post.provider,
          rawProviderData: post.rawProviderData,
          createdAt: now,
          updatedAt: now,
        });

        // Add initial snapshot
        await ctx.db.insert("postMetricSnapshots", {
          organizationId: args.organizationId,
          postId,
          capturedAt: now,
          views: post.views,
          impressions: post.impressions,
          reach: post.reach,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          saves: post.saves,
          provider: post.provider,
        });
        createdCount++;
      }
    }

    return { createdCount, updatedCount };
  },
});

export const listSocialPosts = query({
  args: {
    organizationId: v.id("organizations"),
    platform: v.optional(v.string()),
    accountId: v.optional(v.id("socialAccounts")),
    postType: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    minViews: v.optional(v.number()),
    minEngagementRate: v.optional(v.number()),
    sortBy: v.optional(
      v.union(
        v.literal("newest"),
        v.literal("oldest"),
        v.literal("views"),
        v.literal("likes"),
        v.literal("shares"),
        v.literal("comments"),
        v.literal("saves"),
        v.literal("engagementRate"),
        v.literal("performanceScore")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    let posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Filter by platform
    if (args.platform) {
      posts = posts.filter((p) => p.platform.toLowerCase() === args.platform!.toLowerCase());
    }

    // Filter by account
    if (args.accountId) {
      posts = posts.filter((p) => p.accountId === args.accountId);
    }

    // Filter by postType
    if (args.postType) {
      posts = posts.filter((p) => p.postType === args.postType);
    }

    // Filter by minViews
    if (args.minViews !== undefined) {
      posts = posts.filter((p) => (p.views ?? 0) >= args.minViews!);
    }

    // Filter by minEngagementRate
    if (args.minEngagementRate !== undefined) {
      posts = posts.filter((p) => (p.engagementRate ?? 0) >= args.minEngagementRate!);
    }

    // Search term in title or caption
    if (args.searchTerm && args.searchTerm.trim() !== "") {
      const query = args.searchTerm.toLowerCase();
      posts = posts.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(query)) ||
          (p.caption && p.caption.toLowerCase().includes(query))
      );
    }

    // Sorting (Section 21)
    const sortBy = args.sortBy ?? "newest";
    posts.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.publishedAt - a.publishedAt;
        case "oldest":
          return a.publishedAt - b.publishedAt;
        case "views":
          return (b.views ?? 0) - (a.views ?? 0);
        case "likes":
          return (b.likes ?? 0) - (a.likes ?? 0);
        case "shares":
          return (b.shares ?? 0) - (a.shares ?? 0);
        case "comments":
          return (b.comments ?? 0) - (a.comments ?? 0);
        case "saves":
          return (b.saves ?? 0) - (a.saves ?? 0);
        case "engagementRate":
          return (b.engagementRate ?? 0) - (a.engagementRate ?? 0);
        case "performanceScore":
          return (b.performanceScore ?? 0) - (a.performanceScore ?? 0);
        default:
          return b.publishedAt - a.publishedAt;
      }
    });

    if (args.limit) {
      posts = posts.slice(0, args.limit);
    }

    // Batch fetch accounts and analysis to eliminate N+1 queries
    const accounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const accountMap = new Map(accounts.map((a) => [a._id, a]));

    const analyses = await ctx.db
      .query("postAnalysis")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const analysisMap = new Map(analyses.map((a) => [a.postId, a]));

    const enriched = posts.map((post) => {
      const account = accountMap.get(post.accountId);
      const analysis = analysisMap.get(post._id) ?? null;

      return {
        ...post,
        accountHandle: account?.handle ?? "unknown",
        accountDisplayName: account?.displayName ?? account?.handle,
        analysis,
      };
    });

    return enriched;
  },
});

export const getSocialPost = query({
  args: {
    organizationId: v.id("organizations"),
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const post = await ctx.db.get(args.postId);
    if (!post || post.organizationId !== args.organizationId) {
      throw new NotFoundError("SocialPost", args.postId);
    }

    const account = await ctx.db.get(post.accountId);

    const snapshots = await ctx.db
      .query("postMetricSnapshots")
      .withIndex("by_post_capturedAt", (q) => q.eq("postId", post._id))
      .order("asc")
      .collect();

    const analysis = await ctx.db
      .query("postAnalysis")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .first();

    const campaignLink = await ctx.db
      .query("campaignContent")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .first();

    const campaign = campaignLink ? await ctx.db.get(campaignLink.campaignId) : null;

    // Calculate post benchmark against account baseline (Section 25)
    const allAccountPosts = await ctx.db
      .query("socialPosts")
      .withIndex("by_account", (q) => q.eq("accountId", post.accountId))
      .collect();

    const median = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const viewsList = allAccountPosts.map((p) => p.views).filter((v): v is number => v !== undefined);
    const sharesList = allAccountPosts.map((p) => p.shares).filter((s): s is number => s !== undefined);
    const commentsList = allAccountPosts.map((p) => p.comments).filter((c): c is number => c !== undefined);
    const engagementList = allAccountPosts.map((p) => p.engagementRate).filter((e): e is number => e !== undefined);

    const medianViews = median(viewsList);
    const medianShares = median(sharesList);
    const medianComments = median(commentsList);
    const medianEngagement = median(engagementList);

    const calcPercentDiff = (val?: number, med?: number) => {
      if (val === undefined || !med || med === 0) return undefined;
      return Math.round(((val - med) / med) * 100);
    };

    // Calculate percentile rank (Section 19)
    const calculatePercentile = (val?: number, list?: number[]) => {
      if (val === undefined || !list || list.length === 0) return undefined;
      const countBelow = list.filter((v) => v < val).length;
      return Math.round((countBelow / list.length) * 100);
    };

    const benchmarks = {
      medianViews,
      medianShares,
      medianComments,
      medianEngagement,
      viewVsMedianPercent: calcPercentDiff(post.views, medianViews),
      shareVsMedianPercent: calcPercentDiff(post.shares, medianShares),
      commentVsMedianPercent: calcPercentDiff(post.comments, medianComments),
      engagementVsMedianPercent: calcPercentDiff(post.engagementRate, medianEngagement),
      viewPercentile: calculatePercentile(post.views, viewsList),
      sharePercentile: calculatePercentile(post.shares, sharesList),
      commentPercentile: calculatePercentile(post.comments, commentsList),
      totalAccountPosts: allAccountPosts.length,
    };

    return {
      post,
      account,
      snapshots,
      analysis,
      campaign,
      benchmarks,
    };
  },
});
