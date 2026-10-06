"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import type { EChartsOption } from "echarts";

export interface PlatformDataPoint {
  platform: string;
  count: number;
  impressions: number;
  reach: number;
  shares: number;
  saves: number;
  meaningfulRate: number;
}

interface PlatformComparisonChartProps {
  data: PlatformDataPoint[];
  height?: number;
}

export function PlatformComparisonChart({
  data,
  height = 300,
}: PlatformComparisonChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const platforms = data.map((d) => d.platform.charAt(0).toUpperCase() + d.platform.slice(1));
    const impressionsData = data.map((d) => d.impressions);
    const reachData = data.map((d) => d.reach);

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "#334155",
        textStyle: { color: "#f8fafc", fontSize: 12 },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const first = params[0] as { dataIndex: number };
          const idx = first.dataIndex;
          const p = data[idx];
          if (!p) return "";

          return `
            <div style="font-family: inherit; padding: 4px;">
              <div style="font-weight: 600; text-transform: capitalize; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
                ${p.platform} (${p.count} posts)
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
                <span style="color: #60a5fa;">Impressions:</span>
                <span style="font-family: monospace; font-weight: 600;">${p.impressions.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
                <span style="color: #818cf8;">Unique Reach:</span>
                <span style="font-family: monospace; font-weight: 600;">${p.reach.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 6px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.1);">
                <span style="color: #34d399;">Action Rate:</span>
                <span style="color: #34d399; font-family: monospace; font-weight: 700;">${p.meaningfulRate.toFixed(1)} / 1k</span>
              </div>
            </div>
          `;
        },
      },
      legend: {
        data: ["Impressions", "Unique Reach"],
        top: 0,
        textStyle: { color: "#94a3b8", fontSize: 11 },
        itemGap: 14,
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: "8%",
        top: "14%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: platforms,
        axisLabel: { color: "#94a3b8", fontSize: 11 },
        axisLine: { lineStyle: { color: "#cbd5e1" } },
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
          lineStyle: { color: "rgba(148, 163, 184, 0.15)", type: "dashed" },
        },
      },
      series: [
        {
          name: "Impressions",
          type: "bar",
          data: impressionsData,
          barMaxWidth: 32,
          itemStyle: {
            color: "#3b82f6",
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: "Unique Reach",
          type: "bar",
          data: reachData,
          barMaxWidth: 32,
          itemStyle: {
            color: "#6366f1",
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl"
        style={{ height }}
      >
        No platform breakdown data available.
      </div>
    );
  }

  return <EChartsWrapper option={option} height={height} />;
}
