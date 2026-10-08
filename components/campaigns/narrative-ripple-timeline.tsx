"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PlatformIcon } from "@/components/social/platform-icon";
import { PieiBadge, ConvictionPill, EvergreenBadge } from "@/components/social/insight-pill";
import {
  ExternalLink,
  Flame,
  FileCheck2,
  Sparkles,
  Award,
} from "lucide-react";

export interface TimelinePost {
  _id: string;
  title?: string;
  caption?: string;
  platform: string;
  postType?: string;
  publishedAt?: number;
  views?: number;
  reach?: number;
  shares?: number;
  saves?: number;
  pieiScore?: number;
  convictionTier?: "exceptional" | "high" | "moderate" | "baseline";
  isEvergreen?: boolean;
  velocityRatio24h?: number;
  hookType?: string;
  callToAction?: string;
}

export interface TimelineImpactEvent {
  _id: string;
  type: string;
  title: string;
  summary: string;
  occurredAt?: number;
  discoveredAt: number;
  confidence: number;
  status: string;
  evidence?: Array<{
    _id: string;
    sourceUrl: string;
    sourceTitle?: string;
    publisher?: string;
    evidenceText?: string;
  }>;
}

interface NarrativeRippleTimelineProps {
  posts: TimelinePost[];
  impactEvents: TimelineImpactEvent[];
  campaignName?: string;
  organizationSlug: string;
}

type TimelineNode =
  | {
      kind: "post";
      timestamp: number;
      dayOffset: number;
      data: TimelinePost;
    }
  | {
      kind: "impact";
      timestamp: number;
      dayOffset: number;
      data: TimelineImpactEvent;
    };

export function NarrativeRippleTimeline({
  posts,
  impactEvents,
  campaignName: _campaignName,
  organizationSlug,
}: NarrativeRippleTimelineProps) {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "posts" | "impacts">("all");

  // Merge and sort chronologically
  const { timelineNodes, metrics } = useMemo(() => {
    const rawNodes: Array<
      | { kind: "post"; timestamp: number; data: TimelinePost }
      | { kind: "impact"; timestamp: number; data: TimelineImpactEvent }
    > = [];

    for (const p of posts) {
      if (p.publishedAt) {
        rawNodes.push({ kind: "post", timestamp: p.publishedAt, data: p });
      }
    }

    for (const ev of impactEvents) {
      const ts = ev.occurredAt ?? ev.discoveredAt;
      rawNodes.push({ kind: "impact", timestamp: ts, data: ev });
    }

    rawNodes.sort((a, b) => a.timestamp - b.timestamp);

    const earliestTs = rawNodes.length > 0 ? rawNodes[0].timestamp : 0;
    const latestTs = rawNodes.length > 0 ? rawNodes[rawNodes.length - 1].timestamp : 0;
    const DAY_MS = 24 * 60 * 60 * 1000;

    const nodes: TimelineNode[] = rawNodes.map((n) => {
      const diffDays = Math.max(0, Math.round((n.timestamp - earliestTs) / DAY_MS));
      if (n.kind === "post") {
        return {
          kind: "post",
          timestamp: n.timestamp,
          dayOffset: diffDays,
          data: n.data,
        };
      }
      return {
        kind: "impact",
        timestamp: n.timestamp,
        dayOffset: diffDays,
        data: n.data,
      };
    });

    // Compute ripple metrics
    const anchorPost = posts.length > 0 ? posts[0] : null;
    const secondaryPosts = posts.slice(1);
    const secondaryReach = secondaryPosts.reduce((sum, p) => sum + (p.reach ?? p.views ?? 0), 0);
    const secondaryShares = secondaryPosts.reduce((sum, p) => sum + (p.shares ?? 0), 0);
    const secondarySaves = secondaryPosts.reduce((sum, p) => sum + (p.saves ?? 0), 0);

    const lifespanDays = Math.max(1, Math.round((latestTs - earliestTs) / DAY_MS));

    // Determine highest conversion format
    const formatScores: Record<string, { count: number; totalPiei: number; saves: number }> = {};
    for (const p of posts) {
      const fmt = p.postType || "post";
      if (!formatScores[fmt]) {
        formatScores[fmt] = { count: 0, totalPiei: 0, saves: 0 };
      }
      formatScores[fmt].count++;
      formatScores[fmt].totalPiei += p.pieiScore ?? 0;
      formatScores[fmt].saves += p.saves ?? 0;
    }

    let topFormat = "carousel";
    let topFormatAvgPiei = 0;
    for (const [fmt, stat] of Object.entries(formatScores)) {
      const avg = stat.count > 0 ? stat.totalPiei / stat.count : 0;
      if (avg > topFormatAvgPiei) {
        topFormatAvgPiei = avg;
        topFormat = fmt;
      }
    }

    return {
      timelineNodes: nodes,
      metrics: {
        totalDays: lifespanDays,
        anchorPost,
        secondaryCount: secondaryPosts.length,
        secondaryReach,
        secondaryShares,
        secondarySaves,
        impactCount: impactEvents.length,
        topFormat,
        topFormatAvgPiei: Number(topFormatAvgPiei.toFixed(1)),
      },
    };
  }, [posts, impactEvents]);

  const filteredNodes = useMemo(() => {
    if (selectedFilter === "posts") return timelineNodes.filter((n) => n.kind === "post");
    if (selectedFilter === "impacts") return timelineNodes.filter((n) => n.kind === "impact");
    return timelineNodes;
  }, [timelineNodes, selectedFilter]);

  if (timelineNodes.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-xs text-[var(--muted-foreground)]">
        No content or events linked to this campaign timeline yet. Add posts or log impact evidence to visualize the Cross-Platform Narrative Ripple.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ripple Dynamics Intelligence Header */}
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-indigo-50/40 via-[var(--card)] to-purple-50/20 dark:from-indigo-950/20 dark:to-purple-950/10 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                Cross-Platform Narrative Ripple
              </h3>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Diffusion Engine
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed">
              Traces how the investigation diffused from primary launch exposé across social secondary formats to external policy and prosecutorial citations.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start lg:self-auto bg-[var(--background)] p-1 rounded-xl border border-[var(--border)] text-xs">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedFilter === "all"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-2xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Full Ripple ({timelineNodes.length})
            </button>
            <button
              onClick={() => setSelectedFilter("posts")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedFilter === "posts"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-2xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setSelectedFilter("impacts")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedFilter === "impacts"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-2xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Impact Citations ({impactEvents.length})
            </button>
          </div>
        </div>

        {/* 4 Ripple KPI Callouts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 space-y-1">
            <span className="text-[10px] font-medium text-[var(--muted-foreground)] block">
              Narrative Lifespan
            </span>
            <div className="text-xl font-bold font-mono text-[var(--foreground)]">
              {metrics.totalDays} Days
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              From launch to latest uptake
            </span>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 space-y-1">
            <span className="text-[10px] font-medium text-[var(--muted-foreground)] block">
              Secondary Amplification
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +{metrics.secondaryShares.toLocaleString()}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              Shares driven by secondary formats
            </span>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 space-y-1">
            <span className="text-[10px] font-medium text-[var(--muted-foreground)] block">
              Evidence Archiving
            </span>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {metrics.secondarySaves.toLocaleString()}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              High-conviction saves
            </span>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 space-y-1">
            <span className="text-[10px] font-medium text-[var(--muted-foreground)] block">
              Top Converter Format
            </span>
            <div className="text-xl font-bold font-mono capitalize text-[var(--accent)]">
              {metrics.topFormat}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              Avg. PIEI: {metrics.topFormatAvgPiei}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Timeline Flow */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--border)]">
        {filteredNodes.map((node, index) => {
          const isAnchor = index === 0 && node.kind === "post";

          return (
            <div key={`${node.kind}_${node.data._id}`} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                  node.kind === "impact"
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                    : isAnchor
                    ? "border-indigo-500 bg-indigo-500 text-white shadow-xs"
                    : "border-[var(--primary)] bg-[var(--background)] text-[var(--primary)]"
                }`}
              >
                {node.kind === "impact" ? (
                  <Award className="h-3 w-3" />
                ) : isAnchor ? (
                  <Flame className="h-3 w-3" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                )}
              </div>

              {/* Node Card */}
              {node.kind === "post" ? (
                /* Post Timeline Node */
                <div
                  className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs ${
                    isAnchor
                      ? "border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/10"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]/60">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-[var(--muted)] text-[var(--muted-foreground)]">
                        {node.dayOffset === 0 ? "Launch (Day 0)" : `Day +${node.dayOffset}`}
                      </span>

                      {isAnchor && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                          Story Anchor
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-xs font-semibold text-[var(--foreground)] capitalize">
                        <PlatformIcon platform={node.data.platform} className="h-3.5 w-3.5" />
                        <span>{node.data.platform}</span>
                      </div>

                      <span className="text-[10px] text-[var(--muted-foreground)] capitalize">
                        • {node.data.postType || "post"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      {node.data.pieiScore !== undefined && (
                        <PieiBadge score={node.data.pieiScore} size="sm" />
                      )}
                      {node.data.convictionTier && (
                        <ConvictionPill tier={node.data.convictionTier} />
                      )}
                      {node.data.isEvergreen && <EvergreenBadge isEvergreen={true} />}
                    </div>
                  </div>

                  {/* Title and Hook */}
                  <div className="pt-2.5 space-y-1.5">
                    <Link
                      href={`/${organizationSlug}/content/${node.data._id}`}
                      className="text-xs sm:text-sm font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors line-clamp-2 inline-flex items-center gap-1"
                    >
                      <span>{node.data.title || node.data.caption || "Investigation Output"}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                    </Link>

                    {node.data.hookType && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-[var(--muted-foreground)]">
                        <span className="font-semibold text-[var(--foreground)]">Micro-Hook:</span>
                        <span className="px-2 py-0.5 rounded-md bg-[var(--muted)] capitalize text-[10px]">
                          {node.data.hookType.replace(/_/g, " ")}
                        </span>
                        {node.data.callToAction && (
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            CTA: {node.data.callToAction.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metrics Row */}
                  <div className="mt-3 pt-2.5 border-t border-[var(--border)]/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4 text-[11px]">
                      <span>
                        <strong className="font-mono text-[var(--foreground)]">
                          {(node.data.views ?? 0).toLocaleString()}
                        </strong>{" "}
                        <span className="text-[var(--muted-foreground)]">views</span>
                      </span>
                      <span>
                        <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                          {(node.data.shares ?? 0).toLocaleString()}
                        </strong>{" "}
                        <span className="text-[var(--muted-foreground)]">shares</span>
                      </span>
                      <span>
                        <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                          {(node.data.saves ?? 0).toLocaleString()}
                        </strong>{" "}
                        <span className="text-[var(--muted-foreground)]">saves</span>
                      </span>
                    </div>

                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {new Date(node.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                /* Impact Event Milestone Node */
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-emerald-500 text-white">
                        Uptake Milestone (Day +{node.dayOffset})
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                        {node.data.type.replace(/_/g, " ")}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                        {node.data.status}
                      </span>
                    </div>

                    <span className="text-xs text-[var(--muted-foreground)] font-mono">
                      {new Date(node.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                      <FileCheck2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{node.data.title}</span>
                    </h4>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed">
                      {node.data.summary}
                    </p>
                  </div>

                  {/* Corroborating Citation Badges */}
                  {node.data.evidence && node.data.evidence.length > 0 && (
                    <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                        Verified Primary Artifact Citations ({node.data.evidence.length}):
                      </span>
                      <div className="space-y-1">
                        {node.data.evidence.map((ev) => (
                          <div
                            key={ev._id}
                            className="rounded-lg bg-[var(--background)] p-2 border border-emerald-500/20 text-xs flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[var(--foreground)]">
                                {ev.sourceTitle || ev.publisher || "Official Record"}
                              </span>
                              <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                                • {ev.publisher}
                              </span>
                            </div>

                            {ev.sourceUrl && (
                              <a
                                href={ev.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--primary)] hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <span>View Source</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
