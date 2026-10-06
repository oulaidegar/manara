"use client";

import { useMemo, useState } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import type { EChartsOption } from "echarts";

export interface OverviewTimePoint {
  date: string;
  impressions: number;
  reach: number;
  meaningfulActions: number;
}

interface OverviewTrendChartProps {
  data: OverviewTimePoint[];
  height?: number;
}

export function OverviewTrendChart({ data, height = 280 }: OverviewTrendChartProps) {
  const [metric, setMetric] = useState<"reach" | "impressions" | "meaningfulActions">("reach");

  const option = useMemo<EChartsOption>(() => {
    const dates = data.map((d) => d.date);
    const seriesData = data.map((d) => d[metric]);

    const metricConfig = {
      reach: {
        label: "Unique Reach",
        colorStart: "#6366f1",
        colorEnd: "rgba(99, 102, 241, 0.05)",
        lineColor: "#4f46e5",
      },
      impressions: {
        label: "Total Impressions",
        colorStart: "#3b82f6",
        colorEnd: "rgba(59, 130, 246, 0.05)",
        lineColor: "#2563eb",
      },
      meaningfulActions: {
        label: "Shares & Saves",
        colorStart: "#10b981",
        colorEnd: "rgba(16, 185, 129, 0.05)",
        lineColor: "#059669",
      },
    }[metric];

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "#334155",
        textStyle: { color: "#f8fafc", fontSize: 12 },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const first = params[0] as { dataIndex: number };
          const point = data[first.dataIndex];
          if (!point) return "";

          return `
            <div style="font-family: inherit; padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
                ${point.date}
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
                <span style="color: #818cf8;">● Unique Reach:</span>
                <span style="font-weight: 600; font-family: monospace;">${point.reach.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
                <span style="color: #60a5fa;">● Impressions:</span>
                <span style="font-weight: 600; font-family: monospace;">${point.impressions.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px;">
                <span style="color: #34d399;">● Meaningful Actions:</span>
                <span style="font-weight: 600; font-family: monospace;">${point.meaningfulActions.toLocaleString()}</span>
              </div>
            </div>
          `;
        },
      },
      grid: {
        left: "2%",
        right: "2%",
        top: "8%",
        bottom: "8%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: "#cbd5e1" } },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          formatter: (val: string) => {
            const parts = val.split("-");
            return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
          },
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          formatter: (value: number) => {
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
            if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
            return `${value}`;
          },
        },
        splitLine: {
          lineStyle: { color: "rgba(148, 163, 184, 0.12)", type: "dashed" },
        },
      },
      series: [
        {
          name: metricConfig.label,
          type: "line",
          smooth: 0.35,
          showSymbol: data.length < 15,
          symbolSize: 6,
          data: seriesData,
          lineStyle: {
            width: 2.5,
            color: metricConfig.lineColor,
          },
          itemStyle: {
            color: metricConfig.lineColor,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: metricConfig.colorStart },
                { offset: 1, color: metricConfig.colorEnd },
              ],
            },
          },
        },
      ],
    };
  }, [data, metric]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl"
        style={{ height }}
      >
        No activity trend data available yet. Import data or connect channels to view your publication velocity.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">
          Publication Velocity Timeline
        </span>
        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--background)] p-0.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setMetric("reach")}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              metric === "reach"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Reach
          </button>
          <button
            type="button"
            onClick={() => setMetric("impressions")}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              metric === "impressions"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Impressions
          </button>
          <button
            type="button"
            onClick={() => setMetric("meaningfulActions")}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              metric === "meaningfulActions"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Actions
          </button>
        </div>
      </div>
      <EChartsWrapper option={option} height={height} />
    </div>
  );
}
