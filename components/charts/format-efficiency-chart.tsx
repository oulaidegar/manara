"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import type { EChartsOption } from "echarts";

export interface FormatDataPoint {
  format: string;
  count: number;
  impressions: number;
  views: number;
  shares: number;
  saves: number;
  efficiencyRate: number;
}

interface FormatEfficiencyChartProps {
  data: FormatDataPoint[];
  height?: number;
}

export function FormatEfficiencyChart({
  data,
  height = 300,
}: FormatEfficiencyChartProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.efficiencyRate - a.efficiencyRate);
  }, [data]);

  const option = useMemo<EChartsOption>(() => {
    const formats = sortedData.map((d) => d.format.replace(/_/g, " ").toUpperCase());
    const rates = sortedData.map((d) => d.efficiencyRate);

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
          const f = sortedData[idx];
          if (!f) return "";

          return `
            <div style="font-family: inherit; padding: 4px;">
              <div style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
                ${f.format.replace(/_/g, " ")} (${f.count} items)
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
                <span style="color: #94a3b8;">Total Impressions:</span>
                <span style="font-family: monospace; font-weight: 600;">${f.impressions.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
                <span style="color: #6ee7b7;">Shares & Saves:</span>
                <span style="font-family: monospace; font-weight: 600;">${(f.shares + f.saves).toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 6px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.1);">
                <span style="color: #10b981; font-weight: 600;">Efficiency Rate:</span>
                <span style="color: #10b981; font-family: monospace; font-weight: 700;">${f.efficiencyRate.toFixed(1)} / 1,000 impr</span>
              </div>
            </div>
          `;
        },
      },
      grid: {
        left: "3%",
        right: "6%",
        bottom: "6%",
        top: "8%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        name: "Shares + Saves per 1k",
        nameTextStyle: { color: "#94a3b8", fontSize: 11 },
        axisLabel: { color: "#94a3b8", fontSize: 11 },
        splitLine: {
          lineStyle: { color: "rgba(148, 163, 184, 0.15)", type: "dashed" },
        },
      },
      yAxis: {
        type: "category",
        data: formats,
        inverse: true,
        axisLabel: { color: "#94a3b8", fontSize: 11 },
        axisLine: { lineStyle: { color: "#cbd5e1" } },
      },
      series: [
        {
          name: "Efficiency Rate",
          type: "bar",
          data: rates,
          barMaxWidth: 20,
          label: {
            show: true,
            position: "right",
            color: "#10b981",
            fontFamily: "monospace",
            fontWeight: 600,
            fontSize: 11,
            formatter: "{c} / 1k",
          },
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: "#059669" },
                { offset: 1, color: "#34d399" },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
    };
  }, [sortedData]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl"
        style={{ height }}
      >
        No content format data available.
      </div>
    );
  }

  return <EChartsWrapper option={option} height={height} />;
}
