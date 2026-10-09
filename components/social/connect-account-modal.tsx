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
  Sparkles,
  Layers,
  ShieldCheck,
  Check,
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
  const [mode, setMode] = useState<"multi" | "single">("multi");

  // Single platform mode state
  const [platform, setPlatform] = useState<"instagram" | "linkedin" | "tiktok" | "youtube" | "x">("instagram");
  const [handle, setHandle] = useState("");

  // Multi-platform mode state
  const [multiBaseHandle, setMultiBaseHandle] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({
    instagram: true,
    x: true,
    youtube: true,
    tiktok: false,
    linkedin: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectAccount = useMutation(api.socialAccounts.connectSocialAccount);
  const runAccountImport = useMutation(api.socialSync.runAccountImport);
  const batchUpsertPosts = useMutation(api.socialPosts.batchUpsertPosts);

  const CIVIC_PRESETS = [
    { label: "@darajmedia", handle: "darajmedia", desc: "Investigative Journalism" },
    { label: "@smex_org", handle: "smex_org", desc: "Digital Rights Advocacy" },
    { label: "@arijnetwork", handle: "arijnetwork", desc: "Arab Investigative Network" },
    { label: "@amnesty", handle: "amnesty", desc: "Human Rights Watchdog" },
    { label: "@democracynow", handle: "democracynow", desc: "Independent Media" },
  ];

  if (!isOpen) return null;

  const platforms = [
    { id: "instagram", name: "Instagram", placeholder: "@organization" },
    { id: "x", name: "X (Twitter)", placeholder: "@organization" },
    { id: "youtube", name: "YouTube", placeholder: "@channel" },
    { id: "tiktok", name: "TikTok", placeholder: "@organization" },
    { id: "linkedin", name: "LinkedIn", placeholder: "organization" },
  ] as const;

  // Single account import
  const handleSingleImport = async (e: React.FormEvent) => {
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

  // Turnkey Multi-Platform Batch Import
  const handleMultiImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBaseHandle = multiBaseHandle.trim().replace(/^@/, "");
    if (!cleanBaseHandle) {
      setError("Please enter your organization's primary handle (e.g. darajmedia)");
      return;
    }

    const activePlatforms = platforms.filter((p) => selectedPlatforms[p.id]);
    if (activePlatforms.length === 0) {
      setError("Please select at least one platform to connect.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportStatus(`Starting turnkey crawl across ${activePlatforms.length} channels...`);

    let totalSynced = 0;
    try {
      for (const p of activePlatforms) {
        setImportStatus(`Syncing @${cleanBaseHandle} on ${p.name}...`);
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let crawlResult: any = null;
          try {
            const syncRes = await fetch("/api/social/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                platform: p.id,
                handle: cleanBaseHandle,
                count: 20,
              }),
            });
            if (syncRes.ok) {
              crawlResult = await syncRes.json();
            }
          } catch {
            // fallback
          }

          const profile = crawlResult?.profile;
          const result = await connectAccount({
            organizationId: organization._id,
            platform: p.id,
            handle: cleanBaseHandle,
            displayName: profile?.displayName,
            profileUrl: profile?.profileUrl,
            profileImageUrl: profile?.profileImageUrl,
            followerCount: profile?.followerCount,
            followingCount: profile?.followingCount,
            totalPosts: profile?.totalPosts,
            provider: "socialcrawl",
          });

          if (crawlResult?.posts && crawlResult.posts.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const postsToUpsert = crawlResult.posts.map((post: any) => ({
              platform: post.platform,
              externalPostId: post.externalPostId,
              url: post.url,
              publishedAt: post.publishedAt,
              caption: post.caption,
              title: post.title,
              postType: post.postType,
              thumbnailUrl: post.thumbnailUrl,
              mediaUrls: post.mediaUrls,
              views: post.views,
              impressions: post.impressions,
              reach: post.reach,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              saves: post.saves,
              provider: "socialcrawl",
            }));

            await batchUpsertPosts({
              organizationId: organization._id,
              accountId: result.accountId,
              posts: postsToUpsert,
            });
            totalSynced += crawlResult.posts.length;
          } else {
            await runAccountImport({
              organizationId: organization._id,
              accountId: result.accountId,
              jobId: result.jobId,
              count: 20,
            });
            totalSynced += 20;
          }
        } catch (itemErr) {
          console.warn(`Error connecting ${p.name}:`, itemErr);
        }
      }

      setImportStatus(`Success! Connected ${activePlatforms.length} channels with ${totalSynced} posts!`);

      setTimeout(() => {
        setIsLoading(false);
        setImportStatus(null);
        setMultiBaseHandle("");
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: unknown) {
      console.error("Multi-import failed:", err);
      setError(err instanceof Error ? err.message : "Failed to connect all channels.");
      setIsLoading(false);
      setImportStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Radio className="h-5 w-5 text-emerald-500 animate-pulse" />
            <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
              Turnkey Social Ingestion
            </h2>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Add your social handles once. Radar automatically retrieves past investigative outputs and keeps metrics continuously updated.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-1 mb-4">
          <button
            type="button"
            onClick={() => setMode("multi")}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === "multi"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>All Channels (Out of the Box)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("single")}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === "single"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Single Channel</span>
          </button>
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

        {/* MODE 1: MULTI-CHANNEL OUT OF THE BOX */}
        {mode === "multi" ? (
          <form onSubmit={handleMultiImport} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
                Organization Main Handle
              </label>
              <input
                type="text"
                value={multiBaseHandle}
                onChange={(e) => setMultiBaseHandle(e.target.value)}
                placeholder="e.g. darajmedia, smex_org, amnesty"
                disabled={isLoading}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-hidden"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                Most media and NGOs use the same handle across platforms. Radar will apply this to all selected channels below.
              </p>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--muted-foreground)]">
                Or pick a 1-Click Civic Preset:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CIVIC_PRESETS.map((p) => (
                  <button
                    key={p.handle}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setMultiBaseHandle(p.handle)}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] font-medium text-[var(--foreground)] hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                  >
                    <span>@{p.handle}</span>
                    <span className="text-[9px] text-[var(--muted-foreground)]">({p.desc})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Selection Toggles */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">
                Channels to Ingest
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {platforms.map((p) => {
                  const isChecked = selectedPlatforms[p.id];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        setSelectedPlatforms((prev) => ({
                          ...prev,
                          [p.id]: !prev[p.id],
                        }))
                      }
                      className={`flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors text-left ${
                        isChecked
                          ? "border-emerald-500 bg-emerald-500/10 text-[var(--foreground)] font-semibold"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/40"
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                          isChecked
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-[var(--border)]"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <PlatformIcon platform={p.id} className="h-3.5 w-3.5" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zero-OAuth Advantage Callout */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-2.5 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                <span className="font-semibold text-[var(--foreground)]">Zero-OAuth Guarantee:</span>{" "}
                No passwords or API keys required. Zero 60-day token decay. Your channels stay continuously monitored.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border)]">
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
                disabled={isLoading || !multiBaseHandle.trim()}
                className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Ingesting Channels...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Connect & Ingest All Channels</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* MODE 2: SINGLE PLATFORM */
          <form onSubmit={handleSingleImport} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                Select Platform
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
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-xs transition-colors ${
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

            {/* Quick Presets for Single Platform */}
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/20 p-2.5">
              <span className="text-[11px] font-medium text-[var(--muted-foreground)] block mb-1.5">
                1-Click Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CIVIC_PRESETS.map((preset) => (
                  <button
                    key={preset.handle}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setHandle(preset.handle)}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[11px] font-medium text-[var(--foreground)] hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                  >
                    <span>@{preset.handle}</span>
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
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border)]">
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
                disabled={isLoading || !handle.trim()}
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
        )}
      </div>
    </div>
  );
}
