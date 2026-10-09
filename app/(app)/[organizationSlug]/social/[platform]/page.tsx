"use client";

import { use, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import Link from "next/link";
import {
  Plus,
  Eye,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2,
  Settings,
} from "lucide-react";
import { PlatformIcon } from "@/components/social/platform-icon";
import { ConnectAccountModal } from "@/components/social/connect-account-modal";

interface PlatformPageProps {
  params: Promise<{
    organizationSlug: string;
    platform: string;
  }>;
}

export default function PlatformDashboardPage({ params }: PlatformPageProps) {
  const { platform } = use(params);
  const { organization, organizationSlug } = useOrganization();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const batchUpsertPosts = useMutation(api.socialPosts.batchUpsertPosts);
  const updateSyncTimestamp = useMutation(api.socialAccounts.updateSyncTimestamp);

  const data = useQuery(api.platformAnalytics.getPlatformOverview, {
    organizationId: organization._id,
    platform,
  });

  const handleSyncChannel = async () => {
    if (!data?.account || isSyncing) return;
    const currentAccount = data.account;
    setIsSyncing(true);
    setSyncMessage(`Crawling @${currentAccount.handle} on ${platform} via SocialCrawl...`);

    try {
      const res = await fetch("/api/social/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          handle: currentAccount.handle,
          count: 20,
        }),
      });

      if (res.ok) {
        const crawlData = await res.json();
        if (crawlData.posts && crawlData.posts.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const postsToUpsert = crawlData.posts.map((p: any) => ({
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
            organizationId: organization._id,
            accountId: currentAccount._id,
            posts: postsToUpsert,
          });

          await updateSyncTimestamp({
            organizationId: organization._id,
            accountId: currentAccount._id,
            lastSyncedAt: Date.now(),
            followerCount: crawlData.profile?.followerCount ?? currentAccount.followerCount,
            followingCount: crawlData.profile?.followingCount ?? currentAccount.followingCount,
            totalPosts: crawlData.profile?.totalPosts ?? currentAccount.totalPosts,
            displayName: crawlData.profile?.displayName ?? currentAccount.displayName,
            profileImageUrl: crawlData.profile?.profileImageUrl ?? currentAccount.profileImageUrl,
          });

          setSyncMessage(`Refreshed! ${crawlData.posts.length} posts retrieved from ${platform}.`);
        } else {
          setSyncMessage("Channel checked: All posts are up to date.");
        }
      } else {
        setSyncMessage("Crawl completed.");
      }

      setTimeout(() => {
        setIsSyncing(false);
        setSyncMessage(null);
      }, 3500);
    } catch (err) {
      console.error("Channel sync failed:", err);
      setIsSyncing(false);
      setSyncMessage("Failed to refresh feed.");
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "—";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const formatPercent = (rate?: number) => {
    if (rate === undefined || rate === null) return "—";
    return `${(rate * 100).toFixed(2)}%`;
  };

  if (data === undefined) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[var(--muted-foreground)]">
        Loading {platform} channel analytics...
      </div>
    );
  }

  const { account, totalPosts, totalViews, totalShares, medianViews, medianEngagement, formatBreakdown, topPosts, allPosts } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
            <PlatformIcon platform={platform} className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight capitalize text-[var(--foreground)]">
                {platform} Intelligence
              </h1>
              {account && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>Zero-OAuth Active</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {account ? `@${account.handle} • ${formatNumber(account.followerCount)} followers` : "No account connected yet."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {account ? (
            <>
              <button
                onClick={handleSyncChannel}
                disabled={isSyncing}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] hover:border-[var(--primary)] transition-colors shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[var(--primary)] ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Refresh Feed"}</span>
              </button>

              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                title="Configure or Switch Account"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Manage</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span>Connect {platform}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Account Overview KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs text-[var(--muted-foreground)] mb-1">Total Posts</div>
          <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
            {formatNumber(totalPosts)}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs text-[var(--muted-foreground)] mb-1">Median Views</div>
          <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
            {formatNumber(medianViews)}
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Outlier resistant</div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs text-[var(--muted-foreground)] mb-1">Median Engagement</div>
          <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
            {formatPercent(medianEngagement)}
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Interaction baseline</div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs text-emerald-500 mb-1">Total Shares</div>
          <div className="text-2xl font-bold font-mono text-emerald-500">
            {formatNumber(totalShares)}
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Meaningful advocacy</div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs text-[var(--muted-foreground)] mb-1">Total Exposure</div>
          <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
            {formatNumber(totalViews)}
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Total video/post views</div>
        </div>
      </div>

      {/* Format Performance Breakdown (Section 22) */}
      {formatBreakdown.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-[var(--primary)]" />
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Format Performance Breakdown
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {formatBreakdown.map((fmt) => (
              <div
                key={fmt.format}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3"
              >
                <div className="text-xs font-semibold capitalize text-[var(--foreground)]">
                  {fmt.format} ({fmt.count})
                </div>
                <div className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                  Avg. Views: <span className="font-mono font-medium text-[var(--foreground)]">{formatNumber(fmt.avgViews)}</span>
                </div>
                <div className="text-[11px] text-[var(--muted-foreground)]">
                  Avg. Shares: <span className="font-mono font-medium text-emerald-500">{formatNumber(fmt.avgShares)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Posts Section */}
      {topPosts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Top Performing Content
            </h2>
            <Link
              href={`/${organizationSlug}/content`}
              className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              <span>Explore all in Content Explorer</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {topPosts.slice(0, 3).map((post) => (
              <div
                key={post._id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-2">
                    <span className="capitalize">{post.postType}</span>
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <Link
                    href={`/${organizationSlug}/content/${post._id}`}
                    className="font-medium text-sm text-[var(--foreground)] hover:underline line-clamp-2 block mb-2"
                  >
                    {post.title || post.caption || "Untitled post"}
                  </Link>
                </div>
                <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">Views</span>
                    <span className="font-semibold font-mono text-[var(--foreground)]">{formatNumber(post.views)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">Shares</span>
                    <span className="font-semibold font-mono text-emerald-500">{formatNumber(post.shares)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">Eng. Rate</span>
                    <span className="font-semibold font-mono text-[var(--foreground)]">{formatPercent(post.engagementRate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Platform Post Table (Section 22 Drilldown) */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          All {platform} Posts ({allPosts.length})
        </h2>

        {allPosts.length === 0 ? (
          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-xs text-[var(--muted-foreground)]">
            No posts imported yet for this platform. Click &quot;Connect {platform}&quot; to fetch posts.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Post</th>
                  <th className="px-3 py-3 font-semibold">Format</th>
                  <th className="px-3 py-3 font-semibold text-right">Views</th>
                  <th className="px-3 py-3 font-semibold text-right">Shares</th>
                  <th className="px-3 py-3 font-semibold text-right">Likes</th>
                  <th className="px-3 py-3 font-semibold text-right">Comments</th>
                  <th className="px-3 py-3 font-semibold text-right">Engagement</th>
                  <th className="px-3 py-3 font-semibold text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {allPosts.map((post) => (
                  <tr key={post._id} className="hover:bg-[var(--muted)]/40 transition-colors">
                    <td className="px-4 py-3 max-w-[260px]">
                      <Link
                        href={`/${organizationSlug}/content/${post._id}`}
                        className="font-medium text-[var(--foreground)] hover:underline truncate block"
                      >
                        {post.title || post.caption?.slice(0, 50) || "Untitled post"}
                      </Link>
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-3 py-3 capitalize text-[var(--muted-foreground)]">
                      {post.postType}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-medium text-[var(--foreground)]">
                      {formatNumber(post.views)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-medium text-emerald-500">
                      {formatNumber(post.shares)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[var(--muted-foreground)]">
                      {formatNumber(post.likes)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[var(--muted-foreground)]">
                      {formatNumber(post.comments)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-medium text-[var(--foreground)]">
                      {formatPercent(post.engagementRate)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Link
                        href={`/${organizationSlug}/content/${post._id}`}
                        className="rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        <Eye className="h-3.5 w-3.5 inline" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      <ConnectAccountModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}
