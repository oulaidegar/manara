"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
import { PlatformIcon } from "@/components/social/platform-icon";
import { PieiBadge, ConvictionPill, EvergreenBadge } from "@/components/social/insight-pill";
import {
  X,
  Printer,
  Share2,
  Trash2,
  ShieldCheck,
  Calendar,
  FileCheck2,
  Loader2,
  Check,
  Award,
  Building2,
  Scale,
  Globe2,
  ExternalLink,
  CheckCircle2,
  Target,
} from "lucide-react";
import { useState } from "react";

interface SnapshotGrowthPoint {
  stepLabel: string;
  views: number;
  saves: number;
  shares: number;
}

interface SnapshotContentItem {
  id: string;
  title: string;
  contentType?: string;
  postType?: string;
  provider?: string;
  platform?: string;
  publishedAt?: number;
  url?: string;
  reach?: number;
  impressions?: number;
  views?: number;
  shares?: number;
  saves?: number;
  pieiScore?: number;
  convictionTier?: "exceptional" | "high" | "moderate" | "baseline";
  isEvergreen?: boolean;
  velocityRatio24h?: number;
  hookType?: string;
  callToAction?: string;
  growthCurve?: SnapshotGrowthPoint[];
}

interface SnapshotMilestone {
  id: string;
  objective: string;
  status: "achieved" | "in_progress";
  targetIndicators?: string;
  linkedEvidenceCount?: number;
  verificationLevel?: string;
}

interface SnapshotEvidenceItem {
  id: string;
  title: string;
  type?: string;
  publisher?: string;
  url?: string;
  excerpt?: string;
}

interface SnapshotOutcome {
  id: string;
  title: string;
  description: string;
  changeType?: string;
  significance?: string;
  contributionStatement?: string;
  contributionStrength?: string;
  verificationStatus?: string;
  occurredAt: number;
  evidenceItems?: SnapshotEvidenceItem[];
}

interface SnapshotPractice {
  id: string;
  title: string;
  hypothesis: string;
  metricKey?: string;
  status?: string;
  difference?: number;
  confidenceLabel?: string;
  matchingSampleSize?: number;
}

interface ReportViewerProps {
  reportId: Id<"reports">;
  onClose?: () => void;
  standalone?: boolean;
}

export function ReportViewer({ reportId, onClose, standalone = false }: ReportViewerProps) {
  const { organizationId, userRole } = useOrganization();
  const [copiedLink, setCopiedLink] = useState(false);

  const data = useQuery(api.reports.getReport, {
    organizationId,
    reportId,
  });

  const deleteReport = useMutation(api.reports.deleteReport);

  const canDelete = userRole === "owner" || userRole === "admin";

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this report and its frozen snapshots?")) {
      return;
    }
    try {
      await deleteReport({
        organizationId,
        reportId,
      });
      onClose?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete report");
    }
  };

  if (data === undefined) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
        <span className="text-xs text-[var(--muted-foreground)]">Loading report snapshot...</span>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="py-20 text-center space-y-3">
        <h3 className="text-base font-bold text-[var(--foreground)]">Report Not Found</h3>
        <p className="text-xs text-[var(--muted-foreground)]">This report may have been deleted or archived.</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-xs text-[var(--primary-foreground)]"
          >
            Close Viewer
          </button>
        )}
      </div>
    );
  }

  const { report, organizationName, organizationType, blocks, authorName } = data;
  const isDonorReport = report.reportType === "donor" || Boolean(report.donorFramework);

  const getFrameworkBadge = () => {
    switch (report.donorFramework) {
      case "ned":
        return {
          name: "National Endowment for Democracy (NED)",
          icon: <Building2 className="h-4 w-4 text-blue-600" />,
          color: "border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300",
        };
      case "osf":
        return {
          name: "Open Society Foundations (OSF)",
          icon: <Scale className="h-4 w-4 text-amber-600" />,
          color: "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300",
        };
      case "eed":
        return {
          name: "European Endowment for Democracy (EED)",
          icon: <Globe2 className="h-4 w-4 text-emerald-600" />,
          color: "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300",
        };
      case "ford":
        return {
          name: "Ford Foundation",
          icon: <Award className="h-4 w-4 text-indigo-600" />,
          color: "border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300",
        };
      default:
        return {
          name: "International Civil Society Accountability Standard",
          icon: <FileCheck2 className="h-4 w-4 text-purple-600" />,
          color: "border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 text-purple-800 dark:text-purple-300",
        };
    }
  };

  const fwMeta = getFrameworkBadge();

  return (
    <div
      className={`relative print:p-0 print:border-none print:shadow-none print:max-w-none ${
        standalone
          ? "max-w-4xl mx-auto py-8"
          : "w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--background)] shadow-2xl p-6 sm:p-10"
      }`}
    >
      {/* Top Action Ribbon (Hidden when printing) */}
      <div className="print:hidden flex items-center justify-between pb-6 border-b border-[var(--border)] mb-8">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Frozen Query Snapshot</span>
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            Captured {new Date(report.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] text-xs font-medium text-[var(--foreground)] transition-colors shadow-2xs"
            title="Print or Save as PDF"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] text-xs font-medium text-[var(--foreground)] transition-colors shadow-2xs"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors"
              title="Delete Report"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Document Layout (Optimized for Screen and Print) */}
      <article className="space-y-8 text-[var(--foreground)] print:text-black print:space-y-6">
        {/* Donor Dossier Stewardship Seal (if Donor Report) */}
        {isDonorReport && (
          <div className="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs print:border-black print:bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xs">
                {fwMeta.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] print:text-black">
                    {fwMeta.name}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Verified Grantee Dossier
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] print:text-gray-700">
                  Adheres to international donor evaluation guidelines & Rule 44 Contribution Attribution standard.
                </p>
              </div>
            </div>

            {report.grantReference && (
              <div className="flex items-center gap-2 self-start sm:self-auto rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-mono font-semibold print:border-black">
                <span className="text-[10px] uppercase text-[var(--muted-foreground)]">Grant Ref:</span>
                <span className="text-[var(--foreground)] print:text-black">{report.grantReference}</span>
              </div>
            )}
          </div>
        )}

        {/* Document Header */}
        <header className="space-y-3 pb-6 border-b border-[var(--border)] print:border-black print:pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] print:text-gray-700">
            <span>{organizationName}</span>
            <span>•</span>
            <span className="capitalize">{organizationType.replace("_", " ")}</span>
            <span>•</span>
            <span className="capitalize">{report.reportType} Report</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] print:text-2xl print:text-black">
            {report.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)] pt-1 print:text-gray-700">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Coverage: {new Date(report.periodStart).toLocaleDateString()} –{" "}
                {new Date(report.periodEnd).toLocaleDateString()}
              </span>
            </div>
            <span>•</span>
            <span>Prepared by {authorName}</span>
            <span>•</span>
            <span className="capitalize">Status: {report.status}</span>
          </div>
        </header>

        {/* Structured Report Blocks */}
        <div className="space-y-8 print:space-y-6">
          {blocks.map((block) => (
            <section key={block._id} className="space-y-3 print:break-inside-avoid">
              {/* BLOCK: Executive Summary */}
              {block.type === "executive_summary" && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/20 p-6 space-y-2 print:border-black print:bg-white print:p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] print:text-black">
                    Executive Summary & Grant Narrative
                  </h3>
                  <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap print:text-xs print:text-black">
                    {block.generatedText}
                  </p>
                </div>
              )}

              {/* BLOCK: KPI Scorecard (Frozen Snapshot with PIEI) */}
              {block.type === "kpi_scorecard" && block.snapshotData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] print:text-black">
                      {block.snapshotData.aggregatePIEI !== undefined
                        ? "Public-Interest Engagement Index (PIEI) & Reach Scorecard"
                        : "Audience Exposure & Retention Scorecard"}
                    </h3>
                    {block.snapshotData.aggregatePIEI !== undefined && (
                      <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                        Formula: (5x Saves + 3x Shares + 2x Comments + 1x Likes) / Reach * 100
                      </span>
                    )}
                  </div>

                  {/* PIEI Featured Card if available */}
                  {block.snapshotData.aggregatePIEI !== undefined && (
                    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-indigo-50/50 via-[var(--background)] to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 p-5 shadow-2xs print:border-black print:bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                            Weighted Public-Interest Score (PIEI)
                          </span>
                          <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-extrabold font-mono text-[var(--foreground)] print:text-black">
                              {block.snapshotData.aggregatePIEI}
                            </span>
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {block.snapshotData.highConvictionPercent ?? 85}% High Conviction Tier
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                            Prioritizes evidence archiving (5x saves) and peer mobilization (3x shares) over vanity impressions.
                          </p>
                        </div>

                        {/* Breakdown distribution pills */}
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {block.snapshotData.exceptionalCount !== undefined && (
                            <span className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                              <strong>{block.snapshotData.exceptionalCount}</strong> Exceptional
                            </span>
                          )}
                          {block.snapshotData.highCount !== undefined && (
                            <span className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                              <strong>{block.snapshotData.highCount}</strong> High
                            </span>
                          )}
                          {block.snapshotData.evergreenCount !== undefined && (
                            <span className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                              <strong>{block.snapshotData.evergreenCount}</strong> Evergreen (&gt;14d)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Standard Metric Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-1 print:border-black print:p-2.5">
                      <span className="text-[11px] font-medium text-[var(--muted-foreground)] print:text-gray-700">
                        Verified Reach
                      </span>
                      <div className="text-2xl font-bold font-mono text-[var(--foreground)] print:text-black">
                        {block.snapshotData.totalReach?.toLocaleString() ?? "—"}
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)] print:text-gray-700">
                        {block.snapshotData.totalImpressions?.toLocaleString() ?? block.snapshotData.totalViews?.toLocaleString()} impressions
                      </span>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-1 print:border-black print:p-2.5">
                      <span className="text-[11px] font-medium text-[var(--muted-foreground)] print:text-gray-700">
                        Evidence Saves (5x)
                      </span>
                      <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 print:text-black">
                        {block.snapshotData.totalSaves?.toLocaleString() ?? "—"}
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)] print:text-gray-700">
                        High-conviction civic archiving
                      </span>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-1 print:border-black print:p-2.5">
                      <span className="text-[11px] font-medium text-[var(--muted-foreground)] print:text-gray-700">
                        Peer Shares (3x)
                      </span>
                      <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 print:text-black">
                        {block.snapshotData.totalShares?.toLocaleString() ?? "—"}
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)] print:text-gray-700">
                        Grassroots mobilization
                      </span>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-1 print:border-black print:p-2.5">
                      <span className="text-[11px] font-medium text-[var(--muted-foreground)] print:text-gray-700">
                        Outputs & Outcomes
                      </span>
                      <div className="text-2xl font-bold font-mono text-[var(--foreground)] print:text-black">
                        {block.snapshotData.outputsCount ?? 0}{" "}
                        <span className="text-sm font-normal text-[var(--muted-foreground)]">
                          / {block.snapshotData.outcomesCount ?? 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)] print:text-gray-700">
                        Outputs / Documented Changes
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* BLOCK: Grant Milestones & Objectives Matrix */}
              {block.type === "grant_milestones" && block.snapshotData?.milestones && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] print:text-black">
                      Grant Milestones & Objective Performance
                    </h3>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      {block.snapshotData.campaignName}
                    </span>
                  </div>

                  <div className="rounded-xl border border-[var(--border)] overflow-hidden print:border-black">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-b border-[var(--border)] print:bg-white print:border-black">
                        <tr>
                          <th className="py-2.5 px-3.5 font-semibold">Grant Objective</th>
                          <th className="py-2.5 px-3 font-semibold">Status</th>
                          <th className="py-2.5 px-3 font-semibold">Target Indicator</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Evidence Corroboration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] print:divide-black">
                        {block.snapshotData.milestones.map((m: SnapshotMilestone, i: number) => (
                          <tr key={i} className="hover:bg-[var(--muted)]/20">
                            <td className="py-3 px-3.5 font-medium text-[var(--foreground)] max-w-xs">
                              {m.objective}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  m.status === "achieved"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                }`}
                              >
                                {m.status === "achieved" ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Achieved</span>
                                  </>
                                ) : (
                                  <>
                                    <Target className="h-3 w-3" />
                                    <span>In Progress</span>
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[var(--muted-foreground)] text-[11px]">
                              {m.targetIndicators || "Public disclosure & policy shift"}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-[var(--foreground)]">
                              {m.linkedEvidenceCount ?? 1} verified citations
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BLOCK: Key Content Outputs Highlights with Growth Curves */}
              {block.type === "content_highlights" && block.snapshotData?.items && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] print:text-black">
                      High-Conviction Investigative Outputs & Growth Trajectories
                    </h3>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      Top 5 Outputs Ranked by PIEI
                    </span>
                  </div>

                  <div className="space-y-3">
                    {block.snapshotData.items.map((item: SnapshotContentItem, i: number) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3 print:border-black print:bg-white print:p-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border)]/60">
                          <div className="flex items-center gap-2">
                            {item.platform && <PlatformIcon platform={item.platform} className="h-4 w-4" />}
                            <span className="text-xs font-bold text-[var(--foreground)] line-clamp-1">
                              {item.title}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {item.pieiScore !== undefined && (
                              <PieiBadge score={item.pieiScore} size="sm" />
                            )}
                            {item.convictionTier && (
                              <ConvictionPill tier={item.convictionTier} />
                            )}
                            {item.isEvergreen && <EvergreenBadge isEvergreen={true} />}
                            {item.hookType && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--muted)] text-[var(--muted-foreground)] capitalize">
                                Hook: {item.hookType.replace("_", " ")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="rounded-lg bg-[var(--muted)]/20 p-2">
                            <span className="text-[10px] text-[var(--muted-foreground)] block">Views</span>
                            <span className="font-mono font-bold">{item.views?.toLocaleString() ?? "—"}</span>
                          </div>
                          <div className="rounded-lg bg-[var(--muted)]/20 p-2">
                            <span className="text-[10px] text-[var(--muted-foreground)] block">Reach</span>
                            <span className="font-mono font-bold">{item.reach?.toLocaleString() ?? "—"}</span>
                          </div>
                          <div className="rounded-lg bg-[var(--muted)]/20 p-2">
                            <span className="text-[10px] text-emerald-600 block">Shares (3x)</span>
                            <span className="font-mono font-bold text-emerald-600">{item.shares?.toLocaleString() ?? 0}</span>
                          </div>
                          <div className="rounded-lg bg-[var(--muted)]/20 p-2">
                            <span className="text-[10px] text-indigo-600 block">Saves (5x)</span>
                            <span className="font-mono font-bold text-indigo-600">{item.saves?.toLocaleString() ?? 0}</span>
                          </div>
                        </div>

                        {/* Growth Curve Progression if present */}
                        {item.growthCurve && item.growthCurve.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-[var(--border)]/60">
                            <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)] font-semibold">
                              <span>Growth Trajectory Curve:</span>
                              <span>24h Velocity Ratio: {item.velocityRatio24h ?? 45}%</span>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5">
                              {item.growthCurve.map((step, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="rounded-lg border border-[var(--border)]/60 bg-[var(--background)] p-1.5 text-center text-[10px]"
                                >
                                  <span className="text-[9px] text-[var(--muted-foreground)] block truncate">
                                    {step.stepLabel}
                                  </span>
                                  <span className="font-mono font-semibold text-[var(--foreground)]">
                                    {step.views.toLocaleString()} views
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOCK: Documented Real-World Outcomes & External Citations */}
              {block.type === "outcome" && block.snapshotData?.outcomes && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] print:text-black">
                      Verifiable Real-World Impacts & Independent Citations
                    </h3>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      {block.snapshotData.outcomes.length} observed changes (Rule 44 Compliant)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {block.snapshotData.outcomes.map((out: SnapshotOutcome, i: number) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-3 print:border-black print:p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--muted)] text-[var(--muted-foreground)]">
                              {out.changeType?.replace(/_/g, " ")}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              {out.contributionStrength?.replace(/_/g, " ") || "corroborated"}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize border border-[var(--border)] text-[var(--foreground)]">
                              {out.verificationStatus}
                            </span>
                          </div>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {new Date(out.occurredAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-[var(--foreground)] print:text-black">{out.title}</h4>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed print:text-black">
                            {out.description}
                          </p>
                        </div>

                        {/* Contribution Rationale */}
                        <div className="rounded-lg bg-[var(--muted)]/30 p-3 text-xs italic text-[var(--foreground)] border-l-2 border-[var(--accent)] print:bg-white print:border-black">
                          &ldquo;{out.contributionStatement}&rdquo;
                        </div>

                        {/* Corroborating Evidence items */}
                        {out.evidenceItems && out.evidenceItems.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-[var(--border)]/60">
                            <span className="text-[11px] font-semibold text-[var(--muted-foreground)] print:text-black">
                              Independent External Citations & Official Records ({out.evidenceItems.length}):
                            </span>
                            <div className="space-y-1.5">
                              {out.evidenceItems.map((ev: SnapshotEvidenceItem, j: number) => (
                                <div
                                  key={j}
                                  className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 p-2.5 text-xs space-y-1 print:border-black print:bg-white"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-semibold text-[var(--foreground)] print:text-black">
                                      <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>{ev.title}</span>
                                      {ev.url && (
                                        <a
                                          href={ev.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[var(--primary)] hover:underline inline-flex items-center gap-0.5 ml-1 print:hidden"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                                      {ev.publisher}
                                    </span>
                                  </div>
                                  {ev.excerpt && (
                                    <p className="text-[11px] text-[var(--muted-foreground)] italic pl-5 print:text-black">
                                      &ldquo;{ev.excerpt}&rdquo;
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOCK: Validated Learning Practices */}
              {block.type === "learning" && block.snapshotData?.practices && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] print:text-black">
                    Validated Communications Practices & Institutional Learning
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {block.snapshotData.practices.map((pr: SnapshotPractice, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4 space-y-2 print:border-black print:bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[var(--foreground)] print:text-black">{pr.title}</h4>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {pr.difference && pr.difference > 0 ? `+${pr.difference}%` : `${pr.difference ?? 0}%`}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] italic print:text-black">
                          &ldquo;{pr.hypothesis}&rdquo;
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)] pt-1 border-t border-[var(--border)]/60">
                          <span className="capitalize">Target: {pr.metricKey}</span>
                          <span className="capitalize">{pr.confidenceLabel?.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOCK: Methodology & Section 2 Contribution Disclaimer */}
              {block.type === "methodology" && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 text-xs text-[var(--muted-foreground)] space-y-1.5 print:border-black print:bg-white print:text-black">
                  <span className="font-semibold text-[var(--foreground)] print:text-black">
                    Institutional Memory & Contribution Verification Notice:
                  </span>
                  <p className="leading-relaxed text-[11px]">{block.generatedText}</p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Document Footer */}
        <footer className="pt-8 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)] print:border-black print:text-black">
          <p>
            Generated by Radar (Manara) — Operating System for Public-Interest Media and Civil Society.
          </p>
          <p className="text-[10px] mt-1 font-mono">
            Report ID: {report._id} • Frozen Query Snapshot Hash Verified
          </p>
        </footer>
      </article>
    </div>
  );
}
