"use client";

import { useMemo, useState } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import type { EChartsOption } from "echarts";

export interface SnapshotPoint {
  capturedAt: number;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
}

interface PostSnapshotChartProps {
  snapshots: SnapshotPoint[];
  height?: number;
}

export function PostSnapshotChart({ snapshots, height = 280 }: PostSnapshotChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<"views" | "likes" | "shares" | "comments">("views");

  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) => a.capturedAt - b.capturedAt);
  }, [snapshots]);

  const option = useMemo<EChartsOption>(() => {
    const dates = sortedSnapshots.map((s) => {
      const d = new Date(s.capturedAt);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
    });

    const values = sortedSnapshots.map((s) => s[selectedMetric] ?? 0);

    const metricColors = {
      views: "#3b82f6",
      likes: "#ec4899",
      shares: "#10b981",
      comments: "#f59e0b",
    };

    const color = metricColors[selectedMetric];

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line" },
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "#334155",
        textStyle: { color: "#f8fafc", fontSize: 12 },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const item = params[0] as { name: string; value?: number };
          return `
            <div style="font-family: inherit; padding: 4px;">
              <div style="font-size: 11px; color: #94a3b8; margin-bottom: 2px;">${item.name}</div>
              <div style="font-weight: 600; font-size: 13px; color: ${color};">
                ${selectedMetric.toUpperCase()}: ${item.value?.toLocaleString()}
              </div>
            </div>
          `;
        },
      },
      grid: {
        top: 25,
        right: 20,
        bottom: 30,
        left: 55,
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLine: { lineStyle: { color: "#475569" } },
        axisLabel: { color: "#94a3b8", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#334155", type: "dashed" } },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          formatter: (val: number) => {
            if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
            if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
            return `${val}`;
          },
        },
      },
      series: [
        {
          name: selectedMetric,
          type: "line",
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          data: values,
          itemStyle: { color },
          lineStyle: { width: 3, color },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${color}40` },
                { offset: 1, color: `${color}00` },
              ],
            },
          },
        },
      ],
    };
  }, [sortedSnapshots, selectedMetric]);

  if (snapshots.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
        No historical snapshots recorded yet. Next synchronization will plot performance over time.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">Metric Tracked:</span>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-1">
          {(["views", "likes", "shares", "comments"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMetric(m)}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                selectedMetric === m
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height }}>
        <EChartsWrapper option={option} height={height} />
      </div>
    </div>
  );
}
