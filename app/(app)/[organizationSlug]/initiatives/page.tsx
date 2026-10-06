"use client";

import { useOrganization } from "@/components/organization-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Target,
  Plus,
  Compass,
  ArrowRight,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { InitiativeWorkspace } from "@/components/initiatives/initiative-workspace";

export default function InitiativesPage() {
  const { organizationId, userRole } = useOrganization();
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<Id<"initiatives"> | null>(null);

  const initiatives = useQuery(api.initiatives.listInitiatives, { organizationId });
  const createInitiative = useMutation(api.initiatives.createInitiative);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("policy_change");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCreate = userRole !== "viewer";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const newId = await createInitiative({
        organizationId,
        name: name.trim(),
        description: description.trim() || undefined,
        primaryGoal,
      });
      setShowCreateModal(false);
      setName("");
      setDescription("");
      setSelectedInitiativeId(newId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create initiative");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user selected an initiative, show the full workspace
  if (selectedInitiativeId) {
    return (
      <InitiativeWorkspace
        initiativeId={selectedInitiativeId}
        onBack={() => setSelectedInitiativeId(null)}
      />
    );
  }

  const hasInitiatives = initiatives && initiatives.length > 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Initiatives</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Organize campaigns, investigations, and research into coherent bodies of work with measurable goals.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            <span>New Initiative</span>
          </button>
        )}
      </div>

      {/* The Impact Chain Explainer (Section 2) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          <Compass className="h-4 w-4 text-[var(--accent)]" />
          <span>The Radar Impact Model</span>
        </div>
        <p className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed">
          Radar organizes organizational memory by following this unbroken chain:
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded-md bg-[var(--background)] border border-[var(--border)] px-2.5 py-1 text-[var(--foreground)]">
            Goals
          </span>
          <ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" />
          <span className="rounded-md bg-[var(--background)] border border-[var(--border)] px-2.5 py-1 text-[var(--foreground)] font-semibold text-[var(--accent)]">
            Initiatives
          </span>
          <ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" />
          <span className="rounded-md bg-[var(--background)] border border-[var(--border)] px-2.5 py-1 text-[var(--foreground)]">
            Outputs
          </span>
          <ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" />
          <span className="rounded-md bg-[var(--background)] border border-[var(--border)] px-2.5 py-1 text-[var(--foreground)]">
            Reach & Engagement
          </span>
          <ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" />
          <span className="rounded-md bg-[var(--background)] border border-[var(--border)] px-2.5 py-1 text-[var(--foreground)]">
            External Signals
          </span>
          <ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" />
          <span className="rounded-md bg-[var(--background)] border border-[var(--border)] px-2.5 py-1 text-[var(--foreground)]">
            Outcomes & Evidence
          </span>
        </div>
      </div>

      {/* Initiatives Content */}
      {initiatives === undefined ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : hasInitiatives ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initiatives.map((init) => (
            <div
              key={init._id}
              onClick={() => setSelectedInitiativeId(init._id)}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 space-y-4 hover:border-[var(--accent)] transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 capitalize">
                    {init.status}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] font-mono">
                    {init.startDate ? new Date(init.startDate).toLocaleDateString() : ""}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-[var(--foreground)] leading-snug">
                    {init.name}
                  </h3>
                  {init.description && (
                    <p className="mt-1.5 text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2">
                      {init.description}
                    </p>
                  )}
                </div>

                {/* Tag pills */}
                {init.tags && init.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {init.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-[10px] font-mono text-[var(--muted-foreground)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                {/* Metrics tally */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-base font-bold text-[var(--foreground)]">{init.contentCount}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Outputs</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-[var(--accent)]">{init.goalCount}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Goals</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                      {init.outcomeCount}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Outcomes</div>
                  </div>
                </div>

                {/* Performance rollup preview */}
                <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Reach: <strong className="text-[var(--foreground)] font-mono">{(init.performance?.totalReach ?? 0).toLocaleString()}</strong></span>
                  <span className="text-[var(--accent)] font-semibold flex items-center gap-0.5 hover:underline text-[11px]">
                    <span>Workspace</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Primary Empty State (Section 43) */
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
            <Target className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">No initiatives created yet</h3>
          <p className="mt-2 max-w-md mx-auto text-sm text-[var(--muted-foreground)] leading-relaxed">
            Initiatives connect your communications activity to the work you&apos;re trying to accomplish.
            Group articles, videos, and social outputs around specific campaigns or public-interest goals.
          </p>

          {canCreate && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                <span>Create Initiative</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Initiative Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--foreground)]">Create New Initiative</h3>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              An initiative unites content outputs, performance metrics, and real-world outcomes.
            </p>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Initiative Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Procurement Transparency Project"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Description & Context
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is the objective and timeline of this work?"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Primary Strategic Goal
                </label>
                <select
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                >
                  <option value="policy_change">Policy & Legislative Change</option>
                  <option value="institutional_change">Institutional Practice Review</option>
                  <option value="media_attention">Media Attention & Narrative Shift</option>
                  <option value="awareness">Public Awareness & Education</option>
                  <option value="behavior_change">Audience Behavior Change</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium hover:bg-[var(--muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Initiative"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
