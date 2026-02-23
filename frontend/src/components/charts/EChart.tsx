import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart, ScatterChart, RadarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  ToolboxComponent,
} from "echarts/components";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";
import type { EChartsOption, SetOptionOpts } from "echarts";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  ToolboxComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  SVGRenderer,
]);

interface EChartProps {
  option: EChartsOption;
  renderer?: "canvas" | "svg";
  theme?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  opts?: SetOptionOpts;
  onInit?: (chart: echarts.ECharts) => void;
}

function EChart({
  option,
  renderer = "canvas",
  theme,
  className,
  style,
  loading = false,
  opts,
  onInit,
}: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = echarts.init(containerRef.current, theme, { renderer });
    chartRef.current = chart;
    onInit?.(chart);

    const observer = new ResizeObserver(() => {
      chart.resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // Re-create chart only when renderer or theme changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer, theme]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.setOption(option, opts ?? { notMerge: true });
  }, [option, opts]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (loading) {
      chartRef.current.showLoading();
    } else {
      chartRef.current.hideLoading();
    }
  }, [loading]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", minHeight: 200, ...style }}
      data-testid="echart-container"
    />
  );
}

export type { EChartProps };
export default EChart;
