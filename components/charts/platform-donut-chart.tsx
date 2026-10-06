"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import type { EChartsOption } from "echarts";

export interface PlatformDonutItem {
  platform: string;
  count: number;
  reach: number;
  impressions: number;
}

interface PlatformDonutChartProps {
  data: PlatformDonutItem[];
  height?: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#ef4444",
  linkedin: "#0284c7",
  meta: "#ec4899",
  website: "#10b981",
  substack: "#f97316",
  twitter: "#06b6d4",
  tiktok: "#6366f1",
  podcast: "#8b5cf6",
  general: "#64748b",
};

export function PlatformDonutChart({ data, height = 260 }: PlatformDonutChartProps) {
  const totalReach = useMemo(() => {
    return data.reduce((sum, item) => sum + item.reach, 0);
  }, [data]);

  const option = useMemo<EChartsOption>(() => {
    const pieData = data.map((d) => ({
      name: d.platform.charAt(0).toUpperCase() + d.platform.slice(1),
      value: d.reach,
      itemStyle: {
        color: PLATFORM_COLORS[d.platform.toLowerCase()] || "#64748b",
      },
    }));

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "#334155",
        textStyle: { color: "#f8fafc", fontSize: 12 },
        formatter: (params: unknown) => {
          const item = params as { name: string; value: number; percent: number };
          return `
            <div style="font-family: inherit; padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
              <div style="display: flex; justify-content: space-between; gap: 12px;">
                <span>Reach:</span>
                <span style="font-family: monospace; font-weight: 600;">${item.value.toLocaleString()} (${item.percent.toFixed(1)}%)</span>
              </div>
            </div>
          `;
        },
      },
      legend: {
        orient: "horizontal",
        bottom: 0,
        textStyle: { color: "#94a3b8", fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
      },
      series: [
        {
          name: "Reach by Channel",
          type: "pie",
          radius: ["50%", "72%"],
          center: ["50%", "45%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: "var(--background, #fff)",
            borderWidth: 2,
          },
          label: {
            show: false,
            position: "center",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: "bold",
              formatter: "{b}\n{d}%",
            },
          },
          labelLine: {
            show: false,
          },
          data: pieData,
        },
      ],
    };
  }, [data]);

  if (data.length === 0 || totalReach === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl"
        style={{ height }}
      >
        No channel distribution data available.
      </div>
    );
  }

  return <EChartsWrapper option={option} height={height} />;
}
