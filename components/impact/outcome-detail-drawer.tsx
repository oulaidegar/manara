"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
import {
  X,
  Clock,
  ShieldCheck,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  AlertTriangle,
  Quote,
  Newspaper,
  BookOpen,
  Mail,
  Globe,
  Loader2,
  Check,
  HelpCircle,
  Layers,
} from "lucide-react";
import { useState } from "react";

interface OutcomeDetailDrawerProps {
  outcomeId: Id<"outcomes">;
  onClose: () => void;
}

type EvidenceType =
  | "official_document"
  | "media_article"
  | "report"
  | "webpage"
  | "email"
  | "meeting_note"
  | "quote"
  | "screenshot"
  | "file"
  | "dataset"
  | "other";

export function OutcomeDetailDrawer({ outcomeId, onClose }: OutcomeDetailDrawerProps) {
  const { organizationId, userRole } = useOrganization();
  const [showAddEvidence, setShowAddEvidence] = useState(false);

  // Form states for adding evidence
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("official_document");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidencePublisher, setEvidencePublisher] = useState("");
  const [evidenceExcerpt, setEvidenceExcerpt] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  const data = useQuery(api.impact.getOutcome, {
    organizationId,
    outcomeId,
  });

  const addEvidence = useMutation(api.impact.addEvidence);
  const deleteEvidence = useMutation(api.impact.deleteEvidence);
  const updateVerificationStatus = useMutation(api.impact.updateVerificationStatus);
  const deleteOutcome = useMutation(api.impact.deleteOutcome);

  const canEdit = userRole === "owner" || userRole === "admin" || userRole === "analyst" || userRole === "contributor";
  const canVerify = userRole === "owner" || userRole === "admin" || userRole === "analyst";
  const canDelete = userRole === "owner" || userRole === "admin";

  const handleStatusChange = async (
    status: "candidate" | "documented" | "corroborated" | "verified" | "rejected"
  ) => {
    try {
      await updateVerificationStatus({
        organizationId,
        outcomeId,
        status,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update verification status");
    }
  };

  const handleAddEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTitle.trim()) return;
    setIsSubmittingEvidence(true);

    try {
      await addEvidence({
        organizationId,
        outcomeId,
        title: evidenceTitle.trim(),
        type: evidenceType,
        url: evidenceUrl.trim() || undefined,
        publisher: evidencePublisher.trim() || undefined,
        excerpt: evidenceExcerpt.trim() || undefined,
        notes: evidenceNotes.trim() || undefined,
      });

      // Reset form
      setEvidenceTitle("");
      setEvidenceUrl("");
      setEvidencePublisher("");
      setEvidenceExcerpt("");
      setEvidenceNotes("");
      setShowAddEvidence(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to attach evidence");
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: Id<"evidenceItems">) => {
    if (!confirm("Are you sure you want to remove this evidence item?")) return;
    try {
      await deleteEvidence({
        organizationId,
        evidenceId,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove evidence");
    }
  };

  const handleDeleteOutcome = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this documented outcome and all attached evidence? This cannot be undone."
      )
    ) {
      return;
    }
    try {
      await deleteOutcome({
        organizationId,
        outcomeId,
      });
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete outcome");
    }
  };

  const getEvidenceTypeIcon = (type: string) => {
    switch (type) {
      case "official_document":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "media_article":
        return <Newspaper className="h-4 w-4 text-emerald-500" />;
      case "report":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case "quote":
        return <Quote className="h-4 w-4 text-amber-500" />;
      case "email":
      case "meeting_note":
        return <Mail className="h-4 w-4 text-sky-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
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

  if (data === undefined) {
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[var(--background)] border-l border-[var(--border)] shadow-2xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[var(--background)] border-l border-[var(--border)] shadow-2xl p-6 flex flex-col justify-center items-center">
        <p className="text-sm font-semibold">Outcome record not found</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 rounded-lg bg-[var(--primary)] text-xs text-[var(--primary-foreground)]"
        >
          Close Drawer
        </button>
      </div>
    );
  }

  const { outcome, evidence, initiative, creatorName } = data;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[var(--background)] border-l border-[var(--border)] shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-start justify-between gap-4 bg-[var(--muted)]/10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${getStatusBadge(
                  outcome.verificationStatus
                )}`}
              >
                {outcome.verificationStatus}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] capitalize">
                {outcome.changeType.replace("_", " ")}
              </span>

              {initiative && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent)]/15 text-[var(--accent)]">
                  <Layers className="h-3 w-3" />
                  <span>{initiative.name}</span>
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              {outcome.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Observed {new Date(outcome.occurredAt).toLocaleDateString()}</span>
              </div>
              <span>•</span>
              <span>Logged by {creatorName}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Change Description & Significance */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Real-World Event Details
            </h3>
            <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
              {outcome.description}
            </p>

            {outcome.significance && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3.5 text-xs text-[var(--foreground)]">
                <span className="font-semibold text-[var(--foreground)]">Societal Significance: </span>
                <span className="text-[var(--muted-foreground)]">{outcome.significance}</span>
              </div>
            )}
          </div>

          {/* Contribution Statement (Section 2 & 12) */}
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/20 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[var(--accent)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Evidence of Contribution
                </h3>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 capitalize">
                {outcome.contributionStrength.replace("_", " ")}
              </span>
            </div>

            <blockquote className="border-l-2 border-[var(--accent)] pl-3 text-xs italic text-[var(--foreground)] leading-relaxed">
              &ldquo;{outcome.contributionStatement}&rdquo;
            </blockquote>

            <div className="text-[11px] text-[var(--muted-foreground)] pt-1 border-t border-[var(--border)]/60 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>
                Radar Principle: Documented as plausible contribution rather than sole direct causation.
              </span>
            </div>
          </div>

          {/* Verification Pipeline Transition Controls */}
          {canVerify && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Verification Pipeline Stage
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Requires corroborating sources
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["candidate", "documented", "corroborated", "verified"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                      outcome.verificationStatus === st
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent shadow-xs"
                        : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Verifiable Evidence Items List (Section 13) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Verifiable Evidence ({evidence.length})
                </h3>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowAddEvidence(!showAddEvidence)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddEvidence ? "Cancel" : "Add Evidence"}</span>
                </button>
              )}
            </div>

            {/* Add Evidence Form */}
            {showAddEvidence && (
              <form
                onSubmit={handleAddEvidenceSubmit}
                className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 p-4 space-y-3 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    Attach New Verifiable Evidence Artifact
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddEvidence(false)}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    Close
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                    Artifact / Document Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Parliamentary Hansard Record — Session 44"
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                      Evidence Type
                    </label>
                    <select
                      value={evidenceType}
                      onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                    >
                      <option value="official_document">Official Government Document</option>
                      <option value="media_article">Media / Press Article</option>
                      <option value="report">Independent Report / Study</option>
                      <option value="quote">Direct Public Quote / Speech</option>
                      <option value="meeting_note">Committee / Meeting Record</option>
                      <option value="email">Official Correspondence / Email</option>
                      <option value="webpage">Webpage / Portal Notice</option>
                      <option value="dataset">Open Dataset</option>
                      <option value="other">Other Artifact</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                      Publisher / Origin
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. National Audit Office, Financial Review"
                      value={evidencePublisher}
                      onChange={(e) => setEvidencePublisher(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                    Direct URL Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://parliament.example.org/hansard/record-123"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                    Relevant Citation / Excerpt
                  </label>
                  <textarea
                    placeholder="Exact text or quote where the organization's work or findings are referenced..."
                    value={evidenceExcerpt}
                    onChange={(e) => setEvidenceExcerpt(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                    Verification Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Context on authenticity or archived copy location..."
                    value={evidenceNotes}
                    onChange={(e) => setEvidenceNotes(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEvidence(false)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEvidence}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{isSubmittingEvidence ? "Saving..." : "Save Evidence"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Evidence items list */}
            {evidence.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center space-y-2">
                <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto" />
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  No verifiable evidence attached yet
                </p>
                <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                  To move this outcome from candidate status to corroborated or verified, attach official
                  records, media clippings, or transcripts.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {evidence.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2.5 shadow-2xs hover:border-[var(--accent)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--muted)]">
                          {getEvidenceTypeIcon(item.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[var(--foreground)]">{item.title}</h4>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5 text-[11px]"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted-foreground)] mt-0.5">
                            {item.publisher && <span className="font-medium">{item.publisher}</span>}
                            {item.publishedAt && (
                              <span>• {new Date(item.publishedAt).toLocaleDateString()}</span>
                            )}
                            <span className="capitalize px-1.5 py-0.2 rounded-md bg-[var(--muted)] text-[10px]">
                              {item.type.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEvidence(item._id)}
                          className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-red-600 transition-colors"
                          title="Delete evidence item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {item.excerpt && (
                      <div className="rounded-lg bg-[var(--muted)]/40 p-2.5 text-xs text-[var(--foreground)] border-l-2 border-[var(--accent)] italic">
                        &ldquo;{item.excerpt}&rdquo;
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-[var(--muted-foreground)]">
                        <span className="font-semibold">Notes:</span> {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-between">
          {canDelete ? (
            <button
              type="button"
              onClick={handleDeleteOutcome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Outcome</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
