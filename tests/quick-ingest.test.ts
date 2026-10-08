import { describe, it, expect } from "vitest";
import { parseSocialUrl, ingestPostFromUrl } from "../lib/social/quick-ingest";

describe("Universal Quick Ingest Engine (Pillar 3 & Pillar 1)", () => {
  describe("parseSocialUrl", () => {
    it("correctly identifies Instagram posts and reels", () => {
      const post = parseSocialUrl("https://www.instagram.com/p/DB12345XYZ/");
      expect(post.platform).toBe("instagram");
      expect(post.externalPostId).toBe("DB12345XYZ");
      expect(post.postType).toBe("post");

      const reel = parseSocialUrl("https://instagram.com/reel/C89abc/");
      expect(reel.platform).toBe("instagram");
      expect(reel.externalPostId).toBe("C89abc");
      expect(reel.postType).toBe("reel");
    });

    it("correctly identifies YouTube standard videos and shorts", () => {
      const video = parseSocialUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(video.platform).toBe("youtube");
      expect(video.externalPostId).toBe("dQw4w9WgXcQ");
      expect(video.postType).toBe("video");

      const short = parseSocialUrl("https://www.youtube.com/shorts/xyz987abc11");
      expect(short.platform).toBe("youtube");
      expect(short.externalPostId).toBe("xyz987abc11");
      expect(short.postType).toBe("reel");
    });

    it("correctly identifies X / Twitter threads with author handle", () => {
      const tweet = parseSocialUrl("https://x.com/amnesty/status/1842345678901234");
      expect(tweet.platform).toBe("x");
      expect(tweet.authorHandle).toBe("amnesty");
      expect(tweet.externalPostId).toBe("1842345678901234");
    });

    it("correctly identifies TikTok videos with username", () => {
      const tiktok = parseSocialUrl("https://www.tiktok.com/@aljazeera/video/7345678901234567890");
      expect(tiktok.platform).toBe("tiktok");
      expect(tiktok.authorHandle).toBe("aljazeera");
      expect(tiktok.externalPostId).toBe("7345678901234567890");
      expect(tiktok.postType).toBe("reel");
    });

    it("correctly identifies LinkedIn updates", () => {
      const linkedin = parseSocialUrl("https://www.linkedin.com/posts/darajmedia_investigation-corruption-activity-7245678901234567890");
      expect(linkedin.platform).toBe("linkedin");
      expect(linkedin.externalPostId).toContain("7245678901234567890");
    });
  });

  describe("ingestPostFromUrl pipeline", () => {
    it("extracts and computes PIEI conviction score and micro-taxonomy", async () => {
      const result = await ingestPostFromUrl("https://x.com/amnesty/status/1842345678901234");

      expect(result.platform).toBe("x");
      expect(result.pieiScore).toBeGreaterThan(0);
      expect(["exceptional", "high", "moderate", "baseline"]).toContain(result.convictionTier);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.primaryTopic).toBeDefined();
      expect(result.analysis.hookType).toBeDefined();
    });
  });
});
