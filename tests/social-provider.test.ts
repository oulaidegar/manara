import { describe, it, expect } from "vitest";
import {
  normalizeMetric,
  normalizeTimestamp,
  normalizeHandle,
  calculateEngagement,
} from "../lib/social/normalize";
import { SocialCrawlProvider } from "../lib/social/providers/socialcrawl";

describe("Radar Social Normalization & Provider Adapter (Sections 12, 13, 17, 46)", () => {
  describe("Rule 46: Missing Data vs. Zero", () => {
    it("never treats undefined, null, or empty string as 0", () => {
      expect(normalizeMetric(undefined)).toBeUndefined();
      expect(normalizeMetric(null)).toBeUndefined();
      expect(normalizeMetric("")).toBeUndefined();
      expect(normalizeMetric("N/A")).toBeUndefined();
      expect(normalizeMetric("-")).toBeUndefined();
      expect(normalizeMetric(NaN)).toBeUndefined();
    });

    it("correctly preserves explicit 0 as 0", () => {
      expect(normalizeMetric(0)).toBe(0);
      expect(normalizeMetric("0")).toBe(0);
    });

    it("parses numbers and human shorthand strings", () => {
      expect(normalizeMetric(42500)).toBe(42500);
      expect(normalizeMetric("12,450")).toBe(12450);
      expect(normalizeMetric("50k")).toBe(50000);
      expect(normalizeMetric("1.5M")).toBe(1500000);
    });

    it("normalizes ISO dates and Unix timestamps", () => {
      const ms = 1728288000000;
      expect(normalizeTimestamp(ms)).toBe(ms);
      expect(normalizeTimestamp(ms / 1000)).toBe(ms);
      expect(normalizeTimestamp(new Date(ms).toISOString())).toBe(ms);
    });
  });

  describe("Handle and URL Parsing", () => {
    it("strips @ prefix and clean handles", () => {
      expect(normalizeHandle("@amnesty")).toBe("amnesty");
      expect(normalizeHandle("greenpeace")).toBe("greenpeace");
    });

    it("extracts clean handle from full social URLs", () => {
      expect(normalizeHandle("https://instagram.com/transparency_intl/")).toBe("transparency_intl");
      expect(normalizeHandle("https://www.linkedin.com/company/civic-media?trk=feed")).toBe("civic-media");
      expect(normalizeHandle("https://tiktok.com/@watchdog_group")).toBe("watchdog_group");
    });
  });

  describe("Section 17: Deterministic Engagement Rate & Basis Hierarchy", () => {
    it("prioritizes impressions as rate basis if impressions are present", () => {
      const metrics = {
        impressions: 10000,
        reach: 8000,
        views: 6000,
        likes: 300,
        comments: 50,
        shares: 50,
      };
      const result = calculateEngagement(metrics, 25000);
      expect(result.engagementCount).toBe(400); // 300 + 50 + 50
      expect(result.engagementRateBasis).toBe("impressions");
      expect(result.engagementRate).toBe(0.04); // 400 / 10000 = 0.04
    });

    it("falls back to reach when impressions are missing", () => {
      const metrics = {
        reach: 5000,
        likes: 200,
        comments: 50,
      };
      const result = calculateEngagement(metrics);
      expect(result.engagementCount).toBe(250);
      expect(result.engagementRateBasis).toBe("reach");
      expect(result.engagementRate).toBe(0.05); // 250 / 5000 = 0.05
    });

    it("falls back to views when reach and impressions are missing", () => {
      const metrics = {
        views: 10000,
        likes: 400,
      };
      const result = calculateEngagement(metrics);
      expect(result.engagementCount).toBe(400);
      expect(result.engagementRateBasis).toBe("views");
      expect(result.engagementRate).toBe(0.04);
    });

    it("falls back to followers when exposure metrics are missing", () => {
      const metrics = {
        likes: 250,
        comments: 50,
      };
      const result = calculateEngagement(metrics, 10000);
      expect(result.engagementCount).toBe(300);
      expect(result.engagementRateBasis).toBe("followers");
      expect(result.engagementRate).toBe(0.03);
    });

    it("calculates specific share, comment, and save rates with exposure denominator", () => {
      const metrics = {
        views: 20000,
        likes: 800,
        shares: 200,
        saves: 100,
      };
      const result = calculateEngagement(metrics);
      expect(result.shareRate).toBe(0.01); // 200 / 20000
      expect(result.saveRate).toBe(0.005); // 100 / 20000
      expect(result.commentRate).toBeUndefined(); // comments were not present
    });
  });

  describe("SocialCrawl Provider Adapter", () => {
    const provider = new SocialCrawlProvider();

    it("has provider name socialcrawl", () => {
      expect(provider.name).toBe("socialcrawl");
    });

    it("retrieves and normalizes social profile", async () => {
      const profile = await provider.getProfile({
        platform: "instagram",
        handleOrUrl: "@civic_watch",
      });

      expect(profile.platform).toBe("instagram");
      expect(profile.handle).toBe("civic_watch");
      expect(profile.displayName).toBe("Civic watch");
      expect(profile.followerCount).toBeGreaterThan(0);
      expect(profile.provider).toBe("socialcrawl");
      expect(profile.raw).toBeDefined();
    });

    it("retrieves paginated posts with normalized fields and preserved raw data", async () => {
      const page = await provider.getPosts({
        platform: "instagram",
        externalAccountId: "acc_civic_watch",
        handle: "civic_watch",
        limit: 10,
      });

      expect(page.posts.length).toBe(10);
      const post = page.posts[0];
      expect(post.platform).toBe("instagram");
      expect(post.externalPostId).toBeDefined();
      expect(post.url).toContain("instagram.com");
      expect(post.publishedAt).toBeGreaterThan(0);
      expect(post.title).toBeDefined();
      expect(post.metrics.views).toBeGreaterThan(0);
      expect(post.calculatedMetrics?.engagementRate).toBeDefined();
      expect(post.provider).toBe("socialcrawl");
      expect(post.raw).toBeDefined();
    });
  });
});
