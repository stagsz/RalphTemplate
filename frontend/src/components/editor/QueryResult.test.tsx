import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

// Mock ResizeObserver
const mockResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
Object.defineProperty(globalThis, "ResizeObserver", {
  value: mockResizeObserver,
  writable: true,
});

import QueryResult, {
  suggestChart,
  toRecords,
  toColumnDefs,
} from "./QueryResult";
import type { QueryResult as QueryResultData } from "@/hooks/useDuckDB";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ─── Test data factories ─────────────────────────────────────────────

function makeResult(
  columns: string[],
  rows: unknown[][],
  duration = 42,
): QueryResultData {
  return { columns, rows, duration };
}

const categoricalNumericResult = makeResult(
  ["region", "revenue"],
  [
    ["North", 100],
    ["South", 200],
    ["East", 150],
  ],
);

const twoNumericResult = makeResult(
  ["x", "y"],
  [
    [1, 10],
    [2, 20],
    [3, 30],
  ],
);

const pieSuitableResult = makeResult(
  ["status", "count"],
  [
    ["active", 50],
    ["inactive", 30],
    ["pending", 20],
  ],
);

const singleColumnResult = makeResult(["name"], [["Alice"], ["Bob"]]);

const emptyRowsResult = makeResult(["a", "b"], [], 5);

// ─── Empty / Loading / Error states ──────────────────────────────────

describe("QueryResult", () => {
  describe("empty state", () => {
    it("renders placeholder when result is null", () => {
      render(<QueryResult result={null} />);
      expect(screen.getByTestId("query-result-empty")).toBeInTheDocument();
      expect(screen.getByText("Run a query to see results")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders loading indicator", () => {
      render(<QueryResult result={null} loading />);
      expect(screen.getByTestId("query-result-loading")).toBeInTheDocument();
      expect(screen.getByText("Running query...")).toBeInTheDocument();
    });

    it("shows loading even if result exists", () => {
      render(<QueryResult result={categoricalNumericResult} loading />);
      expect(screen.getByTestId("query-result-loading")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("renders error message", () => {
      render(<QueryResult result={null} error="Syntax error near SELECT" />);
      expect(screen.getByTestId("query-result-error")).toBeInTheDocument();
      expect(screen.getByText("Query Error")).toBeInTheDocument();
      expect(
        screen.getByText("Syntax error near SELECT"),
      ).toBeInTheDocument();
    });

    it("shows error even if result exists", () => {
      render(
        <QueryResult
          result={categoricalNumericResult}
          error="Something went wrong"
        />,
      );
      expect(screen.getByTestId("query-result-error")).toBeInTheDocument();
    });
  });

  // ─── Tab switching ────────────────────────────────────────────────

  describe("tabs", () => {
    it("defaults to table tab", () => {
      render(<QueryResult result={categoricalNumericResult} />);
      expect(screen.getByTestId("query-result-table")).toBeInTheDocument();
    });

    it("switches to chart tab on click", async () => {
      const user = userEvent.setup();
      render(<QueryResult result={categoricalNumericResult} />);

      await user.click(screen.getByTestId("tab-chart"));
      expect(screen.getByTestId("query-result-chart")).toBeInTheDocument();
      expect(screen.queryByTestId("query-result-table")).not.toBeInTheDocument();
    });

    it("switches back to table tab", async () => {
      const user = userEvent.setup();
      render(<QueryResult result={categoricalNumericResult} />);

      await user.click(screen.getByTestId("tab-chart"));
      await user.click(screen.getByTestId("tab-table"));
      expect(screen.getByTestId("query-result-table")).toBeInTheDocument();
      expect(screen.queryByTestId("query-result-chart")).not.toBeInTheDocument();
    });

    it("highlights active table tab", () => {
      render(<QueryResult result={categoricalNumericResult} />);
      const tableTab = screen.getByTestId("tab-table");
      expect(tableTab.className).toContain("bg-gray-100");
    });

    it("highlights active chart tab", async () => {
      const user = userEvent.setup();
      render(<QueryResult result={categoricalNumericResult} />);

      await user.click(screen.getByTestId("tab-chart"));
      const chartTab = screen.getByTestId("tab-chart");
      expect(chartTab.className).toContain("bg-gray-100");
    });
  });

  // ─── Metadata display ────────────────────────────────────────────

  describe("metadata", () => {
    it("shows row count", () => {
      render(<QueryResult result={categoricalNumericResult} />);
      expect(screen.getByTestId("query-result-row-count")).toHaveTextContent(
        "3 rows",
      );
    });

    it("shows singular row for 1 result", () => {
      const single = makeResult(["a"], [[1]], 10);
      render(<QueryResult result={single} />);
      expect(screen.getByTestId("query-result-row-count")).toHaveTextContent(
        "1 row",
      );
    });

    it("shows 0 rows", () => {
      render(<QueryResult result={emptyRowsResult} />);
      expect(screen.getByTestId("query-result-row-count")).toHaveTextContent(
        "0 rows",
      );
    });

    it("shows query duration in ms", () => {
      render(<QueryResult result={categoricalNumericResult} />);
      expect(screen.getByTestId("query-result-duration")).toHaveTextContent(
        "42ms",
      );
    });

    it("shows <1ms for sub-millisecond queries", () => {
      const fast = makeResult(["a"], [[1]], 0.5);
      render(<QueryResult result={fast} />);
      expect(screen.getByTestId("query-result-duration")).toHaveTextContent(
        "<1ms",
      );
    });

    it("rounds duration to nearest integer", () => {
      const result = makeResult(["a"], [[1]], 123.7);
      render(<QueryResult result={result} />);
      expect(screen.getByTestId("query-result-duration")).toHaveTextContent(
        "124ms",
      );
    });
  });

  // ─── Table view ───────────────────────────────────────────────────

  describe("table view", () => {
    it("renders DataTable with correct columns", () => {
      render(<QueryResult result={categoricalNumericResult} />);
      expect(screen.getByTestId("datatable-container")).toBeInTheDocument();
      expect(screen.getByTestId("datatable-th-region")).toBeInTheDocument();
      expect(screen.getByTestId("datatable-th-revenue")).toBeInTheDocument();
    });

    it("renders DataTable with correct row data", () => {
      render(<QueryResult result={categoricalNumericResult} />);
      expect(screen.getByTestId("datatable-cell-0-region")).toHaveTextContent(
        "North",
      );
      expect(screen.getByTestId("datatable-cell-0-revenue")).toHaveTextContent(
        "100",
      );
    });

    it("renders DataTable as sortable", () => {
      render(<QueryResult result={categoricalNumericResult} />);
      expect(screen.getByTestId("sort-button-region")).toBeInTheDocument();
    });

    it("renders empty DataTable for zero-row result", () => {
      render(<QueryResult result={emptyRowsResult} />);
      expect(screen.getByTestId("datatable-empty")).toBeInTheDocument();
    });
  });

  // ─── Chart view — suggestion logic ───────────────────────────────

  describe("chart view", () => {
    it("shows no suggestion for single column result", async () => {
      const user = userEvent.setup();
      render(<QueryResult result={singleColumnResult} />);

      await user.click(screen.getByTestId("tab-chart"));
      expect(screen.getByTestId("chart-no-suggestion")).toBeInTheDocument();
    });

    it("shows no suggestion for empty rows", async () => {
      const user = userEvent.setup();
      render(<QueryResult result={emptyRowsResult} />);

      await user.click(screen.getByTestId("tab-chart"));
      expect(screen.getByTestId("chart-no-suggestion")).toBeInTheDocument();
    });

    it("suggests pie chart for categorical + numeric with few distinct values", async () => {
      const user = userEvent.setup();
      render(<QueryResult result={pieSuitableResult} />);

      await user.click(screen.getByTestId("tab-chart"));
      expect(screen.getByTestId("chart-suggested")).toBeInTheDocument();
      expect(screen.getByTestId("chart-type-label")).toHaveTextContent(
        "Suggested: pie chart",
      );
    });

    it("suggests bar chart for categorical + numeric with many distinct values", async () => {
      const user = userEvent.setup();
      const manyCategories = makeResult(
        ["category", "value"],
        Array.from({ length: 15 }, (_, i) => [`cat-${i}`, i * 10]),
      );
      render(<QueryResult result={manyCategories} />);

      await user.click(screen.getByTestId("tab-chart"));
      expect(screen.getByTestId("chart-type-label")).toHaveTextContent(
        "Suggested: bar chart",
      );
    });

    it("suggests scatter chart for two numeric columns", async () => {
      const user = userEvent.setup();
      render(<QueryResult result={twoNumericResult} />);

      await user.click(screen.getByTestId("tab-chart"));
      expect(screen.getByTestId("chart-type-label")).toHaveTextContent(
        "Suggested: scatter chart",
      );
    });

    it("renders echart container for suggested chart", async () => {
      const user = userEvent.setup();
      render(<QueryResult result={categoricalNumericResult} />);

      await user.click(screen.getByTestId("tab-chart"));
      expect(screen.getByTestId("chart-suggested")).toBeInTheDocument();
      expect(screen.getByTestId("echart-container")).toBeInTheDocument();
    });
  });

  // ─── className prop ───────────────────────────────────────────────

  describe("className prop", () => {
    it("applies className to result container", () => {
      render(
        <QueryResult result={categoricalNumericResult} className="my-class" />,
      );
      expect(screen.getByTestId("query-result").className).toContain(
        "my-class",
      );
    });

    it("applies className to error container", () => {
      render(
        <QueryResult result={null} error="err" className="err-class" />,
      );
      expect(screen.getByTestId("query-result-error").className).toContain(
        "err-class",
      );
    });

    it("applies className to loading container", () => {
      render(<QueryResult result={null} loading className="load-class" />);
      expect(screen.getByTestId("query-result-loading").className).toContain(
        "load-class",
      );
    });

    it("applies className to empty container", () => {
      render(<QueryResult result={null} className="empty-class" />);
      expect(screen.getByTestId("query-result-empty").className).toContain(
        "empty-class",
      );
    });
  });
});

// ─── Unit tests for exported utilities ──────────────────────────────

describe("suggestChart", () => {
  it("returns null for single column", () => {
    expect(suggestChart(["a"], [[1], [2]])).toBeNull();
  });

  it("returns null for empty rows", () => {
    expect(suggestChart(["a", "b"], [])).toBeNull();
  });

  it("returns pie for 1 categorical + 1 numeric with ≤10 distinct values", () => {
    const result = suggestChart(
      ["name", "value"],
      [
        ["A", 10],
        ["B", 20],
        ["C", 30],
      ],
    );
    expect(result).toEqual({
      type: "pie",
      nameField: "name",
      valueField: "value",
    });
  });

  it("returns bar for 1 categorical + 1 numeric with >10 distinct values", () => {
    const rows = Array.from({ length: 12 }, (_, i) => [`cat${i}`, i]);
    const result = suggestChart(["label", "amount"], rows);
    expect(result).toEqual({
      type: "bar",
      xField: "label",
      yField: "amount",
    });
  });

  it("returns bar for multiple categorical + numeric", () => {
    const result = suggestChart(
      ["region", "quarter", "sales"],
      [
        ["North", "Q1", 100],
        ["South", "Q2", 200],
      ],
    );
    expect(result).toEqual({
      type: "bar",
      xField: "region",
      yField: "sales",
    });
  });

  it("returns scatter for two numeric columns", () => {
    const result = suggestChart(
      ["x", "y"],
      [
        [1, 2],
        [3, 4],
      ],
    );
    expect(result).toEqual({ type: "scatter", xField: "x", yField: "y" });
  });

  it("returns scatter for three numeric columns (uses first two)", () => {
    const result = suggestChart(
      ["a", "b", "c"],
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
    );
    expect(result).toEqual({ type: "scatter", xField: "a", yField: "b" });
  });

  it("handles null values in classification", () => {
    const result = suggestChart(
      ["name", "val"],
      [
        ["A", null],
        ["B", 10],
        ["C", 20],
      ],
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe("pie");
  });

  it("handles bigint values as numeric", () => {
    const result = suggestChart(
      ["id", "amount"],
      [
        [BigInt(1), BigInt(100)],
        [BigInt(2), BigInt(200)],
      ],
    );
    expect(result).toEqual({
      type: "scatter",
      xField: "id",
      yField: "amount",
    });
  });
});

describe("toRecords", () => {
  it("converts positional rows to keyed records", () => {
    const result = toRecords(
      ["a", "b"],
      [
        [1, 2],
        [3, 4],
      ],
    );
    expect(result).toEqual([
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ]);
  });

  it("returns empty array for no rows", () => {
    expect(toRecords(["a"], [])).toEqual([]);
  });

  it("preserves null and undefined values", () => {
    const result = toRecords(["a", "b"], [[null, undefined]]);
    expect(result).toEqual([{ a: null, b: undefined }]);
  });
});

describe("toColumnDefs", () => {
  it("converts column names to ColumnDef array", () => {
    const result = toColumnDefs(["region", "revenue"]);
    expect(result).toEqual([
      { key: "region", name: "region" },
      { key: "revenue", name: "revenue" },
    ]);
  });

  it("returns empty array for empty columns", () => {
    expect(toColumnDefs([])).toEqual([]);
  });
});
