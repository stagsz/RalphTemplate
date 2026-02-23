import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => {
  const chartInstance = {
    setOption: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  };
  return {
    chartInstance,
    init: vi.fn(() => chartInstance),
    use: vi.fn(),
  };
});

vi.mock("echarts/core", () => ({
  default: { init: mocks.init, use: mocks.use },
  init: mocks.init,
  use: mocks.use,
}));

vi.mock("echarts/charts", () => ({
  BarChart: "BarChart",
  LineChart: "LineChart",
  PieChart: "PieChart",
  ScatterChart: "ScatterChart",
  RadarChart: "RadarChart",
}));

vi.mock("echarts/components", () => ({
  TitleComponent: "TitleComponent",
  TooltipComponent: "TooltipComponent",
  LegendComponent: "LegendComponent",
  GridComponent: "GridComponent",
  DatasetComponent: "DatasetComponent",
  TransformComponent: "TransformComponent",
  ToolboxComponent: "ToolboxComponent",
}));

vi.mock("echarts/features", () => ({
  LabelLayout: "LabelLayout",
  UniversalTransition: "UniversalTransition",
}));

vi.mock("echarts/renderers", () => ({
  CanvasRenderer: "CanvasRenderer",
  SVGRenderer: "SVGRenderer",
}));

import RadarChart from "./RadarChart";

class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
});

const mockIndicators = [
  { name: "Sales", max: 100 },
  { name: "Marketing", max: 100 },
  { name: "Engineering", max: 100 },
  { name: "Support", max: 100 },
  { name: "Finance", max: 100 },
];

const mockData = [
  { name: "Team A", values: [80, 70, 90, 60, 75] },
  { name: "Team B", values: [60, 85, 70, 80, 65] },
];

describe("RadarChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders an echart container", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} />);
    expect(screen.getByTestId("echart-container")).toBeInTheDocument();
  });

  it("generates radar option with correct indicator mapping", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.radar.indicator).toEqual([
      { name: "Sales", max: 100 },
      { name: "Marketing", max: 100 },
      { name: "Engineering", max: 100 },
      { name: "Support", max: 100 },
      { name: "Finance", max: 100 },
    ]);
  });

  it("generates radar option with correct series data", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.series).toHaveLength(1);
    expect(option.series[0].type).toBe("radar");
    expect(option.series[0].data).toHaveLength(2);
    expect(option.series[0].data[0].name).toBe("Team A");
    expect(option.series[0].data[0].value).toEqual([80, 70, 90, 60, 75]);
    expect(option.series[0].data[1].name).toBe("Team B");
    expect(option.series[0].data[1].value).toEqual([60, 85, 70, 80, 65]);
  });

  it("includes area fill with 0.3 opacity on each series", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.series[0].data[0].areaStyle).toEqual({ opacity: 0.3 });
    expect(option.series[0].data[1].areaStyle).toEqual({ opacity: 0.3 });
  });

  it("includes title when provided", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} title="Team Performance" />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.title).toEqual({ text: "Team Performance" });
  });

  it("omits title when not provided", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.title).toBeUndefined();
  });

  it("uses item tooltip trigger", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.tooltip.trigger).toBe("item");
  });

  it("includes legend with all series names", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.legend).toEqual({
      data: ["Team A", "Team B"],
    });
  });

  it("handles single series", () => {
    const singleSeries = [{ name: "Team A", values: [80, 70, 90, 60, 75] }];
    render(<RadarChart data={singleSeries} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.series[0].data).toHaveLength(1);
    expect(option.legend.data).toEqual(["Team A"]);
  });

  it("handles empty data array", () => {
    render(<RadarChart data={[]} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.series[0].data).toEqual([]);
    expect(option.legend.data).toEqual([]);
  });

  it("handles empty indicators array", () => {
    render(<RadarChart data={mockData} indicators={[]} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.radar.indicator).toEqual([]);
  });

  it("converts non-numeric values in series to 0", () => {
    const data = [
      { name: "Bad", values: ["not a number" as unknown as number, null as unknown as number, undefined as unknown as number] },
    ];
    render(<RadarChart data={data} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.series[0].data[0].value).toEqual([0, 0, 0]);
  });

  it("converts non-numeric indicator max to 0", () => {
    const indicators = [
      { name: "A", max: "bad" as unknown as number },
      { name: "B", max: null as unknown as number },
    ];
    render(<RadarChart data={mockData} indicators={indicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.radar.indicator).toEqual([
      { name: "A", max: 0 },
      { name: "B", max: 0 },
    ]);
  });

  it("converts missing series name to empty string", () => {
    const data = [
      { name: undefined as unknown as string, values: [1, 2, 3] },
    ];
    render(<RadarChart data={data} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.series[0].data[0].name).toBe("");
  });

  it("converts missing indicator name to empty string", () => {
    const indicators = [
      { name: undefined as unknown as string, max: 100 },
    ];
    render(<RadarChart data={mockData} indicators={indicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.radar.indicator[0].name).toBe("");
  });

  it("handles series with empty values array", () => {
    const data = [{ name: "Empty", values: [] }];
    render(<RadarChart data={data} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.series[0].data[0].value).toEqual([]);
  });

  it("handles series with missing values property", () => {
    const data = [{ name: "No Values" } as { name: string; values: number[] }];
    render(<RadarChart data={data} indicators={mockIndicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.series[0].data[0].value).toEqual([]);
  });

  it("passes className to EChart", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} className="custom-radar" />);
    expect(screen.getByTestId("echart-container")).toHaveClass("custom-radar");
  });

  it("passes style to EChart", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} style={{ height: 500 }} />);
    const container = screen.getByTestId("echart-container");
    expect(container.style.height).toBe("500px");
  });

  it("passes loading to EChart", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} loading={true} />);
    expect(mocks.chartInstance.showLoading).toHaveBeenCalled();
  });

  it("passes renderer to EChart", () => {
    render(<RadarChart data={mockData} indicators={mockIndicators} renderer="svg" />);
    expect(mocks.init).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      undefined,
      { renderer: "svg" },
    );
  });

  it("updates chart when data changes", () => {
    const { rerender } = render(
      <RadarChart data={mockData} indicators={mockIndicators} />,
    );
    mocks.chartInstance.setOption.mockClear();

    const newData = [{ name: "Team C", values: [50, 60, 70, 80, 90] }];
    rerender(<RadarChart data={newData} indicators={mockIndicators} />);

    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.series[0].data).toHaveLength(1);
    expect(option.series[0].data[0].name).toBe("Team C");
    expect(option.series[0].data[0].value).toEqual([50, 60, 70, 80, 90]);
  });

  it("updates chart when indicators change", () => {
    const { rerender } = render(
      <RadarChart data={mockData} indicators={mockIndicators} />,
    );
    mocks.chartInstance.setOption.mockClear();

    const newIndicators = [
      { name: "Speed", max: 200 },
      { name: "Power", max: 200 },
    ];
    rerender(<RadarChart data={mockData} indicators={newIndicators} />);

    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.radar.indicator).toEqual([
      { name: "Speed", max: 200 },
      { name: "Power", max: 200 },
    ]);
  });

  it("handles many series", () => {
    const manySeries = Array.from({ length: 10 }, (_, i) => ({
      name: `Series ${i}`,
      values: [i * 10, i * 20, i * 5],
    }));
    const indicators = [
      { name: "A", max: 200 },
      { name: "B", max: 400 },
      { name: "C", max: 100 },
    ];
    render(<RadarChart data={manySeries} indicators={indicators} />);
    const option = mocks.chartInstance.setOption.mock.calls[0][0];
    expect(option.series[0].data).toHaveLength(10);
    expect(option.legend.data).toHaveLength(10);
  });
});
