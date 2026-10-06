"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Trash2,
  HelpCircle,
  BarChart3,
  Clock,
} from "lucide-react";
import { useState } from "react";

interface PracticeWithEvaluation {
  _id: Id<"practices">;
  title: string;
  description: string;
  hypothesis: string;
  metricKey: string;
  status: string;
  source: string;
  createdAt: number;
  latestEvaluation: {
    matchingSampleSize: number;
    comparisonSampleSize: number;
    matchingMetricValue: number;
    comparisonMetricValue: number;
    difference: number;
    confidenceLabel:
      | "insufficient_data"
      | "weak_signal"
      | "positive_signal"
      | "negative_signal"
      | "strong_signal";
    calculatedAt: number;
  } | null;
  evaluationCount: number;
}

interface PracticeCardProps {
  practice: PracticeWithEvaluation;
}

export function PracticeCard({ practice }: PracticeCardProps) {
  const { organizationId, userRole } = useOrganization();
  const [isEvaluating, setIsEvaluating] = useState(false);

  const evaluatePractice = useMutation(api.practices.evaluatePractice);
  const deletePractice = useMutation(api.practices.deletePractice);

  const canEdit = userRole === "owner" || userRole === "admin" || userRole === "analyst";

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      await evaluatePractice({
        organizationId,
        practiceId: practice._id,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to evaluate practice");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the practice "${practice.title}"?`)) return;
    try {
      await deletePractice({
        organizationId,
        practiceId: practice._id,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete practice");
    }
  };

  const getSignalBadge = (confidenceLabel?: string) => {
    switch (confidenceLabel) {
      case "strong_signal":
        return {
          label: "Strong Positive Signal",
          classes:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
          icon: <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
        };
      case "positive_signal":
        return {
          label: "Positive Signal",
          classes:
            "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300 dark:border-teal-800",
          icon: <TrendingUp className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />,
        };
      case "negative_signal":
        return {
          label: "Negative Signal",
          classes:
            "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800",
          icon: <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />,
        };
      case "weak_signal":
        return {
          label: "Weak / Ambiguous Signal",
          classes:
            "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800",
          icon: <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
        };
      default:
        return {
          label: "Insufficient Data",
          classes:
            "bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-300 border-slate-300 dark:border-slate-800",
          icon: <BarChart3 className="h-3.5 w-3.5 text-slate-500" />,
        };
    }
  };

  const evalData = practice.latestEvaluation;
  const signal = getSignalBadge(evalData?.confidenceLabel);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-4 shadow-2xs hover:border-[var(--accent)] transition-colors flex flex-col justify-between">
      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                practice.status === "validated"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : practice.status === "under_test"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              }`}
            >
              {practice.status.replace("_", " ")}
            </span>

            <span className="text-[11px] text-[var(--muted-foreground)] capitalize">
              Target: <span className="font-semibold text-[var(--foreground)]">{practice.metricKey}</span>
            </span>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-rose-600 transition-colors"
              title="Delete practice"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">{practice.title}</h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed">
            {practice.description}
          </p>
        </div>

        {/* Stated Hypothesis Callout */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1">
            <HelpCircle className="h-3 w-3 text-[var(--accent)]" />
            <span>Tested Hypothesis</span>
          </span>
          <p className="text-xs text-[var(--foreground)] italic leading-relaxed">
            &ldquo;{practice.hypothesis}&rdquo;
          </p>
        </div>
      </div>

      {/* Empirical Evaluation Results Box */}
      <div className="space-y-3 pt-3 border-t border-[var(--border)]">
        {evalData ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${signal.classes}`}
              >
                {signal.icon}
                <span>{signal.label}</span>
              </span>

              <span
                className={`text-sm font-bold ${
                  evalData.difference > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : evalData.difference < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                {evalData.difference > 0 ? `+${evalData.difference}%` : `${evalData.difference}%`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--muted-foreground)] pt-1 border-t border-[var(--border)]/60">
              <div>
                <span className="block font-medium text-[var(--foreground)]">
                  {evalData.matchingSampleSize} outputs
                </span>
                <span>Using this practice</span>
              </div>
              <div>
                <span className="block font-medium text-[var(--foreground)]">
                  {evalData.comparisonSampleSize} outputs
                </span>
                <span>Comparison baseline</span>
              </div>
            </div>

            <div className="text-[10px] text-[var(--muted-foreground)] flex items-center justify-between pt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Evaluated {new Date(evalData.calculatedAt).toLocaleDateString()}</span>
              </span>
              <span className="capitalize text-[10px]">Source: {practice.source.replace("_", " ")}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-3 text-center space-y-1 text-xs text-[var(--muted-foreground)]">
            <p>No empirical evaluation calculated yet.</p>
            <p className="text-[11px]">Run an evaluation against organization outputs to test this hypothesis.</p>
          </div>
        )}

        {/* Evaluation Trigger Button */}
        {canEdit && (
          <button
            type="button"
            disabled={isEvaluating}
            onClick={handleEvaluate}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] text-xs font-semibold text-[var(--foreground)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
            <span>{isEvaluating ? "Evaluating Output Signal..." : "Re-evaluate Against Content"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
