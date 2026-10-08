/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Radar Social Engine - SocialCrawl Provider Adapter
 * Based on Sections 12, 13, 52 of the Master Build Specification
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
  private baseUrl = process.env.SOCIALCRAWL_BASE_URL || "https://api.socialcrawl.io/v1";

  private getApiKey(inputApiKey?: string): string | undefined {
    return inputApiKey || process.env.SOCIALCRAWL_API_KEY;
  }

  /**
   * Retrieves profile information for a social account.
   */
  async getProfile(input: GetProfileInput): Promise<NormalizedProfile> {
    const apiKey = this.getApiKey(input.apiKey);
    const cleanHandle = normalizeHandle(input.handleOrUrl, input.platform);

    // If an API key is configured, perform live fetch
    if (apiKey) {
      try {
        const response = await fetch(
          `${this.baseUrl}/${input.platform}/profile?handle=${encodeURIComponent(cleanHandle)}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const rawData = await response.json();
          return this.normalizeProfile(input.platform, cleanHandle, rawData);
        }
      } catch (err) {
        console.warn(`[SocialCrawl] Live fetch failed for @${cleanHandle}, using fallback data:`, err);
      }
    }

    // Fallback profile generation for development and offline testing
    return this.createMockProfile(input.platform, cleanHandle);
  }

  /**
   * Retrieves paginated posts for a social account.
   */
  async getPosts(input: GetPostsInput): Promise<NormalizedPostsPage> {
    const apiKey = this.getApiKey(input.apiKey);
    const cleanHandle = normalizeHandle(input.handle, input.platform);
    const limit = input.limit || 20;

    if (apiKey) {
      try {
        const url = new URL(`${this.baseUrl}/${input.platform}/posts`);
        url.searchParams.set("accountId", input.externalAccountId);
        url.searchParams.set("limit", String(limit));
        if (input.cursor) {
          url.searchParams.set("cursor", input.cursor);
        }

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const rawData = await response.json();
          const rawPosts: any[] = rawData.data || rawData.posts || [];
          const posts = rawPosts.map((raw) => this.normalizePost(input.platform, raw));
          return {
            posts,
            nextCursor: rawData.nextCursor || rawData.cursor,
            hasMore: Boolean(rawData.nextCursor || rawData.hasMore),
            totalCount: rawData.totalCount,
          };
        }
      } catch (err) {
        console.warn(`[SocialCrawl] Live posts fetch failed for @${cleanHandle}, using fallback:`, err);
      }
    }

    return this.createMockPostsPage(input.platform, input.externalAccountId, cleanHandle, limit, input.cursor);
  }

  /**
   * Retrieves an individual post.
   */
  async getPost(input: GetPostInput): Promise<NormalizedSocialPost> {
    const apiKey = this.getApiKey(input.apiKey);

    if (apiKey) {
      try {
        const response = await fetch(
          `${this.baseUrl}/${input.platform}/posts/${encodeURIComponent(input.externalPostId)}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const rawData = await response.json();
          return this.normalizePost(input.platform, rawData);
        }
      } catch (err) {
        console.warn(`[SocialCrawl] Live getPost failed for ID ${input.externalPostId}:`, err);
      }
    }

    return this.createMockPost(input.platform, input.externalPostId);
  }

  /**
   * Normalizes raw profile payload into Radar NormalizedProfile.
   */
  private normalizeProfile(
    platform: SocialPlatform,
    handle: string,
    raw: any
  ): NormalizedProfile {
    const data = raw.data || raw;
    return {
      platform,
      externalAccountId: String(data.id || data.accountId || data.userId || `acc_${handle}`),
      handle: normalizeHandle(String(data.username || data.handle || handle)),
      displayName: String(data.name || data.fullName || data.title || `@${handle}`),
      profileUrl: data.profileUrl || data.url,
      profileImageUrl: data.avatarUrl || data.profilePicUrl || data.profileImageUrl,
      biography: data.bio || data.biography || data.description,
      followerCount: normalizeMetric(data.followerCount || data.followers || data.subscribersCount),
      followingCount: normalizeMetric(data.followingCount || data.following),
      totalPosts: normalizeMetric(data.mediaCount || data.totalPosts || data.videoCount),
      verificationStatus: Boolean(data.isVerified || data.verified),
      provider: this.name,
      raw,
    };
  }

  /**
   * Normalizes raw post payload into Radar NormalizedSocialPost.
   */
  public normalizePost(platform: SocialPlatform, raw: any): NormalizedSocialPost {
    const item = raw.data || raw;

    const metrics = {
      views: normalizeMetric(item.viewCount || item.views || item.plays),
      impressions: normalizeMetric(item.impressionCount || item.impressions),
      reach: normalizeMetric(item.reachCount || item.reach),
      likes: normalizeMetric(item.likeCount || item.likes || item.favoriteCount),
      comments: normalizeMetric(item.commentCount || item.comments),
      shares: normalizeMetric(item.shareCount || item.shares || item.reposts),
      saves: normalizeMetric(item.saveCount || item.saves || item.bookmarkCount),
      reposts: normalizeMetric(item.repostCount || item.retweetCount),
      clicks: normalizeMetric(item.clickCount || item.clicks),
      watchTimeSeconds: normalizeMetric(item.watchTimeSeconds || item.watchTime),
      averageWatchTimeSeconds: normalizeMetric(item.averageWatchTimeSeconds),
      durationSeconds: normalizeMetric(item.durationSeconds || item.duration),
    };

    const externalPostId = String(item.id || item.postId || item.externalId || item.code || `post_${Date.now()}`);
    const caption = item.caption || item.text || item.description || item.title || "";
    const title = item.title || (caption.length > 60 ? caption.slice(0, 60) + "..." : caption);

    const postType = item.postType || item.mediaType || (
      metrics.durationSeconds ? "video" : "post"
    );

    const calculatedMetrics = calculateEngagement(metrics);

    return {
      platform,
      externalPostId,
      url: item.url || item.permalink || `https://${platform}.com/p/${externalPostId}`,
      publishedAt: normalizeTimestamp(item.publishedAt || item.timestamp || item.createdAt),
      caption,
      title,
      postType,
      thumbnailUrl: item.thumbnailUrl || item.displayUrl || item.coverUrl,
      mediaUrls: Array.isArray(item.mediaUrls) ? item.mediaUrls : item.mediaUrl ? [item.mediaUrl] : undefined,
      authorName: item.authorName || item.ownerName,
      authorHandle: item.authorHandle || item.ownerUsername,
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
      externalAccountId: `crawl_${platform}_${handle}`,
      handle,
      displayName: handle.charAt(0).toUpperCase() + handle.slice(1).replace(/_/g, " "),
      profileUrl: `https://${platform}.com/${handle}`,
      profileImageUrl: `https://images.unsplash.com/photo-1579208575657-c595a053b9b7?w=150`,
      biography: `Official ${platform} account for civil society communications and public interest research.`,
      followerCount: followers,
      followingCount: 380,
      totalPosts: 145,
      verificationStatus: true,
      provider: this.name,
      raw: { mock: true, handle, platform },
    };
  }

  /**
   * Generates realistic mock posts page for sandbox & development.
   */
  private createMockPostsPage(
    platform: SocialPlatform,
    externalAccountId: string,
    handle: string,
    limit: number,
    cursor?: string
  ): NormalizedPostsPage {
    const pageIndex = cursor ? parseInt(cursor.replace("page_", ""), 10) : 0;
    const count = Math.min(limit, 25);
    const posts: NormalizedSocialPost[] = [];

    const mockTopics = [
      { topic: "Housing Crisis", hook: "Statistic", format: "explainer" },
      { topic: "Climate Accountability", hook: "Investigation", format: "video" },
      { topic: "Judicial Transparency", hook: "Quote", format: "carousel" },
      { topic: "Public Procurement", hook: "Breaking News", format: "report" },
      { topic: "Healthcare Access", hook: "Personal Story", format: "reel" },
    ];

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < count; i++) {
      const globalIdx = pageIndex * limit + i;
      const archetype = mockTopics[globalIdx % mockTopics.length];
      const publishedAt = now - (globalIdx * 2 + 1) * dayMs;
      const postId = `crawl_${platform}_post_${globalIdx + 100}`;

      const views = Math.floor(15000 + (Math.sin(globalIdx) * 0.5 + 0.5) * 85000);
      const likes = Math.floor(views * (0.03 + (globalIdx % 5) * 0.01));
      const comments = Math.floor(likes * 0.08);
      const shares = Math.floor(likes * 0.22);
      const saves = platform === "instagram" ? Math.floor(likes * 0.15) : undefined;
      const impressions = Math.floor(views * 1.15);
      const reach = Math.floor(views * 0.88);

      const raw = {
        id: postId,
        url: `https://${platform}.com/${handle}/p/${postId}`,
        publishedAt,
        title: `${archetype.topic}: Why the latest policy shift matters`,
        caption: `New data reveals key insights into ${archetype.topic.toLowerCase()}. Here is what you need to know about the upcoming legislation and civil society findings. #policy #research`,
        views,
        impressions,
        reach,
        likes,
        comments,
        shares,
        saves,
        postType: archetype.format,
      };

      posts.push(this.normalizePost(platform, raw));
    }

    const nextCursor = pageIndex < 3 ? `page_${pageIndex + 1}` : undefined;

    return {
      posts,
      nextCursor,
      hasMore: Boolean(nextCursor),
      totalCount: 100,
    };
  }

  private createMockPost(platform: SocialPlatform, externalPostId: string): NormalizedSocialPost {
    const raw = {
      id: externalPostId,
      url: `https://${platform}.com/p/${externalPostId}`,
      publishedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      title: "Public Interest Report Summary",
      caption: "Our latest independent findings highlight urgent regulatory gaps.",
      views: 45000,
      likes: 2400,
      comments: 180,
      shares: 620,
      saves: 310,
    };
    return this.normalizePost(platform, raw);
  }
}
