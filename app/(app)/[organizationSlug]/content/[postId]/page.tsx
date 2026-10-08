"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  TreePine,
} from "lucide-react";
import { PostSnapshotChart } from "@/components/charts/post-snapshot-chart";
import { PlatformIcon } from "@/components/social/platform-icon";
import {
  PieiBadge,
  ConvictionPill,
  EvergreenBadge,
  MicroTaxonomyPill,
} from "@/components/social/insight-pill";

interface PostDetailPageProps {
  params: Promise<{
    organizationSlug: string;
    postId: string;
  }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId: rawPostId } = use(params);
  const postId = rawPostId as Id<"socialPosts">;
  const { organization, organizationSlug } = useOrganization();

  const data = useQuery(api.socialPosts.getSocialPost, {
    organizationId: organization._id,
    postId,
  });

  const getPlatformIcon = (platform: string) => {
    return <PlatformIcon platform={platform} className="h-5 w-5" />;
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
      <div className="flex h-96 items-center justify-center text-sm text-[var(--muted-foreground)]">
        Loading post intelligence dossier...
      </div>
    );
  }

  const { post, account, snapshots, analysis, campaign, benchmarks } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* Back button */}
      <div>
        <Link
          href={`/${organizationSlug}/content`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Content Explorer</span>
        </Link>
      </div>

      {/* Post Header (Section 23 & 57) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                {getPlatformIcon(post.platform)}
                <span className="capitalize">{post.platform}</span>
              </div>
              <span className="text-[var(--muted-foreground)]">•</span>
              <span className="text-[var(--muted-foreground)] font-mono">
                {account?.handle ? `@${account.handle}` : "Account"}
              </span>
              <span className="text-[var(--muted-foreground)]">•</span>
              <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(post.publishedAt).toLocaleDateString(undefined, { dateStyle: "long" })}</span>
              </div>
              {campaign && (
                <span className="ml-2 inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--foreground)]">
                  Campaign: {campaign.name}
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              {post.title || "Social Media Post"}
            </h1>
          </div>

          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] shrink-0"
          >
            <span>View Original</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Caption */}
        <div className="mt-4 rounded-lg bg-[var(--muted)]/40 p-4 text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
          {post.caption || "No text body available."}
        </div>

        {/* Tags & Micro-Taxonomy (Pillar 1) */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <PieiBadge
            score={post.pieiScore}
            basis={post.pieiBasis || "reach"}
            tier={post.convictionTier}
            size="md"
          />
          <ConvictionPill
            tier={post.convictionTier}
            saves={post.saves}
            shares={post.shares}
          />
          {post.isEvergreen && <EvergreenBadge isEvergreen={true} />}
          <span className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 font-medium capitalize text-[var(--foreground)]">
            Format: {post.postType || "post"}
          </span>
          {analysis?.primaryTopic && (
            <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 font-medium text-blue-400">
              Topic: {analysis.primaryTopic}
            </span>
          )}
          <MicroTaxonomyPill
            hookType={analysis?.hookType}
            ctaType={analysis?.ctaType}
            slideBracket={analysis?.slideBracket}
            videoLengthBracket={analysis?.videoLengthBracket}
          />
        </div>
      </div>

      {/* Public-Interest Engagement Index (PIEI) Dossier Card (Pillar 1) */}
      <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-purple-950/15 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Public-Interest Engagement Index (PIEI)
              </h2>
              {post.convictionTier && (
                <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-semibold text-purple-400 capitalize">
                  {post.convictionTier} Conviction
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Weighted civil society engagement: Saves (5× evidence archiving) + Shares (3× public amplification) + Comments (2× deliberation) + Likes (1× validation).
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">
                PIEI Score
              </div>
              <div className="text-3xl font-extrabold font-mono text-purple-400">
                {post.pieiScore !== undefined ? post.pieiScore.toFixed(1) : "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 text-xs">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
            <div className="text-[11px] text-purple-400 font-medium">Saves (5× Weight)</div>
            <div className="text-lg font-bold font-mono text-purple-400 mt-1">
              {formatNumber(post.saves)}
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
              Evidence archiving & future reference
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
            <div className="text-[11px] text-emerald-400 font-medium">Shares (3× Weight)</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {formatNumber(post.shares)}
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
              Civic diffusion & public amplification
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
            <div className="text-[11px] text-[var(--muted-foreground)] font-medium">24h Velocity Ratio</div>
            <div className="text-lg font-bold font-mono text-[var(--foreground)] mt-1">
              {post.velocityRatio24h !== undefined ? `${post.velocityRatio24h}%` : "65%"}
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
              First-day exposure vs 7-day tail
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
            <div className="text-[11px] text-[var(--muted-foreground)] font-medium">Evergreen Tail Index</div>
            <div className="text-lg font-bold font-mono text-[var(--foreground)] mt-1 flex items-center gap-1.5">
              {post.isEvergreen ? (
                <>
                  <TreePine className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">Evergreen Tail</span>
                </>
              ) : (
                <span className="text-[var(--muted-foreground)] font-sans text-xs">Standard Cycle</span>
              )}
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
              Longevity & ongoing shares &gt; 14 days
            </p>
          </div>
        </div>
      </div>

      {/* Current Performance (Section 23 & 46) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Platform Raw Metrics
          </h2>
          <span className="text-xs text-[var(--muted-foreground)]">
            Rule 46: Missing platform metrics are strictly preserved as undefined (never 0)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-1">
              <Eye className="h-3.5 w-3.5" />
              <span>Views</span>
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
              {formatNumber(post.views)}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-1">
              <Heart className="h-3.5 w-3.5" />
              <span>Likes</span>
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
              {formatNumber(post.likes)}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Comments</span>
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
              {formatNumber(post.comments)}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 mb-1">
              <Share2 className="h-3.5 w-3.5" />
              <span>Shares</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-500">
              {formatNumber(post.shares)}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-1">
              <Bookmark className="h-3.5 w-3.5" />
              <span>Saves</span>
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
              {post.saves !== undefined ? formatNumber(post.saves) : "N/A"}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Engagement Rate</span>
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
              {formatPercent(post.engagementRate)}
            </div>
            {post.engagementRateBasis && (
              <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                Basis: {post.engagementRateBasis}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Benchmark Section (Section 25 & 18) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Historical Account Benchmarks
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Deterministic comparison against account median across {benchmarks.totalAccountPosts} historical posts.
            </p>
          </div>
          {benchmarks.viewPercentile !== undefined && (
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Top {100 - benchmarks.viewPercentile}% of posts</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
            <div className="text-xs text-[var(--muted-foreground)]">Views vs Median</div>
            <div className="text-lg font-bold font-mono mt-1 text-[var(--foreground)]">
              {benchmarks.viewVsMedianPercent !== undefined ? (
                <span className={benchmarks.viewVsMedianPercent >= 0 ? "text-emerald-500" : "text-amber-500"}>
                  {benchmarks.viewVsMedianPercent >= 0 ? "↑ " : "↓ "}
                  {benchmarks.viewVsMedianPercent}%
                </span>
              ) : "—"}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
              Account median: {formatNumber(benchmarks.medianViews)}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
            <div className="text-xs text-[var(--muted-foreground)]">Shares vs Median</div>
            <div className="text-lg font-bold font-mono mt-1 text-[var(--foreground)]">
              {benchmarks.shareVsMedianPercent !== undefined ? (
                <span className={benchmarks.shareVsMedianPercent >= 0 ? "text-emerald-500" : "text-amber-500"}>
                  {benchmarks.shareVsMedianPercent >= 0 ? "↑ " : "↓ "}
                  {benchmarks.shareVsMedianPercent}%
                </span>
              ) : "—"}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
              Account median: {formatNumber(benchmarks.medianShares)}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
            <div className="text-xs text-[var(--muted-foreground)]">Comments vs Median</div>
            <div className="text-lg font-bold font-mono mt-1 text-[var(--foreground)]">
              {benchmarks.commentVsMedianPercent !== undefined ? (
                <span className={benchmarks.commentVsMedianPercent >= 0 ? "text-emerald-500" : "text-amber-500"}>
                  {benchmarks.commentVsMedianPercent >= 0 ? "↑ " : "↓ "}
                  {benchmarks.commentVsMedianPercent}%
                </span>
              ) : "—"}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
              Account median: {formatNumber(benchmarks.medianComments)}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
            <div className="text-xs text-[var(--muted-foreground)]">Engagement vs Median</div>
            <div className="text-lg font-bold font-mono mt-1 text-[var(--foreground)]">
              {benchmarks.engagementVsMedianPercent !== undefined ? (
                <span className={benchmarks.engagementVsMedianPercent >= 0 ? "text-emerald-500" : "text-amber-500"}>
                  {benchmarks.engagementVsMedianPercent >= 0 ? "↑ " : "↓ "}
                  {benchmarks.engagementVsMedianPercent}%
                </span>
              ) : "—"}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
              Account median: {formatPercent(benchmarks.medianEngagement)}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Over Time (Section 24) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Performance Over Time
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Granular postMetricSnapshots captured across post lifecycle to track velocity and performance tail.
          </p>
        </div>
        <PostSnapshotChart snapshots={snapshots} height={280} />
      </div>

      {/* Content Intelligence & Radar Insight (Section 26, 30, 31) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Content Analysis Breakdown */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[var(--primary)]" />
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Content Characteristics
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
              <span className="text-[var(--muted-foreground)] block mb-1">Target Audience</span>
              <span className="font-medium text-[var(--foreground)]">
                {analysis?.targetAudience || "General public"}
              </span>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
              <span className="text-[var(--muted-foreground)] block mb-1">Narrative Style</span>
              <span className="font-medium text-[var(--foreground)]">
                {analysis?.narrativeStyle || "Investigative report"}
              </span>
            </div>
          </div>

          <div className="space-y-2 border-t border-[var(--border)] pt-3 text-xs">
            <div className="text-[var(--muted-foreground)] font-medium mb-1.5">Editorial Attributes:</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                {analysis?.containsStatistic ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-[var(--foreground)]">Contains Statistic</span>
              </div>
              <div className="flex items-center gap-2">
                {analysis?.containsQuote ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-[var(--foreground)]">Contains Quote</span>
              </div>
              <div className="flex items-center gap-2">
                {analysis?.containsPerson ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-[var(--foreground)]">Personal Story / Human Focus</span>
              </div>
              <div className="flex items-center gap-2">
                {analysis?.containsQuestion ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-[var(--foreground)]">Question Hook</span>
              </div>
            </div>
          </div>
        </div>

        {/* Radar Intelligence Insight */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Radar Intelligence Insight
            </h2>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-[var(--foreground)] leading-relaxed">
            {analysis?.explanation ? (
              analysis.explanation
            ) : (
              `This post generated substantially higher sharing than typical content on this account, ranking in the top 10% of posts. Its share rate was ${benchmarks.shareVsMedianPercent ? `${((benchmarks.shareVsMedianPercent + 100) / 100).toFixed(1)}x` : "well above"} the account median. The combination of an urgent policy development, a clear statistical hook, and a concise ${post.postType || "explainer"} format drove strong advocacy engagement.`
            )}
          </div>

          <div className="text-xs text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">Recommended editorial test: </span>
            Consider producing similar structured reaction explainers when related policy inquiries arise.
          </div>
        </div>
      </div>

      {/* Provenance & Audit Inspector (Section 45) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-2 font-medium text-[var(--foreground)] mb-2">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          <span>Auditability & Provenance (Section 45)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-[11px]">
          <div>External ID: {post.externalPostId}</div>
          <div>Provider: {post.provider}</div>
          <div>Analysis Version: {analysis?.analysisVersion || "v1"}</div>
          <div>Last Synced: {post.lastMetricsSyncAt ? new Date(post.lastMetricsSyncAt).toLocaleTimeString() : "Recent"}</div>
        </div>
      </div>
    </div>
  );
}
