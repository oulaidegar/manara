"use client";

import { useEffect, useRef, memo } from "react";
import * as echarts from "echarts";

export interface EChartsWrapperProps {
  option: echarts.EChartsOption;
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
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Check dark mode
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

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
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
      ref={chartRef}
      className={`w-full relative transition-all ${className}`}
      style={{ height }}
    />
  );
});
