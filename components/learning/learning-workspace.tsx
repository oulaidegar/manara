"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import {
  Sparkles,
  Plus,
  Loader2,
  CheckCircle2,
  FlaskConical,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { PracticeCard } from "./practice-card";
import { CreatePracticeModal } from "./create-practice-modal";

export function LearningWorkspace() {
  const { organizationId, userRole } = useOrganization();
  const [activeTab, setActiveTab] = useState<"all" | "validated" | "under_test" | "draft">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const practices = useQuery(api.practices.listPractices, {
    organizationId,
    status: activeTab === "all" ? undefined : activeTab,
  });

  const canCreate = userRole !== "viewer";

  // Summary counts
  const totalCount = practices?.length ?? 0;
  const validatedCount = practices?.filter((p) => p.status === "validated").length ?? 0;
  const underTestCount = practices?.filter((p) => p.status === "under_test").length ?? 0;
  const positiveSignalsCount =
    practices?.filter(
      (p) =>
        p.latestEvaluation?.confidenceLabel === "strong_signal" ||
        p.latestEvaluation?.confidenceLabel === "positive_signal"
    ).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)]/15 text-[var(--accent)]">
              Institutional Memory
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">Section 15 & Section 33</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)] mt-1">
            Communications Practices & Learning Engine
          </h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
            Radar tests editorial hypotheses against historical performance data to identify which communications
            practices reliably drive civic dissemination, audience attention, and meaningful actions.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition-opacity shadow-2xs shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Formulate Hypothesis</span>
          </button>
        )}
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-[var(--muted-foreground)]">Total Hypotheses</span>
          <div className="text-xl font-bold text-[var(--foreground)]">{totalCount}</div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-[var(--muted-foreground)]">Validated Practices</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>{validatedCount}</span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-[var(--muted-foreground)]">Currently Under Test</span>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <FlaskConical className="h-4 w-4" />
            <span>{underTestCount}</span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-[var(--muted-foreground)]">Positive Empirical Signals</span>
          <div className="text-xl font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>{positiveSignalsCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[var(--border)] gap-6 text-xs font-medium">
        {(
          [
            { id: "all", label: "All Practices" },
            { id: "validated", label: "Validated" },
            { id: "under_test", label: "Under Test" },
            { id: "draft", label: "Drafts" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[var(--primary)] text-[var(--foreground)] font-bold"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Practices Grid */}
      {practices === undefined ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : practices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {practices.map((practice) => (
            <PracticeCard key={practice._id} practice={practice} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center space-y-3">
          <Sparkles className="h-8 w-8 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-[var(--foreground)]">No practices in this view</h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
            Define editorial rules, storytelling formats, or dissemination techniques to test against your content library.
          </p>

          {canCreate && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-2 rounded-lg bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90"
              >
                Formulate First Practice Hypothesis
              </button>
            </div>
          )}
        </div>
      )}

      {showCreateModal && <CreatePracticeModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
