"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import {
  FlaskConical,
  CheckCircle2,
  Loader2,
  Bookmark,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface HypothesisTesterProps {
  campaignId?: string;
}

const PRESET_HYPOTHESES = [
  {
    key: "hook_document_vs_question",
    label: "Document Scan Hook vs. Open Question",
    defaultMetric: "saves",
    description: "Compare save rate when leading with leaked records/document scans versus rhetorical questions.",
  },
  {
    key: "slide_bracket_depth",
    label: "In-Depth Carousels (6-10) vs. Short (3-5)",
    defaultMetric: "pieiScore",
    description: "Evaluate public-interest conviction (PIEI) between 6-10 slide deep dives and 3-5 slide summaries.",
  },
  {
    key: "cta_archive_vs_read",
    label: "Archive/Save CTA vs. Generic Read CTA",
    defaultMetric: "saves",
    description: "Test citizen evidence archiving when explicitly calling on audiences to archive records.",
  },
  {
    key: "video_depth_vs_bite",
    label: "Investigative Video (>3m) vs. Quick Bites (<30s)",
    defaultMetric: "shares",
    description: "Measure peer mobilization and share ratios between deep documentaries and short clips.",
  },
];

export function HypothesisTester({ campaignId: _campaignId }: HypothesisTesterProps) {
  const { organizationId, userRole } = useOrganization();
  const [selectedPreset, setSelectedPreset] = useState(PRESET_HYPOTHESES[0].key);
  const [selectedMetric, setSelectedMetric] = useState(PRESET_HYPOTHESES[0].defaultMetric);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const result = useQuery(api.hypotheses.runHypothesisTest, {
    organizationId,
    hypothesisKey: selectedPreset,
    targetMetric: selectedMetric,
  });

  const savePractice = useMutation(api.hypotheses.saveHypothesisAsPractice);

  const handleSelectPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const found = PRESET_HYPOTHESES.find((p) => p.key === presetKey);
    if (found) {
      setSelectedMetric(found.defaultMetric);
    }
    setSavedSuccess(false);
  };

  const handleSaveToMemory = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      let confidenceLabel: "insufficient_data" | "weak_signal" | "positive_signal" | "negative_signal" | "strong_signal" = "positive_signal";
      if (result.confidenceLabel === "high_confidence") confidenceLabel = "strong_signal";
      else if (result.confidenceLabel === "statistically_significant") confidenceLabel = "positive_signal";
      else if (result.confidenceLabel === "directional_signal") confidenceLabel = "weak_signal";
      else confidenceLabel = "insufficient_data";

      await savePractice({
        organizationId,
        title: result.title,
        hypothesis: result.description,
        metricKey: result.targetMetric,
        difference: result.liftPercent,
        matchingSampleSize: result.sampleSizeA,
        comparisonSampleSize: result.sampleSizeB,
        confidenceLabel,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save practice");
    } finally {
      setIsSaving(false);
    }
  };

  const getConfidenceBadge = (confidence: string, pct: number) => {
    switch (confidence) {
      case "high_confidence":
        return {
          label: `Statistically Significant (${pct}% Confidence)`,
          classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        };
      case "statistically_significant":
        return {
          label: `Statistically Significant (${pct}% Confidence)`,
          classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        };
      case "directional_signal":
        return {
          label: `Directional Signal (${pct}% Confidence)`,
          classes: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        };
      default:
        return {
          label: `Inconclusive / Small Sample (${pct}%)`,
          classes: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 border-slate-300 dark:border-slate-800",
        };
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 space-y-6 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs">
              <FlaskConical className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              Empirical Hypothesis Testing Workbench
            </h3>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
              Mann-Whitney U Test
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed">
            Test newsroom editorial hypotheses against historical post data to discover what actually drives citizen action and conviction.
          </p>
        </div>

        {/* Metric Selector Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">Target Metric:</span>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)] shadow-2xs cursor-pointer"
          >
            <option value="pieiScore">PIEI Score (Weighted Public Interest)</option>
            <option value="saves">Saves (Evidence Archiving)</option>
            <option value="shares">Shares (Peer Amplification)</option>
            <option value="views">Views (Total Reach)</option>
            <option value="engagementRate">Engagement Rate (%)</option>
          </select>
        </div>
      </div>

      {/* Preset Hypotheses Pills */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block">
          Select Newsroom Editorial Hypothesis:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_HYPOTHESES.map((preset) => {
            const isSelected = selectedPreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleSelectPreset(preset.key)}
                className={`text-left rounded-xl border p-3 transition-all ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--muted-foreground)]/50"
                }`}
              >
                <div className="text-xs font-bold text-[var(--foreground)] line-clamp-1">
                  {preset.label}
                </div>
                <div className="mt-1 text-[10px] text-[var(--muted-foreground)] line-clamp-2">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Test Evaluation Results Area */}
      {result === undefined ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
          <span className="text-xs text-[var(--muted-foreground)]">Running non-parametric significance test...</span>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Main Comparison Banner */}
          <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--background)] to-[var(--muted)]/20 p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border)]/60">
              <div>
                <h4 className="text-sm font-bold text-[var(--foreground)]">{result.title}</h4>
                <p className="text-xs text-[var(--muted-foreground)]">{result.description}</p>
              </div>

              {/* Confidence Badge */}
              <span
                className={`inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border ${
                  getConfidenceBadge(result.confidenceLabel, result.confidencePercentage).classes
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{getConfidenceBadge(result.confidenceLabel, result.confidencePercentage).label}</span>
              </span>
            </div>

            {/* Scorecard: Variant A vs Variant B */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* Variant A */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  Variant A: {result.variantALabel}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-[var(--foreground)]">
                    {result.meanA.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    mean {result.metricLabel}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--muted-foreground)] flex justify-between pt-1">
                  <span>Median: {result.medianA}</span>
                  <span>Sample Size: n={result.sampleSizeA} posts</span>
                </div>
              </div>

              {/* Lift Multiplier Pillar */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Performance Lift
                </span>
                <div
                  className={`text-2xl font-extrabold font-mono ${
                    result.liftPercent >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {result.liftPercent >= 0 ? `+${result.liftPercent}%` : `${result.liftPercent}%`}
                </div>
                <div className="text-[11px] font-bold text-[var(--foreground)]">
                  {result.multiplier >= 1 ? `${result.multiplier}x Higher` : `${result.multiplier}x Ratio`}
                </div>
                <span className="text-[10px] font-mono text-[var(--muted-foreground)] block">
                  p-value = {result.pValue}
                </span>
              </div>

              {/* Variant B */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Variant B: {result.variantBLabel}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-[var(--foreground)]">
                    {result.meanB.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    mean {result.metricLabel}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--muted-foreground)] flex justify-between pt-1">
                  <span>Median: {result.medianB}</span>
                  <span>Sample Size: n={result.sampleSizeB} posts</span>
                </div>
              </div>
            </div>

            {/* Editorial Recommendation Card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-[var(--foreground)]">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                <span>Empirical Newsroom Takeaway & Recommendation:</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed italic">
                &ldquo;{result.editorialRecommendation}&rdquo;
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-[var(--muted-foreground)]">
              Evaluated using Wilcoxon/Mann-Whitney non-parametric rank-sum analysis across {result.sampleSizeA + result.sampleSizeB} tagged posts.
            </span>

            {userRole !== "viewer" && (
              <button
                type="button"
                onClick={handleSaveToMemory}
                disabled={isSaving || savedSuccess}
                className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)] shadow-xs hover:opacity-95 transition-all disabled:opacity-50"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Saved to Organizational Memory!</span>
                  </>
                ) : isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Practice...</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    <span>Save to Organizational Memory</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
