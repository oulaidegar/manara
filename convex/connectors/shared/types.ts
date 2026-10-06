/**
 * Shared Platform Connector Architecture (Section 22)
 *
 * Every platform connector implements the same conceptual interface.
 * Provider-specific logic is isolated to its respective connector directory.
 */

export interface NormalizedContentItem {
  externalId: string;
  externalUrl?: string;
  title: string;
  text?: string;
  contentType:
    | "post"
    | "video"
    | "short_video"
    | "article"
    | "report"
    | "investigation"
    | "newsletter"
    | "podcast"
    | "event"
    | "research"
    | "press_release"
    | "other";
  publishedAt: number;
  mediaType?: string;
  durationSeconds?: number;
  language?: string;
  authorName?: string;
  metrics: {
    impressions?: number;
    reach?: number;
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    clicks?: number;
  };
  rawPayload?: Record<string, unknown>;
}

export interface NormalizedMetricObservation {
  metricKey: string;
  providerMetricName: string;
  value: number;
  observedAt: number;
  sourcePeriodStart?: number;
  sourcePeriodEnd?: number;
}

export interface ConnectorAccount {
  externalAccountId: string;
  name: string;
  handle: string;
  url?: string;
  accountType?: string;
  avatarUrl?: string;
}

export interface SyncResult {
  cursor?: string;
  hasMore: boolean;
  items: NormalizedContentItem[];
  observations: NormalizedMetricObservation[];
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
}

export interface PlatformConnector {
  provider: string;
  displayName: string;
  category: "video" | "professional" | "social" | "short_form" | "csv";
  priority: number; // 1 for YouTube

  connect(credentials: Record<string, string>): Promise<ConnectorAccount>;
  refreshAuthorization(accountId: string): Promise<boolean>;
  listAccounts(): Promise<ConnectorAccount[]>;
  syncContent(options: {
    externalAccountId: string;
    cursor?: string;
    since?: number;
    limit?: number;
  }): Promise<SyncResult>;
  syncAccountMetrics(externalAccountId: string): Promise<NormalizedMetricObservation[]>;
  normalizeContent(rawItem: unknown): NormalizedContentItem;
  normalizeMetrics(rawMetrics: unknown): NormalizedMetricObservation[];
}
