"use client";

import React, { useState } from "react";
import {
  Sparkles,
  TreePine,
  FileSearch,
  HelpCircle,
  Quote,
  Flame,
  Bookmark,
  Share2,
  FileText,
  Info,
} from "lucide-react";

interface PieiBadgeProps {
  score?: number;
  basis?: string;
  tier?: "exceptional" | "high" | "moderate" | "baseline";
  showFormulaTooltip?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PieiBadge({
  score,
  basis = "reach",
  tier = "moderate",
  showFormulaTooltip = true,
  size = "md",
}: PieiBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (score === undefined || score === null) return null;

  const getTierStyles = () => {
    switch (tier) {
      case "exceptional":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25";
      case "high":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25";
      case "moderate":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25";
      default:
        return "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]";
    }
  };

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-0.5 gap-1.5",
    lg: "text-sm px-2.5 py-1 gap-2 font-semibold",
  };

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center rounded-md border font-mono font-medium transition-colors cursor-help ${getTierStyles()} ${sizeClasses[size]}`}
      >
        <Sparkles className="h-3 w-3 shrink-0" />
        <span>PIEI {score.toFixed(1)}</span>
        {basis && (
          <span className="opacity-60 text-[9px] font-sans uppercase">
            /{basis.slice(0, 3)}
          </span>
        )}
      </div>

      {showFormulaTooltip && showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-left shadow-xl text-xs text-[var(--foreground)]">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--foreground)] pb-1 mb-1.5 border-b border-[var(--border)]">
            <Info className="h-3.5 w-3.5 text-purple-400" />
            <span>Public-Interest Engagement Index</span>
          </div>
          <p className="text-[11px] text-[var(--muted-foreground)] mb-2">
            Measures civic conviction and evidence archiving over passive vanity clicks:
          </p>
          <div className="rounded bg-[var(--muted)] p-2 font-mono text-[10px] text-[var(--foreground)] leading-relaxed">
            PIEI = ((Saves×5) + (Shares×3) + (Comments×2) + (Likes×1)) / {basis} × 100
          </div>
          <div className="mt-2 text-[10px] text-[var(--muted-foreground)] flex items-center justify-between">
            <span>Saves: 5x Archive Weight</span>
            <span className="text-purple-400 capitalize">{tier} Tier</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ConvictionPill({
  tier,
  saves,
  shares,
}: {
  tier?: "exceptional" | "high" | "moderate" | "baseline";
  saves?: number;
  shares?: number;
}) {
  if (tier === "exceptional") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300">
        <Sparkles className="h-2.5 w-2.5" />
        <span>Top 5% Conviction</span>
      </span>
    );
  }

  if (saves && saves >= 30) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
        <Bookmark className="h-2.5 w-2.5" />
        <span>High Archive Rate</span>
      </span>
    );
  }

  if (shares && shares >= 40) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
        <Share2 className="h-2.5 w-2.5" />
        <span>Amplification Magnet</span>
      </span>
    );
  }

  if (tier === "high") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
        <span>High Conviction</span>
      </span>
    );
  }

  return null;
}

export function EvergreenBadge({
  isEvergreen,
  score,
}: {
  isEvergreen?: boolean;
  score?: number;
}) {
  if (!isEvergreen) return null;

  return (
    <span
      title="Evergreen Tail Index: Continued shares, saves, and views > 14 days after publication"
      className="inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400 cursor-help"
    >
      <TreePine className="h-3 w-3 shrink-0 text-emerald-400" />
      <span>Evergreen</span>
      {score !== undefined && <span className="opacity-75">({score})</span>}
    </span>
  );
}

export function MicroTaxonomyPill({
  hookType,
  ctaType,
  slideBracket,
  videoLengthBracket,
}: {
  hookType?: string;
  ctaType?: string;
  slideBracket?: string;
  videoLengthBracket?: string;
}) {
  const getHookLabel = (hook?: string) => {
    switch (hook) {
      case "document_scan":
      case "leaked_record":
        return { label: "Leaked Record / Scan", icon: <FileSearch className="h-3 w-3 text-amber-400" /> };
      case "shock_statistic":
        return { label: "Shock Statistic", icon: <Flame className="h-3 w-3 text-rose-400" /> };
      case "statistic":
        return { label: "Statistic", icon: <Flame className="h-3 w-3 text-rose-400" /> };
      case "open_question":
      case "question":
        return { label: "Open Question", icon: <HelpCircle className="h-3 w-3 text-cyan-400" /> };
      case "direct_quote":
      case "quote":
        return { label: "Direct Quote", icon: <Quote className="h-3 w-3 text-purple-400" /> };
      default:
        return hook ? { label: hook.replace(/_/g, " "), icon: null } : null;
    }
  };

  const getCtaLabel = (cta?: string) => {
    switch (cta) {
      case "read_investigation":
        return "Read Investigation";
      case "archive_save":
        return "Archive / Save";
      case "sign_petition":
        return "Sign Petition";
      case "share":
        return "Amplify / Share";
      default:
        return cta && cta !== "none" ? cta.replace(/_/g, " ") : null;
    }
  };

  const hookInfo = getHookLabel(hookType);
  const ctaLabel = getCtaLabel(ctaType);

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
      {hookInfo && (
        <span className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--muted)]/50 px-1.5 py-0.5 text-[var(--foreground)] capitalize">
          {hookInfo.icon}
          <span>{hookInfo.label}</span>
        </span>
      )}

      {slideBracket && (
        <span className="inline-flex items-center gap-1 rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-blue-400">
          <FileText className="h-3 w-3" />
          <span>{slideBracket}</span>
        </span>
      )}

      {videoLengthBracket && (
        <span className="inline-flex items-center gap-1 rounded border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-purple-400">
          <span>{videoLengthBracket}</span>
        </span>
      )}

      {ctaLabel && (
        <span className="inline-flex items-center rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[var(--muted-foreground)] capitalize">
          CTA: {ctaLabel}
        </span>
      )}
    </div>
  );
}
