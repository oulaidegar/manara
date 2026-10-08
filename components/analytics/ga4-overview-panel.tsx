"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
import {
  Globe,
  Users,
  Clock,
  FileDown,
  Share2,
  ExternalLink,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Link as LinkIcon,
} from "lucide-react";
import { PlatformIcon } from "@/components/social/platform-icon";
import { GA4ConnectModal } from "./ga4-connect-modal";

interface EnrichedArticle {
  _id: Id<"webArticles">;
  title: string;
  url: string;
  path: string;
  activeUsers: number;
  averageEngagementTimeSeconds: number;
  formattedAvgTime: string;
  documentDownloads: number;
  socialReferralShare: number;
  attributionHeadline?: string;
  primaryTopic?: string;
  campaignName?: string | null;
  wordCount?: number;
  linkedPost?: {
    _id: Id<"socialPosts">;
    platform: string;
    title: string;
    pieiScore?: number;
    views?: number;
    url: string;
  } | null;
}

interface GA4OverviewPanelProps {
  campaignId?: Id<"campaigns">;
  showHeader?: boolean;
}

export function GA4OverviewPanel({ campaignId, showHeader = true }: GA4OverviewPanelProps) {
  const { organization } = useOrganization();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "activeUsers" | "pageviews" | "averageEngagementTimeSeconds" | "documentDownloads" | "socialReferralShare"
  >("activeUsers");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedArticleForAttribution, setSelectedArticleForAttribution] = useState<EnrichedArticle | null>(null);

  const overview = useQuery(api.ga4.getReadershipOverview, {
    organizationId: organization._id,
    campaignId,
  });

  const articles = useQuery(api.ga4.listWebArticles, {
    organizationId: organization._id,
    campaignId,
    sortBy,
    searchTerm: searchTerm.trim() || undefined,
  });

  const syncReadership = useMutation(api.ga4.syncGA4Readership);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncReadership({
        organizationId: organization._id,
        propertyId: overview?.property?._id,
      });
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  // Not Connected or Empty State
  if (overview && (!overview.isConnected || overview.articleCount === 0)) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-b from-[var(--card)] to-[var(--background)] p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 mb-4 shadow-inner">
          <Globe className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          Close the Social-to-Web Attribution Loop
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted-foreground)] leading-relaxed">
          Social reach is only the top of the funnel. Connect Google Analytics 4 (GA4) to measure 
          investigative article reads, deep attention dwell time vs. social skimming, and downloaded PDF leaks.
        </p>

        <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Connect GA4 / Load Demo Sandbox</span>
          </button>
        </div>

        <GA4ConnectModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Status Bar */}
      {showHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
                Web Readership & Social Attribution
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                <Globe className="h-3 w-3" />
                <span>Google Analytics 4</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {overview?.property?.displayName || "Connected Property"} ({overview?.property?.websiteUrl}) • 
              Synchronized {overview?.property?.lastSyncedAt ? new Date(overview.property.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-blue-400" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Readership"}</span>
            </button>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <span>Property Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* 4-Card Civil Society KPI Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Unique Web Readers */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Unique Readers (Active Users)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-[var(--foreground)]">
            {formatNumber(overview?.totalUniqueReaders)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
            <span>{formatNumber(overview?.totalPageviews)} pageviews</span>
            <span className="font-mono text-blue-400">{formatNumber(overview?.totalSessions)} sessions</span>
          </div>
        </div>

        {/* Card 2: Deep Attention vs Skimming */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Avg Engagement Dwell Time
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-emerald-400">
            {overview?.formattedAvgTime ?? "0m 00s"}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
            <span>{overview?.deepAttentionRatio}% reach 90% scroll</span>
            <span className="text-emerald-500 font-medium">vs 15s social skim</span>
          </div>
        </div>

        {/* Card 3: Evidence Downloads (High-Conviction Civic Action) */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Leaked Records / PDFs Downloaded
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
              <FileDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-purple-400">
            {formatNumber(overview?.totalDocumentDownloads)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
            <span>{formatNumber(overview?.totalPetitionClicks)} petitions signed</span>
            <span className="font-medium text-purple-400">{overview?.totalWhistleblowerTips} tips submitted</span>
          </div>
        </div>

        {/* Card 4: Social Attribution Share */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Social Attribution Share
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <Share2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-amber-400">
            {overview?.overallSocialReferralShare}%
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
            <span>Driven by social channels</span>
            <span className="text-amber-500 font-medium">Closed-Loop</span>
          </div>
        </div>
      </div>

      {/* The Canonical Civic Attribution Headline Banner */}
      {overview?.attributionHeadline && (
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-[var(--card)] to-purple-950/20 p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 shadow-inner">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Rule 44 Attribution Synthesis (Evidence-Backed)
                </span>
                <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                  Convex Deterministic Bridge
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--foreground)] leading-relaxed italic">
                &ldquo;{overview.attributionHeadline}&rdquo;
              </p>
              
              {/* Funnel Pipeline Visualizer */}
              <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <div className="flex items-center gap-1.5 rounded-md bg-[var(--card)] border border-[var(--border)] px-2.5 py-1">
                  <Share2 className="h-3 w-3 text-amber-400" />
                  <span>Social Posts & Threads</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                <div className="flex items-center gap-1.5 rounded-md bg-[var(--card)] border border-[var(--border)] px-2.5 py-1">
                  <Users className="h-3 w-3 text-blue-400" />
                  <span className="font-semibold text-[var(--foreground)]">{formatNumber(overview.totalUniqueReaders)} Unique Readers</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                <div className="flex items-center gap-1.5 rounded-md bg-[var(--card)] border border-[var(--border)] px-2.5 py-1">
                  <Clock className="h-3 w-3 text-emerald-400" />
                  <span className="font-semibold text-emerald-400">{overview.formattedAvgTime} Avg Read Time</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                <div className="flex items-center gap-1.5 rounded-md bg-[var(--card)] border border-[var(--border)] px-2.5 py-1">
                  <FileDown className="h-3 w-3 text-purple-400" />
                  <span className="font-semibold text-purple-400">{formatNumber(overview.totalDocumentDownloads)} PDF Leaks Downloaded</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Traffic Acquisition Sources Breakdown */}
      {overview?.topReferralSources && overview.topReferralSources.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-[var(--foreground)]">
                Acquisition Channels: Social Attribution vs. Direct Readership
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Readers acquired, channel share, and average engagement dwell time per source
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {overview.topReferralSources.slice(0, 4).map((source) => {
              const isSocial = /instagram|x|twitter|youtube|linkedin|facebook|tiktok/i.test(source.source);
              return (
                <div
                  key={`${source.source}_${source.medium}`}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isSocial ? (
                        <PlatformIcon platform={source.source} className="h-4 w-4" />
                      ) : (
                        <Globe className="h-4 w-4 text-[var(--muted-foreground)]" />
                      )}
                      <span className="text-xs font-semibold capitalize text-[var(--foreground)]">
                        {source.source}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-400">{source.sharePercent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>{formatNumber(source.users)} readers</span>
                    <span className="font-mono text-emerald-400">
                      {Math.floor(source.avgTimeSeconds / 60)}m {source.avgTimeSeconds % 60}s dwell
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--muted)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isSocial ? "bg-amber-400" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(100, source.sharePercent * 1.5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Investigative Dossiers Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">
              Top Investigative Dossiers & Research
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Articles ranked by verified readers, reading dwell depth, and linked social campaign distribution
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search investigations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 rounded-lg border border-[var(--border)] bg-[var(--background)] pl-8 pr-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-8 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="activeUsers">Highest Readers</option>
                <option value="averageEngagementTimeSeconds">Deepest Attention (Dwell Time)</option>
                <option value="documentDownloads">Most PDF Leaks Downloaded</option>
                <option value="socialReferralShare">Highest Social Attribution %</option>
                <option value="pageviews">Total Pageviews</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dossiers List */}
        <div className="divide-y divide-[var(--border)]">
          {articles?.map((art) => (
            <div
              key={art._id}
              className="py-4 space-y-2.5 hover:bg-[var(--muted)]/20 rounded-xl px-2.5 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                      {art.primaryTopic || "Investigation"}
                    </span>
                    {art.campaignName && (
                      <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                        Campaign: {art.campaignName}
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--muted-foreground)] font-mono">
                      {art.wordCount ? `${art.wordCount} words` : null}
                    </span>
                  </div>

                  <a
                    href={art.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm font-bold text-[var(--foreground)] hover:text-blue-400 transition-colors group"
                  >
                    <span>{art.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <p className="text-[11px] font-mono text-[var(--muted-foreground)]">
                    {art.path}
                  </p>
                </div>

                {/* Metrics Badges */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-[var(--foreground)]">
                      {formatNumber(art.activeUsers)}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">readers</div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">
                      {art.formattedAvgTime}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">avg read time</div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-purple-400">
                      {formatNumber(art.documentDownloads)}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">PDF downloads</div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-400">
                      {art.socialReferralShare}%
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">social share</div>
                  </div>
                </div>
              </div>

              {/* Attribution Bridge Footer for this Article */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--border)]/50 text-xs text-[var(--muted-foreground)]">
                {art.linkedPost ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-[var(--foreground)] flex items-center gap-1">
                      <LinkIcon className="h-3 w-3 text-blue-400" />
                      <span>Attributed to:</span>
                    </span>
                    <div className="flex items-center gap-1.5 rounded-md bg-[var(--background)] border border-[var(--border)] px-2 py-0.5 text-[11px]">
                      <PlatformIcon platform={art.linkedPost.platform} className="h-3 w-3" />
                      <span className="font-medium text-[var(--foreground)] truncate max-w-xs">
                        {art.linkedPost.title}
                      </span>
                      {art.linkedPost.pieiScore && (
                        <span className="rounded bg-purple-500/20 px-1 text-[9px] font-bold text-purple-400">
                          PIEI {art.linkedPost.pieiScore}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] italic text-[var(--muted-foreground)]">
                    No social post explicitly linked
                  </div>
                )}

                {art.attributionHeadline && (
                  <button
                    onClick={() => setSelectedArticleForAttribution(art)}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    <span>View Attribution Statement</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {articles && articles.length === 0 && (
            <div className="py-8 text-center text-xs text-[var(--muted-foreground)]">
              No investigative dossiers match your search.
            </div>
          )}
        </div>
      </div>

      {/* Attribution Statement Modal */}
      {selectedArticleForAttribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  Civic Attribution Evidence Statement
                </h3>
              </div>
              <button
                onClick={() => setSelectedArticleForAttribution(null)}
                className="rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm font-medium text-[var(--foreground)] leading-relaxed italic">
                &ldquo;{selectedArticleForAttribution.attributionHeadline}&rdquo;
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase">Unique Readers</div>
                  <div className="text-base font-bold text-[var(--foreground)] mt-0.5">
                    {formatNumber(selectedArticleForAttribution.activeUsers)}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase">Avg Dwell Time</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {selectedArticleForAttribution.formattedAvgTime}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase">PDF Documents Leaked/Archived</div>
                  <div className="text-base font-bold text-purple-400 mt-0.5">
                    {formatNumber(selectedArticleForAttribution.documentDownloads)}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase">Social Attribution Share</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">
                    {selectedArticleForAttribution.socialReferralShare}%
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[var(--muted-foreground)] leading-normal">
                This attribution statement is deterministically derived from Google Analytics 4 (GA4) runReport sessions, UTM parameters, and publication timestamps in compliance with civil society donor reporting guidelines.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedArticleForAttribution(null)}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      <GA4ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}
