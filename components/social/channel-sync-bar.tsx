"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import { PlatformIcon } from "./platform-icon";
import {
  RefreshCw,
  Plus,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { ConnectAccountModal } from "./connect-account-modal";

interface ChannelSyncBarProps {
  className?: string;
  compact?: boolean;
}

function formatLastSynced(timestamp?: number): string {
  if (!timestamp) return "Never synced";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChannelSyncBar({ className = "", compact: _compact = false }: ChannelSyncBarProps) {
  const { organization, organizationSlug } = useOrganization();
  const accounts = useQuery(api.socialAccounts.listSocialAccounts, {
    organizationId: organization._id,
  });

  const updateSyncTimestamp = useMutation(api.socialAccounts.updateSyncTimestamp);
  const batchUpsertPosts = useMutation(api.socialPosts.batchUpsertPosts);

  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "—";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const handleRefreshAll = async () => {
    if (!accounts || accounts.length === 0 || isSyncingAll) return;

    setIsSyncingAll(true);
    setSyncStatusText("Initiating multi-channel crawl...");

    let totalSyncedPosts = 0;
    try {
      for (const acc of accounts) {
        if (!acc.platform) continue;
        setSyncStatusText(`Syncing @${acc.handle} on ${acc.platform}...`);

        try {
          const res = await fetch("/api/social/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              platform: acc.platform,
              handle: acc.handle,
              count: 20,
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
                organizationId: organization._id,
                accountId: acc._id,
                posts: postsToUpsert,
              });

              totalSyncedPosts += data.posts.length;
            }

            // Update timestamp & metadata
            await updateSyncTimestamp({
              organizationId: organization._id,
              accountId: acc._id,
              lastSyncedAt: Date.now(),
              followerCount: data.profile?.followerCount ?? acc.followerCount,
              followingCount: data.profile?.followingCount ?? acc.followingCount,
              totalPosts: data.profile?.totalPosts ?? acc.totalPosts,
              displayName: data.profile?.displayName ?? acc.displayName,
              profileImageUrl: data.profile?.profileImageUrl ?? acc.profileImageUrl,
            });
          }
        } catch (crawlErr) {
          console.warn(`Failed to sync @${acc.handle}:`, crawlErr);
        }
      }

      setSyncStatusText(
        totalSyncedPosts > 0
          ? `Sync complete: ${totalSyncedPosts} posts refreshed across ${accounts.length} channels!`
          : "All channels checked and up to date!"
      );

      setTimeout(() => {
        setIsSyncingAll(false);
        setSyncStatusText(null);
      }, 3500);
    } catch (err) {
      console.error("Refresh all error:", err);
      setIsSyncingAll(false);
      setSyncStatusText("Sync encountered an issue");
      setTimeout(() => setSyncStatusText(null), 3000);
    }
  };

  if (!accounts) return null;

  // Empty state: Turnkey Out-of-the-Box Setup Callout
  if (accounts.length === 0) {
    return (
      <>
        <div
          className={`rounded-2xl border border-dashed border-[var(--primary)]/40 bg-gradient-to-r from-[var(--primary)]/5 via-emerald-500/5 to-transparent p-5 ${className}`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                  Turnkey Zero-OAuth Setup
                </span>
                <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                  Persistent Data Pipeline
                </span>
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                Connect your organization channels out of the box
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
                Add your social media handles once. Radar automatically retrieves past investigative outputs,
                calculates public interest conviction scores (PIEI), and runs continuous background synchronization with
                zero token expiration.
              </p>
            </div>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-semibold text-[var(--primary-foreground)] shadow-xs hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Connect Channels (1-Click)</span>
            </button>
          </div>
        </div>

        <ConnectAccountModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
        />
      </>
    );
  }

  // Find most recent sync timestamp
  const latestSyncTime = accounts.reduce((latest, acc) => {
    return Math.max(latest, acc.lastSyncedAt || 0);
  }, 0);

  const totalFollowers = accounts.reduce((acc, curr) => acc + (curr.followerCount || 0), 0);

  return (
    <>
      <div
        className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 shadow-xs transition-all ${className}`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Active Monitored Channels Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-[var(--foreground)]">
                Monitored Channels
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500 border border-emerald-500/20">
                {accounts.length} Channels • {formatNumber(totalFollowers)} Reach
              </span>
            </div>

            {/* Individual Channel Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {accounts.map((acc) => (
                <Link
                  key={acc._id}
                  href={`/${organizationSlug}/social/${acc.platform || "instagram"}`}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--muted)]/50 transition-colors"
                >
                  <PlatformIcon platform={acc.platform || "other"} className="h-3.5 w-3.5" />
                  <span className="font-medium text-[11px]">@{acc.handle}</span>
                  {acc.followerCount !== undefined && acc.followerCount > 0 && (
                    <span className="text-[10px] text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">
                      ({formatNumber(acc.followerCount)})
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Freshness Status + 1-Click Refresh All & Connect More */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)] mr-1">
              <Clock className="h-3 w-3" />
              <span>Synced: {formatLastSynced(latestSyncTime)}</span>
              <span className="opacity-40">•</span>
              <span className="text-emerald-500 font-medium">Auto-Sync On</span>
            </div>

            <button
              onClick={handleRefreshAll}
              disabled={isSyncingAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] hover:border-[var(--primary)] disabled:opacity-50 transition-colors shadow-2xs"
              title="Refresh all connected channels via SocialCrawl"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[var(--primary)] ${isSyncingAll ? "animate-spin" : ""}`} />
              <span>{isSyncingAll ? "Syncing..." : "Refresh Feeds"}</span>
            </button>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-2.5 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Channel</span>
            </button>
          </div>
        </div>

        {/* Sync Progress Notification Banner */}
        {syncStatusText && (
          <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-500 transition-all">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span className="truncate">{syncStatusText}</span>
          </div>
        )}
      </div>

      <ConnectAccountModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </>
  );
}
