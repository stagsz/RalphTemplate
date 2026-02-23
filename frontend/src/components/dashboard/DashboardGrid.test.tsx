import { render, screen, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DashboardGrid, {
  BREAKPOINTS,
  BREAKPOINT_COLS,
  type DashboardCardConfig,
} from "./DashboardGrid";
import type { LayoutItem } from "react-grid-layout";

// Capture callbacks from ResponsiveGridLayout so tests can trigger them
let capturedOnLayoutChange: ((layout: readonly LayoutItem[]) => void) | undefined;
let capturedOnBreakpointChange: ((bp: string, cols: number) => void) | undefined;

vi.mock("react-grid-layout", () => {
  const MockResponsiveGridLayout = ({
    children,
    onLayoutChange,
    onBreakpointChange,
    dragConfig,
    resizeConfig,
    layouts,
    cols,
    breakpoints,
    rowHeight,
    compactor,
    margin,
    containerPadding,
    width,
  }: {
    children: React.ReactNode;
    onLayoutChange?: (layout: readonly LayoutItem[], layouts: unknown) => void;
    onBreakpointChange?: (bp: string, cols: number) => void;
    dragConfig?: { enabled?: boolean; handle?: string; threshold?: number; bounded?: boolean };
    resizeConfig?: { enabled?: boolean; handles?: string[] };
    layouts?: Record<string, readonly LayoutItem[]>;
    cols?: Record<string, number>;
    breakpoints?: Record<string, number>;
    rowHeight?: number;
    compactor?: { type: string };
    margin?: readonly [number, number];
    containerPadding?: readonly [number, number];
    width?: number;
  }) => {
    capturedOnLayoutChange = onLayoutChange
      ? (layout: readonly LayoutItem[]) => onLayoutChange(layout, {})
      : undefined;
    capturedOnBreakpointChange = onBreakpointChange;

    return (
      <div
        data-testid="rgl-responsive"
        data-drag-enabled={String(dragConfig?.enabled ?? true)}
        data-resize-enabled={String(resizeConfig?.enabled ?? true)}
        data-drag-handle={dragConfig?.handle ?? ""}
        data-row-height={rowHeight}
        data-compact-type={compactor?.type ?? ""}
        data-margin={JSON.stringify(margin)}
        data-container-padding={JSON.stringify(containerPadding)}
        data-cols={JSON.stringify(cols)}
        data-breakpoints={JSON.stringify(breakpoints)}
        data-layouts-keys={layouts ? Object.keys(layouts).join(",") : ""}
        data-width={width}
      >
        {children}
      </div>
    );
  };

  const useContainerWidth = () => ({
    width: 1280,
    mounted: true,
    containerRef: { current: null },
    measureWidth: vi.fn(),
  });

  const verticalCompactor = { type: "vertical", allowOverlap: false, compact: vi.fn() };

  return {
    ResponsiveGridLayout: MockResponsiveGridLayout,
    useContainerWidth,
    verticalCompactor,
  };
});

vi.mock("react-grid-layout/css/styles.css", () => ({}));

const sampleCards: DashboardCardConfig[] = [
  {
    id: "card-1",
    type: "bar",
    title: "Revenue by Region",
    query: "SELECT region, SUM(revenue) FROM sales GROUP BY region",
    columnMappings: { xField: "region", yField: "revenue" },
  },
  {
    id: "card-2",
    type: "line",
    title: "Monthly Trend",
    query: "SELECT month, total FROM monthly_sales",
    columnMappings: { xField: "month", yField: "total" },
  },
  {
    id: "card-3",
    type: "kpi",
    title: "Total Revenue",
    query: "SELECT SUM(revenue) as total FROM sales",
    columnMappings: { value: "total" },
  },
];

const sampleLayout: LayoutItem[] = [
  { i: "card-1", x: 0, y: 0, w: 6, h: 3 },
  { i: "card-2", x: 6, y: 0, w: 6, h: 3 },
  { i: "card-3", x: 0, y: 3, w: 4, h: 2 },
];

describe("DashboardGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnLayoutChange = undefined;
    capturedOnBreakpointChange = undefined;
  });

  afterEach(() => {
    cleanup();
  });

  // --- Rendering ---

  it("renders the grid container", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    expect(screen.getByTestId("dashboard-grid")).toBeInTheDocument();
  });

  it("renders the responsive grid layout", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    expect(screen.getByTestId("rgl-responsive")).toBeInTheDocument();
  });

  it("renders a grid item for each layout entry", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    expect(screen.getByTestId("grid-item-card-1")).toBeInTheDocument();
    expect(screen.getByTestId("grid-item-card-2")).toBeInTheDocument();
    expect(screen.getByTestId("grid-item-card-3")).toBeInTheDocument();
  });

  it("renders correct number of grid items", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const items = screen.getAllByTestId(/^grid-item-/);
    expect(items).toHaveLength(3);
  });

  it("renders with empty layout", () => {
    render(
      <DashboardGrid layout={[]} cards={[]} />,
    );
    expect(screen.getByTestId("dashboard-grid")).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^grid-item-/)).toHaveLength(0);
  });

  it("renders single card", () => {
    render(
      <DashboardGrid
        layout={[sampleLayout[0]]}
        cards={[sampleCards[0]]}
      />,
    );
    expect(screen.getByTestId("grid-item-card-1")).toBeInTheDocument();
    expect(screen.queryByTestId("grid-item-card-2")).not.toBeInTheDocument();
  });

  // --- Card rendering ---

  it("renders card content via renderCard callback", () => {
    render(
      <DashboardGrid
        layout={sampleLayout}
        cards={sampleCards}
        renderCard={(card) => (
          <div data-testid={`rendered-${card.id}`}>{card.title}</div>
        )}
      />,
    );
    expect(screen.getByTestId("rendered-card-1")).toHaveTextContent(
      "Revenue by Region",
    );
    expect(screen.getByTestId("rendered-card-2")).toHaveTextContent(
      "Monthly Trend",
    );
    expect(screen.getByTestId("rendered-card-3")).toHaveTextContent(
      "Total Revenue",
    );
  });

  it("shows card title as fallback when renderCard is not provided", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    expect(screen.getByTestId("grid-item-card-1")).toHaveTextContent(
      "Revenue by Region",
    );
  });

  it("shows 'Unknown card' for layout items without matching card config", () => {
    const orphanLayout: LayoutItem[] = [
      { i: "orphan-id", x: 0, y: 0, w: 4, h: 2 },
    ];
    render(
      <DashboardGrid layout={orphanLayout} cards={[]} />,
    );
    expect(screen.getByTestId("grid-item-orphan-id")).toHaveTextContent(
      "Unknown card",
    );
  });

  it("passes correct card config to renderCard", () => {
    const renderCard = vi.fn((card: DashboardCardConfig) => (
      <div>{card.type}</div>
    ));
    render(
      <DashboardGrid
        layout={[sampleLayout[0]]}
        cards={[sampleCards[0]]}
        renderCard={renderCard}
      />,
    );
    expect(renderCard).toHaveBeenCalledTimes(1);
    expect(renderCard).toHaveBeenCalledWith(sampleCards[0]);
  });

  // --- Edit mode ---

  it("disables drag and resize by default (view mode)", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const rgl = screen.getByTestId("rgl-responsive");
    expect(rgl).toHaveAttribute("data-drag-enabled", "false");
    expect(rgl).toHaveAttribute("data-resize-enabled", "false");
  });

  it("enables drag and resize in edit mode", () => {
    render(
      <DashboardGrid
        layout={sampleLayout}
        cards={sampleCards}
        editMode={true}
      />,
    );
    const rgl = screen.getByTestId("rgl-responsive");
    expect(rgl).toHaveAttribute("data-drag-enabled", "true");
    expect(rgl).toHaveAttribute("data-resize-enabled", "true");
  });

  it("uses drag handle selector for card dragging", () => {
    render(
      <DashboardGrid
        layout={sampleLayout}
        cards={sampleCards}
        editMode={true}
      />,
    );
    const rgl = screen.getByTestId("rgl-responsive");
    expect(rgl).toHaveAttribute(
      "data-drag-handle",
      ".dashboard-card-drag-handle",
    );
  });

  // --- Responsive breakpoints ---

  it("passes correct breakpoints to grid layout", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const rgl = screen.getByTestId("rgl-responsive");
    const breakpoints = JSON.parse(
      rgl.getAttribute("data-breakpoints") ?? "{}",
    );
    expect(breakpoints).toEqual(BREAKPOINTS);
  });

  it("passes correct column counts per breakpoint", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const rgl = screen.getByTestId("rgl-responsive");
    const cols = JSON.parse(rgl.getAttribute("data-cols") ?? "{}");
    expect(cols).toEqual(BREAKPOINT_COLS);
  });

  it("provides layouts for all breakpoints", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const rgl = screen.getByTestId("rgl-responsive");
    const keys = rgl.getAttribute("data-layouts-keys")?.split(",");
    expect(keys).toEqual(
      expect.arrayContaining(["lg", "md", "sm", "xs", "xxs"]),
    );
  });

  it("exports BREAKPOINTS with expected keys", () => {
    expect(BREAKPOINTS).toHaveProperty("lg");
    expect(BREAKPOINTS).toHaveProperty("md");
    expect(BREAKPOINTS).toHaveProperty("sm");
    expect(BREAKPOINTS).toHaveProperty("xs");
    expect(BREAKPOINTS).toHaveProperty("xxs");
  });

  it("exports BREAKPOINT_COLS with expected values", () => {
    expect(BREAKPOINT_COLS.lg).toBe(12);
    expect(BREAKPOINT_COLS.md).toBe(10);
    expect(BREAKPOINT_COLS.sm).toBe(6);
    expect(BREAKPOINT_COLS.xs).toBe(4);
    expect(BREAKPOINT_COLS.xxs).toBe(2);
  });

  it("breakpoint widths are in descending order", () => {
    expect(BREAKPOINTS.lg).toBeGreaterThan(BREAKPOINTS.md);
    expect(BREAKPOINTS.md).toBeGreaterThan(BREAKPOINTS.sm);
    expect(BREAKPOINTS.sm).toBeGreaterThan(BREAKPOINTS.xs);
    expect(BREAKPOINTS.xs).toBeGreaterThan(BREAKPOINTS.xxs);
  });

  // --- Layout change callback ---

  it("calls onLayoutChange when layout changes", () => {
    const onLayoutChange = vi.fn();
    render(
      <DashboardGrid
        layout={sampleLayout}
        cards={sampleCards}
        onLayoutChange={onLayoutChange}
        editMode={true}
      />,
    );
    const newLayout: LayoutItem[] = [{ i: "card-1", x: 0, y: 0, w: 12, h: 4 }];
    capturedOnLayoutChange?.(newLayout);
    expect(onLayoutChange).toHaveBeenCalledWith(newLayout);
  });

  it("does not throw when onLayoutChange is not provided", () => {
    render(
      <DashboardGrid
        layout={sampleLayout}
        cards={sampleCards}
        editMode={true}
      />,
    );
    expect(() => capturedOnLayoutChange?.(sampleLayout)).not.toThrow();
  });

  // --- Row height ---

  it("uses default row height of 120", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const rgl = screen.getByTestId("rgl-responsive");
    expect(rgl).toHaveAttribute("data-row-height", "120");
  });

  it("accepts custom row height", () => {
    render(
      <DashboardGrid
        layout={sampleLayout}
        cards={sampleCards}
        rowHeight={80}
      />,
    );
    const rgl = screen.getByTestId("rgl-responsive");
    expect(rgl).toHaveAttribute("data-row-height", "80");
  });

  // --- Compact type ---

  it("uses vertical compactor", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const rgl = screen.getByTestId("rgl-responsive");
    expect(rgl).toHaveAttribute("data-compact-type", "vertical");
  });

  // --- Grid spacing ---

  it("uses 16px margin between cards", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const rgl = screen.getByTestId("rgl-responsive");
    const margin = JSON.parse(rgl.getAttribute("data-margin") ?? "[]");
    expect(margin).toEqual([16, 16]);
  });

  it("uses zero container padding", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const rgl = screen.getByTestId("rgl-responsive");
    const padding = JSON.parse(
      rgl.getAttribute("data-container-padding") ?? "[]",
    );
    expect(padding).toEqual([0, 0]);
  });

  // --- Custom className ---

  it("applies custom className to grid container", () => {
    render(
      <DashboardGrid
        layout={sampleLayout}
        cards={sampleCards}
        className="my-custom-grid"
      />,
    );
    const grid = screen.getByTestId("dashboard-grid");
    expect(grid).toHaveClass("my-custom-grid");
  });

  it("does not add classes when className is not provided", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const grid = screen.getByTestId("dashboard-grid");
    expect(grid.className).toBe("");
  });

  // --- Card styling ---

  it("grid items have proper card styling", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const item = screen.getByTestId("grid-item-card-1");
    expect(item).toHaveClass("rounded-lg");
    expect(item).toHaveClass("border");
    expect(item).toHaveClass("bg-white");
    expect(item).toHaveClass("shadow-sm");
    expect(item).toHaveClass("overflow-hidden");
  });

  it("grid items have data-card-id attribute", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const item = screen.getByTestId("grid-item-card-1");
    expect(item).toHaveAttribute("data-card-id", "card-1");
  });

  // --- Layout as JSON ---

  it("layout is serializable to JSON", () => {
    const json = JSON.stringify(sampleLayout);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(sampleLayout);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toEqual({ i: "card-1", x: 0, y: 0, w: 6, h: 3 });
  });

  it("card configs are serializable to JSON", () => {
    const json = JSON.stringify(sampleCards);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(sampleCards);
    expect(parsed).toHaveLength(3);
  });

  it("full dashboard state (layout + cards) is serializable", () => {
    const dashboardState = {
      layout: sampleLayout,
      cards: sampleCards,
    };
    const json = JSON.stringify(dashboardState);
    const parsed = JSON.parse(json);
    expect(parsed.layout).toEqual(sampleLayout);
    expect(parsed.cards).toEqual(sampleCards);
  });

  // --- All chart types ---

  it("supports all chart types in card config", () => {
    const allTypes = [
      "bar", "line", "area", "scatter", "pie", "radar", "kpi", "table", "text",
    ] as const;

    const typedCards: DashboardCardConfig[] = allTypes.map((type) => ({
      id: `card-${type}`,
      type,
      title: `${type} chart`,
      query: "SELECT 1",
      columnMappings: {},
    }));

    const typedLayout: LayoutItem[] = allTypes.map((type, idx) => ({
      i: `card-${type}`,
      x: (idx % 3) * 4,
      y: Math.floor(idx / 3) * 3,
      w: 4,
      h: 3,
    }));

    const renderCard = vi.fn((card: DashboardCardConfig) => (
      <div data-testid={`type-${card.type}`}>{card.type}</div>
    ));

    render(
      <DashboardGrid
        layout={typedLayout}
        cards={typedCards}
        renderCard={renderCard}
      />,
    );

    for (const type of allTypes) {
      expect(screen.getByTestId(`type-${type}`)).toHaveTextContent(type);
    }
    expect(renderCard).toHaveBeenCalledTimes(allTypes.length);
  });

  // --- Multiple renders / updates ---

  it("handles layout updates without crashing", () => {
    const { rerender } = render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    const updatedLayout: LayoutItem[] = [
      { i: "card-1", x: 0, y: 0, w: 12, h: 4 },
    ];
    rerender(
      <DashboardGrid
        layout={updatedLayout}
        cards={[sampleCards[0]]}
      />,
    );
    expect(screen.getByTestId("grid-item-card-1")).toBeInTheDocument();
    expect(screen.queryByTestId("grid-item-card-2")).not.toBeInTheDocument();
  });

  it("handles adding cards dynamically", () => {
    const { rerender } = render(
      <DashboardGrid
        layout={[sampleLayout[0]]}
        cards={[sampleCards[0]]}
      />,
    );
    expect(screen.queryAllByTestId(/^grid-item-/)).toHaveLength(1);

    rerender(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    expect(screen.queryAllByTestId(/^grid-item-/)).toHaveLength(3);
  });

  it("handles removing cards dynamically", () => {
    const { rerender } = render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    expect(screen.queryAllByTestId(/^grid-item-/)).toHaveLength(3);

    rerender(
      <DashboardGrid
        layout={[sampleLayout[0]]}
        cards={[sampleCards[0]]}
      />,
    );
    expect(screen.queryAllByTestId(/^grid-item-/)).toHaveLength(1);
  });

  it("toggles edit mode without losing layout", () => {
    const { rerender } = render(
      <DashboardGrid
        layout={sampleLayout}
        cards={sampleCards}
        editMode={false}
      />,
    );
    expect(screen.getByTestId("rgl-responsive")).toHaveAttribute(
      "data-drag-enabled",
      "false",
    );

    rerender(
      <DashboardGrid
        layout={sampleLayout}
        cards={sampleCards}
        editMode={true}
      />,
    );
    expect(screen.getByTestId("rgl-responsive")).toHaveAttribute(
      "data-drag-enabled",
      "true",
    );
    expect(screen.queryAllByTestId(/^grid-item-/)).toHaveLength(3);
  });

  // --- Breakpoint change ---

  it("handles breakpoint change", () => {
    render(
      <DashboardGrid layout={sampleLayout} cards={sampleCards} />,
    );
    // Trigger breakpoint change via captured callback
    act(() => {
      capturedOnBreakpointChange?.("sm", 6);
    });
    // No error thrown — breakpoint state updated internally
    expect(screen.getByTestId("dashboard-grid")).toBeInTheDocument();
  });
});
