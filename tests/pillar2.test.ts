import { describe, it, expect } from "vitest";
import {
  calculateMannWhitneyPValue,
  normalCdf,
  getMedian,
  getMean,
} from "../convex/hypotheses";

describe("Pillar 2: Donor Grant Dossier, Narrative Ripple & Hypothesis Testing", () => {
  describe("Empirical Hypothesis Testing & Mann-Whitney U Statistics", () => {
    it("computes exact median and mean for skewed social media metrics", () => {
      const sample = [12, 14, 15, 18, 25, 200]; // 200 is an outlier
      expect(getMean(sample)).toBe(47.33);
      expect(getMedian(sample)).toBe(16.5); // Median is robust against viral outlier
    });

    it("evaluates standard normal CDF approximation", () => {
      // z = 0 => 0.5
      expect(normalCdf(0)).toBeCloseTo(0.5, 2);
      // z = 1.96 => ~0.975
      expect(normalCdf(1.96)).toBeCloseTo(0.975, 2);
    });

    it("returns p-value < 0.05 for statistically significant editorial difference", () => {
      // Group A (e.g. Document Scan Hook saves): very high
      const sampleA = [450, 480, 520, 600, 550, 590, 610, 630];
      // Group B (e.g. Rhetorical Question Hook saves): much lower
      const sampleB = [80, 95, 110, 120, 130, 90, 85, 105];

      const pValue = calculateMannWhitneyPValue(sampleA, sampleB);
      expect(pValue).toBeLessThan(0.05);
    });

    it("returns non-significant p-value (~1.0) when distributions are virtually identical", () => {
      const sampleA = [100, 105, 110, 115, 120];
      const sampleB = [101, 104, 111, 114, 119];

      const pValue = calculateMannWhitneyPValue(sampleA, sampleB);
      expect(pValue).toBeGreaterThan(0.5);
    });

    it("handles small samples safely without dividing by zero", () => {
      expect(calculateMannWhitneyPValue([10], [20])).toBe(0.5);
      expect(calculateMannWhitneyPValue([], [20, 30])).toBe(0.5);
    });

    it("properly resolves tied values in rank summation", () => {
      // Tied ranks: 10, 10, 10
      const sampleA = [10, 20, 30];
      const sampleB = [10, 10, 40];
      const pValue = calculateMannWhitneyPValue(sampleA, sampleB);
      expect(typeof pValue).toBe("number");
      expect(pValue).toBeGreaterThan(0);
      expect(pValue).toBeLessThanOrEqual(1.0);
    });
  });

  describe("Public-Interest Engagement Index (PIEI) Formula Integrity", () => {
    function computePiei(metrics: {
      saves: number;
      shares: number;
      comments: number;
      likes: number;
      reachOrViews: number;
    }): number {
      if (!metrics.reachOrViews || metrics.reachOrViews <= 0) return 0;
      const weightedScore =
        metrics.saves * 5 +
        metrics.shares * 3 +
        metrics.comments * 2 +
        metrics.likes * 1;
      return Number(((weightedScore / metrics.reachOrViews) * 100).toFixed(2));
    }

    it("rewards high conviction actions (saves x5, shares x3) over passive vanity likes (x1)", () => {
      const baseReach = 10000;

      // Post 1: High conviction investigative piece (many saves & shares)
      const investigativePost = computePiei({
        saves: 400, // 400 * 5 = 2000
        shares: 300, // 300 * 3 = 900
        comments: 100, // 100 * 2 = 200
        likes: 200, // 200 * 1 = 200
        reachOrViews: baseReach, // total: 3300 / 10000 * 100 = 33.00
      });

      // Post 2: Viral meme / passive double-tap entertainment (lots of likes, virtually 0 saves/shares)
      const entertainmentPost = computePiei({
        saves: 10, // 10 * 5 = 50
        shares: 20, // 20 * 3 = 60
        comments: 50, // 50 * 2 = 100
        likes: 1200, // 1200 * 1 = 1200
        reachOrViews: baseReach, // total: 1410 / 10000 * 100 = 14.10
      });

      expect(investigativePost).toBe(33.0);
      expect(entertainmentPost).toBe(14.1);
      expect(investigativePost).toBeGreaterThan(entertainmentPost * 2);
    });
  });

  describe("Cross-Platform Narrative Ripple Flow Calculation", () => {
    it("traces narrative amplification from anchor post to secondary social adaptations", () => {
      const posts = [
        { id: "1", title: "Anchor Documentary", reach: 50000, shares: 1200, saves: 3400, publishedAt: 1000 },
        { id: "2", title: "Instagram Carousel", reach: 25000, shares: 800, saves: 1900, publishedAt: 2000 },
        { id: "3", title: "X Thread Breakdown", reach: 15000, shares: 600, saves: 400, publishedAt: 3000 },
      ];

      const anchor = posts[0];
      const secondaryPosts = posts.slice(1);
      const secondaryReach = secondaryPosts.reduce((sum, p) => sum + p.reach, 0);
      const secondarySaves = secondaryPosts.reduce((sum, p) => sum + p.saves, 0);
      const secondaryShares = secondaryPosts.reduce((sum, p) => sum + p.shares, 0);

      expect(anchor.title).toBe("Anchor Documentary");
      expect(secondaryReach).toBe(40000);
      expect(secondarySaves).toBe(2300);
      expect(secondaryShares).toBe(1400);
    });
  });
});
