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

  return {
    engagementCount,
    engagementRate,
    engagementRateBasis,
    viewToFollowerRate,
    shareRate,
    commentRate,
    saveRate,
  };
}
