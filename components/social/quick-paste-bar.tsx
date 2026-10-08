"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import { parseSocialUrl } from "@/lib/social/quick-ingest";
import { PlatformIcon } from "./platform-icon";
import { PieiBadge, ConvictionPill, MicroTaxonomyPill } from "./insight-pill";
import {
  Link2,
  Sparkles,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  X,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface QuickPasteBarProps {
  onSuccess?: (postId: string) => void;
  className?: string;
  compact?: boolean;
}

export function QuickPasteBar({ onSuccess, className = "", compact = false }: QuickPasteBarProps) {
  const { organization, organizationSlug } = useOrganization();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "analyzing" | "ingesting" | "success" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ingestedResult, setIngestedResult] = useState<any | null>(null);

  const quickIngestMutation = useMutation(api.quickIngest.quickIngestPost);

  // Auto-detect platform live as user types or pastes
  const detected = url.trim() ? parseSocialUrl(url) : null;

  const handleIngest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim() || status === "analyzing" || status === "ingesting") return;

    setStatus("analyzing");
    setStatusText("Analyzing URL and extracting content...");
    setErrorMessage("");

    try {
      // 1. Call server API to extract metadata and run deterministic AI classification
      const response = await fetch("/api/quick-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        throw new Error("Unable to extract post metadata");
      }

      const analyzedPost = await response.json();

      setStatus("ingesting");
      setStatusText("Computing PIEI and saving to organization repository...");

      // 2. Persist directly to Convex with organization isolation
      const res = await quickIngestMutation({
        organizationId: organization._id,
        url: analyzedPost.url,
        platform: analyzedPost.platform,
        externalPostId: analyzedPost.externalPostId,
        title: analyzedPost.title,
        caption: analyzedPost.caption,
        postType: analyzedPost.postType,
        authorName: analyzedPost.authorName,
        authorHandle: analyzedPost.authorHandle,
        thumbnailUrl: analyzedPost.thumbnailUrl,
        mediaUrls: analyzedPost.mediaUrls,
        publishedAt: analyzedPost.publishedAt,
        provider: analyzedPost.provider,
        views: analyzedPost.views,
        impressions: analyzedPost.impressions,
        reach: analyzedPost.reach,
        likes: analyzedPost.likes,
        comments: analyzedPost.comments,
        shares: analyzedPost.shares,
        saves: analyzedPost.saves,
        pieiScore: analyzedPost.pieiScore,
        pieiBasis: analyzedPost.pieiBasis,
        convictionTier: analyzedPost.convictionTier,
        isEvergreen: analyzedPost.isEvergreen,
        velocityRatio24h: analyzedPost.velocityRatio24h,
        analysis: analyzedPost.analysis,
      });

      setStatus("success");
      setStatusText("Post successfully ingested with PIEI impact analysis!");
      setIngestedResult({
        ...analyzedPost,
        postId: res.postId,
      });

      if (onSuccess) {
        onSuccess(res.postId);
      }
    } catch (err: unknown) {
      console.error("Ingest failed:", err);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to analyze and ingest post."
      );
    }
  };

  const resetState = () => {
    setUrl("");
    setStatus("idle");
    setStatusText("");
    setErrorMessage("");
    setIngestedResult(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search & Ingest Input Bar */}
      <form onSubmit={handleIngest} className="relative flex items-center w-full">
        <div className="relative flex flex-1 items-center">
          <div className="absolute left-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
            {detected && detected.platform !== "other" ? (
              <PlatformIcon platform={detected.platform} className="h-4 w-4" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
          </div>

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={status === "analyzing" || status === "ingesting"}
            placeholder="Paste any post link (Instagram, YouTube, X, TikTok, LinkedIn)..."
            className={`w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-hidden transition-all shadow-xs ${
              compact ? "pr-24" : "pr-32"
            }`}
          />

          {url.trim() && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute right-28 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!url.trim() || status === "analyzing" || status === "ingesting"}
          className="absolute right-1.5 flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {status === "analyzing" || status === "ingesting" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Quick Ingest</span>
            </>
          )}
        </button>
      </form>

      {/* Live Status Pill when processing */}
      {(status === "analyzing" || status === "ingesting") && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted-foreground)] animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--primary)]" />
          <span>{statusText}</span>
        </div>
      )}

      {/* Error Banner */}
      {status === "error" && (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={resetState} className="p-1 hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Success Preview Card Modal / Banner */}
      {status === "success" && ingestedResult && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-[var(--card)] p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-[var(--foreground)]">
                Successfully Ingested & Analyzed
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 font-mono">
                2.1s
              </span>
            </div>
            <button
              onClick={resetState}
              className="rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={ingestedResult.platform} className="h-3.5 w-3.5" />
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  {ingestedResult.authorHandle || ingestedResult.platform}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-[var(--foreground)] truncate">
                {ingestedResult.title}
              </h4>
              <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                {ingestedResult.caption}
              </p>

              {/* Micro-Taxonomy and Conviction Pills */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <PieiBadge
                  score={ingestedResult.pieiScore}
                  basis={ingestedResult.pieiBasis}
                  tier={ingestedResult.convictionTier}
                  size="sm"
                />
                <ConvictionPill
                  tier={ingestedResult.convictionTier}
                  saves={ingestedResult.saves}
                  shares={ingestedResult.shares}
                />
                <MicroTaxonomyPill
                  hookType={ingestedResult.analysis?.hookType}
                  ctaType={ingestedResult.analysis?.ctaType}
                />
              </div>
            </div>

            {/* Quick Metrics & Actions */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
              <div className="grid grid-cols-3 gap-3 text-center sm:text-right text-[11px]">
                <div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">Views</div>
                  <div className="font-semibold font-mono text-[var(--foreground)]">
                    {ingestedResult.views?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-purple-400">Saves (5x)</div>
                  <div className="font-semibold font-mono text-purple-400">
                    {ingestedResult.saves?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400">Shares (3x)</div>
                  <div className="font-semibold font-mono text-emerald-400">
                    {ingestedResult.shares?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/${organizationSlug}/content/${ingestedResult.postId}`}
                  className="flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                >
                  <span>Post Dossier</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <a
                  href={ingestedResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  title="Open source URL"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
