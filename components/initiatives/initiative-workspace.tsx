"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
import {
  Target,
  ArrowLeft,
  Calendar,
  Layers,
  Plus,
  Loader2,
  Trash2,
  Compass,
  ShieldCheck,
  FileText,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { ContentLinkDrawer } from "./content-link-drawer";
import { AddGoalModal } from "./goal-modal";

interface InitiativeWorkspaceProps {
  initiativeId: Id<"initiatives">;
  onBack: () => void;
}

type WorkspaceTab = "goals" | "outputs" | "outcomes";

export function InitiativeWorkspace({ initiativeId, onBack }: InitiativeWorkspaceProps) {
  const { organizationId, userRole } = useOrganization();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("goals");
  const [showLinkDrawer, setShowLinkDrawer] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  // Queries & Mutations
  const workspaceData = useQuery(api.initiatives.getInitiativeWorkspace, {
    organizationId,
    initiativeId,
  });

  const updateStatus = useMutation(api.initiatives.updateInitiativeStatus);
  const unlinkContent = useMutation(api.initiatives.unlinkContent);

  const canEdit = userRole === "owner" || userRole === "admin" || userRole === "analyst" || userRole === "contributor";

  if (workspaceData === undefined) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
        <div className="text-xs text-[var(--muted-foreground)]">Loading initiative workspace...</div>
      </div>
    );
  }

  if (workspaceData === null) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="text-sm font-semibold text-[var(--foreground)]">Initiative not found</div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)]"
        >
          Return to Initiatives
        </button>
      </div>
    );
  }

  const { initiative, goals, content, outcomes, performance } = workspaceData;

  const handleStatusChange = async (newStatus: "draft" | "active" | "completed" | "archived") => {
    try {
      await updateStatus({
        organizationId,
        initiativeId,
        status: newStatus,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleUnlink = async (contentItemId: Id<"contentItems">) => {
    if (!confirm("Are you sure you want to detach this content item from this initiative?")) return;
    try {
      await unlinkContent({
        organizationId,
        initiativeId,
        contentItemId,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unlink content item");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Workspace Header */}
      <div className="space-y-4 border-b border-[var(--border)] pb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Initiatives</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[var(--accent)]/15 text-[var(--accent)]">
                Strategic Initiative
              </span>

              {canEdit ? (
                <select
                  value={initiative.status}
                  onChange={(e) =>
                    handleStatusChange(
                      e.target.value as "draft" | "active" | "completed" | "archived"
                    )
                  }
                  className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-0.5 text-[11px] font-semibold capitalize cursor-pointer text-emerald-700 dark:text-emerald-300"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              ) : (
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 capitalize">
                  {initiative.status}
                </span>
              )}

              {initiative.startDate && (
                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Started {new Date(initiative.startDate).toLocaleDateString()}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {initiative.name}
            </h1>

            {initiative.description && (
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed pt-0.5">
                {initiative.description}
              </p>
            )}

            {initiative.tags && initiative.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {initiative.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-[10px] font-mono text-[var(--muted-foreground)]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                onClick={() => setShowLinkDrawer(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] text-xs font-medium text-[var(--foreground)] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Link Output</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddGoalModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                <Target className="h-3.5 w-3.5" />
                <span>Add Goal</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Visual Impact Chain Flowchart (Section 2) */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/20 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
          <Compass className="h-4 w-4 text-[var(--accent)]" />
          <span>Initiative Impact Chain Architecture</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {/* Step 1: Goals */}
          <div
            onClick={() => setActiveTab("goals")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === "goals"
                ? "border-[var(--accent)] bg-[var(--background)] shadow-xs"
                : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]/50"
            }`}
          >
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">1. Goals</div>
            <div className="text-base font-bold text-[var(--foreground)] mt-0.5">{goals.length} Goals</div>
            <div className="text-[11px] text-[var(--muted-foreground)] mt-1 truncate">
              Target indicators
            </div>
          </div>

          {/* Step 2: Outputs */}
          <div
            onClick={() => setActiveTab("outputs")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === "outputs"
                ? "border-[var(--accent)] bg-[var(--background)] shadow-xs"
                : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]/50"
            }`}
          >
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">2. Outputs</div>
            <div className="text-base font-bold text-[var(--foreground)] mt-0.5">{content.length} Items</div>
            <div className="text-[11px] text-[var(--muted-foreground)] mt-1 truncate">
              Investigative work
            </div>
          </div>

          {/* Step 3: Audience Reach */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">3. Audience Reach</div>
            <div className="text-base font-bold font-mono text-[var(--foreground)] mt-0.5">
              {performance.totalReach.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-[var(--muted-foreground)] mt-1 truncate">
              {performance.totalImpressions.toLocaleString()} views
            </div>
          </div>

          {/* Step 4: Engagement */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">4. Actions</div>
            <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {performance.meaningfulActions.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 mt-1 truncate">
              {performance.meaningfulRate} / 1k rate
            </div>
          </div>

          {/* Step 5: Outcomes */}
          <div
            onClick={() => setActiveTab("outcomes")}
            className={`p-3 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              activeTab === "outcomes"
                ? "border-amber-400 bg-[var(--background)] shadow-xs"
                : "border-[var(--border)] bg-[var(--background)] hover:border-amber-400/50"
            }`}
          >
            <div className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-semibold">5. Outcomes</div>
            <div className="text-base font-bold text-amber-700 dark:text-amber-300 mt-0.5">
              {outcomes.length} Documented
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)] mt-1 truncate">
              External changes
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-[var(--border)] gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("goals")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "goals"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Target className="h-4 w-4" />
          <span>Strategic Goals ({goals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("outputs")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "outputs"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Assigned Outputs ({content.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("outcomes")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "outcomes"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Documented Outcomes ({outcomes.length})</span>
        </button>
      </div>

      {/* TAB 1: STRATEGIC GOALS & INDICATORS */}
      {activeTab === "goals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--muted-foreground)]">
              Measurable goals define what the initiative aims to alter in the real world or in audience behavior.
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowAddGoalModal(true)}
                className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Goal</span>
              </button>
            )}
          </div>

          {goals.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] text-xs text-[var(--muted-foreground)]">
              No strategic goals documented for this initiative yet. Click &quot;Add Goal&quot; above to define targets.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <div
                  key={goal._id}
                  className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--muted)] capitalize text-[var(--muted-foreground)]">
                        {goal.goalType.replace(/_/g, " ")}
                      </span>
                      <h4 className="font-bold text-sm text-[var(--foreground)] mt-1.5">
                        {goal.title}
                      </h4>
                      {goal.description && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Indicators Tracker (Section 11) */}
                  <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                    <div className="text-[11px] font-semibold text-[var(--foreground)] uppercase tracking-wider">
                      Quantifiable Indicators
                    </div>

                    {goal.indicators.length === 0 ? (
                      <div className="text-[11px] text-[var(--muted-foreground)] italic">
                        No metric indicators attached to this goal.
                      </div>
                    ) : (
                      goal.indicators.map((ind) => {
                        const current = ind.currentValue ?? ind.baselineValue;
                        const progressSpan = ind.targetValue - ind.baselineValue;
                        const progressAchieved = current - ind.baselineValue;
                        const progressPct =
                          progressSpan !== 0
                            ? Math.min(100, Math.max(0, Math.round((progressAchieved / progressSpan) * 100)))
                            : 50;

                        return (
                          <div key={ind._id} className="p-3 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] space-y-2 text-xs">
                            <div className="flex items-center justify-between font-medium">
                              <span>{ind.description}</span>
                              <span className="text-[10px] font-mono capitalize px-1.5 py-0.5 rounded bg-[var(--background)]">
                                {ind.direction}
                              </span>
                            </div>

                            <div className="flex items-center justify-between font-mono text-[11px] text-[var(--muted-foreground)]">
                              <span>Baseline: {ind.baselineValue}</span>
                              <span className="font-bold text-[var(--foreground)]">Current: {current}</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Target: {ind.targetValue}</span>
                            </div>

                            {/* Visual Progress Bar */}
                            <div className="w-full bg-[var(--muted)] h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[var(--accent)] h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ASSIGNED OUTPUTS */}
      {activeTab === "outputs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--muted-foreground)]">
              All communications pieces, investigations, and research papers assigned to this initiative.
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowLinkDrawer(true)}
                className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Link Another Output</span>
              </button>
            )}
          </div>

          {content.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] text-xs text-[var(--muted-foreground)] space-y-2">
              <div>No content outputs linked to this initiative yet.</div>
              <button
                type="button"
                onClick={() => setShowLinkDrawer(true)}
                className="px-4 py-2 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)]"
              >
                Assign Content Outputs
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] overflow-x-auto bg-[var(--background)]">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-[var(--muted-foreground)] font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Title / Output</th>
                    <th className="py-2.5 px-3">Platform</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3 text-right">Impressions</th>
                    <th className="py-2.5 px-3 text-right">Reach</th>
                    <th className="py-2.5 px-3 text-right">Shares</th>
                    <th className="py-2.5 px-3 text-right">Action Rate</th>
                    {canEdit && <th className="py-2.5 px-3 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {content.map((item) => {
                    const imp = item.metrics?.impressions ?? 0;
                    const shares = item.metrics?.shares ?? 0;
                    const saves = item.metrics?.saves ?? 0;
                    const rate = imp > 0 ? (((shares + saves) / imp) * 1000).toFixed(1) : "0.0";

                    return (
                      <tr key={item._id} className="hover:bg-[var(--muted)]/20">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--muted-foreground)]">
                          {new Date(item.publishedAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 max-w-[280px]">
                          <div className="font-medium text-[var(--foreground)] truncate">{item.title}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--muted)] capitalize">
                            {item.provider}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--muted-foreground)] capitalize">
                          {item.contentType.replace(/_/g, " ")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {item.metrics?.impressions?.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {item.metrics?.reach?.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-[var(--foreground)]">
                          {item.metrics?.shares?.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {rate}
                        </td>
                        {canEdit && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleUnlink(item._id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-md"
                              title="Unlink output from initiative"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REAL-WORLD OUTCOMES & EVIDENCE */}
      {activeTab === "outcomes" && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            Observed societal, legislative, media, and institutional changes where evidence suggests this initiative contributed.
          </p>

          {outcomes.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] text-xs text-[var(--muted-foreground)]">
              No real-world outcomes logged for this initiative yet. Use the Impact section to document societal changes with corroborating evidence.
            </div>
          ) : (
            <div className="space-y-4">
              {outcomes.map((out) => (
                <div
                  key={out._id}
                  className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-4 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200">
                          {out.changeType.replace(/_/g, " ")}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--muted)] text-[var(--foreground)] capitalize">
                          Status: {out.verificationStatus}
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground)] font-mono">
                          {new Date(out.occurredAt).toLocaleDateString(undefined, { dateStyle: "long" })}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-[var(--foreground)]">
                        {out.title}
                      </h4>
                      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                        {out.description}
                      </p>
                    </div>

                    <div className="text-right sm:shrink-0">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 capitalize">
                        {out.contributionStrength.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Contribution Statement (Section 2) */}
                  <div className="p-3 rounded-xl bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/60 text-xs">
                    <div className="font-semibold text-blue-900 dark:text-blue-200 text-[11px] flex items-center gap-1 mb-0.5">
                      <Sparkles className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span>Contribution Rationale</span>
                    </div>
                    <div className="text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed italic">
                      &quot;{out.contributionStatement}&quot;
                    </div>
                  </div>

                  {/* Supporting Evidence Items (Section 31) */}
                  {out.evidence && out.evidence.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                      <div className="text-[11px] font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                        <span>Supporting Corroborating Evidence ({out.evidence.length})</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {out.evidence.map((ev) => (
                          <div key={ev._id} className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 space-y-1">
                            <div className="font-semibold text-[var(--foreground)] truncate">{ev.title}</div>
                            {ev.publisher && (
                              <div className="text-[10px] text-[var(--muted-foreground)]">
                                Source: {ev.publisher} ({ev.type.replace(/_/g, " ")})
                              </div>
                            )}
                            {ev.excerpt && (
                              <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 italic">
                                &quot;{ev.excerpt}&quot;
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
          )}
        </div>
      )}

      {/* Drawers & Modals */}
      {showLinkDrawer && (
        <ContentLinkDrawer
          organizationId={organizationId}
          initiativeId={initiativeId}
          initiativeName={initiative.name}
          onClose={() => setShowLinkDrawer(false)}
        />
      )}

      {showAddGoalModal && (
        <AddGoalModal
          organizationId={organizationId}
          initiativeId={initiativeId}
          onClose={() => setShowAddGoalModal(false)}
        />
      )}
    </div>
  );
}
