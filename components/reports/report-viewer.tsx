"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
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
} from "lucide-react";
import { useState } from "react";

interface SnapshotContentItem {
  id: string;
  title: string;
  contentType?: string;
  provider?: string;
  publishedAt?: number;
  reach?: number;
  impressions?: number;
  shares?: number;
  saves?: number;
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

  return (
    <div className={`relative ${standalone ? "max-w-4xl mx-auto py-8" : "w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--background)] shadow-2xl p-6 sm:p-10"}`}>
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
      <article className="space-y-8 text-[var(--foreground)] print:text-black">
        {/* Document Header */}
        <header className="space-y-3 pb-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            <span>{organizationName}</span>
            <span>•</span>
            <span className="capitalize">{organizationType.replace("_", " ")}</span>
            <span>•</span>
            <span className="capitalize">{report.reportType} Report</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] print:text-black">
            {report.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)] pt-1">
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
        <div className="space-y-8">
          {blocks.map((block) => (
            <section key={block._id} className="space-y-3">
              {/* BLOCK: Executive Summary */}
              {block.type === "executive_summary" && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/20 p-6 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Executive Summary & Narrative
                  </h3>
                  <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                    {block.generatedText}
                  </p>
                </div>
              )}

              {/* BLOCK: KPI Scorecard (Frozen Snapshot) */}
              {block.type === "kpi_scorecard" && block.snapshotData && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Audience Exposure & Retention Scorecard
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-1">
                      <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                        Verified Reach
                      </span>
                      <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
                        {block.snapshotData.totalReach?.toLocaleString() ?? "—"}
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {block.snapshotData.totalImpressions?.toLocaleString()} impressions
                      </span>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-1">
                      <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                        Meaningful Actions
                      </span>
                      <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {block.snapshotData.meaningfulActions?.toLocaleString() ?? "—"}
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {block.snapshotData.totalShares?.toLocaleString()} shares, {block.snapshotData.totalSaves?.toLocaleString()} saves
                      </span>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-1">
                      <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                        Action Rate / 1k
                      </span>
                      <div className="text-2xl font-bold font-mono text-[var(--accent)]">
                        {block.snapshotData.meaningfulRate ?? "0.0"}
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        Per 1,000 views
                      </span>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-1">
                      <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                        Outputs & Outcomes
                      </span>
                      <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
                        {block.snapshotData.outputsCount ?? 0}{" "}
                        <span className="text-sm font-normal text-[var(--muted-foreground)]">
                          / {block.snapshotData.outcomesCount ?? 0}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        Outputs / Documented Outcomes
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* BLOCK: Key Content Outputs Highlights */}
              {block.type === "content_highlights" && block.snapshotData?.items && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Published Investigations & Public Outputs
                  </h3>
                  <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-b border-[var(--border)]">
                        <tr>
                          <th className="py-2.5 px-3.5 font-semibold">Title</th>
                          <th className="py-2.5 px-3 font-semibold">Format</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Reach</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Meaningful Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {block.snapshotData.items.map((item: SnapshotContentItem, i: number) => (
                          <tr key={i} className="hover:bg-[var(--muted)]/20">
                            <td className="py-3 px-3.5 font-medium text-[var(--foreground)]">
                              {item.title}
                            </td>
                            <td className="py-3 px-3 capitalize text-[var(--muted-foreground)]">
                              {item.contentType?.replace("_", " ")}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[var(--foreground)]">
                              {item.reach?.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {((item.shares ?? 0) + (item.saves ?? 0)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BLOCK: Documented Real-World Outcomes & Corroborating Evidence */}
              {block.type === "outcome" && block.snapshotData?.outcomes && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Documented Real-World Outcomes & External Citations
                    </h3>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      {block.snapshotData.outcomes.length} observed changes
                    </span>
                  </div>

                  <div className="space-y-3">
                    {block.snapshotData.outcomes.map((out: SnapshotOutcome, i: number) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--muted)] text-[var(--muted-foreground)]">
                              {out.changeType?.replace("_", " ")}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              {out.contributionStrength?.replace("_", " ")}
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
                          <h4 className="text-sm font-bold text-[var(--foreground)]">{out.title}</h4>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed">
                            {out.description}
                          </p>
                        </div>

                        {/* Contribution Rationale */}
                        <div className="rounded-lg bg-[var(--muted)]/30 p-3 text-xs italic text-[var(--foreground)] border-l-2 border-[var(--accent)]">
                          &ldquo;{out.contributionStatement}&rdquo;
                        </div>

                        {/* Evidence Items attached to this outcome */}
                        {out.evidenceItems && out.evidenceItems.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-[var(--border)]/60">
                            <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                              Corroborating Evidence Artifacts ({out.evidenceItems.length}):
                            </span>
                            <div className="space-y-1.5">
                              {out.evidenceItems.map((ev: SnapshotEvidenceItem, j: number) => (
                                <div
                                  key={j}
                                  className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 p-2.5 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                                      <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>{ev.title}</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--muted-foreground)]">
                                      {ev.publisher}
                                    </span>
                                  </div>
                                  {ev.excerpt && (
                                    <p className="text-[11px] text-[var(--muted-foreground)] italic pl-5">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Validated Communications Practices & Institutional Learning
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {block.snapshotData.practices.map((pr: SnapshotPractice, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[var(--foreground)]">{pr.title}</h4>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {pr.difference && pr.difference > 0 ? `+${pr.difference}%` : `${pr.difference ?? 0}%`}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] italic">
                          &ldquo;{pr.hypothesis}&rdquo;
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)] pt-1 border-t border-[var(--border)]/60">
                          <span className="capitalize">Target: {pr.metricKey}</span>
                          <span className="capitalize">{pr.confidenceLabel?.replace("_", " ")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOCK: Methodology & Section 2 Contribution Disclaimer */}
              {block.type === "methodology" && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 text-xs text-[var(--muted-foreground)] space-y-1.5">
                  <span className="font-semibold text-[var(--foreground)]">
                    Institutional Memory & Contribution Verification Notice:
                  </span>
                  <p className="leading-relaxed text-[11px]">{block.generatedText}</p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Document Footer */}
        <footer className="pt-8 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
          <p>
            Generated by Radar — Institutional Memory and Communications Impact Platform for Civil Society.
          </p>
          <p className="text-[10px] mt-1">
            Report ID: {report._id} • Snapshot Immutable Hash Verified
          </p>
        </footer>
      </article>
    </div>
  );
}
