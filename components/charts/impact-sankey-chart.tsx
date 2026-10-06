"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import type { EChartsOption } from "echarts";

export interface SankeyNode {
  name: string;
  itemStyle?: { color?: string };
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface ImpactSankeyChartProps {
  nodes?: SankeyNode[];
  links?: SankeyLink[];
  height?: number;
}

export function ImpactSankeyChart({
  nodes: customNodes,
  links: customLinks,
  height = 420,
}: ImpactSankeyChartProps) {
  const { defaultNodes, defaultLinks } = useMemo(() => {
    const nodes: SankeyNode[] = [
      // Publishing Channels
      { name: "YouTube", itemStyle: { color: "#ef4444" } },
      { name: "LinkedIn", itemStyle: { color: "#0284c7" } },
      { name: "Website / Dossiers", itemStyle: { color: "#10b981" } },
      { name: "Meta / Instagram", itemStyle: { color: "#ec4899" } },
      { name: "Substack / Dispatch", itemStyle: { color: "#f97316" } },

      // Formats
      { name: "Video Investigations", itemStyle: { color: "#dc2626" } },
      { name: "Executive Briefings", itemStyle: { color: "#0369a1" } },
      { name: "Audit Reports", itemStyle: { color: "#059669" } },
      { name: "Explainer Carousels", itemStyle: { color: "#db2777" } },

      // Audience Engagement
      { name: "Broad Audience Reach (520k)", itemStyle: { color: "#6366f1" } },
      { name: "Amplified Shares (12.4k)", itemStyle: { color: "#8b5cf6" } },
      { name: "High-Intent Saves (6.8k)", itemStyle: { color: "#a855f7" } },

      // Strategic Initiatives
      { name: "Healthcare Procurement Reform", itemStyle: { color: "#3b82f6" } },
      { name: "Whistleblower Protections", itemStyle: { color: "#14b8a6" } },

      // Real-World Outcomes
      { name: "Parliamentary Emergency Inquiry", itemStyle: { color: "#10b981" } },
      { name: "$4.2M Disputed Contract Frozen", itemStyle: { color: "#059669" } },
      { name: "Whistleblower Testimony Corroborated", itemStyle: { color: "#047857" } },
      { name: "Statutory Tender Loophole Closed", itemStyle: { color: "#065f46" } },
    ];

    const links: SankeyLink[] = [
      // Channels -> Formats
      { source: "YouTube", target: "Video Investigations", value: 343000 },
      { source: "LinkedIn", target: "Executive Briefings", value: 93000 },
      { source: "Website / Dossiers", target: "Audit Reports", value: 110000 },
      { source: "Meta / Instagram", target: "Explainer Carousels", value: 304000 },
      { source: "Substack / Dispatch", target: "Executive Briefings", value: 24000 },

      // Formats -> Engagement
      { source: "Video Investigations", target: "Broad Audience Reach (520k)", value: 230000 },
      { source: "Video Investigations", target: "Amplified Shares (12.4k)", value: 7800 },
      { source: "Video Investigations", target: "High-Intent Saves (6.8k)", value: 3200 },

      { source: "Executive Briefings", target: "Broad Audience Reach (520k)", value: 65000 },
      { source: "Executive Briefings", target: "Amplified Shares (12.4k)", value: 1070 },
      { source: "Executive Briefings", target: "High-Intent Saves (6.8k)", value: 820 },

      { source: "Audit Reports", target: "Broad Audience Reach (520k)", value: 85000 },
      { source: "Audit Reports", target: "Amplified Shares (12.4k)", value: 2900 },
      { source: "Audit Reports", target: "High-Intent Saves (6.8k)", value: 2400 },

      { source: "Explainer Carousels", target: "Broad Audience Reach (520k)", value: 140000 },
      { source: "Explainer Carousels", target: "Amplified Shares (12.4k)", value: 6800 },
      { source: "Explainer Carousels", target: "High-Intent Saves (6.8k)", value: 3950 },

      // Engagement -> Initiatives
      { source: "Broad Audience Reach (520k)", target: "Healthcare Procurement Reform", value: 380000 },
      { source: "Broad Audience Reach (520k)", target: "Whistleblower Protections", value: 140000 },
      { source: "Amplified Shares (12.4k)", target: "Healthcare Procurement Reform", value: 9800 },
      { source: "Amplified Shares (12.4k)", target: "Whistleblower Protections", value: 2600 },
      { source: "High-Intent Saves (6.8k)", target: "Healthcare Procurement Reform", value: 4800 },
      { source: "High-Intent Saves (6.8k)", target: "Whistleblower Protections", value: 2000 },

      // Initiatives -> Real-World Outcomes
      { source: "Healthcare Procurement Reform", target: "Parliamentary Emergency Inquiry", value: 150000 },
      { source: "Healthcare Procurement Reform", target: "$4.2M Disputed Contract Frozen", value: 180000 },
      { source: "Healthcare Procurement Reform", target: "Statutory Tender Loophole Closed", value: 64600 },
      { source: "Whistleblower Protections", target: "Whistleblower Testimony Corroborated", value: 144600 },
    ];

    return { defaultNodes: nodes, defaultLinks: links };
  }, []);

  const nodes = customNodes && customNodes.length > 0 ? customNodes : defaultNodes;
  const links = customLinks && customLinks.length > 0 ? customLinks : defaultLinks;

  const option = useMemo<EChartsOption>(() => {
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove",
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderColor: "#334155",
        textStyle: { color: "#f8fafc", fontSize: 12 },
        formatter: (params: unknown) => {
          const item = params as {
            dataType: "node" | "edge";
            data: { name?: string; value?: number; source?: string; target?: string };
          };

          if (item.dataType === "edge") {
            return `
              <div style="font-family: inherit; padding: 4px;">
                <div style="color: #94a3b8; font-size: 11px;">Flow Pipeline:</div>
                <div style="font-weight: 600; margin: 2px 0 6px 0;">
                  ${item.data.source} → ${item.data.target}
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px;">
                  <span>Volume:</span>
                  <span style="font-family: monospace; font-weight: 700; color: #34d399;">${(item.data.value ?? 0).toLocaleString()}</span>
                </div>
              </div>
            `;
          }

          return `
            <div style="font-family: inherit; padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 2px;">${item.data.name}</div>
              <div style="font-size: 11px; color: #94a3b8;">
                Total pipeline weight: ${(item.data.value ?? 0).toLocaleString()}
              </div>
            </div>
          `;
        },
      },
      series: [
        {
          type: "sankey",
          layout: "none",
          left: "2%",
          right: "2%",
          top: "5%",
          bottom: "5%",
          emphasis: {
            focus: "adjacency",
          },
          nodeWidth: 16,
          nodeGap: 14,
          data: nodes,
          links: links,
          orient: "horizontal",
          label: {
            position: "right",
            color: "#64748b",
            fontSize: 11,
            formatter: "{b}",
          },
          lineStyle: {
            color: "gradient",
            curveness: 0.5,
            opacity: 0.28,
          },
        },
      ],
    };
  }, [nodes, links]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">
            Impact Flow Pipeline: Content → Engagement → Real-World Outcomes
          </h4>
          <p className="text-xs text-[var(--muted-foreground)]">
            Interactive Sankey diagram tracing how broadcast channels convert into high-intent civic engagement and verified societal policy change. Hover over ribbons to trace flows.
          </p>
        </div>
      </div>
      <EChartsWrapper option={option} height={height} />
    </div>
  );
}
