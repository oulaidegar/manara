"use client";

import { useEffect, useRef, memo, useState } from "react";
import type { ECharts, EChartsOption } from "echarts";

export interface EChartsWrapperProps {
  option: EChartsOption;
  height?: number | string;
  className?: string;
  loading?: boolean;
}

export const EChartsWrapper = memo(function EChartsWrapper({
  option,
  height = 340,
  className = "",
  loading = false,
}: EChartsWrapperProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    let resizeObserver: ResizeObserver | null = null;

    // Asynchronously import ECharts to prevent main-thread hydration blocking
    import("echarts").then((echarts) => {
      if (!active || !chartRef.current) return;
      setIsLoaded(true);

      const isDark = document.documentElement.classList.contains("dark");

      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current, isDark ? "dark" : undefined, {
          renderer: "canvas",
        });
      }

      const chart = chartInstance.current;
      chart.setOption(option, { notMerge: true });

      if (loading) {
        chart.showLoading({
          text: "Computing analytics...",
          color: "#2563eb",
          textColor: isDark ? "#e2e8f0" : "#334155",
          maskColor: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.6)",
        });
      } else {
        chart.hideLoading();
      }

      resizeObserver = new ResizeObserver(() => {
        chart.resize();
      });
      resizeObserver.observe(chartRef.current);
    });

    return () => {
      active = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [option, loading]);

  // Clean up instance on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`w-full relative transition-all ${className}`}
      style={{ height }}
    >
      {/* Dedicated chart DOM container for ECharts - NO React children inside! */}
      <div ref={chartRef} className="w-full h-full" />

      {/* React loading overlay as a SIBLING, never a child of chartRef! */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--muted)]/20 animate-pulse rounded-lg text-xs text-[var(--muted-foreground)] pointer-events-none">
          Rendering chart...
        </div>
      )}
    </div>
  );
});
