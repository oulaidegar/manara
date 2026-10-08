import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationRole } from "./lib/auth";
import { logAuditEvent } from "./lib/audit";

export const quickIngestPost = mutation({
  args: {
    organizationId: v.id("organizations"),
    url: v.string(),
    platform: v.string(),
    externalPostId: v.string(),
    title: v.string(),
    caption: v.string(),
    postType: v.string(),
    authorName: v.optional(v.string()),
    authorHandle: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    views: v.optional(v.number()),
    impressions: v.optional(v.number()),
    reach: v.optional(v.number()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    saves: v.optional(v.number()),
    pieiScore: v.optional(v.number()),
    pieiBasis: v.optional(v.string()),
    convictionTier: v.optional(
      v.union(
        v.literal("exceptional"),
        v.literal("high"),
        v.literal("moderate"),
        v.literal("baseline")
      )
    ),
    isEvergreen: v.optional(v.boolean()),
    velocityRatio24h: v.optional(v.number()),
    analysis: v.optional(
      v.object({
        primaryTopic: v.optional(v.string()),
        topics: v.optional(v.array(v.string())),
        contentFormat: v.optional(v.string()),
        contentPurpose: v.optional(v.string()),
        tone: v.optional(v.array(v.string())),
        hookType: v.optional(v.string()),
        ctaType: v.optional(v.string()),
        slideBracket: v.optional(v.string()),
        videoLengthBracket: v.optional(v.string()),
        targetAudience: v.optional(v.string()),
        narrativeStyle: v.optional(v.string()),
        containsStatistic: v.optional(v.boolean()),
        containsQuote: v.optional(v.boolean()),
        containsPerson: v.optional(v.boolean()),
        containsQuestion: v.optional(v.boolean()),
        containsExternalLink: v.optional(v.boolean()),
        summary: v.optional(v.string()),
        explanation: v.optional(v.string()),
        analysisVersion: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const member = await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();

    const validPlatforms = [
      "instagram",
      "linkedin",
      "tiktok",
      "youtube",
      "x",
      "facebook",
      "threads",
      "other",
    ] as const;
    type ValidPlatform = (typeof validPlatforms)[number];
    const platformStr = args.platform.toLowerCase();
    const platform: ValidPlatform = validPlatforms.includes(platformStr as ValidPlatform)
      ? (platformStr as ValidPlatform)
      : "other";

    let account = await ctx.db
      .query("socialAccounts")
      .withIndex("by_organization_platform", (q) =>
        q.eq("organizationId", args.organizationId).eq("platform", platform)
      )
      .first();

    if (!account) {
      const cleanHandle = (args.authorHandle || "ingested_feed").replace(/^@/, "");
      const accountId = await ctx.db.insert("socialAccounts", {
        organizationId: args.organizationId,
        platform,
        handle: cleanHandle,
        displayName: args.authorName || "Quick Ingest Feed",
        externalAccountId: `ingest_${platform}_${cleanHandle}`,
        profileUrl: `https://${platform}.com/${cleanHandle}`,
        followerCount: 15000,
        provider: "quick_ingest",
        syncEnabled: true,
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      account = await ctx.db.get(accountId);
    }

    if (!account) {
      throw new Error("Failed to initialize account for ingestion");
    }

    // 2. Check if post already exists
    const existing = await ctx.db
      .query("socialPosts")
      .withIndex("by_account_externalPostId", (q) =>
        q.eq("accountId", account._id).eq("externalPostId", args.externalPostId)
      )
      .first();

    let postId;
    let isNew = false;

    if (existing) {
      postId = existing._id;
      await ctx.db.patch(existing._id, {
        title: args.title,
        caption: args.caption,
        views: args.views ?? existing.views,
        impressions: args.impressions ?? existing.impressions,
        reach: args.reach ?? existing.reach,
        likes: args.likes ?? existing.likes,
        comments: args.comments ?? existing.comments,
        shares: args.shares ?? existing.shares,
        saves: args.saves ?? existing.saves,
        pieiScore: args.pieiScore ?? existing.pieiScore,
        pieiBasis: args.pieiBasis ?? existing.pieiBasis,
        convictionTier: args.convictionTier ?? existing.convictionTier,
        isEvergreen: args.isEvergreen ?? existing.isEvergreen,
        velocityRatio24h: args.velocityRatio24h ?? existing.velocityRatio24h,
        updatedAt: now,
      });
    } else {
      isNew = true;
      postId = await ctx.db.insert("socialPosts", {
        organizationId: args.organizationId,
        accountId: account._id,
        platform,
        externalPostId: args.externalPostId,
        url: args.url,
        publishedAt: now - 2 * 24 * 60 * 60 * 1000,
        title: args.title,
        caption: args.caption,
        postType: args.postType,
        thumbnailUrl: args.thumbnailUrl,
        authorName: args.authorName || account.displayName,
        authorHandle: args.authorHandle || `@${account.handle}`,
        views: args.views,
        impressions: args.impressions,
        reach: args.reach,
        likes: args.likes,
        comments: args.comments,
        shares: args.shares,
        saves: args.saves,
        pieiScore: args.pieiScore,
        pieiBasis: args.pieiBasis,
        convictionTier: args.convictionTier,
        isEvergreen: args.isEvergreen,
        velocityRatio24h: args.velocityRatio24h,
        analysisStatus: args.analysis ? "complete" : "pending",
        provider: "quick_ingest",
        createdAt: now,
        updatedAt: now,
      });

      // 3. Insert initial metric snapshot
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
        provider: "quick_ingest",
      });
    }

    // 4. Save analysis if provided
    if (args.analysis) {
      const existingAnalysis = await ctx.db
        .query("postAnalysis")
        .withIndex("by_post", (q) => q.eq("postId", postId))
        .first();

      if (existingAnalysis) {
        await ctx.db.patch(existingAnalysis._id, {
          primaryTopic: args.analysis.primaryTopic,
          topics: args.analysis.topics,
          contentFormat: args.analysis.contentFormat,
          contentPurpose: args.analysis.contentPurpose,
          tone: args.analysis.tone,
          hookType: args.analysis.hookType,
          ctaType: args.analysis.ctaType,
          slideBracket: args.analysis.slideBracket,
          videoLengthBracket: args.analysis.videoLengthBracket,
          targetAudience: args.analysis.targetAudience,
          narrativeStyle: args.analysis.narrativeStyle,
          containsStatistic: args.analysis.containsStatistic,
          containsQuote: args.analysis.containsQuote,
          containsPerson: args.analysis.containsPerson,
          containsQuestion: args.analysis.containsQuestion,
          containsExternalLink: args.analysis.containsExternalLink,
          summary: args.analysis.summary,
          explanation: args.analysis.explanation,
          analysisVersion: args.analysis.analysisVersion,
          analyzedAt: now,
        });
      } else {
        await ctx.db.insert("postAnalysis", {
          postId,
          organizationId: args.organizationId,
          primaryTopic: args.analysis.primaryTopic,
          topics: args.analysis.topics,
          contentFormat: args.analysis.contentFormat,
          contentPurpose: args.analysis.contentPurpose,
          tone: args.analysis.tone,
          hookType: args.analysis.hookType,
          ctaType: args.analysis.ctaType,
          slideBracket: args.analysis.slideBracket,
          videoLengthBracket: args.analysis.videoLengthBracket,
          targetAudience: args.analysis.targetAudience,
          narrativeStyle: args.analysis.narrativeStyle,
          containsStatistic: args.analysis.containsStatistic,
          containsQuote: args.analysis.containsQuote,
          containsPerson: args.analysis.containsPerson,
          containsQuestion: args.analysis.containsQuestion,
          containsExternalLink: args.analysis.containsExternalLink,
          summary: args.analysis.summary,
          explanation: args.analysis.explanation,
          analysisVersion: args.analysis.analysisVersion,
          analyzedAt: now,
        });
      }
    }

    // 5. Log audit event
    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: member.user._id,
      action: "content_created",
      entityType: "social_post",
      entityId: postId,
      metadata: {
        platform,
        url: args.url,
        pieiScore: args.pieiScore,
        convictionTier: args.convictionTier,
        isNew,
      },
    });

    return { postId, isNew };
  },
});
