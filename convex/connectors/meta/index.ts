/**
 * Meta (Instagram / Facebook) Platform Connector (Section 22)
 *
 * Implements PlatformConnector for Meta Graph API.
 */

import {
  PlatformConnector,
  ConnectorAccount,
  NormalizedContentItem,
  NormalizedMetricObservation,
  SyncResult,
} from "../shared/types";

export class MetaConnector implements PlatformConnector {
  provider = "meta";
  displayName = "Meta (Instagram / Facebook)";
  category = "social" as const;
  priority = 3;

  async connect(credentials: Record<string, string>): Promise<ConnectorAccount> {
    const handle = credentials.handle || "public_watch";
    return {
      externalAccountId: credentials.pageId || "meta_page_123456",
      name: credentials.name || "Public Interest Watch",
      handle: `@${handle.replace(/^@/, "")}`,
      url: `https://instagram.com/${handle.replace(/^@/, "")}`,
      accountType: "page",
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
      externalId: String(item.id || `meta_${Date.now()}`),
      externalUrl: String(item.permalink || "https://instagram.com"),
      title: String(item.caption || item.title || "Meta Post").slice(0, 100),
      text: String(item.caption || item.text || ""),
      contentType: "post",
      publishedAt: typeof item.timestamp === "number" ? item.timestamp : Date.now(),
      metrics: {
        impressions: Number(item.impressions ?? 0),
        reach: Number(item.reach ?? 0),
        likes: Number(item.like_count ?? 0),
        comments: Number(item.comments_count ?? 0),
        shares: Number(item.shares ?? 0),
        saves: Number(item.saved ?? 0),
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

export const metaConnector = new MetaConnector();
