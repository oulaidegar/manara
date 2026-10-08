import { describe, it, expect } from "vitest";
import { calculateEngagement } from "../lib/social/normalize";

describe("Post Intelligence & Deterministic Analytics (Sections 8, 10, 18, 19)", () => {
  describe("Account Median & Benchmark Calculation", () => {
    function calculateMedian(arr: number[]): number {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function calculatePercentile(val: number, list: number[]): number {
      if (list.length === 0) return 0;
      const countBelow = list.filter((v) => v < val).length;
      return Math.round((countBelow / list.length) * 100);
    }

    it("correctly computes median views without skew from viral outliers", () => {
      // 9 regular posts and 1 viral outlier
      const views = [12000, 14000, 15000, 16000, 18000, 19000, 21000, 22000, 25000, 850000];
      const median = calculateMedian(views);
      expect(median).toBe(18500); // Resistant to the 850k outlier
    });

    it("calculates percentage difference against account median", () => {
      const medianViews = 20000;
      const postViews = 56800;
      const diffPercent = Math.round(((postViews - medianViews) / medianViews) * 100);
      expect(diffPercent).toBe(184); // +184% vs account median
    });

    it("correctly determines percentile ranking", () => {
      const cohort = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
      expect(calculatePercentile(950, cohort)).toBe(90); // Top 10%
      expect(calculatePercentile(990, cohort)).toBe(90);
      expect(calculatePercentile(50, cohort)).toBe(0);
    });
  });

  describe("Engagement Rate Basis Transparency (Section 17)", () => {
    it("assigns basis impressions when impressions are available", () => {
      const res = calculateEngagement({
        impressions: 50000,
        views: 40000,
        likes: 2000,
        comments: 250,
        shares: 150,
      });

      expect(res.engagementRateBasis).toBe("impressions");
      expect(res.engagementRate).toBe(0.048); // (2000 + 250 + 150) / 50000 = 0.048
    });

    it("assigns basis views when impressions and reach are missing", () => {
      const res = calculateEngagement({
        views: 20000,
        likes: 800,
        shares: 200,
      });

      expect(res.engagementRateBasis).toBe("views");
      expect(res.engagementRate).toBe(0.05); // 1000 / 20000 = 0.05
    });

    it("does not calculate engagementRate if denominator is missing", () => {
      const res = calculateEngagement({
        likes: 300,
        comments: 40,
      });

      expect(res.engagementCount).toBe(340);
      expect(res.engagementRate).toBeUndefined();
      expect(res.engagementRateBasis).toBeUndefined();
    });
  });

  describe("Public-Interest Engagement Index (PIEI) & Conviction (Pillar 1)", () => {
    it("correctly weights high-conviction actions (Saves 5x, Shares 3x, Comments 2x, Likes 1x)", () => {
      // Investigative exposé with high evidence archiving (saves) and amplification (shares)
      const investigativePost = calculateEngagement({
        reach: 10000,
        saves: 150,    // 150 * 5 = 750
        shares: 200,   // 200 * 3 = 600
        comments: 100, // 100 * 2 = 200
        likes: 300,    // 300 * 1 = 300
      });
      // Total weighted = 1850. PIEI = (1850 / 10000) * 100 = 18.5
      expect(investigativePost.pieiScore).toBe(18.5);
      expect(investigativePost.pieiBasis).toBe("reach");
      expect(investigativePost.convictionTier).toBe("high");

      // Passive meme post with high double-tap likes but near-zero saves/shares
      const viralMeme = calculateEngagement({
        reach: 10000,
        saves: 5,     // 5 * 5 = 25
        shares: 10,   // 10 * 3 = 30
        comments: 15, // 15 * 2 = 30
        likes: 900,   // 900 * 1 = 900
      });
      // Total weighted = 985. PIEI = (985 / 10000) * 100 = 9.85
      expect(viralMeme.pieiScore).toBe(9.85);
      expect(viralMeme.convictionTier).toBe("moderate");

      // PIEI clearly elevates the investigative exposé despite having fewer total vanity likes
      expect(investigativePost.pieiScore!).toBeGreaterThan(viralMeme.pieiScore!);
    });

    it("assigns exceptional tier for posts with PIEI >= 25", () => {
      const topImpactPost = calculateEngagement({
        reach: 5000,
        saves: 200,   // 1000
        shares: 150,  // 450
        comments: 50, // 100
        likes: 100,   // 100
      });
      // Weighted = 1650. (1650 / 5000) * 100 = 33.0
      expect(topImpactPost.pieiScore).toBe(33);
      expect(topImpactPost.convictionTier).toBe("exceptional");
    });
  });
});

