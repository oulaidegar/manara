"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  Search,
  ExternalLink,
  Plus,
  Eye,
  Share2,
  Bookmark,
  TrendingUp,
  Sparkles,
  TreePine,
  Filter,
} from "lucide-react";
import { ConnectAccountModal } from "@/components/social/connect-account-modal";
import { PlatformIcon } from "@/components/social/platform-icon";
import { QuickPasteBar } from "@/components/social/quick-paste-bar";
import {
  PieiBadge,
  ConvictionPill,
  EvergreenBadge,
  MicroTaxonomyPill,
} from "@/components/social/insight-pill";
import { CampaignAutoSuggestBanner } from "@/components/campaigns/campaign-auto-suggest-banner";

type SortOption =
  | "pieiScore"
  | "newest"
  | "oldest"
  | "views"
  | "likes"
  | "shares"
  | "comments"
  | "saves"
  | "engagementRate"
  | "performanceScore";

export default function ContentExplorerPage() {
  const { organization, organizationSlug } = useOrganization();
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [selectedHook, setSelectedHook] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [isEvergreenOnly, setIsEvergreenOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("pieiScore");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const posts = useQuery(api.socialPosts.listSocialPosts, {
    organizationId: organization._id,
    platform: selectedPlatform === "all" ? undefined : selectedPlatform,
    postType: selectedFormat === "all" ? undefined : selectedFormat,
    searchTerm: searchTerm.trim() || undefined,
    convictionTier: selectedTier === "all" ? undefined : selectedTier,
    isEvergreen: isEvergreenOnly ? true : undefined,
    hookType: selectedHook === "all" ? undefined : selectedHook,
    sortBy,
  });

  const getPlatformIcon = (platform: string) => {
    return <PlatformIcon platform={platform} className="h-4 w-4" />;
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Content Explorer
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400">
              <Sparkles className="h-3 w-3" />
              <span>PIEI Impact Engine</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Every published post measured by public-interest conviction, evidence archiving, and staying power.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Dual View Toggle (Pillar 3) */}
          <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--background)] p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "cards"
                  ? "bg-[var(--muted)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title="Visual Feed Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Feed Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-[var(--muted)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title="Power Table View"
            >
              <List className="h-3.5 w-3.5" />
              <span>Power Table</span>
            </button>
          </div>

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Connect Channel</span>
          </button>
        </div>
      </div>

      {/* Universal Quick Ingest Bar (Pillar 3) */}
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] via-[var(--card)] to-purple-950/10 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground)]">
                Universal Quick Ingest (Zero-Friction Link Paste)
              </h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Paste any link from Instagram, YouTube, X, TikTok, or LinkedIn. Radar normalizes metrics and computes PIEI conviction in seconds.
              </p>
            </div>
          </div>
        </div>
        <QuickPasteBar className="w-full" />
      </div>

      {/* Smart AI Campaign Auto-Suggestions (Pillar 3) */}
      <CampaignAutoSuggestBanner organizationSlug={organizationSlug} />

      {/* Multi-Parameter Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search captions & topics..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-1.5 pl-8 pr-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-hidden"
            />
          </div>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-hidden"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
            <option value="tiktok">TikTok</option>
            <option value="x">X (Twitter)</option>
          </select>

          {/* Format Filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-hidden"
          >
            <option value="all">All Formats</option>
            <option value="investigation">Investigation</option>
            <option value="carousel">Carousel</option>
            <option value="video">Video</option>
            <option value="reel">Reel / Short</option>
            <option value="explainer">Explainer</option>
            <option value="report">Report</option>
          </select>

          {/* Hook Type Filter (Micro-Taxonomy) */}
          <select
            value={selectedHook}
            onChange={(e) => setSelectedHook(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-hidden"
          >
            <option value="all">All Hook Types</option>
            <option value="document_scan">📑 Leaked Record / Scan</option>
            <option value="shock_statistic">📊 Shock Statistic</option>
            <option value="open_question">❓ Open Question</option>
            <option value="direct_quote">💬 Direct Quote</option>
            <option value="breaking_news">🚨 Breaking News</option>
          </select>

          {/* Conviction Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-hidden"
          >
            <option value="all">All Conviction Tiers</option>
            <option value="exceptional">Top 5% Conviction (PIEI ≥ 25)</option>
            <option value="high">High Conviction (PIEI ≥ 12)</option>
            <option value="moderate">Moderate Conviction (PIEI ≥ 5)</option>
          </select>

          {/* Evergreen Only Toggle */}
          <button
            onClick={() => setIsEvergreenOnly(!isEvergreenOnly)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isEvergreenOnly
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <TreePine className="h-3.5 w-3.5" />
            <span>Evergreen (14d+ Tail)</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] focus:outline-hidden"
          >
            <option value="pieiScore">⚡ Public-Interest Impact (PIEI)</option>
            <option value="saves">📥 Most Saved (Evidence Archiving)</option>
            <option value="shares">📣 Most Shared (Amplification)</option>
            <option value="views">👁️ Most Viewed</option>
            <option value="engagementRate">📈 Engagement Rate</option>
            <option value="newest">🕒 Newest First</option>
            <option value="oldest">⏳ Oldest First</option>
          </select>
        </div>
      </div>

      {/* Content Display */}
      {posts === undefined ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--muted-foreground)]">
          Loading content repository...
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] mb-3">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">No matching posts found</h3>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)]">
            Try adjusting your platform, hook type, or conviction tier filters, or paste a new URL above to analyze.
          </p>
        </div>
      ) : viewMode === "cards" ? (
        /* Visual Feed Grid View (Pillar 3 & Pillar 1) */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post._id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xs hover:border-purple-500/40 hover:shadow-md transition-all"
            >
              <div>
                {/* Media Header Banner */}
                <div className="relative aspect-video w-full bg-gradient-to-br from-[var(--muted)] via-[var(--card)] to-[var(--muted)] border-b border-[var(--border)] flex items-center justify-center p-4">
                  {/* Platform & Date Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-[var(--background)]/85 backdrop-blur-xs border border-[var(--border)] px-2.5 py-1 text-[11px] shadow-xs">
                    {getPlatformIcon(post.platform)}
                    <span className="font-semibold text-[var(--foreground)]">
                      {post.accountHandle ? `@${post.accountHandle}` : post.platform}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {post.isEvergreen && <EvergreenBadge isEvergreen={true} />}
                  </div>

                  {/* Visual Center Preview / Topic Badge */}
                  <div className="text-center px-4">
                    <span className="inline-block rounded-lg bg-[var(--background)]/80 backdrop-blur-xs border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--foreground)] shadow-xs">
                      {post.analysis?.primaryTopic || post.postType || "Public Interest Report"}
                    </span>
                  </div>

                  {/* PIEI Floating Score Badge */}
                  <div className="absolute bottom-3 left-3">
                    <PieiBadge
                      score={post.pieiScore}
                      basis={post.pieiBasis || "reach"}
                      tier={post.convictionTier}
                      size="md"
                    />
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <span className="rounded-md bg-[var(--background)]/85 px-2 py-0.5 text-[10px] text-[var(--muted-foreground)] border border-[var(--border)]">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ConvictionPill
                      tier={post.convictionTier}
                      saves={post.saves}
                      shares={post.shares}
                    />
                  </div>

                  <Link
                    href={`/${organizationSlug}/content/${post._id}`}
                    className="font-semibold text-sm text-[var(--foreground)] hover:text-purple-400 transition-colors line-clamp-2 block leading-snug"
                  >
                    {post.title || post.caption || "Untitled post"}
                  </Link>

                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                    {post.caption || "No text excerpt available."}
                  </p>

                  {/* Micro-Taxonomy Badges */}
                  <div className="pt-1">
                    <MicroTaxonomyPill
                      hookType={post.analysis?.hookType}
                      ctaType={post.analysis?.ctaType}
                      slideBracket={post.analysis?.slideBracket}
                      videoLengthBracket={post.analysis?.videoLengthBracket}
                    />
                  </div>
                </div>
              </div>

              {/* High-Conviction Metrics Strip */}
              <div className="border-t border-[var(--border)] bg-[var(--muted)]/20 p-3.5">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Views</div>
                    <div className="font-semibold text-[var(--foreground)] font-mono">
                      {formatNumber(post.views)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-purple-400 font-medium">Saves (5x)</div>
                    <div className="font-semibold text-purple-400 font-mono flex items-center justify-center gap-0.5">
                      <Bookmark className="h-2.5 w-2.5" />
                      <span>{formatNumber(post.saves)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 font-medium">Shares (3x)</div>
                    <div className="font-semibold text-emerald-400 font-mono flex items-center justify-center gap-0.5">
                      <Share2 className="h-2.5 w-2.5" />
                      <span>{formatNumber(post.shares)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Std. ER</div>
                    <div className="font-semibold text-[var(--foreground)] font-mono">
                      {formatPercent(post.engagementRate)}
                    </div>
                  </div>
                </div>

                {/* Footer Action Links */}
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-[var(--border)]/60 text-xs">
                  <Link
                    href={`/${organizationSlug}/content/${post._id}`}
                    className="font-medium text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <span>Post Intelligence</span>
                    <TrendingUp className="h-3 w-3" />
                  </Link>

                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1 transition-colors"
                  >
                    <span>Original</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Power Table View (Pillar 3 & Pillar 1) */
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Post Details</th>
                <th className="px-3 py-3 font-semibold">Micro-Taxonomy</th>
                <th className="px-3 py-3 font-semibold text-right">Views</th>
                <th className="px-3 py-3 font-semibold text-right">Likes (1x)</th>
                <th className="px-3 py-3 font-semibold text-right">Comments (2x)</th>
                <th className="px-3 py-3 font-semibold text-right text-emerald-400">Shares (3x)</th>
                <th className="px-3 py-3 font-semibold text-right text-purple-400">Saves (5x)</th>
                <th className="px-3 py-3 font-semibold text-right">Std ER</th>
                <th className="px-4 py-3 font-semibold text-right text-purple-400">PIEI Score</th>
                <th className="px-3 py-3 font-semibold text-center">Status</th>
                <th className="px-3 py-3 font-semibold text-center">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {posts.map((post) => (
                <tr
                  key={post._id}
                  className="group hover:bg-[var(--muted)]/40 transition-colors"
                >
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">{getPlatformIcon(post.platform)}</div>
                      <div className="truncate">
                        <Link
                          href={`/${organizationSlug}/content/${post._id}`}
                          className="font-medium text-[var(--foreground)] hover:underline truncate block"
                        >
                          {post.title || post.caption?.slice(0, 50) || "Untitled post"}
                        </Link>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] mt-0.5">
                          <span>{post.accountHandle ? `@${post.accountHandle}` : post.platform}</span>
                          <span>•</span>
                          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <MicroTaxonomyPill
                      hookType={post.analysis?.hookType}
                      ctaType={post.analysis?.ctaType}
                    />
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-[var(--foreground)] font-mono">
                    {formatNumber(post.views)}
                  </td>
                  <td className="px-3 py-3 text-right text-[var(--muted-foreground)] font-mono">
                    {formatNumber(post.likes)}
                  </td>
                  <td className="px-3 py-3 text-right text-[var(--muted-foreground)] font-mono">
                    {formatNumber(post.comments)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-medium text-emerald-400">
                    {formatNumber(post.shares)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-medium text-purple-400">
                    {formatNumber(post.saves)}
                  </td>
                  <td className="px-3 py-3 text-right text-[var(--muted-foreground)] font-mono">
                    {formatPercent(post.engagementRate)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <PieiBadge
                      score={post.pieiScore}
                      basis={post.pieiBasis || "reach"}
                      tier={post.convictionTier}
                      size="sm"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    {post.isEvergreen ? (
                      <EvergreenBadge isEvergreen={true} />
                    ) : (
                      <span className="text-[10px] text-[var(--muted-foreground)]">Standard</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/${organizationSlug}/content/${post._id}`}
                        className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                        title="View post intelligence"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                        title="Open external post"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Connect Account Modal */}
      <ConnectAccountModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}
