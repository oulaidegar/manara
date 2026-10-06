"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import type { EChartsOption } from "echarts";

export interface VerificationFunnelItem {
  status: "candidate" | "documented" | "corroborated" | "verified" | "rejected";
  count: number;
}

interface ImpactFunnelChartProps {
  data: VerificationFunnelItem[];
  height?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  candidate: {
    label: "1. Candidate Leads",
    color: "#f59e0b",
    desc: "Unverified external signals and anecdotal reports",
  },
  documented: {
    label: "2. Documented",
    color: "#3b82f6",
    desc: "Primary source citations and FOIA records attached",
  },
  corroborated: {
    label: "3. Corroborated",
    color: "#8b5cf6",
    desc: "Multiple independent third-party confirmations",
  },
  verified: {
    label: "4. Verified Impact",
    color: "#10b981",
    desc: "Definitive real-world outcome with audit trail",
  },
};

export function ImpactFunnelChart({ data, height = 260 }: ImpactFunnelChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const funnelOrder = ["candidate", "documented", "corroborated", "verified"];
    const funnelData = funnelOrder.map((statusKey) => {
      const match = data.find((d) => d.status === statusKey);
      const conf = STATUS_CONFIG[statusKey];
      return {
        name: conf.label,
        value: match ? match.count : 0,
        itemStyle: { color: conf.color },
        description: conf.desc,
      };
    });

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "#334155",
        textStyle: { color: "#f8fafc", fontSize: 12 },
        formatter: (params: unknown) => {
          const item = params as { name: string; value: number; percent: number; data: { description: string } };
          return `
            <div style="font-family: inherit; padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 2px;">${item.name}</div>
              <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">${item.data.description}</div>
              <div style="display: flex; justify-content: space-between; gap: 12px; font-family: monospace;">
                <span>Total Outcomes:</span>
                <span style="font-weight: 700; color: #34d399;">${item.value} (${item.percent}%)</span>
              </div>
            </div>
          `;
        },
      },
      series: [
        {
          name: "Verification Pipeline",
          type: "funnel",
          left: "8%",
          top: "8%",
          bottom: "10%",
          width: "84%",
          min: 0,
          minSize: "15%",
          maxSize: "100%",
          sort: "descending",
          gap: 4,
          label: {
            show: true,
            position: "inside",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 600,
            formatter: "{b}: {c}",
          },
          labelLine: {
            show: false,
          },
          itemStyle: {
            borderColor: "var(--background, #fff)",
            borderWidth: 2,
            borderRadius: 4,
          },
          emphasis: {
            label: {
              fontSize: 14,
            },
          },
          data: funnelData,
        },
      ],
    };
  }, [data]);

  return <EChartsWrapper option={option} height={height} />;
}
