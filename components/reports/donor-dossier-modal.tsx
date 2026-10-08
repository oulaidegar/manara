"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
import {
  X,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  ChevronRight,
  Loader2,
  Check,
  Award,
  Globe2,
  Building2,
  Layers,
  Scale,
} from "lucide-react";
import { useState, useMemo } from "react";

interface DonorDossierModalProps {
  onClose: () => void;
  onSuccess?: (reportId: Id<"reports">) => void;
  preselectedCampaignId?: Id<"campaigns">;
}

type DonorFramework = "ned" | "osf" | "eed" | "ford" | "general";

interface FrameworkOption {
  id: DonorFramework;
  name: string;
  shortName: string;
  tagline: string;
  focusIndicators: string[];
  color: string;
  borderActive: string;
  bgActive: string;
  icon: React.ReactNode;
}

const FRAMEWORKS: FrameworkOption[] = [
  {
    id: "ned",
    name: "National Endowment for Democracy",
    shortName: "NED",
    tagline: "Democratic accountability, citizen oversight & FOIA transparency",
    focusIndicators: [
      "Democratic oversight reach",
      "Public data disclosure impact",
      "Citizen conviction & evidence archiving",
    ],
    color: "text-blue-600 dark:text-blue-400",
    borderActive: "border-blue-500 ring-2 ring-blue-500/20",
    bgActive: "bg-blue-50/50 dark:bg-blue-950/20",
    icon: <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
  },
  {
    id: "osf",
    name: "Open Society Foundations",
    shortName: "OSF",
    tagline: "Rule of law, anti-corruption & systemic justice reform",
    focusIndicators: [
      "Institutional policy shifts",
      "Rule of law corroboration",
      "Civic space protection metrics",
    ],
    color: "text-amber-600 dark:text-amber-400",
    borderActive: "border-amber-500 ring-2 ring-amber-500/20",
    bgActive: "bg-amber-50/50 dark:bg-amber-950/20",
    icon: <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
  },
  {
    id: "eed",
    name: "European Endowment for Democracy",
    shortName: "EED",
    tagline: "Independent media resilience & counter-disinformation",
    focusIndicators: [
      "High-conviction PIEI saves",
      "Counter-disinformation reach",
      "Independent editorial integrity",
    ],
    color: "text-emerald-600 dark:text-emerald-400",
    borderActive: "border-emerald-500 ring-2 ring-emerald-500/20",
    bgActive: "bg-emerald-50/50 dark:bg-emerald-950/20",
    icon: <Globe2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
  },
  {
    id: "ford",
    name: "Ford Foundation",
    shortName: "Ford",
    tagline: "Structural equity, civic justice & institutional reform",
    focusIndicators: [
      "Public accountability milestones",
      "Systemic inequity exposés",
      "Community voice mobilization",
    ],
    color: "text-indigo-600 dark:text-indigo-400",
    borderActive: "border-indigo-500 ring-2 ring-indigo-500/20",
    bgActive: "bg-indigo-50/50 dark:bg-indigo-950/20",
    icon: <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
  },
  {
    id: "general",
    name: "General Accountability Standard",
    shortName: "General",
    tagline: "International civil society & public-interest media standard",
    focusIndicators: [
      "Weighted PIEI score",
      "Corroborated external citations",
      "Rule 44 contribution analysis",
    ],
    color: "text-purple-600 dark:text-purple-400",
    borderActive: "border-purple-500 ring-2 ring-purple-500/20",
    bgActive: "bg-purple-50/50 dark:bg-purple-950/20",
    icon: <FileCheck2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
  },
];

export function DonorDossierModal({
  onClose,
  onSuccess,
  preselectedCampaignId,
}: DonorDossierModalProps) {
  const { organizationId } = useOrganization();

  // Step 1: Framework & Campaign | Step 2: Details & Review
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [selectedFramework, setSelectedFramework] = useState<DonorFramework>("ned");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    preselectedCampaignId ? (preselectedCampaignId as string) : ""
  );
  const [grantReference, setGrantReference] = useState("NED-2026-INV-842");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [periodPreset, setPeriodPreset] = useState<"90d" | "q3" | "q2" | "ytd" | "all">("90d");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data queries
  const campaigns = useQuery(api.campaigns.listCampaigns, { organizationId });
  const createDonorGrantDossier = useMutation(api.reports.createDonorGrantDossier);

  const selectedCampaign = useMemo(() => {
    if (!campaigns || !selectedCampaignId) return null;
    return campaigns.find((c) => c._id === selectedCampaignId) ?? null;
  }, [campaigns, selectedCampaignId]);

  // Update default title when framework or campaign changes
  const handleSelectFramework = (fw: DonorFramework) => {
    setSelectedFramework(fw);
    const fwObj = FRAMEWORKS.find((f) => f.id === fw);
    const campName = selectedCampaign?.name || "Civic Oversight Initiative";
    setTitle(`${fwObj?.shortName || "Donor"} Grant Impact Dossier — ${campName}`);
  };

  const handleSelectCampaign = (campId: string) => {
    setSelectedCampaignId(campId);
    const camp = campaigns?.find((c) => c._id === campId);
    const fwObj = FRAMEWORKS.find((f) => f.id === selectedFramework);
    const campName = camp?.name || "Civic Oversight Initiative";
    setTitle(`${fwObj?.shortName || "Donor"} Grant Impact Dossier — ${campName}`);
    if (camp?.description) {
      setDescription(camp.description);
    }
  };

  const handleProceedToStep2 = () => {
    if (!title) {
      const fwObj = FRAMEWORKS.find((f) => f.id === selectedFramework);
      const campName = selectedCampaign?.name || "Civic Oversight Initiative";
      setTitle(`${fwObj?.shortName || "Donor"} Grant Impact Dossier — ${campName}`);
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    let periodStart = now - 90 * DAY;

    if (periodPreset === "90d") {
      periodStart = now - 90 * DAY;
    } else if (periodPreset === "q3") {
      // Q3 (Jul 1 - Sep 30)
      const currentYear = new Date().getFullYear();
      periodStart = new Date(currentYear, 6, 1).getTime();
    } else if (periodPreset === "q2") {
      const currentYear = new Date().getFullYear();
      periodStart = new Date(currentYear, 3, 1).getTime();
    } else if (periodPreset === "ytd") {
      periodStart = new Date(new Date().getFullYear(), 0, 1).getTime();
    } else if (periodPreset === "all") {
      periodStart = now - 365 * DAY;
    }

    try {
      const reportId = await createDonorGrantDossier({
        organizationId,
        title: title.trim(),
        description: description.trim() || undefined,
        donorFramework: selectedFramework,
        grantReference: grantReference.trim() || undefined,
        campaignId: selectedCampaignId ? (selectedCampaignId as Id<"campaigns">) : undefined,
        periodStart,
        periodEnd: now,
        targetObjectives: selectedCampaign?.objectives ?? undefined,
      });

      onSuccess?.(reportId);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate donor dossier");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--background)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5 bg-[var(--muted)]/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  Generate Grant Impact Dossier
                </h2>
                <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Rule 44 Compliant</span>
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Automated donor-ready dossier with frozen PIEI scores, growth curves & external citations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-6">
              {/* Step 1: Donor Framework Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
                  1. Select Donor Reporting Framework
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FRAMEWORKS.map((fw) => {
                    const isSelected = selectedFramework === fw.id;
                    return (
                      <button
                        key={fw.id}
                        type="button"
                        onClick={() => handleSelectFramework(fw.id)}
                        className={`text-left rounded-2xl border p-4 transition-all duration-150 flex flex-col justify-between ${
                          isSelected
                            ? `${fw.borderActive} ${fw.bgActive}`
                            : "border-[var(--border)] hover:border-[var(--muted-foreground)]/50 bg-[var(--card)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-[var(--background)] shadow-2xs">
                              {fw.icon}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-[var(--foreground)] leading-tight">
                                {fw.name}
                              </h3>
                              <span className="text-[10px] font-semibold text-[var(--muted-foreground)]">
                                {fw.shortName} Standard
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shrink-0">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <p className="mt-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
                          {fw.tagline}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-[var(--border)]/60 flex flex-wrap gap-1.5">
                          {fw.focusIndicators.map((ind, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-[var(--muted)] text-[var(--muted-foreground)]"
                            >
                              {ind}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
                  2. Select Campaign or Thematic Investigation
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSelectCampaign("")}
                    className={`w-full text-left rounded-xl border p-3 text-xs flex items-center justify-between transition-colors ${
                      selectedCampaignId === ""
                        ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--foreground)] font-semibold"
                        : "border-[var(--border)] hover:bg-[var(--muted)]/50 text-[var(--muted-foreground)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="h-4 w-4 text-[var(--primary)]" />
                      <span>Entire Organization (All Campaigns & Content)</span>
                    </div>
                    {selectedCampaignId === "" && <Check className="h-3.5 w-3.5 text-[var(--primary)]" />}
                  </button>

                  {campaigns &&
                    campaigns.map((camp) => {
                      const isSelected = selectedCampaignId === camp._id;
                      return (
                        <button
                          key={camp._id}
                          type="button"
                          onClick={() => handleSelectCampaign(camp._id)}
                          className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                            isSelected
                              ? "border-[var(--primary)] bg-[var(--primary)]/5"
                              : "border-[var(--border)] hover:bg-[var(--muted)]/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="h-2 w-2 rounded-full bg-emerald-500" />
                              <span className="text-xs font-bold text-[var(--foreground)]">
                                {camp.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-[var(--muted-foreground)]">
                              <span>{camp.postCount} posts</span>
                              <span>•</span>
                              <span>{camp.totalViews.toLocaleString()} views</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[var(--primary)] ml-1" />}
                            </div>
                          </div>
                          {camp.description && (
                            <p className="mt-1 text-[11px] text-[var(--muted-foreground)] line-clamp-1 pl-4.5">
                              {camp.description}
                            </p>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Grant Details & Verification */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--foreground)]">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[var(--primary)]" />
                    <span>Framework: {FRAMEWORKS.find((f) => f.id === selectedFramework)?.name}</span>
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    Target: {selectedCampaign?.name || "All Campaigns"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)] shadow-2xs"
                  placeholder="e.g. NED Grant Impact Dossier — Judicial Transparency Inquiry"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Grant Reference ID / Agreement Code
                  </label>
                  <input
                    type="text"
                    value={grantReference}
                    onChange={(e) => setGrantReference(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)] font-mono shadow-2xs"
                    placeholder="e.g. NED-2026-INV-842"
                  />
                  <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5 block">
                    Appears in header and formal donor seal.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Reporting Window
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "90d", label: "90 Days" },
                      { id: "q3", label: "Q3" },
                      { id: "ytd", label: "YTD" },
                      { id: "all", label: "1 Year" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPeriodPreset(p.id as typeof periodPreset)}
                        className={`rounded-lg py-2 text-xs font-medium border text-center transition-colors ${
                          periodPreset === p.id
                            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Executive Grantee Narrative & Context (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)] resize-none shadow-2xs"
                  placeholder="Summarize key investigation milestones, contextual obstacles, or strategic policy moments during this grant period..."
                />
              </div>

              {/* Tamper-Proof & Quality Assurances */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Automated Dossier Compilation Guarantee:</span>
                </div>
                <ul className="space-y-1 text-[11px] text-[var(--muted-foreground)] list-disc pl-5 leading-relaxed">
                  <li>
                    Computes weighted Public-Interest Engagement Index (PIEI) prioritizing citizen evidence archiving (5x saves) and peer mobilization (3x shares).
                  </li>
                  <li>
                    Freezes growth curve sparklines capturing 24h pickup velocity and 14d+ evergreen staying power.
                  </li>
                  <li>
                    Attaches verifiable external citations (Hansard transcripts, official gazettes, prime time media features) with active source URLs.
                  </li>
                  <li>
                    Adheres strictly to the Rule 44 Contribution Attribution standard for international donor audits.
                  </li>
                </ul>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4 bg-[var(--muted)]/10">
          {step === 1 ? (
            <>
              <span className="text-xs text-[var(--muted-foreground)]">
                Step 1 of 2: Framework & Campaign
              </span>
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-semibold text-[var(--primary-foreground)] shadow-sm hover:opacity-95 transition-opacity"
              >
                <span>Continue to Grant Details</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                ← Back to Framework Selection
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim()}
                className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-xs font-bold text-[var(--primary-foreground)] shadow-md hover:opacity-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Freezing Snapshot & Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Grant Impact Dossier</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
