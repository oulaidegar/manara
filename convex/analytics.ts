import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember } from "./lib/auth";

export const getBriefingData = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    // Fetch initiatives
    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(5);

    // Fetch candidate outcomes
    const candidateOutcomes = await ctx.db
      .query("outcomes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("verificationStatus"), "candidate"))
      .take(5);

    // Fetch verified / documented outcomes
    const recentOutcomes = await ctx.db
      .query("outcomes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(3);

    // Fetch content items to calculate totals
    const content = await ctx.db
      .query("contentItems")
      .withIndex("by_organization_publishedAt", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(200);

    let totalImpressions = 0;
    let totalReach = 0;
    let totalShares = 0;
    let totalSaves = 0;
    let totalClicks = 0;

    for (const item of content) {
      if (item.metrics) {
        totalImpressions += item.metrics.impressions ?? 0;
        totalReach += item.metrics.reach ?? 0;
        totalShares += item.metrics.shares ?? 0;
        totalSaves += item.metrics.saves ?? 0;
        totalClicks += item.metrics.clicks ?? 0;
      }
    }

    const meaningfulActions = totalShares + totalSaves + totalClicks;
    const meaningfulRate =
      totalImpressions > 0
        ? ((meaningfulActions / totalImpressions) * 1000).toFixed(1)
        : "0.0";

    // Fetch practices
    const practices = await ctx.db
      .query("practices")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(3);

    // Fetch recent reports
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(2);

    return {
      performance: {
        totalImpressions,
        totalReach,
        meaningfulActions,
        meaningfulRate,
        contentCount: content.length,
      },
      activeInitiatives: initiatives,
      candidateOutcomes,
      recentOutcomes,
      practices,
      reports,
    };
  },
});

export const getAnalyzeData = query({
  args: {
    organizationId: v.id("organizations"),
    provider: v.optional(v.string()),
    contentType: v.optional(v.string()),
    dateRange: v.optional(v.string()), // "7d" | "30d" | "90d" | "ytd" | "all"
    comparePeriod: v.optional(v.string()), // "previous_period" | "none"
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    let periodMs = 30 * DAY;
    if (args.dateRange === "7d") periodMs = 7 * DAY;
    else if (args.dateRange === "30d") periodMs = 30 * DAY;
    else if (args.dateRange === "90d") periodMs = 90 * DAY;
    else if (args.dateRange === "ytd") {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
      periodMs = Math.max(DAY, now - startOfYear);
    } else if (args.dateRange === "all") {
      periodMs = 365 * 5 * DAY; // 5 years
    }

    const currentPeriodStart = now - periodMs;
    const previousPeriodStart = currentPeriodStart - periodMs;

    // Fetch all content items for this org
    const allItems = await ctx.db
      .query("contentItems")
      .withIndex("by_organization_publishedAt", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(500);

    // Fetch initiative links to enrich content
    const links = await ctx.db
      .query("initiativeContentLinks")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(500);

    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(50);

    const initiativeMap = new Map<string, string>();
    for (const init of initiatives) {
      initiativeMap.set(init._id, init.name);
    }

    const itemToInitiativeMap = new Map<string, string>();
    for (const link of links) {
      const initName = initiativeMap.get(link.initiativeId);
      if (initName) {
        itemToInitiativeMap.set(link.contentItemId, initName);
      }
    }

    // Filter by provider and content type
    const applyFilters = (itemsList: typeof allItems) => {
      return itemsList.filter((item) => {
        if (args.provider && args.provider !== "all" && item.provider !== args.provider) {
          return false;
        }
        if (args.contentType && args.contentType !== "all" && item.contentType !== args.contentType) {
          return false;
        }
        return true;
      });
    };

    const filteredAllItems = applyFilters(allItems);

    // Split into Current vs Previous period
    const currentPeriodItems = filteredAllItems.filter(
      (item) => item.publishedAt >= currentPeriodStart && item.publishedAt <= now
    );

    const previousPeriodItems = filteredAllItems.filter(
      (item) => item.publishedAt >= previousPeriodStart && item.publishedAt < currentPeriodStart
    );

    // Aggregator helper
    const calculateTotals = (itemsList: typeof allItems) => {
      let impressions = 0;
      let reach = 0;
      let shares = 0;
      let saves = 0;
      let views = 0;
      let clicks = 0;

      for (const item of itemsList) {
        impressions += item.metrics?.impressions ?? 0;
        reach += item.metrics?.reach ?? 0;
        shares += item.metrics?.shares ?? 0;
        saves += item.metrics?.saves ?? 0;
        views += item.metrics?.views ?? 0;
        clicks += item.metrics?.clicks ?? 0;
      }

      const meaningfulActions = shares + saves + clicks;
      const meaningfulRate =
        impressions > 0 ? parseFloat(((meaningfulActions / impressions) * 1000).toFixed(1)) : 0;
      const reachRatio =
        impressions > 0 ? parseFloat(((reach / impressions) * 100).toFixed(1)) : 0;

      return {
        impressions,
        reach,
        shares,
        saves,
        views,
        clicks,
        meaningfulActions,
        meaningfulRate,
        reachRatio,
        itemCount: itemsList.length,
      };
    };

    // If 'all' is chosen or not enough items in window, default to using filteredAllItems
    const activeItems =
      args.dateRange === "all" || currentPeriodItems.length === 0
        ? filteredAllItems
        : currentPeriodItems;

    const currentTotals = calculateTotals(activeItems);
    const previousTotals = calculateTotals(previousPeriodItems);

    // Deltas
    const computeDelta = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    const deltas = {
      impressions: computeDelta(currentTotals.impressions, previousTotals.impressions),
      reach: computeDelta(currentTotals.reach, previousTotals.reach),
      meaningfulActions: computeDelta(
        currentTotals.meaningfulActions,
        previousTotals.meaningfulActions
      ),
      meaningfulRate: computeDelta(currentTotals.meaningfulRate, previousTotals.meaningfulRate),
    };

    // 1. Time Series Aggregation (Daily buckets)
    const timeBuckets = new Map<
      string,
      {
        date: string;
        timestamp: number;
        impressions: number;
        reach: number;
        views: number;
        shares: number;
        saves: number;
        meaningfulActions: number;
      }
    >();

    for (const item of activeItems) {
      const d = new Date(item.publishedAt);
      const dateKey = d.toISOString().split("T")[0]; // YYYY-MM-DD

      const existing = timeBuckets.get(dateKey) ?? {
        date: dateKey,
        timestamp: new Date(dateKey).getTime(),
        impressions: 0,
        reach: 0,
        views: 0,
        shares: 0,
        saves: 0,
        meaningfulActions: 0,
      };

      const imp = item.metrics?.impressions ?? 0;
      const reach = item.metrics?.reach ?? 0;
      const views = item.metrics?.views ?? 0;
      const shares = item.metrics?.shares ?? 0;
      const saves = item.metrics?.saves ?? 0;
      const clicks = item.metrics?.clicks ?? 0;

      existing.impressions += imp;
      existing.reach += reach;
      existing.views += views;
      existing.shares += shares;
      existing.saves += saves;
      existing.meaningfulActions += shares + saves + clicks;

      timeBuckets.set(dateKey, existing);
    }

    const timeSeries = Array.from(timeBuckets.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((bucket) => ({
        ...bucket,
        meaningfulRate:
          bucket.impressions > 0
            ? parseFloat(((bucket.meaningfulActions / bucket.impressions) * 1000).toFixed(1))
            : 0,
      }));

    // 2. Platform Breakdown
    const platformMap = new Map<
      string,
      {
        platform: string;
        count: number;
        impressions: number;
        reach: number;
        views: number;
        shares: number;
        saves: number;
      }
    >();

    for (const item of activeItems) {
      const p = item.provider || "general";
      const existing = platformMap.get(p) ?? {
        platform: p,
        count: 0,
        impressions: 0,
        reach: 0,
        views: 0,
        shares: 0,
        saves: 0,
      };

      existing.count += 1;
      existing.impressions += item.metrics?.impressions ?? 0;
      existing.reach += item.metrics?.reach ?? 0;
      existing.views += item.metrics?.views ?? 0;
      existing.shares += item.metrics?.shares ?? 0;
      existing.saves += item.metrics?.saves ?? 0;

      platformMap.set(p, existing);
    }

    const platformBreakdown = Array.from(platformMap.values()).map((p) => ({
      ...p,
      meaningfulRate:
        p.impressions > 0 ? parseFloat((((p.shares + p.saves) / p.impressions) * 1000).toFixed(1)) : 0,
    }));

    // 3. Content Format Efficiency Breakdown (Section 20)
    const formatMap = new Map<
      string,
      {
        format: string;
        count: number;
        impressions: number;
        views: number;
        shares: number;
        saves: number;
      }
    >();

    for (const item of activeItems) {
      const f = item.contentType || "post";
      const existing = formatMap.get(f) ?? {
        format: f,
        count: 0,
        impressions: 0,
        views: 0,
        shares: 0,
        saves: 0,
      };

      existing.count += 1;
      existing.impressions += item.metrics?.impressions ?? 0;
      existing.views += item.metrics?.views ?? 0;
      existing.shares += item.metrics?.shares ?? 0;
      existing.saves += item.metrics?.saves ?? 0;

      formatMap.set(f, existing);
    }

    const formatBreakdown = Array.from(formatMap.values()).map((f) => ({
      ...f,
      efficiencyRate:
        f.impressions > 0
          ? parseFloat((((f.shares + f.saves) / f.impressions) * 1000).toFixed(1))
          : 0,
    }));

    // 4. Enriched Content Items with meaningful rates and linked initiatives
    const enrichedItems = activeItems.map((item) => {
      const imp = item.metrics?.impressions ?? 0;
      const shares = item.metrics?.shares ?? 0;
      const saves = item.metrics?.saves ?? 0;
      const clicks = item.metrics?.clicks ?? 0;
      const meaningfulActions = shares + saves + clicks;
      const meaningfulRate =
        imp > 0 ? parseFloat(((meaningfulActions / imp) * 1000).toFixed(1)) : 0;

      return {
        ...item,
        initiativeName: itemToInitiativeMap.get(item._id) ?? null,
        meaningfulRate,
        meaningfulActions,
      };
    });

    return {
      kpis: {
        totalImpressions: currentTotals.impressions,
        totalReach: currentTotals.reach,
        totalShares: currentTotals.shares,
        totalSaves: currentTotals.saves,
        totalViews: currentTotals.views,
        totalClicks: currentTotals.clicks,
        meaningfulActions: currentTotals.meaningfulActions,
        meaningfulRate: currentTotals.meaningfulRate,
        reachRatio: currentTotals.reachRatio,
        itemCount: currentTotals.itemCount,
        deltas,
      },
      timeSeries,
      platformBreakdown,
      formatBreakdown,
      contentItems: enrichedItems,
    };
  },
});
