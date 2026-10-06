"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Target, Check } from "lucide-react";

interface AddGoalModalProps {
  organizationId: Id<"organizations">;
  initiativeId: Id<"initiatives">;
  onClose: () => void;
}

export function AddGoalModal({
  organizationId,
  initiativeId,
  onClose,
}: AddGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState<
    | "awareness"
    | "engagement"
    | "audience_growth"
    | "behavior_change"
    | "media_attention"
    | "policy_change"
    | "institutional_change"
    | "capacity"
    | "fundraising"
    | "other"
  >("policy_change");

  // Indicator fields
  const [withIndicator, setWithIndicator] = useState(true);
  const [metricKey, setMetricKey] = useState("meaningful_action_rate");
  const [indicatorDesc, setIndicatorDesc] = useState("Meaningful Action Rate per 1k views");
  const [baselineValue, setBaselineValue] = useState(2.5);
  const [targetValue, setTargetValue] = useState(8.0);
  const [direction, setDirection] = useState<"increase" | "decrease" | "maintain" | "qualitative">("increase");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createGoal = useMutation(api.initiatives.createGoal);
  const addGoalIndicator = useMutation(api.initiatives.addGoalIndicator);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    try {
      const goalId = await createGoal({
        organizationId,
        initiativeId,
        title: title.trim(),
        description: description.trim() || undefined,
        goalType,
      });

      if (withIndicator) {
        await addGoalIndicator({
          organizationId,
          goalId,
          metricKey,
          description: indicatorDesc.trim(),
          baselineValue,
          targetValue,
          direction,
        });
      }

      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-base font-bold text-[var(--foreground)]">Add Strategic Goal</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
              Goal Title
            </label>
            <input
              type="text"
              placeholder="e.g. Mandatory public procurement disclosure standard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                Goal Type
              </label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as typeof goalType)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
              >
                <option value="policy_change">Policy & Statutory Change</option>
                <option value="institutional_change">Institutional Practice</option>
                <option value="media_attention">Media Attention</option>
                <option value="awareness">Audience Awareness</option>
                <option value="behavior_change">Behavior Change</option>
                <option value="capacity">Organizational Capacity</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as typeof direction)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
              >
                <option value="increase">Increase Value</option>
                <option value="decrease">Decrease / Eliminate</option>
                <option value="maintain">Maintain Standard</option>
                <option value="qualitative">Qualitative Milestone</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
              Strategic Rationale & Scope
            </label>
            <textarea
              placeholder="Why this matters for public interest..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
            />
          </div>

          {/* Indicator Section */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--foreground)]">
                Attach Quantifiable Indicator (Section 11)
              </span>
              <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={withIndicator}
                  onChange={(e) => setWithIndicator(e.target.checked)}
                  className="rounded text-[var(--primary)]"
                />
                <span>Include indicator</span>
              </label>
            </div>

            {withIndicator && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                      Indicator Metric Key
                    </label>
                    <select
                      value={metricKey}
                      onChange={(e) => setMetricKey(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                    >
                      <option value="meaningful_action_rate">Meaningful Action Rate</option>
                      <option value="external_citations">External Citations</option>
                      <option value="institutional_responses">Institutional Responses</option>
                      <option value="retained_readers">Retained Readers</option>
                      <option value="custom">Custom Metric</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                      Indicator Description
                    </label>
                    <input
                      type="text"
                      value={indicatorDesc}
                      onChange={(e) => setIndicatorDesc(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                      Baseline Value
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={baselineValue}
                      onChange={(e) => setBaselineValue(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                      Target Value
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={targetValue}
                      onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-medium hover:bg-[var(--muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Saving..." : "Save Goal"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
