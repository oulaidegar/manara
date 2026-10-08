/**
 * Radar Social Engine - Type Definitions
 * Based on Sections 7, 8, 12, 13, 17, 46 of the Master Build Specification
 */

export type SocialPlatform =
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "x"
  | "facebook"
  | "threads"
  | "other";

export type EngagementRateBasis =
  | "impressions"
  | "reach"
  | "views"
  | "followers";

export type PostAnalysisStatus =
  | "pending"
  | "processing"
  | "complete"
  | "failed";

export type SyncJobType =
  | "profile_sync"
  | "post_backfill"
  | "post_sync"
  | "metric_refresh"
  | "ai_analysis";

export type SyncJobStatus =
  | "queued"
  | "running"
  | "complete"
  | "failed";

export type PieiBasis =
  | "reach"
  | "impressions"
  | "views"
  | "interactions"
  | "followers";

export type ConvictionTier =
  | "exceptional"
  | "high"
  | "moderate"
  | "baseline";

export interface NormalizedMetrics {
  views?: number;
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reposts?: number;
  clicks?: number;
  watchTimeSeconds?: number;
  averageWatchTimeSeconds?: number;
  durationSeconds?: number;
}

export interface CalculatedEngagement {
  engagementCount?: number;
  engagementRate?: number;
  engagementRateBasis?: EngagementRateBasis;
  viewToFollowerRate?: number;
  shareRate?: number;
  commentRate?: number;
  saveRate?: number;
  // Public-Interest Engagement Index (Pillar 1)
  pieiScore?: number;
  pieiBasis?: PieiBasis;
  convictionTier?: ConvictionTier;
  isEvergreen?: boolean;
  evergreenScore?: number;
  velocityRatio24h?: number;
}

export interface NormalizedProfile {
  platform: SocialPlatform;
  externalAccountId: string;
  handle: string;
  displayName: string;
  profileUrl?: string;
  profileImageUrl?: string;
  biography?: string;
  followerCount?: number;
  followingCount?: number;
  totalPosts?: number;
  verificationStatus?: boolean;
  provider: string;
  raw: unknown;
}

export interface NormalizedSocialPost {
  platform: SocialPlatform;
  externalPostId: string;
  url: string;
  publishedAt: number;
  caption?: string;
  title?: string;
  postType?: string;
  thumbnailUrl?: string;
  mediaUrls?: string[];
  authorName?: string;
  authorHandle?: string;
  metrics: NormalizedMetrics;
  calculatedMetrics?: CalculatedEngagement;
  pieiScore?: number;
  convictionTier?: ConvictionTier;
  isEvergreen?: boolean;
  velocityRatio24h?: number;
  provider: string;
  raw: unknown;
}

export interface GetProfileInput {
  handleOrUrl: string;
  platform: SocialPlatform;
  apiKey?: string;
}

export interface GetPostsInput {
  platform: SocialPlatform;
  externalAccountId: string;
  handle: string;
  limit?: number;
  cursor?: string;
  apiKey?: string;
}

export interface NormalizedPostsPage {
  posts: NormalizedSocialPost[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount?: number;
}

export interface GetPostInput {
  platform: SocialPlatform;
  externalPostId: string;
  url?: string;
  apiKey?: string;
}

export interface SearchPostsInput {
  platform: SocialPlatform;
  query: string;
  limit?: number;
  cursor?: string;
}

export interface NormalizedSearchResults {
  posts: NormalizedSocialPost[];
  nextCursor?: string;
}

export interface SocialProvider {
  readonly name: string;
  getProfile(input: GetProfileInput): Promise<NormalizedProfile>;
  getPosts(input: GetPostsInput): Promise<NormalizedPostsPage>;
  getPost(input: GetPostInput): Promise<NormalizedSocialPost>;
  searchPosts?(input: SearchPostsInput): Promise<NormalizedSearchResults>;
}
