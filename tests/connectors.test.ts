import { describe, it, expect } from "vitest";
import { YouTubeConnector } from "../convex/connectors/youtube";
import { SYSTEM_METRIC_DEFINITIONS } from "../convex/metrics";

describe("Platform Connectors & Normalized Metrics (Section 22, 23, 16)", () => {
  const youtube = new YouTubeConnector();

  describe("YouTube Priority Connector #1", () => {
    it("has correct provider attributes and priority", () => {
      expect(youtube.provider).toBe("youtube");
      expect(youtube.priority).toBe(1);
      expect(youtube.category).toBe("video");
    });

    it("connects and returns valid connector account details", async () => {
      const account = await youtube.connect({
        channelId: "UC_civic_test",
        channelTitle: "Civil Society Media",
        handle: "civicmedia",
      });

      expect(account.externalAccountId).toBe("UC_civic_test");
      expect(account.name).toBe("Civil Society Media");
      expect(account.handle).toBe("@civicmedia");
      expect(account.url).toBe("https://youtube.com/@civicmedia");
    });

    it("normalizes long-form video item into canonical content item", () => {
      const raw = {
        id: "yt_video_123",
        snippet: {
          title: "Investigation: Procurement Inquiries",
          description: "Full documentary on public tender oversight.",
          publishedAt: "2026-08-15T10:00:00Z",
        },
        statistics: {
          viewCount: "50000",
          likeCount: "3500",
          commentCount: "420",
        },
        contentDetails: {
          duration: "PT15M30S", // 15 mins 30 secs = 930s
        },
      };

      const normalized = youtube.normalizeContent(raw);
      expect(normalized.externalId).toBe("yt_video_123");
      expect(normalized.title).toBe("Investigation: Procurement Inquiries");
      expect(normalized.contentType).toBe("video");
      expect(normalized.durationSeconds).toBe(930);
      expect(normalized.metrics.views).toBe(50000);
      expect(normalized.metrics.likes).toBe(3500);
      expect(normalized.metrics.comments).toBe(420);
      expect(normalized.metrics.shares).toBeGreaterThan(0);
      expect(normalized.metrics.impressions).toBeGreaterThan(50000);
    });

    it("normalizes short-form video into short_video content type", () => {
      const raw = {
        id: "yt_short_456",
        snippet: {
          title: "Key Takeaways in 45 Seconds",
        },
        contentDetails: {
          duration: "PT45S", // 45 seconds
        },
      };

      const normalized = youtube.normalizeContent(raw);
      expect(normalized.contentType).toBe("short_video");
      expect(normalized.durationSeconds).toBe(45);
    });

    it("normalizes raw YouTube statistics into observation records", () => {
      const stats = {
        viewCount: 12000,
        likeCount: 950,
        commentCount: 88,
        estimatedMinutesWatched: 45000,
      };

      const obs = youtube.normalizeMetrics(stats);
      expect(obs.length).toBe(4);

      const viewsObs = obs.find((o) => o.metricKey === "views");
      expect(viewsObs?.value).toBe(12000);
      expect(viewsObs?.providerMetricName).toBe("viewCount");

      const watchTimeObs = obs.find((o) => o.metricKey === "watch_time_seconds");
      expect(watchTimeObs?.value).toBe(45000);
    });
  });

  describe("Normalized Metric Definitions (Section 16)", () => {
    it("includes all core canonical and derived metrics", () => {
      const keys = SYSTEM_METRIC_DEFINITIONS.map((m) => m.key);
      expect(keys).toContain("impressions");
      expect(keys).toContain("reach");
      expect(keys).toContain("views");
      expect(keys).toContain("likes");
      expect(keys).toContain("comments");
      expect(keys).toContain("shares");
      expect(keys).toContain("saves");
      expect(keys).toContain("clicks");
      expect(keys).toContain("meaningful_action_rate");
      expect(keys).toContain("reach_efficiency_ratio");
      expect(keys).toContain("meaningful_share_ratio");
    });

    it("transparently defines formulas for derived rates", () => {
      const actionRate = SYSTEM_METRIC_DEFINITIONS.find(
        (m) => m.key === "meaningful_action_rate"
      );
      expect(actionRate).toBeDefined();
      expect(actionRate?.category).toBe("derived");
      expect(actionRate?.aggregationBehavior).toBe("derived_ratio");
      expect(actionRate?.formula).toBe("(shares + saves + clicks) / (impressions / 1,000)");

      const reachRatio = SYSTEM_METRIC_DEFINITIONS.find(
        (m) => m.key === "reach_efficiency_ratio"
      );
      expect(reachRatio?.formula).toBe("(reach / impressions) * 100");
    });
  });
});
