"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import { X, Sparkles, Check } from "lucide-react";
import { useState } from "react";

interface CreatePracticeModalProps {
  onClose: () => void;
}

export function CreatePracticeModal({ onClose }: CreatePracticeModalProps) {
  const { organizationId } = useOrganization();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [metricKey, setMetricKey] = useState("shares");
  const [status, setStatus] = useState("under_test");
  const [source, setSource] = useState("editorial_testing");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPractice = useMutation(api.practices.createPractice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !hypothesis.trim()) return;
    setIsSubmitting(true);

    try {
      await createPractice({
        organizationId,
        title: title.trim(),
        description: description.trim(),
        hypothesis: hypothesis.trim(),
        metricKey,
        status,
        source,
      });

      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create practice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">
                Formulate Communications Hypothesis
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Define an editorial or dissemination practice to track in organizational memory
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
              Practice Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Lead with key investigative finding in opening sentence"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
              Stated Hypothesis (What we predict will happen) *
            </label>
            <textarea
              placeholder="e.g. Outputs stating the core conclusion immediately generate greater civic dissemination than intrigue-based headlines..."
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
              Editorial Rule / Description
            </label>
            <textarea
              placeholder="Guidance for writers, producers, and communicators when drafting content..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                Target Metric
              </label>
              <select
                value={metricKey}
                onChange={(e) => setMetricKey(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
              >
                <option value="shares">Meaningful Shares</option>
                <option value="saves">Saves / Bookmarks</option>
                <option value="reach">Unique Reach</option>
                <option value="clicks">Link Clicks</option>
                <option value="views">Total Views</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
              >
                <option value="under_test">Under Test</option>
                <option value="draft">Draft</option>
                <option value="validated">Validated</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                Hypothesis Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
              >
                <option value="editorial_testing">Editorial Testing</option>
                <option value="team_observation">Team Observation</option>
                <option value="retrospective">Retrospective</option>
                <option value="peer_organization">Peer Benchmark</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Creating..." : "Save Hypothesis"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
