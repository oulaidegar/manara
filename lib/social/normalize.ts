/**
 * Radar Social Engine - Normalization Utilities
 * Based on Sections 16, 17, 46 of the Master Build Specification
 */

import {
  NormalizedMetrics,
  CalculatedEngagement,
  EngagementRateBasis,
  SocialPlatform,
} from "./types";

/**
 * Normalizes a metric value.
 * Non-negotiable rule (Section 46): Never treat undefined as 0.
 * If value is null, undefined, empty string, or NaN -> returns undefined.
 */
export function normalizeMetric(val: unknown): number | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "number") {
    if (isNaN(val) || !isFinite(val)) return undefined;
    return Math.max(0, Math.round(val));
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "" || trimmed === "N/A" || trimmed === "-") return undefined;

    // Handle formats like 1.2M, 50K
    const lower = trimmed.toLowerCase();
    if (lower.endsWith("k")) {
      const num = parseFloat(lower.slice(0, -1));
      return isNaN(num) ? undefined : Math.round(num * 1000);
    }
    if (lower.endsWith("m")) {
      const num = parseFloat(lower.slice(0, -1));
      return isNaN(num) ? undefined : Math.round(num * 1000000);
    }
    if (lower.endsWith("b")) {
      const num = parseFloat(lower.slice(0, -1));
      return isNaN(num) ? undefined : Math.round(num * 1000000000);
    }

    // Strip commas, spaces
    const cleaned = trimmed.replace(/,/g, "").replace(/\s/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) || !isFinite(parsed) ? undefined : Math.max(0, Math.round(parsed));
  }
  return undefined;
}

/**
 * Normalizes timestamp from ISO string, UNIX seconds, or milliseconds.
 */
export function normalizeTimestamp(val: unknown): number {
  if (!val) return Date.now();
  if (typeof val === "number") {
    // If Unix timestamp in seconds (less than 10^11), convert to ms
    return val < 100000000000 ? val * 1000 : val;
  }
  if (typeof val === "string") {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? Date.now() : parsed;
  }
  if (val instanceof Date) {
    return val.getTime();
  }
  return Date.now();
}

/**
 * Normalizes a social handle or profile URL to a clean handle.
 */
export function normalizeHandle(handleOrUrl: string, _platform?: SocialPlatform): string {
  if (!handleOrUrl) return "";
  let cleaned = handleOrUrl.trim();

  // If full URL, extract last path segment or query
  try {
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      const url = new URL(cleaned);
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        // LinkedIn company URLs: linkedin.com/company/handle
        if (segments[0] === "company" && segments.length > 1) {
          cleaned = segments[1];
        } else if (segments[0] === "in" && segments.length > 1) {
          cleaned = segments[1];
        } else {
          cleaned = segments[segments.length - 1];
        }
      }
    }
  } catch {
    // Not a valid URL, treat as raw handle
  }

  // Remove leading @
  if (cleaned.startsWith("@")) {
    cleaned = cleaned.substring(1);
  }

  // Remove query params or slashes
  cleaned = cleaned.split("?")[0].replace(/\/+$/, "");

  return cleaned;
}

/**
 * Deterministically calculates engagement count, rates, and ratios.
 * Follows Section 16 & 17 of the Master Build Specification.
 */
export function calculateEngagement(
  metrics: NormalizedMetrics,
  followerCount?: number
): CalculatedEngagement {
  const interactions = [
    metrics.likes,
    metrics.comments,
    metrics.shares,
    metrics.saves,
    metrics.reposts,
    metrics.clicks,
  ].filter((v): v is number => v !== undefined);

  // If none of the interaction metrics are available, engagementCount is undefined
  const engagementCount =
    interactions.length > 0
      ? interactions.reduce((sum, val) => sum + val, 0)
      : undefined;

  // Determine explicit engagement denominator hierarchy (Section 17)
  let engagementRate: number | undefined = undefined;
  let engagementRateBasis: EngagementRateBasis | undefined = undefined;

  if (engagementCount !== undefined) {
    if (metrics.impressions && metrics.impressions > 0) {
      engagementRate = Number((engagementCount / metrics.impressions).toFixed(4));
      engagementRateBasis = "impressions";
    } else if (metrics.reach && metrics.reach > 0) {
      engagementRate = Number((engagementCount / metrics.reach).toFixed(4));
      engagementRateBasis = "reach";
    } else if (metrics.views && metrics.views > 0) {
      engagementRate = Number((engagementCount / metrics.views).toFixed(4));
      engagementRateBasis = "views";
    } else if (followerCount && followerCount > 0) {
      engagementRate = Number((engagementCount / followerCount).toFixed(4));
      engagementRateBasis = "followers";
    }
  }

  // Exposure denominator for individual action rates
  const exposure =
    metrics.views && metrics.views > 0
      ? metrics.views
      : metrics.impressions && metrics.impressions > 0
      ? metrics.impressions
      : metrics.reach && metrics.reach > 0
      ? metrics.reach
      : undefined;

  const shareRate =
    metrics.shares !== undefined && exposure
      ? Number((metrics.shares / exposure).toFixed(4))
      : undefined;

  const commentRate =
    metrics.comments !== undefined && exposure
      ? Number((metrics.comments / exposure).toFixed(4))
      : undefined;

  const saveRate =
    metrics.saves !== undefined && exposure
      ? Number((metrics.saves / exposure).toFixed(4))
      : undefined;

  const viewToFollowerRate =
    metrics.views !== undefined && followerCount && followerCount > 0
      ? Number((metrics.views / followerCount).toFixed(4))
      : undefined;

  // Public-Interest Engagement Index (PIEI) Calculation (Pillar 1)
  const pieiResult = calculatePIEI(metrics, followerCount);

  return {
    engagementCount,
    engagementRate,
    engagementRateBasis,
    viewToFollowerRate,
    shareRate,
    commentRate,
    saveRate,
    pieiScore: pieiResult.pieiScore,
    pieiBasis: pieiResult.pieiBasis,
    convictionTier: pieiResult.convictionTier,
  };
}

/**
 * Computes the Public-Interest Engagement Index (PIEI) (Pillar 1).
 * Formula:
 * PIEI = ((Saves * 5) + (Shares * 3) + (Comments * 2) + (Likes * 1)) / Denominator * 100
 *
 * Saves (5x): High-conviction evidence archiving and future reference.
 * Shares (3x): Public amplification & civic distribution.
 * Comments (2x): Deliberative civic discourse.
 * Likes (1x): Standard passive validation.
 */
export function calculatePIEI(
  metrics: NormalizedMetrics,
  followerCount?: number
): {
  pieiScore?: number;
  pieiBasis?: "reach" | "impressions" | "views" | "interactions" | "followers";
  convictionTier?: "exceptional" | "high" | "moderate" | "baseline";
  weightedScore?: number;
} {
  const hasInteractions =
    metrics.saves !== undefined ||
    metrics.shares !== undefined ||
    metrics.comments !== undefined ||
    metrics.likes !== undefined;

  if (!hasInteractions) {
    return {};
  }

  const weightedScore =
    (metrics.saves ?? 0) * 5 +
    (metrics.shares ?? 0) * 3 +
    (metrics.comments ?? 0) * 2 +
    (metrics.likes ?? 0) * 1;

  // Explicit denominator hierarchy per Rule 17: Reach -> Impressions -> Views -> Interactions -> Followers
  let denominator: number | undefined;
  let pieiBasis: "reach" | "impressions" | "views" | "interactions" | "followers" | undefined;

  if (metrics.reach && metrics.reach > 0) {
    denominator = metrics.reach;
    pieiBasis = "reach";
  } else if (metrics.impressions && metrics.impressions > 0) {
    denominator = metrics.impressions;
    pieiBasis = "impressions";
  } else if (metrics.views && metrics.views > 0) {
    denominator = metrics.views;
    pieiBasis = "views";
  } else {
    const rawInteractionSum =
      (metrics.likes ?? 0) +
      (metrics.comments ?? 0) +
      (metrics.shares ?? 0) +
      (metrics.saves ?? 0);
    if (rawInteractionSum > 0) {
      denominator = rawInteractionSum;
      pieiBasis = "interactions";
    } else if (followerCount && followerCount > 0) {
      denominator = followerCount;
      pieiBasis = "followers";
    }
  }

  if (denominator === undefined || denominator <= 0) {
    return { weightedScore };
  }

  const pieiScore = Number(((weightedScore / denominator) * 100).toFixed(2));

  // Conviction tier classification based on public-interest benchmarks
  let convictionTier: "exceptional" | "high" | "moderate" | "baseline" = "baseline";
  if (pieiScore >= 25) {
    convictionTier = "exceptional"; // Top 5%
  } else if (pieiScore >= 12) {
    convictionTier = "high"; // Top 20%
  } else if (pieiScore >= 5) {
    convictionTier = "moderate";
  } else {
    convictionTier = "baseline";
  }

  return {
    pieiScore,
    pieiBasis,
    convictionTier,
    weightedScore,
  };
}

/**
 * Computes 24h Velocity Ratio and Evergreen Tail Index (Pillar 1).
 * - 24h Velocity Ratio: % of total views gained in first 24 hours.
 * - Evergreen Tail Index: Flags posts that continue gathering shares, saves, and views > 14 days after publication.
 */
export function computePostLongevity(
  publishedAt: number,
  metrics: NormalizedMetrics,
  snapshots?: Array<{ capturedAt: number; views?: number; shares?: number; saves?: number }>
): {
  velocityRatio24h?: number;
  isEvergreen?: boolean;
  evergreenScore?: number;
} {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const postAgeDays = (now - publishedAt) / dayMs;

  let velocityRatio24h: number | undefined;
  let isEvergreen = false;
  let evergreenScore: number | undefined;

  const totalViews = metrics.views ?? metrics.impressions ?? metrics.reach;

  // 1. Calculate 24h Velocity Ratio if snapshots exist
  if (snapshots && snapshots.length > 1 && totalViews && totalViews > 0) {
    const targetTime = publishedAt + dayMs;
    // Find snapshot closest to +24 hours (within 12h-36h window)
    const snapshot24h = snapshots.find(
      (s) => Math.abs(s.capturedAt - targetTime) <= 12 * 60 * 60 * 1000
    );

    if (snapshot24h && snapshot24h.views !== undefined && snapshot24h.views > 0) {
      velocityRatio24h = Math.min(100, Math.round((snapshot24h.views / totalViews) * 100));
    }
  }

  // 2. Evergreen Tail Index (Pillar 1)
  // Posts > 14 days old with sustained staying power (evidence archiving & amplification)
  if (postAgeDays >= 14) {
    const saves = metrics.saves ?? 0;
    const shares = metrics.shares ?? 0;
    const savesAndShares = saves + shares;

    // Check if snapshots indicate post-14-day growth
    let hasPost14DayGrowth = false;
    if (snapshots && snapshots.length >= 2) {
      const snap14d = snapshots.find((s) => s.capturedAt - publishedAt >= 13 * dayMs);
      const latestSnap = snapshots[snapshots.length - 1];
      if (snap14d && latestSnap && latestSnap.views && snap14d.views) {
        if (latestSnap.views > snap14d.views * 1.1) {
          hasPost14DayGrowth = true;
        }
      }
    }

    // High conviction archiving (saves >= 10 or saves+shares >= 25 or post-14d growth)
    if (saves >= 10 || savesAndShares >= 25 || hasPost14DayGrowth) {
      isEvergreen = true;
      evergreenScore = Number(
        Math.min(100, ((saves * 3 + shares * 2) / Math.max(1, totalViews ? totalViews / 100 : 1))).toFixed(1)
      );
    }
  }

  return {
    velocityRatio24h,
    isEvergreen,
    evergreenScore,
  };
}
