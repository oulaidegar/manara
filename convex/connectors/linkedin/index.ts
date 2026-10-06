/**
 * LinkedIn Platform Connector (Section 22)
 *
 * Implements PlatformConnector for LinkedIn Organization Pages.
 */

import {
  PlatformConnector,
  ConnectorAccount,
  NormalizedContentItem,
  NormalizedMetricObservation,
  SyncResult,
} from "../shared/types";

export class LinkedInConnector implements PlatformConnector {
  provider = "linkedin";
  displayName = "LinkedIn";
  category = "professional" as const;
  priority = 2;

  async connect(credentials: Record<string, string>): Promise<ConnectorAccount> {
    const handle = credentials.handle || "public-interest-watch";
    return {
      externalAccountId: credentials.organizationUrn || "urn:li:organization:12345678",
      name: credentials.name || "Public Interest Watchdog Organization",
      handle: handle.startsWith("@") ? handle.slice(1) : handle,
      url: `https://linkedin.com/company/${handle}`,
      accountType: "organization",
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
    const publishedAt =
      typeof item.publishedAt === "number" ? item.publishedAt : Date.now();
    return {
      externalId: String(item.id || `li_${Date.now()}`),
      externalUrl: String(item.url || "https://linkedin.com"),
      title: String(item.title || "LinkedIn Organization Update"),
      text: String(item.text || ""),
      contentType: "post",
      publishedAt,
      metrics: {
        impressions: Number(item.impressions ?? 0),
        reach: Number(item.reach ?? 0),
        likes: Number(item.likes ?? 0),
        comments: Number(item.comments ?? 0),
        shares: Number(item.shares ?? 0),
        clicks: Number(item.clicks ?? 0),
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

export const linkedInConnector = new LinkedInConnector();
