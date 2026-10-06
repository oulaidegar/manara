"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import type { EChartsOption } from "echarts";

export interface TimeSeriesDataPoint {
  date: string;
  impressions: number;
  reach: number;
  views: number;
  shares: number;
  saves: number;
  meaningfulActions: number;
  meaningfulRate: number;
}

interface TimeSeriesTrendChartProps {
  data: TimeSeriesDataPoint[];
  metricVolume?: "impressions" | "reach" | "views";
  height?: number;
}

export function TimeSeriesTrendChart({
  data,
  metricVolume = "impressions",
  height = 360,
}: TimeSeriesTrendChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const dates = data.map((d) => d.date);
    const volumeData = data.map((d) => d[metricVolume]);
    const rateData = data.map((d) => d.meaningfulRate);

    const isVolumeImpressions = metricVolume === "impressions";
    const volumeLabel = isVolumeImpressions ? "Impressions" : metricVolume === "reach" ? "Reach" : "Views";

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          crossStyle: { color: "#94a3b8" },
        },
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "#334155",
        textStyle: { color: "#f8fafc", fontSize: 12 },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const first = params[0] as { dataIndex: number };
          const idx = first.dataIndex;
          const point = data[idx];
          if (!point) return "";

          return `
            <div style="font-family: inherit; padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
                ${point.date}
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
                <span style="color: #93c5fd;">● ${volumeLabel}:</span>
                <span style="font-weight: 600; font-family: monospace;">${point[metricVolume].toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
                <span style="color: #6ee7b7;">● Shares & Saves:</span>
                <span style="font-weight: 600; font-family: monospace;">${(point.shares + point.saves).toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 6px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.1);">
                <span style="color: #34d399; font-weight: 500;">Action Rate:</span>
                <span style="font-weight: 700; color: #34d399; font-family: monospace;">${point.meaningfulRate.toFixed(1)} / 1k</span>
              </div>
            </div>
          `;
        },
      },
      legend: {
        data: [volumeLabel, "Meaningful Action Rate"],
        top: 0,
        textStyle: { color: "#94a3b8", fontSize: 12 },
        itemGap: 16,
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: "12%",
        top: "12%",
        containLabel: true,
      },
      xAxis: [
        {
          type: "category",
          data: dates,
          axisPointer: { type: "shadow" },
          axisLabel: {
            color: "#94a3b8",
            fontSize: 11,
            formatter: (val: string) => {
              const parts = val.split("-");
              return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
            },
          },
          axisLine: { lineStyle: { color: "#cbd5e1" } },
        },
      ],
      yAxis: [
        {
          type: "value",
          name: volumeLabel,
          nameTextStyle: { color: "#94a3b8", fontSize: 11 },
          position: "left",
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
        {
          type: "value",
          name: "Rate / 1k",
          nameTextStyle: { color: "#10b981", fontSize: 11 },
          position: "right",
          axisLabel: {
            color: "#10b981",
            fontSize: 11,
            formatter: "{value}",
          },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        {
          type: "slider",
          show: true,
          xAxisIndex: [0],
          bottom: 2,
          height: 18,
          borderColor: "transparent",
          fillerColor: "rgba(59, 130, 246, 0.15)",
          handleStyle: { color: "#3b82f6" },
          textStyle: { color: "#94a3b8", fontSize: 10 },
        },
        {
          type: "inside",
          xAxisIndex: [0],
        },
      ],
      series: [
        {
          name: volumeLabel,
          type: "bar",
          yAxisIndex: 0,
          data: volumeData,
          barMaxWidth: 24,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#3b82f6" },
                { offset: 1, color: "rgba(59, 130, 246, 0.4)" },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: "Meaningful Action Rate",
          type: "line",
          yAxisIndex: 1,
          data: rateData,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: {
            width: 2.5,
            color: "#10b981",
          },
          itemStyle: {
            color: "#10b981",
            borderColor: "#ffffff",
            borderWidth: 1.5,
          },
        },
      ],
    };
  }, [data, metricVolume]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl"
        style={{ height }}
      >
        No time-series data available for the selected filters.
      </div>
    );
  }

  return <EChartsWrapper option={option} height={height} />;
}
