"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import {
  X,
  Radio,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PlatformIcon } from "./platform-icon";

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ConnectAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: ConnectAccountModalProps) {
  const { organization } = useOrganization();
  const [platform, setPlatform] = useState<"instagram" | "linkedin" | "tiktok" | "youtube" | "x">("instagram");
  const [handle, setHandle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectAccount = useMutation(api.socialAccounts.connectSocialAccount);
  const runAccountImport = useMutation(api.socialSync.runAccountImport);
  const batchUpsertPosts = useMutation(api.socialPosts.batchUpsertPosts);

  const CIVIC_PRESETS = [
    { label: "@darajmedia", platform: "instagram" as const, handle: "darajmedia", desc: "Investigative" },
    { label: "@smex_org", platform: "instagram" as const, handle: "smex_org", desc: "Digital Rights" },
    { label: "@arijnetwork", platform: "instagram" as const, handle: "arijnetwork", desc: "Arab Watchdog" },
    { label: "@amnesty", platform: "x" as const, handle: "amnesty", desc: "Human Rights" },
    { label: "@democracynow", platform: "youtube" as const, handle: "democracynow", desc: "Independent News" },
  ];

  if (!isOpen) return null;

  const platforms = [
    { id: "instagram", name: "Instagram", placeholder: "@organization" },
    { id: "linkedin", name: "LinkedIn", placeholder: "organization or URL" },
    { id: "tiktok", name: "TikTok", placeholder: "@organization" },
    { id: "youtube", name: "YouTube", placeholder: "@channel" },
    { id: "x", name: "X (Twitter)", placeholder: "@organization" },
  ] as const;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setError("Please enter an account handle or URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    const cleanHandle = handle.trim().replace(/^@/, "");
    setImportStatus(`Crawling @${cleanHandle} on ${platform} via SocialCrawl...`);

    try {
      // Step 1: Attempt live crawl via Next.js SocialCrawl sync API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let crawlResult: any = null;
      try {
        const syncRes = await fetch("/api/social/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            handle: cleanHandle,
            count: 20,
          }),
        });
        if (syncRes.ok) {
          crawlResult = await syncRes.json();
        }
      } catch (crawlErr) {
        console.warn("Live crawl network call failed, falling back:", crawlErr);
      }

      setImportStatus("Connecting account profile...");
      // Step 2: Connect account record with real or normalized profile details
      const profile = crawlResult?.profile;
      const result = await connectAccount({
        organizationId: organization._id,
        platform,
        handle: cleanHandle,
        displayName: profile?.displayName,
        profileUrl: profile?.profileUrl,
        profileImageUrl: profile?.profileImageUrl,
        followerCount: profile?.followerCount,
        followingCount: profile?.followingCount,
        totalPosts: profile?.totalPosts,
        provider: "socialcrawl",
      });

      // Step 3: Upsert live crawled posts if available, otherwise fallback to backfill mutation
      if (crawlResult?.posts && crawlResult.posts.length > 0) {
        setImportStatus(`Ingesting ${crawlResult.posts.length} live posts into repository...`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const postsToUpsert = crawlResult.posts.map((p: any) => ({
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
          accountId: result.accountId,
          posts: postsToUpsert,
        });

        setImportStatus(`${crawlResult.posts.length} real posts crawled & synced!`);
      } else {
        setImportStatus(`Importing ${platform} posts...`);
        const importResult = await runAccountImport({
          organizationId: organization._id,
          accountId: result.accountId,
          jobId: result.jobId,
          count: 25,
        });
        setImportStatus(`${importResult.importedCount} posts imported. Analyzing content...`);
      }

      // Short delay for user visibility
      setTimeout(() => {
        setIsLoading(false);
        setImportStatus(null);
        setHandle("");
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: unknown) {
      console.error("Account connection failed:", err);
      const message = err instanceof Error ? err.message : "Failed to import account. Please try again.";
      setError(message);
      setIsLoading(false);
      setImportStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Radio className="h-5 w-5 text-emerald-500 animate-pulse" />
            <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              Connect Social Account
            </h2>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Enter your organization handle. Radar will automatically retrieve past posts, calculate post-level analytics, and analyze content patterns.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {importStatus && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span>{importStatus}</span>
          </div>
        )}

        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Platform
            </label>
            <div className="grid grid-cols-5 gap-2">
              {platforms.map((p) => {
                const isSelected = platform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    disabled={isLoading}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-xs transition-colors ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 font-semibold text-[var(--foreground)]"
                        : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    <PlatformIcon platform={p.id} className="h-4 w-4 mb-1" />
                    <span className="text-[10px] truncate max-w-full">{p.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/20 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                1-Click Civic Presets (Zero OAuth)
              </span>
              <span className="text-[10px] text-emerald-500 font-medium">Live SocialCrawl</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CIVIC_PRESETS.map((preset) => (
                <button
                  key={preset.handle}
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setPlatform(preset.platform);
                    setHandle(preset.handle);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[11px] font-medium text-[var(--foreground)] hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                >
                  <PlatformIcon platform={preset.platform} className="h-3 w-3" />
                  <span>{preset.label}</span>
                  <span className="text-[9px] text-[var(--muted-foreground)]">({preset.desc})</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Handle or Profile URL
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={platforms.find((p) => p.id === platform)?.placeholder}
              disabled={isLoading}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-hidden"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
              No passwords or API tokens required. Data is ingested through Radar&apos;s provider pipeline.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Import Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
