import { describe, it, expect } from "vitest";
import {
  tokenize,
  computeTopicSimilarity,
} from "../convex/campaigns";

describe("Pillar 3: Smart AI Campaign Auto-Suggestions", () => {
  describe("Tokenization & Preprocessing", () => {
    it("lowercases, removes punctuation, filters stop words, and keeps tokens >= 3 chars", () => {
      const tokens = tokenize("The investigation into Public Hospital Procurement contracts!");
      expect(tokens.has("investigation")).toBe(true);
      expect(tokens.has("public")).toBe(true);
      expect(tokens.has("hospital")).toBe(true);
      expect(tokens.has("procurement")).toBe(true);
      expect(tokens.has("contracts")).toBe(true);

      // Stop words and short words filtered out
      expect(tokens.has("the")).toBe(false);
      expect(tokens.has("into")).toBe(false);
      expect(tokens.has("to")).toBe(false);
    });
  });

  describe("Semantic Topic & Content Similarity Scoring", () => {
    const campaign = {
      name: "Healthcare Accountability",
      description: "Tracking corruption and misallocated funds in public hospital procurement.",
      objectives: [
        "Uncover fraudulent supplier bidding",
        "Document shortages in regional clinics",
      ],
    };

    it("assigns high confidence (0.95) for direct campaign candidate matches", () => {
      const post = {
        title: "Hospital audit findings",
        caption: "Audit report reveals massive equipment markups.",
        campaignCandidate: "Healthcare Accountability",
      };

      const result = computeTopicSimilarity(post, campaign);
      expect(result.score).toBe(0.95);
      expect(result.reason).toContain('Targeted candidate for "Healthcare Accountability"');
    });

    it("detects thematic topic match (0.85) between post primaryTopic and campaign name", () => {
      const post = {
        title: "Medical supplier expose",
        caption: "Reviewing company records of shell corporations.",
        primaryTopic: "Healthcare Governance & Medicine",
      };

      const result = computeTopicSimilarity(post, campaign);
      expect(result.score).toBe(0.85);
      expect(result.reason).toContain("Matches campaign theme");
    });

    it("detects keyword overlap (>= 0.55) from caption against campaign objectives", () => {
      const post = {
        title: "Ministry contracts under review",
        caption: "Investigating public hospital procurement bids and supplier kickbacks.",
      };

      const result = computeTopicSimilarity(post, campaign);
      expect(result.score).toBeGreaterThanOrEqual(0.55);
      expect(result.reason).toContain("Shared key subjects");
    });

    it("returns score 0 for unrelated content", () => {
      const post = {
        title: "National Football League Finals",
        caption: "Highlights from yesterday's soccer match and coach press conference.",
        primaryTopic: "Sports & Athletics",
      };

      const result = computeTopicSimilarity(post, campaign);
      expect(result.score).toBe(0);
      expect(result.reason).toBe("Insufficient match");
    });
  });
});
