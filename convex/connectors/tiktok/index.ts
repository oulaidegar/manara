/**
 * TikTok Platform Connector (Section 22)
 *
 * Implements PlatformConnector for TikTok for Business / Creator API.
 */

import {
  PlatformConnector,
  ConnectorAccount,
  NormalizedContentItem,
  NormalizedMetricObservation,
  SyncResult,
} from "../shared/types";

export class TikTokConnector implements PlatformConnector {
  provider = "tiktok";
  displayName = "TikTok";
  category = "short_form" as const;
  priority = 4;

  async connect(credentials: Record<string, string>): Promise<ConnectorAccount> {
    const handle = credentials.handle || "public_watch";
    return {
      externalAccountId: credentials.creatorId || "tiktok_creator_123456",
      name: credentials.name || "Public Interest Watch",
      handle: `@${handle.replace(/^@/, "")}`,
      url: `https://tiktok.com/@${handle.replace(/^@/, "")}`,
      accountType: "creator",
    };
  }

  async refreshAuthorization(_accountId: string): Promise<boolean> {
    return true;
  }

  async listAccounts(): Promise<ConnectorAccount[]> {
    return [];
  }

  normalizeContent(rawItem: unknown): NormalizedContentItem {
    const item = rawItem as Record<string, unknown>;
    return {
      externalId: String(item.id || `tt_${Date.now()}`),
      externalUrl: String(item.share_url || "https://tiktok.com"),
      title: String(item.title || item.video_description || "TikTok Video").slice(0, 100),
      text: String(item.video_description || item.text || ""),
      contentType: "short_video",
      publishedAt: typeof item.create_time === "number" ? item.create_time : Date.now(),
      metrics: {
        views: Number(item.view_count ?? 0),
        likes: Number(item.like_count ?? 0),
        comments: Number(item.comment_count ?? 0),
        shares: Number(item.share_count ?? 0),
        reach: Number(item.reach ?? 0),
      },
    };
  }

  normalizeMetrics(_rawMetrics: unknown): NormalizedMetricObservation[] {
    return [];
  }

  async syncContent(_options: {
    externalAccountId: string;
    cursor?: string;
    since?: number;
    limit?: number;
  }): Promise<SyncResult> {
    return {
      hasMore: false,
      items: [],
      observations: [],
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
    };
  }

  async syncAccountMetrics(_externalAccountId: string): Promise<NormalizedMetricObservation[]> {
    return [];
  }
}

export const tikTokConnector = new TikTokConnector();
