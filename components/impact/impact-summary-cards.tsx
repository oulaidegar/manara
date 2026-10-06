"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ShieldCheck, FileCheck2, Compass, Layers, CheckCircle2 } from "lucide-react";

interface ImpactSummaryCardsProps {
  organizationId: Id<"organizations">;
}

export function ImpactSummaryCards({ organizationId }: ImpactSummaryCardsProps) {
  const summary = useQuery(api.impact.getImpactSummary, { organizationId });

  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const {
    totalOutcomes,
    candidatesCount,
    documentedCount,
    corroboratedCount,
    verifiedCount,
    totalEvidenceCount,
    initiativesLinkedCount,
  } = summary;

  const corroboratedOrVerified = corroboratedCount + verifiedCount;
  const verifiedPercentage =
    totalOutcomes > 0 ? Math.round((corroboratedOrVerified / totalOutcomes) * 100) : 0;
  const linkedPercentage =
    totalOutcomes > 0 ? Math.round((initiativesLinkedCount / totalOutcomes) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Documented Outcomes */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            Observed Outcomes
          </span>
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Compass className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {totalOutcomes}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
            {candidatesCount} review candidates pending
          </div>
        </div>
      </div>

      {/* 2. Corroborated / Verified Pipeline */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            Corroborated / Verified
          </span>
          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {corroboratedOrVerified}{" "}
            <span className="text-xs font-normal text-[var(--muted-foreground)]">
              ({verifiedPercentage}%)
            </span>
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>
              {verifiedCount} verified, {corroboratedCount} corroborated, {documentedCount} documented
            </span>
          </div>
        </div>
      </div>

      {/* 3. Verifiable Evidence Items */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            Evidence Items Attached
          </span>
          <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <FileCheck2 className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {totalEvidenceCount}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
            Official records, citations & excerpts
          </div>
        </div>
      </div>

      {/* 4. Strategic Alignment */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            Strategic Alignment
          </span>
          <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {initiativesLinkedCount}{" "}
            <span className="text-xs font-normal text-[var(--muted-foreground)]">
              ({linkedPercentage}%)
            </span>
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-amber-500" />
            <span>Tied to active initiatives</span>
          </div>
        </div>
      </div>
    </div>
  );
}
