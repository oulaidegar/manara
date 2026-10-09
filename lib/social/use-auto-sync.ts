"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

/**
 * Automatically keeps social feeds refreshed in the background.
 * If any connected channel has not been synced in > 4 hours, quietly crawls
 * recent posts and persists metrics so the director/editor always sees fresh data.
 */
export function useAutoSync(organizationId: Id<"organizations">) {
  const accounts = useQuery(api.socialAccounts.listSocialAccounts, { organizationId });
  const batchUpsertPosts = useMutation(api.socialPosts.batchUpsertPosts);
  const updateSyncTimestamp = useMutation(api.socialAccounts.updateSyncTimestamp);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!accounts || accounts.length === 0 || hasRunRef.current) return;

    // Filter accounts needing background refresh
    const now = Date.now();
    const staleAccounts = accounts.filter((acc) => {
      if (!acc.syncEnabled) return false;
      if (!acc.lastSyncedAt) return true;
      return now - acc.lastSyncedAt > FOUR_HOURS_MS;
    });

    if (staleAccounts.length === 0) return;

    hasRunRef.current = true;

    // Run background sync quietly
    const runBackgroundSync = async () => {
      for (const acc of staleAccounts) {
        if (!acc.platform) continue;
        try {
          const res = await fetch("/api/social/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              platform: acc.platform,
              handle: acc.handle,
              count: 15,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.posts && data.posts.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const postsToUpsert = data.posts.map((p: any) => ({
                platform: p.platform,
                externalPostId: p.externalPostId,
                url: p.url,
                publishedAt: p.publishedAt,
                caption: p.caption,
                title: p.title,
                postType: p.postType,
                thumbnailUrl: p.thumbnailUrl,
                mediaUrls: p.mediaUrls,
                views: p.views,
                impressions: p.impressions,
                reach: p.reach,
                likes: p.likes,
                comments: p.comments,
                shares: p.shares,
                saves: p.saves,
                provider: "socialcrawl",
              }));

              await batchUpsertPosts({
                organizationId,
                accountId: acc._id,
                posts: postsToUpsert,
              });
            }

            await updateSyncTimestamp({
              organizationId,
              accountId: acc._id,
              lastSyncedAt: Date.now(),
              followerCount: data.profile?.followerCount ?? acc.followerCount,
              followingCount: data.profile?.followingCount ?? acc.followingCount,
              totalPosts: data.profile?.totalPosts ?? acc.totalPosts,
              displayName: data.profile?.displayName ?? acc.displayName,
              profileImageUrl: data.profile?.profileImageUrl ?? acc.profileImageUrl,
            });
          }
        } catch (err) {
          console.warn(`[AutoSync] Background refresh failed for @${acc.handle}:`, err);
        }
      }
    };

    runBackgroundSync();
  }, [accounts, organizationId, batchUpsertPosts, updateSyncTimestamp]);
}
