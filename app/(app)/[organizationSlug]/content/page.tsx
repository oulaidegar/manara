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
  TrendingUp,
} from "lucide-react";
import { ConnectAccountModal } from "@/components/social/connect-account-modal";
import { PlatformIcon } from "@/components/social/platform-icon";

type SortOption =
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
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const posts = useQuery(api.socialPosts.listSocialPosts, {
    organizationId: organization._id,
    platform: selectedPlatform === "all" ? undefined : selectedPlatform,
    postType: selectedFormat === "all" ? undefined : selectedFormat,
    searchTerm: searchTerm.trim() || undefined,
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
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Content Explorer
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Every published post across connected platforms. Drill down from aggregate statistics to individual records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--background)] p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded p-1.5 transition-colors ${
                viewMode === "table"
                  ? "bg-[var(--muted)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`rounded p-1.5 transition-colors ${
                viewMode === "cards"
                  ? "bg-[var(--muted)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title="Cards view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            <span>Import Social Content</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar (Section 21) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search captions & titles..."
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
            <option value="linkedin">LinkedIn</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="x">X (Twitter)</option>
          </select>

          {/* Format Filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-hidden"
          >
            <option value="all">All Formats</option>
            <option value="explainer">Explainer</option>
            <option value="video">Video</option>
            <option value="reel">Reel / Short</option>
            <option value="carousel">Carousel</option>
            <option value="investigation">Investigation</option>
            <option value="infographic">Infographic</option>
            <option value="post">Standard Post</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-hidden"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="views">Most Viewed</option>
            <option value="shares">Most Shared</option>
            <option value="comments">Most Commented</option>
            <option value="saves">Most Saved</option>
            <option value="engagementRate">Highest Engagement</option>
          </select>
        </div>
      </div>

      {/* Content Register Display */}
      {posts === undefined ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--muted-foreground)]">
          Loading content repository...
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] mb-3">
            <Share2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">No posts found</h3>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)]">
            Connect an organization account or import historical social content to analyze post-level intelligence.
          </p>
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span>Connect Account & Import Posts</span>
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* Table View (Section 20) */
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Post Details</th>
                <th className="px-4 py-3 font-semibold">Format & Topic</th>
                <th className="px-3 py-3 font-semibold text-right">Views</th>
                <th className="px-3 py-3 font-semibold text-right">Likes</th>
                <th className="px-3 py-3 font-semibold text-right">Comments</th>
                <th className="px-3 py-3 font-semibold text-right">Shares</th>
                <th className="px-3 py-3 font-semibold text-right">Saves</th>
                <th className="px-4 py-3 font-semibold text-right">Engagement</th>
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--muted)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)] capitalize">
                        {post.postType || "post"}
                      </span>
                      {post.analysis?.primaryTopic && (
                        <span className="text-[11px] text-[var(--muted-foreground)] truncate max-w-[140px]">
                          {post.analysis.primaryTopic}
                        </span>
                      )}
                    </div>
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
                  <td className="px-3 py-3 text-right text-[var(--muted-foreground)] font-mono font-medium text-emerald-500">
                    {formatNumber(post.shares)}
                  </td>
                  <td className="px-3 py-3 text-right text-[var(--muted-foreground)] font-mono">
                    {formatNumber(post.saves)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[var(--foreground)] font-mono">
                    <div className="inline-flex items-center gap-1">
                      <span>{formatPercent(post.engagementRate)}</span>
                      {post.engagementRate && post.engagementRate > 0.035 && (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      )}
                    </div>
                    {post.engagementRateBasis && (
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        /{post.engagementRateBasis}
                      </div>
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
      ) : (
        /* Cards View (Section 20) */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post._id}
              className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xs hover:border-[var(--primary)]/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(post.platform)}
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      {post.accountHandle ? `@${post.accountHandle}` : post.platform}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                <Link
                  href={`/${organizationSlug}/content/${post._id}`}
                  className="font-medium text-sm text-[var(--foreground)] hover:underline line-clamp-2 mb-2 block"
                >
                  {post.title || post.caption || "Untitled post"}
                </Link>

                <p className="text-xs text-[var(--muted-foreground)] line-clamp-3 mb-3">
                  {post.caption || "No text excerpt available."}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="inline-flex items-center rounded border border-[var(--border)] bg-[var(--muted)]/50 px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)] capitalize">
                    {post.postType || "post"}
                  </span>
                  {post.analysis?.primaryTopic && (
                    <span className="inline-flex items-center rounded border border-[var(--border)] bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                      {post.analysis.primaryTopic}
                    </span>
                  )}
                  {post.analysis?.hookType && (
                    <span className="inline-flex items-center rounded border border-[var(--border)] bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                      Hook: {post.analysis.hookType}
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics strip */}
              <div className="border-t border-[var(--border)] pt-3">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Views</div>
                    <div className="font-semibold text-[var(--foreground)] font-mono">
                      {formatNumber(post.views)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Shares</div>
                    <div className="font-semibold text-emerald-500 font-mono">
                      {formatNumber(post.shares)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Comments</div>
                    <div className="font-semibold text-[var(--foreground)] font-mono">
                      {formatNumber(post.comments)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Eng. Rate</div>
                    <div className="font-semibold text-[var(--foreground)] font-mono">
                      {formatPercent(post.engagementRate)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--border)]/50">
                  <Link
                    href={`/${organizationSlug}/content/${post._id}`}
                    className="text-xs font-medium text-[var(--primary)] hover:underline flex items-center gap-1"
                  >
                    <span>View Intelligence</span>
                    <TrendingUp className="h-3 w-3" />
                  </Link>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1"
                  >
                    <span>Original</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
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
