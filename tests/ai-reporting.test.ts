import { describe, it, expect } from "vitest";
import {
  deterministicSynthesizeReport,
  DeterministicReportBundle,
} from "../convex/lib/reportSynthesis";

describe("Pillar 3: AI Reporting Engine & Anti-Hallucination Pipeline", () => {
  const baseBundle: DeterministicReportBundle = {
    reportTitle: "Q3 Accountability & Communications Retrospective",
    reportType: "board",
    periodStart: 1720000000000,
    periodEnd: 1727770000000,
    periodDays: 90,
    organizationName: "Daraj Media Watchdog",
    kpi: {
      totalImpressions: 450000,
      totalReach: 320000,
      totalViews: 380000,
      totalShares: 12500,
      totalSaves: 18400,
      meaningfulActions: 30900,
      meaningfulRate: 68.7,
      pieiScore: 32.4,
      outputsCount: 42,
      outcomesCount: 3,
      webReaders: 24500,
      avgEngagementTimeSeconds: 248,
      scrollDepthPercent: 84,
      documentDownloads: 4120,
    },
    formatEfficiency: [
      {
        format: "carousel",
        count: 14,
        impressions: 180000,
        views: 160000,
        shares: 6200,
        saves: 11400,
        efficiencyRate: 97.8,
        avgPiei: 41.2,
      },
      {
        format: "video",
        count: 12,
        impressions: 140000,
        views: 120000,
        shares: 3800,
        saves: 3900,
        efficiencyRate: 55.0,
        avgPiei: 24.6,
      },
      {
        format: "post",
        count: 16,
        impressions: 130000,
        views: 100000,
        shares: 2500,
        saves: 3100,
        efficiencyRate: 43.1,
        avgPiei: 18.2,
      },
    ],
    velocityCurve: [
      {
        date: "Jul 1",
        timestamp: 1720000000000,
        impressions: 50000,
        reach: 40000,
        views: 45000,
        shares: 1500,
        saves: 2200,
        meaningfulActions: 3700,
        meaningfulRate: 74.0,
      },
      {
        date: "Aug 15",
        timestamp: 1723500000000,
        impressions: 250000,
        reach: 180000,
        views: 210000,
        shares: 7000,
        saves: 10500,
        meaningfulActions: 17500,
        meaningfulRate: 70.0,
      },
      {
        date: "Sep 30",
        timestamp: 1727770000000,
        impressions: 450000,
        reach: 320000,
        views: 380000,
        shares: 12500,
        saves: 18400,
        meaningfulActions: 30900,
        meaningfulRate: 68.7,
      },
    ],
    topShowcases: [
      {
        id: "post-1",
        title: "Offshore Procurement Bank Records Exposed",
        platform: "instagram",
        format: "carousel",
        views: 65000,
        shares: 3200,
        saves: 5800,
        pieiScore: 54.2,
        webReferrals: 16200,
        hookType: "document_scan",
        ctaType: "archive_save",
      },
    ],
    verifiedOutcomes: [
      {
        id: "outcome-1",
        title: "Parliamentary Inquiry Launched into Hospital Contracts",
        description: "Official inquiry initiated following investigative exposé.",
        changeType: "policy",
        verificationStatus: "verified",
        contributionStatement: "Corroborated by parliamentary record Hansard 44/2B.",
        evidenceItems: [
          {
            title: "Parliamentary Gazette Session 44",
            publisher: "Official Gazette",
            url: "https://parliament.gov/records/44",
          },
        ],
      },
      {
        id: "outcome-2",
        title: "Minister of Health Orders Audit Review",
        description: "Ministerial decree issued for emergency review.",
        changeType: "institutional_action",
        verificationStatus: "verified",
        evidenceItems: [],
      },
      {
        id: "outcome-3",
        title: "Civil Society Coalition Petitions Court of Audit",
        description: "Formal legal complaint filed by civic partners.",
        changeType: "legal",
        verificationStatus: "verified",
        evidenceItems: [],
      },
    ],
  };

  describe("Anti-Hallucination Golden Rule", () => {
    it("preserves exact verified figures in executive narrative without hallucinating", () => {
      const result = deterministicSynthesizeReport(baseBundle);

      // Verify exact metrics appear in text
      expect(result.executiveSummary).toContain("380,000"); // totalViews
      expect(result.executiveSummary).toContain("320,000"); // totalReach
      expect(result.executiveSummary).toContain("18,400"); // totalSaves
      expect(result.executiveSummary).toContain("12,500"); // totalShares
      expect(result.executiveSummary).toContain("32.4"); // pieiScore
      expect(result.executiveSummary).toContain("97.8‰"); // best format efficiency
      expect(result.executiveSummary).toContain("3 documented"); // outcomes count
    });

    it("synthesizes persona-specific takeaways for Board Briefing", () => {
      const result = deterministicSynthesizeReport(baseBundle);
      expect(result.personaTakeaways.length).toBeGreaterThanOrEqual(3);
      expect(result.personaTakeaways[0]).toContain("380,000 views");
      expect(result.personaTakeaways[0]).toContain("30,900 high-conviction actions");
      expect(result.personaTakeaways[1]).toContain("CAROUSEL");
      expect(result.personaTakeaways[2]).toContain("3 societal accountability events");
    });
  });

  describe("Persona Adaptation", () => {
    it("tailors synthesis for Donor Impact Dossier (NED / OSF / EED)", () => {
      const donorBundle: DeterministicReportBundle = {
        ...baseBundle,
        reportType: "donor",
        donorFramework: "ned",
        grantReference: "NED-2026-CSO-849",
      };

      const result = deterministicSynthesizeReport(donorBundle);
      expect(result.executiveSummary).toContain("NED evaluation standards");
      expect(result.executiveSummary).toContain("NED-2026-CSO-849");
      expect(result.personaTakeaways.some((t) => t.includes("Public-Interest Engagement Index"))).toBe(true);
      expect(result.prescriptiveRecommendations.some((r) => r.title.includes("Grant Milestone"))).toBe(true);
    });

    it("tailors synthesis for Editorial & Learning Review", () => {
      const editorialBundle: DeterministicReportBundle = {
        ...baseBundle,
        reportType: "editorial",
      };

      const result = deterministicSynthesizeReport(editorialBundle);
      expect(result.executiveSummary).toContain("Editorial & Learning Review");
      expect(result.personaTakeaways.some((t) => t.includes("CAROUSEL proved to be the most impactful"))).toBe(true);
      expect(result.prescriptiveRecommendations.some((r) => r.title.includes("Hooks") || r.title.includes("Carousel"))).toBe(true);
    });
  });

  describe("Prescriptive Recommendations Structure", () => {
    it("generates structured recommendations with actionable steps and priorities", () => {
      const result = deterministicSynthesizeReport(baseBundle);
      expect(result.prescriptiveRecommendations.length).toBe(3);

      for (const rec of result.prescriptiveRecommendations) {
        expect(rec.title).toBeTruthy();
        expect(rec.rationale).toBeTruthy();
        expect(rec.actionableStep).toBeTruthy();
        expect(rec.expectedImpact).toBeTruthy();
        expect(["high", "strategic", "medium"]).toContain(rec.priority);
      }
    });
  });
});
