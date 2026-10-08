"use client";

import { useOrganization } from "@/components/organization-context";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  FileText,
  Plus,
  Shield,
  Loader2,
  Calendar,
  Layers,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Award,
} from "lucide-react";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { ReportGeneratorModal } from "@/components/reports/report-generator-modal";
import { DonorDossierModal } from "@/components/reports/donor-dossier-modal";
import { ReportViewer } from "@/components/reports/report-viewer";

export default function ReportsPage() {
  const { organizationId, organizationSlug, userRole } = useOrganization();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<Id<"reports"> | null>(null);

  const reports = useQuery(api.reports.listReports, {
    organizationId,
    reportType: activeTab === "all" ? undefined : activeTab,
  });

  const canCreate = userRole !== "viewer";
  const hasReports = reports && reports.length > 0;

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "board":
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case "donor":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "campaign":
        return <Layers className="h-4 w-4 text-amber-500" />;
      case "editorial":
        return <GraduationCap className="h-4 w-4 text-emerald-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-gray-500" />;
    }
  };

  const getReportBadge = (type: string) => {
    switch (type) {
      case "board":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800";
      case "donor":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800";
      case "campaign":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800";
      case "editorial":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 border-slate-300 dark:border-slate-800";
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Reports & Tamper-Proof Snapshots
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Synthesize verified communications data, outcomes, and evidence into reproducible, shareable reports.
          </p>
        </div>

        {canCreate && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDonorModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all"
            >
              <Award className="h-4 w-4" />
              <span>Generate Grant Impact Dossier</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              <span>Standard Report</span>
            </button>
          </div>
        )}
      </div>

      {/* Snapshot Reproducibility Banner (Section 39) */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-start gap-3">
          <Shield className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[var(--foreground)]">
              Tamper-Proof Snapshot Guarantee (Section 39):
            </span>
            <p className="leading-relaxed">
              Radar reports freeze exact data queries and metric snapshots from the moment of generation.
              New data, edits to social channels, or refreshed metrics never silently mutate published reports
              sent to boards, donors, or the public.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs by Archetype */}
      <div className="flex border-b border-[var(--border)] gap-6 text-xs sm:text-sm font-medium overflow-x-auto pb-0.5">
        {(
          [
            { id: "all", label: "All Reports" },
            { id: "board", label: "Board Briefings" },
            { id: "donor", label: "Donor Narratives" },
            { id: "campaign", label: "Initiative Retrospectives" },
            { id: "editorial", label: "Editorial Learning" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[var(--primary)] text-[var(--foreground)] font-bold"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      {reports === undefined ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : hasReports ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((report) => (
            <div
              key={report._id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 space-y-4 hover:border-[var(--accent)] transition-all shadow-2xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${getReportBadge(
                      report.reportType
                    )}`}
                  >
                    {getReportTypeIcon(report.reportType)}
                    <span>{report.reportType} Report</span>
                  </span>

                  <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-[var(--foreground)] tracking-tight">
                    {report.title}
                  </h3>
                  {report.description && (
                    <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2">
                      {report.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs">
                <div className="text-[var(--muted-foreground)] text-[11px]">
                  <span>By {report.authorName}</span>
                  <span className="mx-1.5">•</span>
                  <span>{report.blockCount} frozen blocks</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedReportId(report._id)}
                    className="font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <span>View Snapshot</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <Link
                    href={`/${organizationSlug}/reports/${report._id}`}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
                    title="Open Permalink Document"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
            <FileText className="h-7 w-7 text-[var(--accent)]" />
          </div>
          <h3 className="text-base font-bold text-[var(--foreground)]">No reports published in this view</h3>
          <p className="max-w-md mx-auto text-xs text-[var(--muted-foreground)] leading-relaxed">
            Generate reports that combine verified communications data, observed outcomes, and corroborating evidence
            into a tamper-proof narrative for boards, funders, and partners.
          </p>

          {canCreate && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                <span>Generate First Report</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Snapshot Inspector Modal */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <ReportViewer
            reportId={selectedReportId}
            onClose={() => setSelectedReportId(null)}
          />
        </div>
      )}

      {/* Generator Wizard Modal */}
      {showGenerateModal && (
        <ReportGeneratorModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={(newId) => {
            setSelectedReportId(newId);
          }}
        />
      )}

      {/* Donor Dossier Generator Modal */}
      {showDonorModal && (
        <DonorDossierModal
          onClose={() => setShowDonorModal(false)}
          onSuccess={(newId) => {
            setSelectedReportId(newId);
          }}
        />
      )}
    </div>
  );
}
