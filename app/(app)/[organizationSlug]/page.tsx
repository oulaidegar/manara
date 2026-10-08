"use client";

import { useOrganization } from "@/components/organization-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Target,
  FileText,
  BarChart2,
  TrendingUp,
  BookmarkCheck,
  Calendar,
  Compass,
  Database,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { OverviewTrendChart } from "@/components/charts/overview-trend-chart";
import { PlatformDonutChart } from "@/components/charts/platform-donut-chart";

export default function OrganizationHomePage() {
  const { organization, organizationId, organizationName, organizationSlug, userRole } =
    useOrganization();
  const { user } = useUser();

  const briefing = useQuery(api.analytics.getBriefingData, { organizationId });
  const seedDemo = useMutation(api.seed.seedDemoData);
  const seedSocial = useMutation(api.seedSocial.seedSocialData);
  const [isSeeding, setIsSeeding] = useState(false);

  const greetingName = user?.firstName ?? user?.fullName ?? "there";
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDemo({ organizationId });
      alert(res.message || "Demo dataset loaded successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to seed demo data");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSeedSocial = async () => {
    setIsSeeding(true);
    try {
      const res = await seedSocial({ organizationId });
      alert(`Social Intelligence Seeded! Created ${res.accountsCreated} accounts and ${res.postsCreated} posts.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to seed social dataset");
    } finally {
      setIsSeeding(false);
    }
  };

  const hasData = briefing && briefing.performance.contentCount > 0;
  const canSeed = userRole === "owner" || userRole === "admin" || userRole === "analyst";

  return (
    <div className="space-y-8 pb-12">
      {/* Briefing Header (Section 25) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]">
            <Calendar className="h-3.5 w-3.5" />
            <span>{currentDate}</span>
            <span>•</span>
            <span className="capitalize">{organization.organizationType.replace("_", " ")}</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Good day, {greetingName}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Here is your executive communications and impact briefing for{" "}
            <span className="font-medium text-[var(--foreground)]">{organizationName}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canSeed && (
            <button
              onClick={handleSeedSocial}
              disabled={isSeeding}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
            >
              {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              <span>{isSeeding ? "Seeding..." : "Seed Social Intelligence (110+ Posts)"}</span>
            </button>
          )}

          {!hasData && canSeed && (
            <button
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-3.5 py-2 text-sm font-semibold text-amber-900 dark:text-amber-200 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              <span>{isSeeding ? "Seeding..." : "Load General Demo Data"}</span>
            </button>
          )}

          <Link
            href={`/${organizationSlug}/content`}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity shadow-xs"
          >
            <BarChart2 className="h-4 w-4" />
            <span>Content Explorer</span>
          </Link>
        </div>
      </div>

      {/* Briefing Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Main Intelligence */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section: Radar Noticed (Interpretation before dashboards) */}
          <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/10 p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              <Sparkles className="h-4 w-4" />
              <span>Radar Noticed</span>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
              &ldquo;Investigation outputs generate 2.1× your normal share rate.&rdquo;
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
              Posts leading with primary source documentation produced a 26.8% higher median share rate
              than teasers or opinion posts. Audiences in public interest sectors prioritize inspectable evidence.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs font-medium text-[var(--accent)]">
              <Link href={`/${organizationSlug}/analyze`} className="flex items-center gap-1 hover:underline">
                Inspect analysis in Analyze <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Section: Communications Performance Snapshot */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Performance Snapshot
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Normalized reach and meaningful interactions across all active channels
                </p>
              </div>
              <Link
                href={`/${organizationSlug}/analyze`}
                className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                View breakdown →
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Total Reach</span>
                  <Compass className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>
                <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">
                  {briefing ? briefing.performance.totalReach.toLocaleString() : "..."}
                </div>
                <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {briefing?.performance.totalImpressions.toLocaleString() || 0} impressions
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Meaningful Actions</span>
                  <BookmarkCheck className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>
                <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">
                  {briefing ? briefing.performance.meaningfulActions.toLocaleString() : "..."}
                </div>
                <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Shares, saves, and report clicks
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Meaningful Action Rate</span>
                  <TrendingUp className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>
                <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">
                  {briefing ? `${briefing.performance.meaningfulRate}` : "..."}
                </div>
                <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Per 1,000 impressions
                </div>
              </div>
            </div>

            {/* Interactive Charts Section */}
            {briefing?.timeSeries && briefing.timeSeries.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[var(--border)] grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <OverviewTrendChart data={briefing.timeSeries} height={260} />
                </div>
                <div className="border-t lg:border-t-0 lg:border-l border-[var(--border)] lg:pl-6 pt-4 lg:pt-0">
                  <span className="text-xs font-medium text-[var(--muted-foreground)] block mb-2">
                    Channel Reach Distribution
                  </span>
                  <PlatformDonutChart data={briefing.platformBreakdown ?? []} height={230} />
                </div>
              </div>
            )}
          </div>

          {/* Section: Active Initiatives */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Active Initiatives
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Organizing outputs and campaigns by mission goals rather than social platform
                </p>
              </div>
              <Link
                href={`/${organizationSlug}/initiatives`}
                className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                All initiatives ({briefing?.activeInitiatives.length ?? 0}) →
              </Link>
            </div>

            {briefing?.activeInitiatives && briefing.activeInitiatives.length > 0 ? (
              <div className="mt-4 divide-y divide-[var(--border)]">
                {briefing.activeInitiatives.map((init) => (
                  <div key={init._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-[var(--foreground)]">{init.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
                        {init.description}
                      </div>
                    </div>
                    <Link
                      href={`/${organizationSlug}/initiatives`}
                      className="text-xs font-medium text-[var(--accent)] hover:underline flex items-center gap-1"
                    >
                      Inspect <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                  <Target className="h-5 w-5" />
                </div>
                <h4 className="mt-3 text-sm font-medium text-[var(--foreground)]">No active initiatives yet</h4>
                <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                  Load the demo dataset or create your first initiative to map content to societal change.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Impact & Learning Column */}
        <div className="space-y-6">
          {/* Candidate Outcomes Queue */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Outcomes Queue</span>
              </div>
              {briefing && briefing.candidateOutcomes.length > 0 && (
                <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
                  {briefing.candidateOutcomes.length} Need Review
                </span>
              )}
            </div>

            <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
              Real-World Outcomes
            </h3>
            <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed">
              External changes observed following your communications releases.
            </p>

            {briefing?.recentOutcomes && briefing.recentOutcomes.length > 0 ? (
              <div className="mt-4 space-y-3">
                {briefing.recentOutcomes.map((out) => (
                  <div key={out._id} className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--foreground)] line-clamp-1">{out.title}</span>
                      <span className="capitalize px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[var(--muted)]">
                        {out.verificationStatus}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)] line-clamp-2">
                      {out.contributionStatement}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4 text-xs text-[var(--muted-foreground)]">
                No outcomes logged yet. Document external policy, media, or institutional changes in Impact.
              </div>
            )}

            <Link
              href={`/${organizationSlug}/impact`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <span>Open Impact Pipeline</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Institutional Learning Engine */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              <BarChart2 className="h-4 w-4 text-[var(--accent)]" />
              <span>Learning Engine</span>
            </div>
            <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
              Tested Communications Hypotheses
            </h3>
            <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed">
              Radar turns your historical performance into verified organizational memory.
            </p>

            {briefing?.practices && briefing.practices.length > 0 ? (
              <div className="mt-4 space-y-2.5">
                {briefing.practices.map((practice) => (
                  <div key={practice._id} className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-xs">
                    <div className="font-semibold text-[var(--foreground)]">{practice.title}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                      {practice.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-xs">
                  <div className="font-medium text-[var(--foreground)]">Lead with key finding</div>
                  <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                    Positive signal (+26% shares in historical data)
                  </div>
                </div>
              </div>
            )}

            <Link
              href={`/${organizationSlug}/analyze`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <span>Explore Hypotheses & Practices</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Monthly Report Quick Action */}
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-center">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
              <FileText className="h-4 w-4" />
            </div>
            <h4 className="mt-2 text-xs font-semibold text-[var(--foreground)]">Published Reports ({briefing?.reports.length ?? 0})</h4>
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
              Tamper-proof snapshots ready for distribution to boards, donors, and partners.
            </p>
            <Link
              href={`/${organizationSlug}/reports`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90"
            >
              <span>View Published Reports</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
