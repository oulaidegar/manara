"use client";

import { useOrganization } from "@/components/organization-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Sparkles,
  Plus,
  HelpCircle,
  Clock,
  Loader2,
  Search,
  Filter,
  Users,
  ChevronRight,
  Layers,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { ImpactSummaryCards } from "@/components/impact/impact-summary-cards";
import { OutcomeDetailDrawer } from "@/components/impact/outcome-detail-drawer";
import { RecordOutcomeModal } from "@/components/impact/record-outcome-modal";
import { ActorRegistryModal } from "@/components/impact/actor-registry-modal";

type VerificationStatus = "candidate" | "documented" | "corroborated" | "verified" | "rejected";

export default function ImpactPage() {
  const { organizationId, userRole } = useOrganization();
  const [activeTab, setActiveTab] = useState<"all" | "candidate" | "documented" | "corroborated" | "verified">("all");
  const [selectedChangeType, setSelectedChangeType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Drawers
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<Id<"outcomes"> | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActorModal, setShowActorModal] = useState(false);

  const rawOutcomes = useQuery(api.impact.listOutcomes, {
    organizationId,
    status: activeTab === "all" ? undefined : activeTab,
    changeType: selectedChangeType === "all" ? undefined : selectedChangeType,
  });

  const updateStatus = useMutation(api.impact.updateVerificationStatus);

  const canCreate = userRole !== "viewer";
  const canVerify = userRole === "owner" || userRole === "admin" || userRole === "analyst";

  // Filter outcomes by search query
  const filteredOutcomes = useMemo(() => {
    if (!rawOutcomes) return [];
    if (!searchQuery.trim()) return rawOutcomes;
    const q = searchQuery.toLowerCase();
    return rawOutcomes.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.contributionStatement.toLowerCase().includes(q) ||
        (o.initiativeName && o.initiativeName.toLowerCase().includes(q))
    );
  }, [rawOutcomes, searchQuery]);

  const handleQuickStatusChange = async (
    e: React.MouseEvent,
    outcomeId: Id<"outcomes">,
    status: VerificationStatus
  ) => {
    e.stopPropagation();
    try {
      await updateStatus({
        organizationId,
        outcomeId,
        status,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update verification status");
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      case "corroborated":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800";
      case "documented":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800";
      case "rejected":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800";
      default:
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800";
    }
  };

  const getContributionBadgeStyle = (strength: string) => {
    switch (strength) {
      case "strong_evidence":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
      case "plausible":
        return "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-900";
      case "possible":
        return "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900";
      default:
        return "bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800";
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Real-World Impact & Evidence
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Document external societal changes and preserve verifiable evidence of contribution without inflated causality claims.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowActorModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors shadow-2xs"
          >
            <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span>Actor Directory</span>
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition-opacity shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              <span>Record Outcome</span>
            </button>
          )}
        </div>
      </div>

      {/* Contribution Principle Banner (Section 2 & Section 32) */}
      <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20 p-4 text-xs text-[var(--foreground)]">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[var(--foreground)]">
              Core Product Principle: Contribution vs. Direct Causation
            </span>
            <p className="text-[var(--muted-foreground)] leading-relaxed">
              Radar strictly avoids asserting single-handed direct causation for policy, legal, or institutional shifts.
              We distinguish between activity, communications reach, external signals, and verifiable evidence of contribution.
              Outcomes progress through verification stages as independent evidence accumulates.
            </p>
          </div>
        </div>
      </div>

      {/* Impact Summary KPI Cards */}
      <ImpactSummaryCards organizationId={organizationId} />

      {/* Filter & Pipeline Controls */}
      <div className="space-y-3">
        {/* Verification Status Tabs (Section 27) */}
        <div className="flex flex-wrap border-b border-[var(--border)] gap-2 sm:gap-6 text-xs sm:text-sm font-medium">
          {(
            [
              { id: "all", label: "All Outcomes" },
              { id: "candidate", label: "Candidates for Review" },
              { id: "documented", label: "Documented" },
              { id: "corroborated", label: "Corroborated" },
              { id: "verified", label: "Verified" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--primary)] text-[var(--foreground)] font-bold"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Change Type Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search outcomes, evidence, or citations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-8 pr-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <span className="text-xs text-[var(--muted-foreground)]">Change Type:</span>
            <select
              value={selectedChangeType}
              onChange={(e) => setSelectedChangeType(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs text-[var(--foreground)]"
            >
              <option value="all">All Classifications</option>
              <option value="policy">Policy / Regulatory</option>
              <option value="law">Statute / Law</option>
              <option value="institutional_practice">Institutional Practice</option>
              <option value="investigation">Government Inquiry</option>
              <option value="public_commitment">Public Commitment</option>
              <option value="media">Media Narrative</option>
              <option value="relationship">Strategic Relationship</option>
            </select>
          </div>
        </div>
      </div>

      {/* Outcomes Register */}
      {rawOutcomes === undefined ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : filteredOutcomes.length > 0 ? (
        <div className="space-y-4">
          {filteredOutcomes.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedOutcomeId(item._id)}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-4 hover:border-[var(--accent)] transition-all shadow-2xs cursor-pointer hover:shadow-xs"
            >
              {/* Card Top Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${getStatusBadgeStyle(
                      item.verificationStatus
                    )}`}
                  >
                    {item.verificationStatus}
                  </span>

                  <span className="rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted-foreground)] capitalize">
                    {item.changeType.replace("_", " ")}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize border ${getContributionBadgeStyle(
                      item.contributionStrength
                    )}`}
                  >
                    {item.contributionStrength.replace("_", " ")}
                  </span>

                  {item.initiativeName && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] pl-1">
                      <Layers className="h-3 w-3 text-[var(--accent)]" />
                      <span className="font-medium text-[var(--foreground)]">{item.initiativeName}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(item.occurredAt).toLocaleDateString()}</span>
                  </div>

                  {canVerify && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.verificationStatus}
                        onChange={(e) =>
                          handleQuickStatusChange(
                            e as unknown as React.MouseEvent,
                            item._id,
                            e.target.value as VerificationStatus
                          )
                        }
                        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-[11px] font-semibold capitalize cursor-pointer hover:border-[var(--foreground)]"
                      >
                        <option value="candidate">Candidate</option>
                        <option value="documented">Documented</option>
                        <option value="corroborated">Corroborated</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Title & Description */}
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {item.significance && (
                  <div className="mt-2 text-[11px] bg-[var(--muted)]/40 px-2.5 py-1.5 rounded-lg text-[var(--foreground)] inline-block">
                    <span className="font-semibold">Significance: </span>
                    <span className="text-[var(--muted-foreground)]">{item.significance}</span>
                  </div>
                )}
              </div>

              {/* Contribution Statement Callout */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-3.5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Plausible Contribution Rationale:
                </span>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed italic">
                  &ldquo;{item.contributionStatement}&rdquo;
                </p>
              </div>

              {/* Verifiable Evidence Preview Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-[var(--border)]/60">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{item.evidenceCount} verifiable evidence items attached</span>
                  </div>

                  {item.evidencePreview && item.evidencePreview.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5">
                      {item.evidencePreview.map((ev) => (
                        <span
                          key={ev._id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--muted)] text-[10px] text-[var(--foreground)] truncate max-w-44"
                          title={ev.title}
                        >
                          <FileText className="h-2.5 w-2.5 text-[var(--muted-foreground)]" />
                          <span className="truncate">{ev.title}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[var(--accent)] text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Inspect Evidence & Chain</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
            <Sparkles className="h-7 w-7 text-amber-500" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[var(--foreground)]">
            {searchQuery ? "No matching outcomes found" : "No outcomes recorded in this view"}
          </h3>
          <p className="mt-2 max-w-md mx-auto text-xs text-[var(--muted-foreground)] leading-relaxed">
            Record an observed real-world change and attach verifiable corroborating evidence such as official
            gazettes, Hansard transcripts, or investigative articles.
          </p>

          {canCreate && !searchQuery && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                <span>Record New Outcome</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Outcome Inspection Slide-over Drawer */}
      {selectedOutcomeId && (
        <OutcomeDetailDrawer
          outcomeId={selectedOutcomeId}
          onClose={() => setSelectedOutcomeId(null)}
        />
      )}

      {/* Record Outcome Wizard Modal */}
      {showCreateModal && (
        <RecordOutcomeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newId) => {
            setSelectedOutcomeId(newId);
          }}
        />
      )}

      {/* Societal Actors & Stakeholders Modal */}
      {showActorModal && (
        <ActorRegistryModal onClose={() => setShowActorModal(false)} />
      )}
    </div>
  );
}
