"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
import { PlatformIcon } from "@/components/social/platform-icon";
import {
  ArrowLeft,
  Calendar,
  Layers,
  Plus,
  ExternalLink,
  Trash2,
  ShieldCheck,
  AlertCircle,
  X,
  Target,
  Award,
  Sparkles,
  FlaskConical,
  Globe,
} from "lucide-react";
import { DonorDossierModal } from "@/components/reports/donor-dossier-modal";
import { ReportViewer } from "@/components/reports/report-viewer";
import { NarrativeRippleTimeline, TimelinePost } from "@/components/campaigns/narrative-ripple-timeline";
import { HypothesisTester } from "@/components/campaigns/hypothesis-tester";
import { CampaignAutoSuggestBanner } from "@/components/campaigns/campaign-auto-suggest-banner";
import { GA4OverviewPanel } from "@/components/analytics/ga4-overview-panel";

interface CampaignDetailPageProps {
  params: Promise<{
    organizationSlug: string;
    campaignId: string;
  }>;
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { organizationSlug, campaignId } = use(params);
  const { organization } = useOrganization();

  const [isAddPostsOpen, setIsAddPostsOpen] = useState(false);
  const [isAddImpactOpen, setIsAddImpactOpen] = useState(false);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [generatedReportId, setGeneratedReportId] = useState<Id<"reports"> | null>(null);
  const [activeTab, setActiveTab] = useState<"ripple" | "content" | "web" | "hypothesis" | "impact">("ripple");
  const [postSearch, setPostSearch] = useState("");

  // Impact form state
  const [impactType, setImpactType] = useState<
    | "media_mention"
    | "institutional_mention"
    | "policy_discussion"
    | "public_response"
    | "formal_commitment"
    | "institutional_action"
    | "policy_change"
    | "other"
  >("media_mention");
  const [impactTitle, setImpactTitle] = useState("");
  const [impactSummary, setImpactSummary] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidencePublisher, setEvidencePublisher] = useState("");
  const [evidenceText, setEvidenceText] = useState("");

  const campaignData = useQuery(api.campaigns.getCampaign, {
    organizationId: organization._id,
    campaignId: campaignId as Id<"campaigns">,
  });

  const unlinkedPosts = useQuery(api.campaigns.listUnlinkedPosts, {
    organizationId: organization._id,
    campaignId: campaignId as Id<"campaigns">,
  });

  const linkPost = useMutation(api.campaigns.linkPostToCampaign);
  const unlinkPost = useMutation(api.campaigns.unlinkPostFromCampaign);
  const createImpactEvent = useMutation(api.campaigns.createCampaignImpactEvent);

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const handleLinkPost = async (postId: Id<"socialPosts">) => {
    await linkPost({
      organizationId: organization._id,
      campaignId: campaignId as Id<"campaigns">,
      postId,
      associationType: "manual",
    });
  };

  const handleUnlinkPost = async (postId: Id<"socialPosts">) => {
    if (confirm("Remove this post from the campaign?")) {
      await unlinkPost({
        organizationId: organization._id,
        campaignId: campaignId as Id<"campaigns">,
        postId,
      });
    }
  };

  const handleCreateImpact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!impactTitle.trim() || !evidenceUrl.trim()) return;

    await createImpactEvent({
      organizationId: organization._id,
      campaignId: campaignId as Id<"campaigns">,
      type: impactType,
      title: impactTitle.trim(),
      summary: impactSummary.trim() || impactTitle.trim(),
      confidence: 0.9,
      status: "verified",
      evidenceUrl: evidenceUrl.trim(),
      publisher: evidencePublisher.trim() || undefined,
      evidenceText: evidenceText.trim() || undefined,
    });

    setImpactTitle("");
    setImpactSummary("");
    setEvidenceUrl("");
    setEvidencePublisher("");
    setEvidenceText("");
    setIsAddImpactOpen(false);
  };

  if (campaignData === undefined) {
    return (
      <div className="flex h-96 items-center justify-center text-xs text-[var(--muted-foreground)]">
        Loading campaign intelligence dossier...
      </div>
    );
  }

  const {
    campaign,
    posts,
    totalViews,
    totalShares,
    totalSaves,
    totalEngagement: _totalEngagement,
    avgEngagementRate: _avgEngagementRate,
    campaignPiei,
    platformBreakdown,
    formatBreakdown,
    impactEvents,
  } = campaignData;

  const filteredUnlinked = (unlinkedPosts || []).filter((p) => {
    if (!postSearch.trim()) return true;
    const q = postSearch.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.caption && p.caption.toLowerCase().includes(q)) ||
      p.platform.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href={`/${organizationSlug}/campaigns`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Campaigns</span>
        </Link>
      </div>

      {/* Campaign Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--border)] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {campaign.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                campaign.status === "active"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : campaign.status === "planning"
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
              }`}
            >
              {campaign.status}
            </span>
          </div>
          <p className="max-w-2xl text-xs text-[var(--muted-foreground)] leading-relaxed">
            {campaign.description || "No description provided for this thematic campaign."}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
            </span>
            {campaign.objectives && campaign.objectives.length > 0 && (
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                <span>{campaign.objectives.join(", ")}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDonorModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 transition-all"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Generate Grant Dossier</span>
          </button>
          <button
            onClick={() => setIsAddPostsOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Posts</span>
          </button>
          <button
            onClick={() => setIsAddImpactOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Log Impact Evidence</span>
          </button>
        </div>
      </div>

      {/* KPI Scorecard with PIEI & Conviction (Section 36 & Pillar 1/2) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xs">
          <div className="text-[11px] font-medium text-[var(--muted-foreground)]">Total Posts</div>
          <div className="mt-1 text-2xl font-bold font-mono text-[var(--foreground)]">
            {posts.length}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
            <span>Across {Object.keys(platformBreakdown).length} platforms</span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xs">
          <div className="text-[11px] font-medium text-[var(--muted-foreground)]">Total Views</div>
          <div className="mt-1 text-2xl font-bold font-mono text-[var(--foreground)]">
            {formatNumber(totalViews)}
          </div>
          <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">
            Cross-platform reach
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xs">
          <div className="text-[11px] font-medium text-[var(--muted-foreground)]">Evidence Saves (5x)</div>
          <div className="mt-1 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {formatNumber(totalSaves)}
          </div>
          <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">
            High-conviction civic archives
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xs">
          <div className="text-[11px] font-medium text-[var(--muted-foreground)]">Peer Shares (3x)</div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-500">
            {formatNumber(totalShares)}
          </div>
          <div className="mt-1 text-[10px] text-emerald-500">
            Grassroots peer mobilization
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-medium text-[var(--muted-foreground)]">Campaign PIEI Score</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-[var(--foreground)]">
              {campaignPiei ?? "0.0"}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">
            Weighted Public Interest Index
          </div>
        </div>
      </div>

      {/* Campaign Views Navigation Bar */}
      <div className="flex border-b border-[var(--border)] gap-2 overflow-x-auto pb-0.5 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab("ripple")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === "ripple"
              ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Narrative Ripple Flow</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "ripple" ? "bg-white/20 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
            {posts.length + impactEvents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("content")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === "content"
              ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Campaign Content & Explorer</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "content" ? "bg-white/20 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
            {posts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("web")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === "web"
              ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Web Readership (GA4)</span>
        </button>

        <button
          onClick={() => setActiveTab("hypothesis")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === "hypothesis"
              ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
          }`}
        >
          <FlaskConical className="h-4 w-4" />
          <span>Empirical Hypothesis Testing</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "hypothesis" ? "bg-white/20 text-white" : "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"}`}>
            What Works
          </span>
        </button>

        <button
          onClick={() => setActiveTab("impact")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === "impact"
              ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Real-World Impact Ladder</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "impact" ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"}`}>
            {impactEvents.length} verified
          </span>
        </button>
      </div>

      {/* Smart AI Campaign Auto-Suggestions (Pillar 3) */}
      <CampaignAutoSuggestBanner campaignId={campaignId} organizationSlug={organizationSlug} />

      {/* Tab: Narrative Ripple Flow */}
      {activeTab === "ripple" && (
        <NarrativeRippleTimeline
          posts={(posts || []) as unknown as TimelinePost[]}
          impactEvents={impactEvents}
          campaignName={campaign.name}
          organizationSlug={organizationSlug}
        />
      )}

      {/* Tab: Web Readership & GA4 Social Attribution */}
      {activeTab === "web" && (
        <GA4OverviewPanel campaignId={campaignId as Id<"campaigns">} showHeader={false} />
      )}

      {/* Tab: Empirical Hypothesis Testing */}
      {activeTab === "hypothesis" && (
        <HypothesisTester campaignId={campaignId} />
      )}

      {/* Tab: Campaign Content Explorer */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Platform & Format Breakdown */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Platform Breakdown */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
            Platform Distribution
          </h2>
          {Object.keys(platformBreakdown).length === 0 ? (
            <div className="text-xs text-[var(--muted-foreground)]">No posts linked yet.</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(platformBreakdown).map(([platform, data]) => (
                <div
                  key={platform}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <PlatformIcon platform={platform} className="h-5 w-5" />
                    <div>
                      <div className="text-xs font-semibold capitalize text-[var(--foreground)]">
                        {platform}
                      </div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        {data.count} {data.count === 1 ? "post" : "posts"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-[var(--foreground)]">
                      {formatNumber(data.views)} views
                    </div>
                    <div className="text-[10px] font-mono text-emerald-500">
                      {formatNumber(data.shares)} shares
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Format Breakdown */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
            Content Formats Used
          </h2>
          {Object.keys(formatBreakdown).length === 0 ? (
            <div className="text-xs text-[var(--muted-foreground)]">No posts linked yet.</div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(formatBreakdown).map(([fmt, count]) => (
                <div
                  key={fmt}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2 text-xs"
                >
                  <Layers className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  <span className="font-medium capitalize text-[var(--foreground)]">{fmt}</span>
                  <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-mono text-[var(--muted-foreground)]">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Linked Posts Explorer (Section 36) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              Campaign Content ({posts.length})
            </h2>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Individual posts contributing to this campaign objective.
            </p>
          </div>
          <button
            onClick={() => setIsAddPostsOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Post</span>
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
            No posts associated with this campaign yet. Click &quot;Add Post&quot; to link published content.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                <tr>
                  <th className="py-3 px-4">Post</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4 text-right">Views</th>
                  <th className="py-3 px-4 text-right">Shares</th>
                  <th className="py-3 px-4 text-right">Engagement</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {posts.map((post) => (
                  <tr key={post._id} className="hover:bg-[var(--muted)]/20 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <Link
                        href={`/${organizationSlug}/content/${post._id}`}
                        className="font-medium text-[var(--foreground)] hover:text-[var(--primary)] line-clamp-1"
                      >
                        {post.title || post.caption || "Untitled Post"}
                      </Link>
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <PlatformIcon platform={post.platform || "other"} className="h-3.5 w-3.5" />
                        <span className="capitalize">{post.platform || "other"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-[10px] capitalize text-[var(--muted-foreground)]">
                        {post.postType || "post"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {formatNumber(post.views)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-500">
                      {formatNumber(post.shares)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {post.engagementRate !== undefined
                        ? `${(post.engagementRate * 100).toFixed(2)}%`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post._id && (
                          <Link
                            href={`/${organizationSlug}/content/${post._id}`}
                            className="rounded-md border border-[var(--border)] p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            title="Open Post Dossier"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        {post._id && (
                          <button
                            onClick={() => handleUnlinkPost(post._id!)}
                            className="rounded-md border border-[var(--border)] p-1 text-[var(--muted-foreground)] hover:text-red-500"
                            title="Remove from Campaign"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </div>
      )}

      {/* Tab: Real-World Impact Evidence Ladder */}
      {activeTab === "impact" && (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--foreground)]">
                Real-World Impact & Evidence Ladder
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                Rule 44 Compliant
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Documented institutional uptakes, media citations, and policy milestones linked to this campaign.
            </p>
          </div>
          <button
            onClick={() => setIsAddImpactOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Evidence</span>
          </button>
        </div>

        {/* Rule 44 Impact Causality Banner */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3 text-xs text-[var(--muted-foreground)] flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-[var(--foreground)] font-semibold">Attribution Standard:</strong> Radar never asserts sole causality without explicit legal or institutional attribution. The events below document public interest uptake, media amplification, and policy responses correlated with this campaign&apos;s communications trajectory.
          </div>
        </div>

        {impactEvents.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--muted-foreground)]">
            No real-world impact events logged yet. Log media mentions, parliamentary questions, or institutional policy shifts using &quot;Log Impact Evidence&quot;.
          </div>
        ) : (
          <div className="space-y-3">
            {impactEvents.map((ev) => (
              <div
                key={ev._id}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-500 uppercase tracking-wider">
                      {ev.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {new Date(ev.occurredAt || ev.discoveredAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Evidence
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[var(--foreground)]">{ev.title}</h3>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {ev.summary}
                </p>

                {/* Evidence items */}
                {ev.evidence && ev.evidence.length > 0 && (
                  <div className="mt-2 space-y-2 border-t border-[var(--border)] pt-2">
                    {ev.evidence.map((evi) => (
                      <div
                        key={evi._id}
                        className="rounded-md border border-[var(--border)] bg-[var(--muted)]/30 p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[var(--foreground)]">
                            {evi.publisher || evi.sourceTitle || "External Source"}
                          </span>
                          <a
                            href={evi.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[var(--primary)] hover:underline"
                          >
                            <span>View Source</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {evi.evidenceText && (
                          <p className="text-[11px] text-[var(--muted-foreground)] italic border-l-2 border-[var(--primary)] pl-2">
                            &ldquo;{evi.evidenceText}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Add Posts Modal */}
      {isAddPostsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsAddPostsOpen(false)}
              className="absolute right-4 top-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Add Posts to Campaign
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Select from published posts in your organization to associate with &quot;{campaign.name}&quot;.
              </p>
            </div>

            <input
              type="text"
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
              placeholder="Search posts by title, caption, platform..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-hidden"
            />

            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg">
              {filteredUnlinked.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--muted-foreground)]">
                  No matching unlinked posts found.
                </div>
              ) : (
                filteredUnlinked.map((post) => (
                  <div
                    key={post._id}
                    className="flex items-center justify-between p-3 hover:bg-[var(--muted)]/30"
                  >
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <PlatformIcon platform={post.platform} className="h-3 w-3" />
                        <span className="font-semibold capitalize text-[var(--foreground)]">
                          {post.platform}
                        </span>
                        <span className="text-[var(--muted-foreground)]">•</span>
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--foreground)] line-clamp-1 font-medium">
                        {post.title || post.caption || "Untitled Post"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleLinkPost(post._id)}
                      className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90 shrink-0"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsAddPostsOpen(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Impact Modal */}
      {isAddImpactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsAddImpactOpen(false)}
              className="absolute right-4 top-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Log Real-World Impact Evidence
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Attach external media coverage, parliamentary questions, or institutional policy shifts to this campaign.
              </p>
            </div>

            <form onSubmit={handleCreateImpact} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Impact Event Type
                </label>
                <select
                  value={impactType}
                  onChange={(e) => setImpactType(e.target.value as typeof impactType)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-xs text-[var(--foreground)] focus:outline-hidden"
                >
                  <option value="media_mention">Media Mention / Editorial Citation</option>
                  <option value="institutional_mention">Institutional / Agency Mention</option>
                  <option value="policy_discussion">Parliamentary / Policy Discussion</option>
                  <option value="public_response">Public Response by Officials</option>
                  <option value="formal_commitment">Formal Commitment / Investigation</option>
                  <option value="institutional_action">Institutional Regulatory Action</option>
                  <option value="policy_change">Policy / Legislative Change</option>
                  <option value="other">Other External Impact</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={impactTitle}
                  onChange={(e) => setImpactTitle(e.target.value)}
                  placeholder="e.g. National Audit Office cites campaign inquiry"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Summary & Context
                </label>
                <textarea
                  value={impactSummary}
                  onChange={(e) => setImpactSummary(e.target.value)}
                  placeholder="Briefly describe what happened and how it aligns with the campaign..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-hidden h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Publisher / Institution
                  </label>
                  <input
                    type="text"
                    value={evidencePublisher}
                    onChange={(e) => setEvidencePublisher(e.target.value)}
                    placeholder="e.g. Financial Times, European Parliament"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Evidence Source URL *
                  </label>
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Direct Evidence Excerpt / Quote
                </label>
                <textarea
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  placeholder="Quote the relevant passage verifying the mention or policy response..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-hidden h-16"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddImpactOpen(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90"
                >
                  Save Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donor Dossier Generator Modal */}
      {isDonorModalOpen && (
        <DonorDossierModal
          preselectedCampaignId={campaignId as Id<"campaigns">}
          onClose={() => setIsDonorModalOpen(false)}
          onSuccess={(newId) => {
            setGeneratedReportId(newId);
          }}
        />
      )}

      {/* Snapshot Inspector Modal */}
      {generatedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <ReportViewer
            reportId={generatedReportId}
            onClose={() => setGeneratedReportId(null)}
          />
        </div>
      )}
    </div>
  );
}
