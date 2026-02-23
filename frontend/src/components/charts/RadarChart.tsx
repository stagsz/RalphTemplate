import { useMemo } from "react";
import EChart from "./EChart";
import type { EChartsOption } from "echarts";

interface RadarIndicator {
  name: string;
  max: number;
}

interface RadarSeries {
  name: string;
  values: number[];
}

interface RadarChartProps {
  data: RadarSeries[];
  indicators: RadarIndicator[];
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  renderer?: "canvas" | "svg";
}

function RadarChart({ data, indicators, title, className, style, loading, renderer }: RadarChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const radarIndicators = indicators.map((ind) => ({
      name: String(ind.name ?? ""),
      max: Number(ind.max) || 0,
    }));

    const seriesData = data.map((s) => ({
      name: String(s.name ?? ""),
      value: (s.values ?? []).map((v) => Number(v) || 0),
      areaStyle: { opacity: 0.3 },
    }));

    return {
      title: title ? { text: title } : undefined,
      tooltip: {
        trigger: "item" as const,
      },
      legend: {
        data: seriesData.map((s) => s.name),
      },
      radar: {
        indicator: radarIndicators,
      },
      series: [
        {
          type: "radar" as const,
          data: seriesData,
        },
      ],
    };
  }, [data, indicators, title]);

  return <EChart option={option} className={className} style={style} loading={loading} renderer={renderer} />;
}

export type { RadarChartProps, RadarIndicator, RadarSeries };
export default RadarChart;
