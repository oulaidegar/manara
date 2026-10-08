import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember } from "./lib/auth";

export const getPlatformOverview = query({
  args: {
    organizationId: v.id("organizations"),
    platform: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const platform = args.platform.toLowerCase();

    // Get social accounts connected for this platform
    const accounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("platform"), platform))
      .collect();

    // Get posts published on this platform
    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("platform"), platform))
      .collect();

    const median = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const viewsList = posts.map((p) => p.views).filter((v): v is number => v !== undefined);
    const sharesList = posts.map((p) => p.shares).filter((s): s is number => s !== undefined);
    const likesList = posts.map((p) => p.likes).filter((l): l is number => l !== undefined);
    const commentsList = posts.map((p) => p.comments).filter((c): c is number => c !== undefined);
    const engagementList = posts.map((p) => p.engagementRate).filter((e): e is number => e !== undefined);

    const totalViews = viewsList.reduce((sum, v) => sum + v, 0);
    const totalShares = sharesList.reduce((sum, s) => sum + s, 0);
    const totalLikes = likesList.reduce((sum, l) => sum + l, 0);
    const totalComments = commentsList.reduce((sum, c) => sum + c, 0);

    const medianViews = median(viewsList);
    const medianShares = median(sharesList);
    const medianEngagement = median(engagementList);

    // Format performance breakdown
    const formatStats: Record<string, { count: number; totalViews: number; totalShares: number }> = {};
    posts.forEach((p) => {
      const fmt = p.postType || "post";
      if (!formatStats[fmt]) {
        formatStats[fmt] = { count: 0, totalViews: 0, totalShares: 0 };
      }
      formatStats[fmt].count++;
      formatStats[fmt].totalViews += p.views ?? 0;
      formatStats[fmt].totalShares += p.shares ?? 0;
    });

    const formatBreakdown = Object.entries(formatStats).map(([format, stat]) => ({
      format,
      count: stat.count,
      avgViews: Math.round(stat.totalViews / stat.count),
      avgShares: Math.round(stat.totalShares / stat.count),
    }));

    // Top posts sorted by views
    const topPosts = [...posts]
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      .slice(0, 5);

    // Primary connected account
    const primaryAccount = accounts[0] || null;

    return {
      platform,
      account: primaryAccount,
      connectedAccountsCount: accounts.length,
      totalPosts: posts.length,
      totalViews,
      totalShares,
      totalLikes,
      totalComments,
      medianViews,
      medianShares,
      medianEngagement,
      formatBreakdown,
      topPosts,
      allPosts: posts.sort((a, b) => b.publishedAt - a.publishedAt),
    };
  },
});
