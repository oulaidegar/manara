"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
import {
  X,
  HelpCircle,
  FileCheck2,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

interface RecordOutcomeModalProps {
  onClose: () => void;
  onSuccess?: (outcomeId: Id<"outcomes">) => void;
}

type ChangeType =
  | "policy"
  | "law"
  | "institutional_practice"
  | "investigation"
  | "public_commitment"
  | "media"
  | "relationship"
  | "awareness"
  | "behavior"
  | "funding"
  | "other";

type ContributionStrength = "possible" | "plausible" | "strong_evidence" | "unknown";

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

export function RecordOutcomeModal({ onClose, onSuccess }: RecordOutcomeModalProps) {
  const { organizationId } = useOrganization();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Queries
  const initiatives = useQuery(api.initiatives.listInitiatives, { organizationId });

  // Step 1: Observed Event
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [changeType, setChangeType] = useState<ChangeType>("policy");
  const [significance, setSignificance] = useState("");
  const [occurredDate, setOccurredDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>("");

  // Step 2: Contribution Rationale (Section 2 & Section 28)
  const [contributionStatement, setContributionStatement] = useState("");
  const [contributionStrength, setContributionStrength] = useState<ContributionStrength>("plausible");

  // Step 3: Optional Initial Evidence Artifact
  const [attachEvidence, setAttachEvidence] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("official_document");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidencePublisher, setEvidencePublisher] = useState("");
  const [evidenceExcerpt, setEvidenceExcerpt] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createOutcome = useMutation(api.impact.createOutcome);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contributionStatement.trim()) return;
    setIsSubmitting(true);

    try {
      const occurredAt = new Date(occurredDate).getTime() || Date.now();
      const outcomeId = await createOutcome({
        organizationId,
        title: title.trim(),
        description: description.trim(),
        changeType,
        significance: significance.trim() || undefined,
        initiativeId: selectedInitiativeId ? (selectedInitiativeId as Id<"initiatives">) : undefined,
        contributionStatement: contributionStatement.trim(),
        contributionStrength,
        occurredAt,
        initialEvidence:
          attachEvidence && evidenceTitle.trim()
            ? {
                title: evidenceTitle.trim(),
                type: evidenceType,
                url: evidenceUrl.trim() || undefined,
                publisher: evidencePublisher.trim() || undefined,
                excerpt: evidenceExcerpt.trim() || undefined,
              }
            : undefined,
      });

      onSuccess?.(outcomeId);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to record outcome");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)]">
              Record Observed Real-World Outcome
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Step {step} of 3: {step === 1 ? "What Changed?" : step === 2 ? "Contribution Rationale" : "Corroborating Evidence"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 1 ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 2 ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 3 ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
            }`}
          />
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  What changed in the real world? *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Parliamentary inquiry launched into public procurement transparency"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Change Classification
                  </label>
                  <select
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value as ChangeType)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
                  >
                    <option value="policy">Policy / Regulatory Shift</option>
                    <option value="law">Statute / Legislation Enacted</option>
                    <option value="institutional_practice">Institutional Practice Change</option>
                    <option value="investigation">Official Government Inquiry</option>
                    <option value="public_commitment">Public Pledge / Commitment</option>
                    <option value="media">Media Narrative Shift</option>
                    <option value="relationship">Strategic Actor Engagement</option>
                    <option value="funding">Public Funding Allocation</option>
                    <option value="other">Other Public Interest Change</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Date Observed
                  </label>
                  <input
                    type="date"
                    value={occurredDate}
                    onChange={(e) => setOccurredDate(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Event Description & Context
                </label>
                <textarea
                  placeholder="Describe the action taken by the institution, committee, or body..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Connect to Strategic Initiative (Optional)
                </label>
                <select
                  value={selectedInitiativeId}
                  onChange={(e) => setSelectedInitiativeId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
                >
                  <option value="">None / Standalone Organization Work</option>
                  {initiatives?.map((init) => (
                    <option key={init._id} value={init._id}>
                      {init.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Societal Significance (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. First legislative amendment on this topic in over a decade"
                  value={significance}
                  onChange={(e) => setSignificance(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Guidance Callout */}
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <HelpCircle className="h-4 w-4 shrink-0" />
                  <span>Radar Contribution Standard (Section 2)</span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                  Avoid claiming direct causality (e.g., &ldquo;our video forced the minister to resign&rdquo;). Instead,
                  use verifiable framing such as: &ldquo;Our investigation was cited by...&rdquo;, &ldquo;Followed our policy submission...&rdquo;, or &ldquo;Data was referenced during hearings.&rdquo;
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  How did your work plausibly contribute? *
                </label>
                <textarea
                  placeholder="e.g. The parliamentary committee cited page 14 of our investigation in their formal inquiry terms of reference..."
                  value={contributionStatement}
                  onChange={(e) => setContributionStatement(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Contribution Evidence Strength
                </label>
                <select
                  value={contributionStrength}
                  onChange={(e) => setContributionStrength(e.target.value as ContributionStrength)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
                >
                  <option value="plausible">Plausible Contribution (Supported by public timing & theme)</option>
                  <option value="strong_evidence">Strong Evidence (Explicit citations, official documents)</option>
                  <option value="possible">Possible Contribution (Correlated context)</option>
                  <option value="unknown">Unknown / Under Investigation</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      Attach Initial Supporting Evidence Artifact
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachEvidence}
                      onChange={(e) => setAttachEvidence(e.target.checked)}
                      className="rounded text-[var(--primary)]"
                    />
                    <span>Attach now</span>
                  </label>
                </div>

                {attachEvidence && (
                  <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                        Artifact Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hansard Official Record Session 44"
                        value={evidenceTitle}
                        onChange={(e) => setEvidenceTitle(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                        required={attachEvidence}
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
                          <option value="official_document">Official Document / Directive</option>
                          <option value="media_article">Media / Press Article</option>
                          <option value="quote">Direct Quote / Press Conference</option>
                          <option value="meeting_note">Committee / Hearing Minutes</option>
                          <option value="email">Official Correspondence</option>
                          <option value="webpage">Public Webpage</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                          Publisher / Source
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ministry of Finance"
                          value={evidencePublisher}
                          onChange={(e) => setEvidencePublisher(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                        Source URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.gov/records/123"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                        Verbatim Citation / Excerpt
                      </label>
                      <textarea
                        placeholder="Quotation showing how findings or work were cited..."
                        value={evidenceExcerpt}
                        onChange={(e) => setEvidenceExcerpt(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {!attachEvidence && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  You can always attach supporting evidence, Hansard transcripts, and media articles later from the outcome inspector.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                type="button"
                disabled={step === 1 ? !title.trim() : !contributionStatement.trim()}
                onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                <span>Continue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !title.trim() || !contributionStatement.trim()}
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Recording..." : "Save Outcome"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
