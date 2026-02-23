import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { EChartsOption } from "echarts";

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

import EChart from "./EChart";

let resizeCallback: (() => void) | null = null;

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class MockResizeObserver {
  constructor(cb: () => void) {
    resizeCallback = cb;
  }
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
}

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
});

const barOption: EChartsOption = {
  xAxis: { type: "category", data: ["A", "B", "C"] },
  yAxis: { type: "value" },
  series: [{ type: "bar", data: [10, 20, 30] }],
};

describe("EChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resizeCallback = null;
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a container div", () => {
    render(<EChart option={barOption} />);
    expect(screen.getByTestId("echart-container")).toBeInTheDocument();
  });

  it("initializes echarts with canvas renderer by default", () => {
    render(<EChart option={barOption} />);
    expect(mocks.init).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      undefined,
      { renderer: "canvas" },
    );
  });

  it("initializes echarts with svg renderer when specified", () => {
    render(<EChart option={barOption} renderer="svg" />);
    expect(mocks.init).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      undefined,
      { renderer: "svg" },
    );
  });

  it("passes theme to echarts.init", () => {
    render(<EChart option={barOption} theme="dark" />);
    expect(mocks.init).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      "dark",
      { renderer: "canvas" },
    );
  });

  it("sets option on the chart after init", () => {
    render(<EChart option={barOption} />);
    expect(mocks.chartInstance.setOption).toHaveBeenCalledWith(barOption, {
      notMerge: true,
    });
  });

  it("passes custom opts to setOption", () => {
    const customOpts = { notMerge: false, lazyUpdate: true };
    render(<EChart option={barOption} opts={customOpts} />);
    expect(mocks.chartInstance.setOption).toHaveBeenCalledWith(
      barOption,
      customOpts,
    );
  });

  it("updates option when it changes", () => {
    const { rerender } = render(<EChart option={barOption} />);
    mocks.chartInstance.setOption.mockClear();

    const newOption: EChartsOption = {
      xAxis: { type: "category", data: ["X", "Y"] },
      yAxis: { type: "value" },
      series: [{ type: "bar", data: [50, 60] }],
    };
    rerender(<EChart option={newOption} />);

    expect(mocks.chartInstance.setOption).toHaveBeenCalledWith(newOption, {
      notMerge: true,
    });
  });

  it("shows loading when loading prop is true", () => {
    render(<EChart option={barOption} loading={true} />);
    expect(mocks.chartInstance.showLoading).toHaveBeenCalled();
  });

  it("hides loading when loading prop is false", () => {
    render(<EChart option={barOption} loading={false} />);
    expect(mocks.chartInstance.hideLoading).toHaveBeenCalled();
  });

  it("toggles loading state on prop change", () => {
    const { rerender } = render(<EChart option={barOption} loading={false} />);
    mocks.chartInstance.showLoading.mockClear();
    mocks.chartInstance.hideLoading.mockClear();

    rerender(<EChart option={barOption} loading={true} />);
    expect(mocks.chartInstance.showLoading).toHaveBeenCalled();

    mocks.chartInstance.showLoading.mockClear();
    rerender(<EChart option={barOption} loading={false} />);
    expect(mocks.chartInstance.hideLoading).toHaveBeenCalled();
  });

  it("resizes chart when container resizes", () => {
    render(<EChart option={barOption} />);
    expect(mockObserve).toHaveBeenCalled();

    resizeCallback?.();
    expect(mocks.chartInstance.resize).toHaveBeenCalled();
  });

  it("disposes chart and disconnects observer on unmount", () => {
    const { unmount } = render(<EChart option={barOption} />);
    unmount();
    expect(mocks.chartInstance.dispose).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("re-creates chart when renderer changes", () => {
    const { rerender } = render(<EChart option={barOption} renderer="canvas" />);
    expect(mocks.init).toHaveBeenCalledTimes(1);
    mocks.chartInstance.dispose.mockClear();
    mocks.init.mockClear();

    rerender(<EChart option={barOption} renderer="svg" />);
    expect(mocks.chartInstance.dispose).toHaveBeenCalled();
    expect(mocks.init).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      undefined,
      { renderer: "svg" },
    );
  });

  it("re-creates chart when theme changes", () => {
    const { rerender } = render(<EChart option={barOption} />);
    mocks.init.mockClear();
    mocks.chartInstance.dispose.mockClear();

    rerender(<EChart option={barOption} theme="dark" />);
    expect(mocks.chartInstance.dispose).toHaveBeenCalled();
    expect(mocks.init).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      "dark",
      { renderer: "canvas" },
    );
  });

  it("applies className to container", () => {
    render(<EChart option={barOption} className="my-chart" />);
    expect(screen.getByTestId("echart-container")).toHaveClass("my-chart");
  });

  it("applies style to container", () => {
    render(<EChart option={barOption} style={{ height: 400 }} />);
    const container = screen.getByTestId("echart-container");
    expect(container.style.height).toBe("400px");
  });

  it("has default min-height of 200px", () => {
    render(<EChart option={barOption} />);
    const container = screen.getByTestId("echart-container");
    expect(container.style.minHeight).toBe("200px");
  });

  it("calls onInit callback with chart instance", () => {
    const onInit = vi.fn();
    render(<EChart option={barOption} onInit={onInit} />);
    expect(onInit).toHaveBeenCalledWith(mocks.chartInstance);
  });

});
