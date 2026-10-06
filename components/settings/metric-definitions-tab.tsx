"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Plus,
  Trash2,
  Calculator,
  X,
  Loader2,
} from "lucide-react";

interface MetricDefinitionsTabProps {
  organizationId: Id<"organizations">;
  isAdmin: boolean;
}

type MetricCategory = "all" | "reach" | "engagement" | "action" | "audience" | "derived";

export function MetricDefinitionsTab({
  organizationId,
  isAdmin,
}: MetricDefinitionsTabProps) {
  const metrics = useQuery(api.metrics.listMetricDefinitions, { organizationId });
  const createMetric = useMutation(api.metrics.createCustomMetric);
  const deleteMetric = useMutation(api.metrics.deleteCustomMetric);

  const [selectedCategory, setSelectedCategory] = useState<MetricCategory>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Metric Form State
  const [displayName, setDisplayName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("count");
  const [category, setCategory] = useState<"reach" | "engagement" | "action" | "audience" | "derived">("derived");
  const [scope, setScope] = useState<"content" | "account" | "cross_channel">("content");
  const [aggregation, setAggregation] = useState<"sum" | "average" | "latest" | "derived_ratio">("derived_ratio");
  const [formula, setFormula] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);
    try {
      await createMetric({
        organizationId,
        displayName: displayName.trim(),
        key: key.trim().toLowerCase(),
        description: description.trim(),
        unit,
        scope,
        category,
        aggregationBehavior: aggregation,
        higherIsBetter: true,
        formula: formula.trim() || undefined,
      });
      setIsAddOpen(false);
      setDisplayName("");
      setKey("");
      setDescription("");
      setFormula("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create metric definition");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (metricId: Id<"metricDefinitions">) => {
    if (!confirm("Are you sure you want to delete this custom metric?")) return;
    try {
      await deleteMetric({ organizationId, metricId });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete metric");
    }
  };

  const filteredMetrics = metrics?.filter((m) => {
    if (selectedCategory === "all") return true;
    return m.category === selectedCategory;
  });

  return (
    <div className="max-w-5xl space-y-6">
      {/* Architecture Disclaimer */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4 text-xs text-[var(--muted-foreground)]">
        <span className="font-semibold text-[var(--foreground)]">Transparent Formulas (Section 16 & 26):</span>{" "}
        Radar does not disguise social metrics or fabricate black-box vanity composite scores. Every metric definition,
        formula, and aggregation behavior is strictly inspectable and normalized across platforms.
      </div>

      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {(["all", "reach", "engagement", "action", "derived"] as MetricCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 font-medium capitalize transition-colors ${
                selectedCategory === cat
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)]/40 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {cat === "all" ? "All Metrics" : cat}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Custom Metric</span>
          </button>
        )}
      </div>

      {/* Metrics List */}
      {metrics === undefined ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMetrics?.map((m) => {
            const isSystem = m.isSystem;
            return (
              <div
                key={m.key}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-3 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-[var(--foreground)]">
                        {m.displayName}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--accent)] mt-0.5">
                        {m.key}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-[10px] font-mono text-[var(--muted-foreground)] capitalize">
                        {m.category}
                      </span>
                      {isSystem ? (
                        <span className="rounded-md bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                          System
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--muted-foreground)] mt-2 leading-relaxed">
                    {m.description}
                  </p>

                  {m.formula && (
                    <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-2.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-[11px] text-[var(--foreground)]">
                        <Calculator className="h-3 w-3 text-[var(--accent)]" />
                        <span>Calculation Formula</span>
                      </div>
                      <div className="font-mono text-[11px] text-[var(--foreground)] bg-[var(--background)] px-2 py-1 rounded border border-[var(--border)]">
                        {m.formula}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-3">
                    <span>
                      Unit: <strong className="font-mono text-[var(--foreground)]">{m.unit}</strong>
                    </span>
                    <span>
                      Aggregation:{" "}
                      <strong className="font-mono text-[var(--foreground)] capitalize">
                        {m.aggregationBehavior}
                      </strong>
                    </span>
                  </div>

                  {!isSystem && isAdmin && typeof m._id !== "string" && (
                    <button
                      onClick={() => handleDelete(m._id as Id<"metricDefinitions">)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete custom metric"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Metric Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Plus className="h-4 w-4 text-[var(--accent)]" />
                <span>Define Organization Metric (Section 16)</span>
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--foreground)] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (!key) {
                        setKey(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
                      }
                    }}
                    placeholder="e.g. Advocacy Citation Index"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--foreground)] mb-1">
                    Metric Key (Identifier)
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g. citation_index"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  Description / Editorial Meaning
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why this metric matters to your civil society mission..."
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-[var(--foreground)] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value as
                          | "reach"
                          | "engagement"
                          | "action"
                          | "audience"
                          | "derived"
                      )
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 text-xs"
                  >
                    <option value="derived">Derived / Rate</option>
                    <option value="action">Action</option>
                    <option value="engagement">Engagement</option>
                    <option value="reach">Reach</option>
                    <option value="audience">Audience</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--foreground)] mb-1">
                    Scope
                  </label>
                  <select
                    value={scope}
                    onChange={(e) =>
                      setScope(
                        e.target.value as "content" | "account" | "cross_channel"
                      )
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 text-xs"
                  >
                    <option value="content">Content</option>
                    <option value="account">Account</option>
                    <option value="cross_channel">Cross-Channel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--foreground)] mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 text-xs"
                  >
                    <option value="count">Count (Absolute)</option>
                    <option value="ratio_per_1k">Rate / 1,000</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="seconds">Seconds</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--foreground)] mb-1">
                    Aggregation
                  </label>
                  <select
                    value={aggregation}
                    onChange={(e) =>
                      setAggregation(
                        e.target.value as
                          | "sum"
                          | "average"
                          | "latest"
                          | "derived_ratio"
                      )
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 text-xs"
                  >
                    <option value="derived_ratio">Derived Ratio</option>
                    <option value="sum">Sum</option>
                    <option value="average">Average</option>
                    <option value="latest">Latest</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  Formula Representation (Optional)
                </label>
                <input
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="e.g. (citations / publications) * 100"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Metric Definition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
