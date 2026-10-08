"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
import {
  X,
  FileText,
  Briefcase,
  Layers,
  Sparkles,
  Check,
  Calendar,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";

interface ReportGeneratorModalProps {
  onClose: () => void;
  onSuccess?: (reportId: Id<"reports">) => void;
}

type ReportType =
  | "monthly"
  | "quarterly"
  | "annual"
  | "campaign"
  | "donor"
  | "board"
  | "editorial"
  | "custom";

interface ArchetypeTemplate {
  type: ReportType;
  title: string;
  description: string;
  defaultTitle: string;
  defaultContext: string;
  icon: React.ReactNode;
}

const TEMPLATES: ArchetypeTemplate[] = [
  {
    type: "board",
    title: "Board / Executive Briefing",
    description: "High-level overview of audience reach, meaningful actions, and corroborated societal outcomes.",
    defaultTitle: "Executive Board Briefing — Communications & Impact",
    defaultContext: "Synthesized executive briefing reviewing strategic dissemination efficiency and corroborated public interest outcomes.",
    icon: <Briefcase className="h-5 w-5 text-blue-500" />,
  },
  {
    type: "donor",
    title: "Donor Impact Narrative",
    description: "Demonstrates stewardship with verified reach, initiative progress, and external evidence citations.",
    defaultTitle: "Grantee Impact & Communications Retrospective",
    defaultContext: "Accountability report presenting verified reach metrics, campaign milestones, and independent external signals.",
    icon: <FileText className="h-5 w-5 text-purple-500" />,
  },
  {
    type: "campaign",
    title: "Initiative Retrospective",
    description: "Deep dive into a specific initiative's published outputs, audience peaks, and policy inquiries.",
    defaultTitle: "Strategic Initiative Impact Retrospective",
    defaultContext: "Retrospective synthesis examining published investigative dossiers and following policy changes.",
    icon: <Layers className="h-5 w-5 text-amber-500" />,
  },
  {
    type: "editorial",
    title: "Editorial & Learning Review",
    description: "Focuses on content format action rates and communications practices in organizational memory.",
    defaultTitle: "Editorial Performance & Practice Evaluation",
    defaultContext: "Internal learning review analyzing which storytelling tactics reliably drive public attention and meaningful civic action.",
    icon: <GraduationCap className="h-5 w-5 text-emerald-500" />,
  },
];

export function ReportGeneratorModal({ onClose, onSuccess }: ReportGeneratorModalProps) {
  const { organizationId } = useOrganization();
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [selectedTemplate, setSelectedTemplate] = useState<ArchetypeTemplate>(TEMPLATES[0]);
  const [title, setTitle] = useState(TEMPLATES[0].defaultTitle);
  const [description, setDescription] = useState(TEMPLATES[0].defaultContext);
  const [periodPreset, setPeriodPreset] = useState<"30d" | "90d" | "ytd" | "all">("90d");
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const initiatives = useQuery(api.initiatives.listInitiatives, { organizationId });
  const campaigns = useQuery(api.campaigns.listCampaigns, { organizationId });
  const createReport = useMutation(api.reports.createReport);

  const handleSelectTemplate = (template: ArchetypeTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.defaultTitle);
    setDescription(template.defaultContext);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    let periodStart = now - 90 * DAY;

    if (periodPreset === "30d") {
      periodStart = now - 30 * DAY;
    } else if (periodPreset === "90d") {
      periodStart = now - 90 * DAY;
    } else if (periodPreset === "ytd") {
      periodStart = new Date(new Date().getFullYear(), 0, 1).getTime();
    } else if (periodPreset === "all") {
      periodStart = now - 365 * DAY;
    }

    try {
      const reportId = await createReport({
        organizationId,
        title: title.trim(),
        description: description.trim() || undefined,
        reportType: selectedTemplate.type,
        periodStart,
        periodEnd: now,
        initiativeId: selectedInitiativeId ? (selectedInitiativeId as Id<"initiatives">) : undefined,
        campaignId: selectedCampaignId ? (selectedCampaignId as Id<"campaigns">) : undefined,
      });

      onSuccess?.(reportId);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              <h3 className="text-base font-bold text-[var(--foreground)]">
                Generate Structured Report
              </h3>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Step {step} of 2: {step === 1 ? "Select Report Archetype" : "Timeframe & Narrative Scope"}
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
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <div className={`h-1.5 rounded-full ${step >= 1 ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`} />
          <div className={`h-1.5 rounded-full ${step >= 2 ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`} />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {step === 1 ? (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[var(--foreground)]">
                Choose a pre-configured civil society archetype:
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.type}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                      selectedTemplate.type === tmpl.type
                        ? "border-[var(--primary)] bg-[var(--muted)]/40 shadow-2xs"
                        : "border-[var(--border)] hover:border-[var(--muted-foreground)]/50 bg-[var(--background)]"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[var(--muted)] shrink-0 mt-0.5">
                      {tmpl.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[var(--foreground)]">{tmpl.title}</h4>
                        {selectedTemplate.type === tmpl.type && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[var(--primary)] text-[var(--primary-foreground)]">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Report Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Executive Context / Narrative Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
                  placeholder="Context on the reporting period, key investigations, or target audience..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Reporting Timeframe
                  </label>
                  <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    <select
                      value={periodPreset}
                      onChange={(e) => setPeriodPreset(e.target.value as typeof periodPreset)}
                      className="w-full bg-transparent focus:outline-none text-xs"
                    >
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days (Recommended)</option>
                      <option value="ytd">Year to Date</option>
                      <option value="all">Full Historical Archive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Campaign Focus (Optional)
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                  >
                    <option value="">All Campaigns / Cross-Channel</option>
                    {campaigns?.map((camp) => (
                      <option key={camp._id} value={camp._id}>
                        {camp.name} ({camp.postCount} posts)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Initiative Focus (Optional)
                  </label>
                  <select
                    value={selectedInitiativeId}
                    onChange={(e) => setSelectedInitiativeId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                  >
                    <option value="">All Strategic Initiatives</option>
                    {initiatives?.map((init) => (
                      <option key={init._id} value={init._id}>
                        {init.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Snapshot Guarantee Note */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3.5 text-xs text-[var(--muted-foreground)] space-y-1">
                <span className="font-semibold text-[var(--foreground)]">
                  Tamper-Proof Snapshot Guarantee (Section 39):
                </span>
                <p className="leading-relaxed">
                  Upon generation, Radar queries live performance metrics, published outputs, outcomes, and corroborating
                  evidence, freezing them into immutable blocks. Future data updates will never alter this published report.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
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

            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90"
              >
                <span>Continue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !title.trim()}
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Freezing Snapshot..." : "Generate Report"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
