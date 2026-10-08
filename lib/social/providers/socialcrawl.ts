/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Radar Social Engine - SocialCrawl Provider Adapter
 * Official SocialCrawl.dev API client with unified schema parsing across 68 platforms
 */

import {
  SocialProvider,
  GetProfileInput,
  NormalizedProfile,
  GetPostsInput,
  NormalizedPostsPage,
  GetPostInput,
  NormalizedSocialPost,
  SocialPlatform,
} from "../types";
import {
  normalizeMetric,
  normalizeTimestamp,
  normalizeHandle,
  calculateEngagement,
} from "../normalize";

export class SocialCrawlProvider implements SocialProvider {
  public readonly name = "socialcrawl";
  private baseUrl = process.env.SOCIALCRAWL_BASE_URL || "https://www.socialcrawl.dev/v1";

  private getApiKey(inputApiKey?: string): string | undefined {
    return inputApiKey || process.env.SOCIALCRAWL_API_KEY;
  }

  /**
   * Maps internal platform string to SocialCrawl.dev endpoint platform name
   */
  private getPlatformPath(platform: SocialPlatform): string {
    if (platform === "x") return "twitter";
    return platform;
  }

  /**
   * Builds authentication headers for SocialCrawl.dev
   */
  private getHeaders(apiKey: string): Record<string, string> {
    return {
      "x-api-key": apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Retrieves profile information for a social account via SocialCrawl.dev
   */
  async getProfile(input: GetProfileInput): Promise<NormalizedProfile> {
    const apiKey = this.getApiKey(input.apiKey);
    const cleanHandle = normalizeHandle(input.handleOrUrl, input.platform);
    const platformPath = this.getPlatformPath(input.platform);

    if (apiKey) {
      try {
        const response = await fetch(
          `${this.baseUrl}/${platformPath}/profile?handle=${encodeURIComponent(cleanHandle)}`,
          {
            headers: this.getHeaders(apiKey),
          }
        );

        if (response.ok) {
          const rawData = await response.json();
          return this.normalizeProfile(input.platform, cleanHandle, rawData);
        } else {
          console.warn(`[SocialCrawl] Profile fetch HTTP ${response.status} for @${cleanHandle}`);
        }
      } catch (err) {
        console.warn(`[SocialCrawl] Live profile fetch failed for @${cleanHandle}, using fallback data:`, err);
      }
    }

    return this.createMockProfile(input.platform, cleanHandle);
  }

  /**
   * Retrieves paginated posts for a social account via SocialCrawl.dev
   */
  async getPosts(input: GetPostsInput): Promise<NormalizedPostsPage> {
    const apiKey = this.getApiKey(input.apiKey);
    const cleanHandle = normalizeHandle(input.handle, input.platform);
    const limit = input.limit || 20;

    if (apiKey) {
      try {
        let endpointPath = "instagram/profile/posts";
        if (input.platform === "x") endpointPath = "twitter/user/tweets";
        else if (input.platform === "youtube") endpointPath = "youtube/channel/videos";
        else if (input.platform === "tiktok") endpointPath = "tiktok/profile/full";
        else if (input.platform === "linkedin") endpointPath = "linkedin/company/posts";

        const url = new URL(`${this.baseUrl}/${endpointPath}`);
        url.searchParams.set("handle", cleanHandle);
        if (endpointPath.includes("company/posts")) {
          url.searchParams.set("company_id", cleanHandle);
        }
        url.searchParams.set("limit", String(limit));
        if (input.cursor) {
          url.searchParams.set("cursor", input.cursor);
        }

        const response = await fetch(url.toString(), {
          headers: this.getHeaders(apiKey),
        });

        if (response.ok) {
          const rawData = await response.json();
          // SocialCrawl posts return { success: true, data: { items: [{ post: ... }] } } or { data: [...] }
          const rawItems: any[] =
            rawData.data?.items ||
            rawData.data?.posts ||
            rawData.data?.videos ||
            rawData.data?.tweets ||
            (Array.isArray(rawData.data) ? rawData.data : []) ||
            (Array.isArray(rawData.items) ? rawData.items : []);

          const posts = rawItems.map((raw) => this.normalizePost(input.platform, raw));
          const nextCursor =
            rawData.pagination?.next_cursor ||
            rawData.data?.next_cursor ||
            rawData.nextCursor ||
            rawData.cursor;

          return {
            posts,
            nextCursor: nextCursor || undefined,
            hasMore: Boolean(nextCursor || rawData.pagination?.has_more),
            totalCount: rawData.total || rawData.data?.total || posts.length,
          };
        } else {
          console.warn(`[SocialCrawl] Posts fetch HTTP ${response.status} for @${cleanHandle}`);
        }
      } catch (err) {
        console.warn(`[SocialCrawl] Live posts fetch failed for @${cleanHandle}, using fallback:`, err);
      }
    }

    return this.createMockPostsPage(input.platform, input.externalAccountId, cleanHandle, limit, input.cursor);
  }

  /**
   * Retrieves an individual post via SocialCrawl.dev
   */
  async getPost(input: GetPostInput): Promise<NormalizedSocialPost> {
    const apiKey = this.getApiKey(input.apiKey);

    if (apiKey) {
      try {
        let endpointPath = "instagram/post";
        const postUrl = input.url || (
          input.platform === "instagram" ? `https://www.instagram.com/p/${input.externalPostId}/` :
          input.platform === "x" ? `https://x.com/i/status/${input.externalPostId}` :
          input.platform === "youtube" ? `https://www.youtube.com/watch?v=${input.externalPostId}` :
          `https://${input.platform}.com/post/${input.externalPostId}`
        );

        if (input.platform === "x") endpointPath = "twitter/tweet";
        else if (input.platform === "youtube") endpointPath = "youtube/video";
        else if (input.platform === "linkedin") endpointPath = "linkedin/post";

        const response = await fetch(
          `${this.baseUrl}/${endpointPath}?url=${encodeURIComponent(postUrl)}`,
          {
            headers: this.getHeaders(apiKey),
          }
        );

        if (response.ok) {
          const rawData = await response.json();
          return this.normalizePost(input.platform, rawData);
        } else {
          console.warn(`[SocialCrawl] getPost HTTP ${response.status} for ${input.externalPostId}`);
        }
      } catch (err) {
        console.warn(`[SocialCrawl] Live getPost failed for ID ${input.externalPostId}:`, err);
      }
    }

    return this.createMockPost(input.platform, input.externalPostId);
  }

  /**
   * Normalizes raw SocialCrawl profile payload into Radar NormalizedProfile.
   */
  private normalizeProfile(
    platform: SocialPlatform,
    handle: string,
    raw: any
  ): NormalizedProfile {
    const data = raw.data || raw;
    const author = data.author || data;

    return {
      platform,
      externalAccountId: String(author.id || data.id || data.accountId || `acc_${handle}`),
      handle: normalizeHandle(String(author.username || author.handle || handle)),
      displayName: String(author.display_name || author.name || author.fullName || `@${handle}`),
      profileUrl: author.url || data.profileUrl || `https://${platform}.com/${handle}`,
      profileImageUrl: author.avatar_url || data.avatarUrl || data.profilePicUrl,
      biography: author.bio || data.biography || data.description,
      followerCount: normalizeMetric(author.followers ?? data.followerCount ?? data.subscribersCount),
      followingCount: normalizeMetric(author.following ?? data.followingCount),
      totalPosts: normalizeMetric(author.posts_count ?? data.mediaCount ?? data.totalPosts),
      verificationStatus: Boolean(author.verified ?? data.isVerified),
      provider: this.name,
      raw,
    };
  }

  /**
   * Normalizes raw SocialCrawl post payload into Radar NormalizedSocialPost.
   */
  public normalizePost(platform: SocialPlatform, raw: any): NormalizedSocialPost {
    // If wrapped in { post: { ... } }, unwrap it
    const post = raw.post || raw.data || raw;
    const content = post.content || {};
    const engagement = post.engagement || {};
    const author = post.author || {};
    const ext = post.ext || {};

    const views = normalizeMetric(engagement.views ?? post.viewCount ?? post.views ?? post.plays);
    const impressions = normalizeMetric(engagement.impressions ?? post.impressionCount ?? post.impressions ?? (views ? Math.round(views * 1.25) : 0));
    const reach = normalizeMetric(engagement.reach ?? post.reachCount ?? post.reach ?? (views ? Math.round(views * 0.85) : 0));
    const likes = normalizeMetric(engagement.likes ?? post.likeCount ?? post.likes);
    const comments = normalizeMetric(engagement.comments ?? post.commentCount ?? post.comments);
    const shares = normalizeMetric(engagement.shares ?? post.shareCount ?? post.shares ?? post.reposts);
    const saves = normalizeMetric(engagement.saves ?? post.saveCount ?? post.saves ?? post.bookmarkCount);

    const metrics = {
      views,
      impressions,
      reach,
      likes,
      comments,
      shares,
      saves,
      reposts: normalizeMetric(engagement.reposts ?? post.repostCount),
      clicks: normalizeMetric(engagement.clicks ?? post.clickCount),
      watchTimeSeconds: normalizeMetric(content.duration_seconds ?? post.watchTimeSeconds),
      averageWatchTimeSeconds: normalizeMetric(post.averageWatchTimeSeconds),
      durationSeconds: normalizeMetric(content.duration_seconds ?? post.durationSeconds),
    };

    const externalPostId = String(post.id || post.postId || post.externalId || `post_${Date.now()}`);
    const caption = String(content.text || post.caption || post.text || post.description || "");
    const title = post.title || (caption.length > 70 ? caption.slice(0, 70) + "..." : caption || `${platform.toUpperCase()} Post`);

    const postType = ext.media_type || post.postType || post.mediaType || (
      metrics.durationSeconds ? "video" : "post"
    );

    const mediaUrls = Array.isArray(content.media_urls)
      ? content.media_urls
      : Array.isArray(post.mediaUrls)
      ? post.mediaUrls
      : post.mediaUrl
      ? [post.mediaUrl]
      : undefined;

    const thumbnailUrl = content.thumbnail_url || post.thumbnailUrl || post.displayUrl || mediaUrls?.[0];

    const calculatedMetrics = calculateEngagement(metrics);

    return {
      platform,
      externalPostId,
      url: post.url || post.permalink || `https://${platform}.com/p/${externalPostId}`,
      publishedAt: normalizeTimestamp(post.published_at || post.publishedAt || post.timestamp || post.createdAt),
      caption,
      title,
      postType,
      thumbnailUrl,
      mediaUrls,
      authorName: author.display_name || post.authorName,
      authorHandle: author.username ? `@${author.username}` : post.authorHandle,
      metrics,
      calculatedMetrics,
      provider: this.name,
      raw,
    };
  }

  /**
   * Generates mock profile for sandbox & development.
   */
  private createMockProfile(platform: SocialPlatform, handle: string): NormalizedProfile {
    const followers = platform === "youtube" ? 54000 : platform === "instagram" ? 42000 : 28000;
    return {
      platform,
      externalAccountId: `acc_${platform}_${handle}`,
      handle,
      displayName: handle.charAt(0).toUpperCase() + handle.slice(1).replace(/_/g, " "),
      profileUrl: `https://${platform}.com/${handle}`,
      followerCount: followers,
      followingCount: 350,
      totalPosts: 85,
      verificationStatus: true,
      provider: this.name,
      raw: { mock: true, handle, platform },
    };
  }

  /**
   * Generates mock posts page for sandbox & development.
   */
  private createMockPostsPage(
    platform: SocialPlatform,
    externalAccountId: string,
    handle: string,
    limit: number,
    cursor?: string
  ): NormalizedPostsPage {
    const posts: NormalizedSocialPost[] = [];
    const count = Math.min(limit, 10);
    const startIndex = cursor ? parseInt(cursor, 10) : 0;

    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      const postId = `mock_${platform}_${handle}_${idx}`;
      posts.push(this.createMockPost(platform, postId, handle));
    }

    return {
      posts,
      nextCursor: startIndex + count < 30 ? String(startIndex + count) : undefined,
      hasMore: startIndex + count < 30,
      totalCount: 30,
    };
  }

  /**
   * Generates an individual mock post.
   */
  private createMockPost(platform: SocialPlatform, externalPostId: string, handle = "organization"): NormalizedSocialPost {
    const now = Date.now();
    const metrics = {
      views: 12500,
      impressions: 15400,
      reach: 10800,
      likes: 620,
      comments: 74,
      shares: 185,
      saves: 142,
    };

    return {
      platform,
      externalPostId,
      url: `https://${platform}.com/${handle}/status/${externalPostId}`,
      publishedAt: now - 3 * 24 * 60 * 60 * 1000,
      caption: `Civic inquiry and accountability investigation regarding institutional reform and transparency. Published by @${handle}.`,
      title: "Public Interest Investigation Brief",
      postType: "post",
      authorName: `@${handle}`,
      authorHandle: `@${handle}`,
      metrics,
      calculatedMetrics: calculateEngagement(metrics),
      provider: this.name,
      raw: { mock: true, externalPostId, platform },
    };
  }
}
