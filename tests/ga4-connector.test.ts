import { describe, it, expect } from "vitest";
import {
  buildCivicAttributionHeadline,
  formatTimeSeconds,
  DEMO_GA4_ARTICLES,
} from "../convex/lib/ga4Data";
import {
  fetchGA4Articles,
  getDemoSandboxArticles,
  buildAttributionHeadline,
} from "../lib/analytics/ga4-client";

describe("Pillar 2: Google Analytics 4 (GA4) & Social-to-Web Attribution Bridge", () => {
  describe("Civic Attribution Headline Builder", () => {
    it("generates the exact canonical civil society attribution sentence", () => {
      const headline = buildCivicAttributionHeadline({
        articleTitle: "Offshore Banking in Beirut",
        uniqueReaders: 18400,
        socialSharePercent: 64,
        topSocialFormat: "3-post Instagram carousel",
        publishDateStr: "March 12",
        avgEngagementSeconds: 228, // 3m 48s
      });

      expect(headline).toBe(
        "Investigation Dossier: 'Offshore Banking in Beirut' received 18,400 unique readers on your site. 64% of traffic came directly from the 3-post Instagram carousel published on March 12, with an average reading time of 3m 48s."
      );
    });

    it("formats seconds with leading zero when under 10 seconds", () => {
      expect(formatTimeSeconds(248)).toBe("4m 08s");
      expect(formatTimeSeconds(65)).toBe("1m 05s");
      expect(formatTimeSeconds(300)).toBe("5m 00s");
    });

    it("client library buildAttributionHeadline matches canonical structure", () => {
      const headline = buildAttributionHeadline({
        articleTitle: "Public Hospital Procurement",
        uniqueReaders: 13900,
        socialSharePercent: 58,
        topSocialFormat: "YouTube investigative mini-documentary",
        publishDateStr: "February 26",
        avgTimeSeconds: 264, // 4m 24s
      });

      expect(headline).toContain("Investigation Dossier: 'Public Hospital Procurement'");
      expect(headline).toContain("13,900 unique readers");
      expect(headline).toContain("58% of traffic came directly from the YouTube investigative mini-documentary");
      expect(headline).toContain("average reading time of 4m 24s");
    });
  });

  describe("GA4 Demo Sandbox Readership Dataset", () => {
    it("provides 3 realistic civil society investigative dossiers", async () => {
      const articles = await fetchGA4Articles({
        propertyId: "314159265",
        credentialsType: "demo_sandbox",
      });

      expect(articles.length).toBe(3);
      expect(articles[0].path).toBe("/investigations/offshore-banking-beirut");
      expect(articles[1].path).toBe("/investigations/hospital-procurement-monopolies");
      expect(articles[2].path).toBe("/reports/judicial-transparency-index-2026");
    });

    it("verifies deep attention dwell times exceeding 3 minutes for investigative pieces", () => {
      const articles = getDemoSandboxArticles();

      for (const article of articles) {
        // Commercial average bounce is 10-15s; civil society deep reading is > 3 mins (180s)
        expect(article.averageEngagementTimeSeconds).toBeGreaterThanOrEqual(180);
        // Scroll depth 90% is tracked
        expect(article.scrollDepth90Percent).toBeGreaterThan(0);
        // Action conversions: document downloads (leaked records/PDFs)
        expect(article.documentDownloads).toBeGreaterThan(0);
      }
    });

    it("includes rich social referrer attribution breakdown", () => {
      const articles = getDemoSandboxArticles();
      const offshore = articles.find((a) => a.path.includes("offshore-banking-beirut"))!;

      expect(offshore.socialReferralShare).toBe(64);
      expect(offshore.topReferrers.length).toBeGreaterThanOrEqual(3);

      const instaReferrer = offshore.topReferrers.find((r) => r.source === "instagram");
      expect(instaReferrer).toBeDefined();
      expect(instaReferrer?.users).toBe(8200);
      expect(instaReferrer?.campaign).toBe("offshore_banking_expose");
    });
  });

  describe("Readership Rollups & Deep Attention vs Skimming Ratios", () => {
    it("correctly computes weighted average dwell time across dossiers", () => {
      const articles = DEMO_GA4_ARTICLES;

      const totalSessions = articles.reduce((sum, a) => sum + a.sessions, 0);
      const totalDuration = articles.reduce(
        (sum, a) => sum + a.averageEngagementTimeSeconds * a.sessions,
        0
      );
      const weightedAvgSeconds = Math.round(totalDuration / totalSessions);

      // (228*24100 + 264*17800 + 310*13900) / (24100 + 17800 + 13900) = ~260s (4m 20s)
      expect(weightedAvgSeconds).toBeGreaterThan(240);
      expect(weightedAvgSeconds).toBeLessThan(280);
    });

    it("correctly computes aggregate action conversions (evidence downloads)", () => {
      const articles = DEMO_GA4_ARTICLES;
      const totalDownloads = articles.reduce((sum, a) => sum + a.documentDownloads, 0);
      const totalPetitions = articles.reduce((sum, a) => sum + a.petitionClicks, 0);
      const totalTips = articles.reduce((sum, a) => sum + a.whistleblowerTips, 0);

      expect(totalDownloads).toBe(1240 + 890 + 2150); // 4,280 PDF downloads
      expect(totalPetitions).toBe(420 + 1450 + 820); // 2,690 petitions
      expect(totalTips).toBe(28 + 19 + 12); // 59 whistleblower tips
    });

    it("aggregates multi-channel traffic acquisition correctly", () => {
      const articles = DEMO_GA4_ARTICLES;
      const channelUsers: Record<string, number> = {};

      for (const art of articles) {
        for (const ref of art.topReferrers) {
          channelUsers[ref.source] = (channelUsers[ref.source] ?? 0) + ref.users;
        }
      }

      // Instagram users = 8200 + 5600 = 13800
      expect(channelUsers["instagram"]).toBe(13800);
      // X users = 3580 + 2350 = 5930
      expect(channelUsers["x"]).toBe(5930);
      // Google Organic = 4100 + 3840 + 4500 = 12440
      expect(channelUsers["google"]).toBe(12440);
    });
  });
});
