import { describe, it, expect } from "vitest";
import {
  analyzePostContent,
  generatePostExplanation,
  ANALYSIS_VERSION,
} from "../lib/ai";

describe("AI Content Analysis Service (Section 26-29)", () => {
  it("classifies post content objectively with standard categories", async () => {
    const input = {
      platform: "instagram",
      postType: "carousel",
      title: "Why Are Rent Prices Rising in City Center?",
      caption: "Our investigation reveals that 42% of residential leases are owned by 3 corporate entities. What do you think should be done? Link in bio.",
    };

    const result = await analyzePostContent(input);

    expect(result.primaryTopic).toBe("housing");
    expect(result.containsStatistic).toBe(true);
    expect(result.containsQuestion).toBe(true);
    expect(result.hookType).toBe("question");
    expect(result.ctaType).toBe("read");
    expect(result.analysisVersion).toBe(ANALYSIS_VERSION);
  });

  it("handles posts without questions or statistics", async () => {
    const input = {
      platform: "linkedin",
      postType: "post",
      title: "Clean Water Infrastructure Statement",
      caption: "Welcoming municipal representatives to discuss water quality standards.",
    };

    const result = await analyzePostContent(input);

    expect(result.primaryTopic).toBe("water quality");
    expect(result.containsStatistic).toBe(false);
    expect(result.containsQuestion).toBe(false);
    expect(result.analysisVersion).toBe(ANALYSIS_VERSION);
  });
});

describe("AI Performance Explanation Service (Section 30, 34)", () => {
  it("generates evidence-based explanation for top-performing post", async () => {
    const input = {
      platform: "instagram",
      views: 75000,
      shares: 1200,
      benchmarks: {
        viewsVsMedian: 150,
        sharesVsMedian: 220,
        percentileRank: 92,
      },
      analysis: {
        primaryTopic: "housing",
        hookType: "question",
        ctaType: "share",
        contentFormat: "carousel",
      },
    };

    const result = await generatePostExplanation(input);

    expect(result.headline).toContain("Top-Decile");
    expect(result.explanation).toContain("92%");
    expect(result.keyDrivers.length).toBeGreaterThan(0);
    expect(result.confidence).toBe("strong_evidence");
  });

  it("modulates confidence for lower sample or below-median performance", async () => {
    const input = {
      platform: "linkedin",
      views: 1200,
      benchmarks: {
        viewsVsMedian: -45,
        percentileRank: 25,
      },
      analysis: {
        primaryTopic: "climate",
        hookType: "none",
      },
    };

    const result = await generatePostExplanation(input);

    expect(result.headline).toBe("Below-Median Reach");
    expect(result.confidence).toBe("early_signal");
    expect(result.testingRecommendation).toContain("Experiment");
  });
});
