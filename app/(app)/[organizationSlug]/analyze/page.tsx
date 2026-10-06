"use client";

import { useOrganization } from "@/components/organization-context";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BarChart3,
  Calendar,
  Filter,
  Layers,
  FileSpreadsheet,
  Share2,
  Bookmark,
  Eye,
  Info,
  Radio,
  Loader2,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Target,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { TimeSeriesTrendChart } from "@/components/charts/time-series-trend-chart";
import { PlatformComparisonChart } from "@/components/charts/platform-comparison-chart";
import { FormatEfficiencyChart } from "@/components/charts/format-efficiency-chart";
import {
  ContentDetailModal,
  DetailedContentItem,
} from "@/components/analytics/content-detail-modal";
import { LearningWorkspace } from "@/components/learning/learning-workspace";

type SortField =
  | "publishedAt"
  | "title"
  | "provider"
  | "contentType"
  | "impressions"
  | "reach"
  | "views"
  | "shares"
  | "saves"
  | "meaningfulRate";

export default function AnalyzePage() {
  const { organizationId, organizationSlug } = useOrganization();

  // Filter States
  const [dateRange, setDateRange] = useState("90d");
  const [comparePeriod, setComparePeriod] = useState("previous_period");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedContentType, setSelectedContentType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Visualization States
  const [timeSeriesVolume, setTimeSeriesVolume] = useState<"impressions" | "reach" | "views">("impressions");
  const [activeVizTab, setActiveVizTab] = useState<"trend" | "breakdown" | "practices">("trend");

  // Table Sorting & Pagination
  const [sortField, setSortField] = useState<SortField>("publishedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected Content Item for Modal
  const [selectedItem, setSelectedItem] = useState<DetailedContentItem | null>(null);

  // Fetch Analyzed Data from Convex
  const analyzeData = useQuery(api.analytics.getAnalyzeData, {
    organizationId,
    provider: selectedChannel,
    contentType: selectedContentType,
    dateRange,
    comparePeriod,
  });

  const contentItems = analyzeData?.contentItems;

  // Filter & Sort Content Items
  const filteredAndSortedItems = useMemo(() => {
    if (!contentItems) return [];

    let items = [...contentItems];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.text && i.text.toLowerCase().includes(q)) ||
          i.provider.toLowerCase().includes(q)
      );
    }

    // Sort
    items.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      if (sortField === "publishedAt") {
        aVal = a.publishedAt;
        bVal = b.publishedAt;
      } else if (sortField === "title") {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      } else if (sortField === "provider") {
        aVal = a.provider;
        bVal = b.provider;
      } else if (sortField === "contentType") {
        aVal = a.contentType;
        bVal = b.contentType;
      } else if (sortField === "impressions") {
        aVal = a.metrics?.impressions ?? 0;
        bVal = b.metrics?.impressions ?? 0;
      } else if (sortField === "reach") {
        aVal = a.metrics?.reach ?? 0;
        bVal = b.metrics?.reach ?? 0;
      } else if (sortField === "views") {
        aVal = a.metrics?.views ?? 0;
        bVal = b.metrics?.views ?? 0;
      } else if (sortField === "shares") {
        aVal = a.metrics?.shares ?? 0;
        bVal = b.metrics?.shares ?? 0;
      } else if (sortField === "saves") {
        aVal = a.metrics?.saves ?? 0;
        bVal = b.metrics?.saves ?? 0;
      } else if (sortField === "meaningfulRate") {
        aVal = a.meaningfulRate ?? 0;
        bVal = b.meaningfulRate ?? 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [contentItems, searchQuery, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / pageSize) || 1;
  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Analyze</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Inspect exposure, audience retention, and communications performance across channels and formats.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${organizationSlug}/settings`}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>CSV Import Manager</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar (Section 20) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent focus:outline-hidden text-xs cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="ytd">Year to date</option>
              <option value="all">All Available Data</option>
            </select>
          </div>

          {/* Period Comparison Selector (Section 20) */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
            <span className="text-[var(--muted-foreground)]">Compare:</span>
            <select
              value={comparePeriod}
              onChange={(e) => setComparePeriod(e.target.value)}
              className="bg-transparent focus:outline-hidden text-xs cursor-pointer"
            >
              <option value="previous_period">vs. Previous Period</option>
              <option value="none">No Comparison</option>
            </select>
          </div>

          {/* Platform / Channel Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
            <Filter className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <select
              value={selectedChannel}
              onChange={(e) => {
                setSelectedChannel(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent focus:outline-hidden text-xs cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="youtube">YouTube</option>
              <option value="linkedin">LinkedIn</option>
              <option value="website">Website / Publications</option>
            </select>
          </div>

          {/* Content Type Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
            <Layers className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <select
              value={selectedContentType}
              onChange={(e) => {
                setSelectedContentType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent focus:outline-hidden text-xs cursor-pointer"
            >
              <option value="all">All Formats</option>
              <option value="investigation">Investigations</option>
              <option value="video">Videos</option>
              <option value="report">Reports</option>
              <option value="post">Posts / Briefings</option>
              <option value="article">Articles</option>
            </select>
          </div>
        </div>

        {/* Quick Item Counter */}
        {analyzeData && (
          <div className="text-xs text-[var(--muted-foreground)] font-medium">
            Showing <strong className="text-[var(--foreground)]">{filteredAndSortedItems.length}</strong> content outputs
          </div>
        )}
      </div>

      {/* Loading State */}
      {analyzeData === undefined && (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
          <div className="text-xs text-[var(--muted-foreground)]">Computing analytics and aggregations...</div>
        </div>
      )}

      {/* Main Content Area */}
      {analyzeData && (
        <>
          {/* Rate KPI Cards (Section 20 & 26) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Impressions */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">Total Impressions</span>
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--foreground)] tracking-tight">
                {analyzeData.kpis.totalImpressions.toLocaleString()}
              </div>
              {comparePeriod === "previous_period" && (
                <div className="flex items-center gap-1 text-[11px] pt-1 font-medium">
                  {analyzeData.kpis.deltas.impressions >= 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      +{analyzeData.kpis.deltas.impressions}%
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                      {analyzeData.kpis.deltas.impressions}%
                    </span>
                  )}
                  <span className="text-[var(--muted-foreground)]">vs prev</span>
                </div>
              )}
            </div>

            {/* KPI 2: Unique Reach */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">Unique Reach</span>
                <Radio className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--foreground)] tracking-tight">
                {analyzeData.kpis.totalReach.toLocaleString()}
              </div>
              {comparePeriod === "previous_period" && (
                <div className="flex items-center gap-1 text-[11px] pt-1 font-medium">
                  {analyzeData.kpis.deltas.reach >= 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      +{analyzeData.kpis.deltas.reach}%
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                      {analyzeData.kpis.deltas.reach}%
                    </span>
                  )}
                  <span className="text-[var(--muted-foreground)]">vs prev</span>
                </div>
              )}
            </div>

            {/* KPI 3: Meaningful Actions */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
                  Meaningful Actions
                </span>
                <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-200 tracking-tight">
                {analyzeData.kpis.meaningfulActions.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                {(analyzeData.kpis.totalShares).toLocaleString()} shares · {(analyzeData.kpis.totalSaves).toLocaleString()} saves
              </div>
            </div>

            {/* KPI 4: Meaningful Action Rate (Section 26) */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--foreground)]">Action Rate / 1k</span>
                <Bookmark className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--foreground)] tracking-tight">
                {analyzeData.kpis.meaningfulRate}
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1">
                <Info className="h-3 w-3 text-[var(--muted-foreground)] shrink-0" />
                <span className="truncate" title="(Shares + Saves + Clicks) / (Impressions / 1,000)">
                  (actions) / (impr / 1k)
                </span>
              </div>
            </div>

            {/* KPI 5: Reach Efficiency */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">Reach-to-Impr Ratio</span>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--foreground)] tracking-tight">
                {analyzeData.kpis.reachRatio}%
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)]">
                Unique viewer efficiency proxy
              </div>
            </div>
          </div>

          {/* Interactive Apache ECharts Visualizations */}
          <div className="space-y-4">
            {/* Chart Section Header with Tabs & Volume Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setActiveVizTab("trend")}
                  className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeVizTab === "trend"
                      ? "border-[var(--primary)] text-[var(--foreground)]"
                      : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Exposure & Rate Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVizTab("breakdown")}
                  className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                    activeVizTab === "breakdown"
                      ? "border-[var(--primary)] text-[var(--foreground)]"
                      : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Channel & Format Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVizTab("practices")}
                  className={`text-sm font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeVizTab === "practices"
                      ? "border-[var(--primary)] text-[var(--foreground)]"
                      : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span>Strategic Practices</span>
                </button>
              </div>

              {activeVizTab === "trend" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">Volume Metric:</span>
                  <div className="flex rounded-lg border border-[var(--border)] bg-[var(--background)] p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setTimeSeriesVolume("impressions")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        timeSeriesVolume === "impressions"
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      Impressions
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeSeriesVolume("reach")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        timeSeriesVolume === "reach"
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      Reach
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeSeriesVolume("views")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        timeSeriesVolume === "views"
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      Views
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TAB 1: Dual-Axis Time Series Trend Chart */}
            {activeVizTab === "trend" && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      Daily Communications Exposure vs. Retention Rate
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Blue bars represent exposure volume (left axis); emerald line represents Meaningful Action Rate per 1,000 impressions (right axis). Drag the slider to zoom in.
                    </p>
                  </div>
                </div>

                <TimeSeriesTrendChart
                  data={analyzeData.timeSeries}
                  metricVolume={timeSeriesVolume}
                  height={340}
                />
              </div>
            )}

            {/* TAB 2: Channel & Format Efficiency Breakdown */}
            {activeVizTab === "breakdown" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Platform Chart */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Channel Exposure Comparison</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Total impressions and unique individual reach across platforms.
                    </p>
                  </div>
                  <PlatformComparisonChart data={analyzeData.platformBreakdown} height={280} />
                </div>

                {/* Format Efficiency Chart */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Format Action Efficiency</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Which formats generate the highest density of shares and saves per 1,000 views?
                    </p>
                  </div>
                  <FormatEfficiencyChart data={analyzeData.formatBreakdown} height={280} />
                </div>
              </div>
            )}

            {/* TAB 3: Strategic Communications Practices & Hypotheses */}
            {activeVizTab === "practices" && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xs">
                <LearningWorkspace />
              </div>
            )}
          </div>

          {/* Sortable Content Ranking Table (Section 20) */}
          {activeVizTab !== "practices" && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">Content Performance Register</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Click any row to inspect complete item parameters, linked initiatives, and contribution evidence.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Filter by title or excerpt..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-8 pr-3 py-1.5 text-xs text-[var(--foreground)]"
                />
              </div>
            </div>

            {filteredAndSortedItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">
                No content items match the current filters or search query.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--border)] overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-[var(--muted-foreground)] font-medium">
                      <tr>
                        <th
                          onClick={() => toggleSort("publishedAt")}
                          className="py-2.5 px-3 cursor-pointer hover:text-[var(--foreground)]"
                        >
                          <div className="flex items-center gap-1">
                            <span>Date</span>
                            {sortField === "publishedAt" ? (
                              sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => toggleSort("title")}
                          className="py-2.5 px-3 cursor-pointer hover:text-[var(--foreground)]"
                        >
                          <div className="flex items-center gap-1">
                            <span>Content Item / Title</span>
                            {sortField === "title" ? (
                              sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => toggleSort("provider")}
                          className="py-2.5 px-3 cursor-pointer hover:text-[var(--foreground)]"
                        >
                          <span>Platform</span>
                        </th>
                        <th
                          onClick={() => toggleSort("contentType")}
                          className="py-2.5 px-3 cursor-pointer hover:text-[var(--foreground)]"
                        >
                          <span>Format</span>
                        </th>
                        <th
                          onClick={() => toggleSort("impressions")}
                          className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--foreground)]"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Impressions</span>
                            {sortField === "impressions" && (
                              sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => toggleSort("reach")}
                          className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--foreground)]"
                        >
                          <span>Reach</span>
                        </th>
                        <th
                          onClick={() => toggleSort("views")}
                          className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--foreground)]"
                        >
                          <span>Views</span>
                        </th>
                        <th
                          onClick={() => toggleSort("shares")}
                          className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--foreground)]"
                        >
                          <span>Shares</span>
                        </th>
                        <th
                          onClick={() => toggleSort("saves")}
                          className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--foreground)]"
                        >
                          <span>Saves</span>
                        </th>
                        <th
                          onClick={() => toggleSort("meaningfulRate")}
                          className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--foreground)]"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Action Rate</span>
                            {sortField === "meaningfulRate" && (
                              sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {paginatedItems.map((item) => (
                        <tr
                          key={item._id}
                          onClick={() => setSelectedItem(item as DetailedContentItem)}
                          className="hover:bg-[var(--muted)]/30 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--muted-foreground)]">
                            {new Date(item.publishedAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 max-w-[280px]">
                            <div className="font-medium text-[var(--foreground)] truncate">
                              {item.title}
                            </div>
                            {item.initiativeName && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                <Target className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{item.initiativeName}</span>
                              </div>
                            )}
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
                          <td className="py-2.5 px-3 text-right font-mono">
                            {item.metrics?.views?.toLocaleString() ?? "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-[var(--foreground)]">
                            {item.metrics?.shares?.toLocaleString() ?? "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {item.metrics?.saves?.toLocaleString() ?? "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.meaningfulRate?.toFixed(1) ?? "0.0"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-2">
                  <div>
                    Page {currentPage} of {totalPages} ({filteredAndSortedItems.length} total outputs)
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1 rounded-md border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--muted)]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-1 rounded-md border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--muted)]"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </>
    )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ContentDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
