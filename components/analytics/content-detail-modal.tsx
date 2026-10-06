"use client";

import {
  X,
  ExternalLink,
  Calendar,
  Share2,
  Bookmark,
  MousePointerClick,
  Target,
  Sparkles,
} from "lucide-react";

export interface DetailedContentItem {
  _id: string;
  title: string;
  text?: string;
  provider: string;
  contentType: string;
  publishedAt: number;
  externalUrl?: string;
  externalId?: string;
  metrics?: {
    impressions?: number;
    reach?: number;
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    clicks?: number;
  };
  initiativeName?: string | null;
  meaningfulRate?: number;
  meaningfulActions?: number;
}

interface ContentDetailModalProps {
  item: DetailedContentItem | null;
  onClose: () => void;
}

export function ContentDetailModal({ item, onClose }: ContentDetailModalProps) {
  if (!item) return null;

  const imp = item.metrics?.impressions ?? 0;
  const reach = item.metrics?.reach ?? 0;
  const views = item.metrics?.views ?? 0;
  const shares = item.metrics?.shares ?? 0;
  const saves = item.metrics?.saves ?? 0;
  const clicks = item.metrics?.clicks ?? 0;
  const likes = item.metrics?.likes ?? 0;
  const comments = item.metrics?.comments ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--muted)] text-[var(--foreground)] capitalize">
                {item.provider}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                {item.contentType.replace(/_/g, " ")}
              </span>
              {item.initiativeName && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  <span>{item.initiativeName}</span>
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-[var(--foreground)] leading-snug">
              {item.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(item.publishedAt).toLocaleDateString(undefined, { dateStyle: "long" })}</span>
              </span>
              {item.externalUrl && (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[var(--accent)] hover:underline font-medium"
                >
                  <span>Original Link</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Excerpt / Text */}
        {item.text && (
          <div className="p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] space-y-1.5">
            <div className="text-xs font-semibold text-[var(--foreground)]">Text Excerpt / Caption</div>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed whitespace-pre-wrap">
              {item.text}
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[var(--foreground)] flex items-center justify-between">
            <span>Performance & Actions Breakdown</span>
            <span className="text-[11px] text-[var(--muted-foreground)] font-mono">
              Action Rate: {item.meaningfulRate?.toFixed(1) ?? "0.0"} / 1,000 impr
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <div className="text-[var(--muted-foreground)]">Impressions</div>
              <div className="text-base font-bold font-mono text-[var(--foreground)] mt-0.5">
                {imp.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <div className="text-[var(--muted-foreground)]">Unique Reach</div>
              <div className="text-base font-bold font-mono text-[var(--foreground)] mt-0.5">
                {reach.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <div className="text-[var(--muted-foreground)]">Views / Plays</div>
              <div className="text-base font-bold font-mono text-[var(--foreground)] mt-0.5">
                {views.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/20">
              <div className="text-emerald-700 dark:text-emerald-300">Meaningful Actions</div>
              <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                {((item.meaningfulActions ?? (shares + saves + clicks))).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] flex items-center gap-1">
                <Share2 className="h-3 w-3 text-blue-500" />
                <span>Shares / Reposts</span>
              </div>
              <div className="font-semibold font-mono text-sm mt-0.5">{shares.toLocaleString()}</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] flex items-center gap-1">
                <Bookmark className="h-3 w-3 text-emerald-500" />
                <span>Saves / Bookmarks</span>
              </div>
              <div className="font-semibold font-mono text-sm mt-0.5">{saves.toLocaleString()}</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] flex items-center gap-1">
                <MousePointerClick className="h-3 w-3 text-purple-500" />
                <span>Clicks</span>
              </div>
              <div className="font-semibold font-mono text-sm mt-0.5">{clicks.toLocaleString()}</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)]">Likes & Comments</div>
              <div className="font-semibold font-mono text-sm mt-0.5">
                {(likes + comments).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Radar Insights Footer */}
        <div className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <div className="font-semibold">Institutional Memory & Impact Link</div>
            <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
              This item is recorded as an operational output. When linking outcomes or external citations in the Impact section, reference this item to maintain the unbroken chain from activity to societal change.
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--muted)] text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
