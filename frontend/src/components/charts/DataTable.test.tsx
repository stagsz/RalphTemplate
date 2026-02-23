import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import DataTable from "./DataTable";

const mockColumns = [
  { key: "name", name: "Name" },
  { key: "age", name: "Age" },
  { key: "city", name: "City" },
];

const mockRows = [
  { name: "Alice", age: 30, city: "New York" },
  { name: "Bob", age: 25, city: "London" },
  { name: "Charlie", age: 35, city: "Paris" },
  { name: "Diana", age: 28, city: "Berlin" },
  { name: "Eve", age: 22, city: "Tokyo" },
];

describe("DataTable", () => {
  afterEach(() => {
    cleanup();
  });

  // --- Rendering ---

  it("renders a datatable container", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    expect(screen.getByTestId("datatable-container")).toBeInTheDocument();
  });

  it("renders a table element", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    expect(screen.getByTestId("datatable-table")).toBeInTheDocument();
  });

  it("renders column headers", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    expect(screen.getByTestId("datatable-header")).toBeInTheDocument();
    expect(screen.getByTestId("datatable-th-name")).toHaveTextContent("Name");
    expect(screen.getByTestId("datatable-th-age")).toHaveTextContent("Age");
    expect(screen.getByTestId("datatable-th-city")).toHaveTextContent("City");
  });

  it("renders rows with correct data", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    const rows = screen.getAllByTestId("datatable-row");
    expect(rows).toHaveLength(5);
    expect(screen.getByTestId("datatable-cell-0-name")).toHaveTextContent("Alice");
    expect(screen.getByTestId("datatable-cell-0-age")).toHaveTextContent("30");
    expect(screen.getByTestId("datatable-cell-1-name")).toHaveTextContent("Bob");
    expect(screen.getByTestId("datatable-cell-4-city")).toHaveTextContent("Tokyo");
  });

  it("shows empty state when no rows", () => {
    render(<DataTable columns={mockColumns} rows={[]} />);
    expect(screen.getByTestId("datatable-empty")).toHaveTextContent("No data");
    expect(screen.queryAllByTestId("datatable-row")).toHaveLength(0);
  });

  it("handles null and undefined cell values", () => {
    const rows = [{ name: null, age: undefined, city: "Test" }];
    render(
      <DataTable
        columns={mockColumns}
        rows={rows as unknown as Record<string, unknown>[]}
      />,
    );
    expect(screen.getByTestId("datatable-cell-0-name")).toHaveTextContent("");
    expect(screen.getByTestId("datatable-cell-0-age")).toHaveTextContent("");
    expect(screen.getByTestId("datatable-cell-0-city")).toHaveTextContent("Test");
  });

  it("handles boolean values", () => {
    const cols = [{ key: "active", name: "Active" }];
    const rows = [{ active: true }, { active: false }];
    render(<DataTable columns={cols} rows={rows} />);
    expect(screen.getByTestId("datatable-cell-0-active")).toHaveTextContent("true");
    expect(screen.getByTestId("datatable-cell-1-active")).toHaveTextContent("false");
  });

  it("handles missing fields in row data", () => {
    const rows = [{ name: "Alice" }];
    render(<DataTable columns={mockColumns} rows={rows} />);
    expect(screen.getByTestId("datatable-cell-0-name")).toHaveTextContent("Alice");
    expect(screen.getByTestId("datatable-cell-0-age")).toHaveTextContent("");
  });

  // --- Styling ---

  it("has proper card styling", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    const container = screen.getByTestId("datatable-container");
    expect(container).toHaveClass("rounded-lg");
    expect(container).toHaveClass("border");
    expect(container).toHaveClass("bg-white");
    expect(container).toHaveClass("shadow-sm");
  });

  it("applies custom className", () => {
    render(
      <DataTable columns={mockColumns} rows={mockRows} className="w-full my-4" />,
    );
    const container = screen.getByTestId("datatable-container");
    expect(container).toHaveClass("w-full");
    expect(container).toHaveClass("my-4");
  });

  it("applies custom style", () => {
    render(
      <DataTable
        columns={mockColumns}
        rows={mockRows}
        style={{ maxHeight: 400 }}
      />,
    );
    const container = screen.getByTestId("datatable-container");
    expect(container.style.maxHeight).toBe("400px");
  });

  it("header has background styling", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    const header = screen.getByTestId("datatable-header");
    expect(header).toHaveClass("bg-gray-50");
  });

  // --- Loading ---

  it("shows loading overlay when loading", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} loading={true} />);
    expect(screen.getByTestId("datatable-loading")).toBeInTheDocument();
    expect(screen.getByTestId("datatable-loading")).toHaveTextContent("Loading...");
  });

  it("does not show loading overlay when not loading", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} loading={false} />);
    expect(screen.queryByTestId("datatable-loading")).not.toBeInTheDocument();
  });

  it("still renders table under loading overlay", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} loading={true} />);
    expect(screen.getByTestId("datatable-table")).toBeInTheDocument();
    expect(screen.getAllByTestId("datatable-row")).toHaveLength(5);
  });

  // --- Sorting ---

  it("does not show sort buttons when sortable is false", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} sortable={false} />);
    expect(screen.queryByTestId("sort-button-name")).not.toBeInTheDocument();
  });

  it("shows sort buttons when sortable is true", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} sortable={true} />);
    expect(screen.getByTestId("sort-button-name")).toBeInTheDocument();
    expect(screen.getByTestId("sort-button-age")).toBeInTheDocument();
    expect(screen.getByTestId("sort-button-city")).toBeInTheDocument();
  });

  it("sorts ascending on first click", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} sortable={true} />);
    fireEvent.click(screen.getByTestId("sort-button-name"));
    expect(screen.getByTestId("datatable-cell-0-name")).toHaveTextContent("Alice");
    expect(screen.getByTestId("datatable-cell-1-name")).toHaveTextContent("Bob");
    expect(screen.getByTestId("datatable-cell-4-name")).toHaveTextContent("Eve");
    expect(screen.getByTestId("sort-indicator-name")).toHaveTextContent("▲");
  });

  it("sorts descending on second click", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} sortable={true} />);
    fireEvent.click(screen.getByTestId("sort-button-name"));
    fireEvent.click(screen.getByTestId("sort-button-name"));
    expect(screen.getByTestId("datatable-cell-0-name")).toHaveTextContent("Eve");
    expect(screen.getByTestId("datatable-cell-4-name")).toHaveTextContent("Alice");
    expect(screen.getByTestId("sort-indicator-name")).toHaveTextContent("▼");
  });

  it("sorts numeric columns numerically", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} sortable={true} />);
    fireEvent.click(screen.getByTestId("sort-button-age"));
    expect(screen.getByTestId("datatable-cell-0-age")).toHaveTextContent("22");
    expect(screen.getByTestId("datatable-cell-4-age")).toHaveTextContent("35");
  });

  it("changes sort column when clicking different header", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} sortable={true} />);
    fireEvent.click(screen.getByTestId("sort-button-name"));
    expect(screen.getByTestId("sort-indicator-name")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("sort-button-city"));
    expect(screen.queryByTestId("sort-indicator-name")).not.toBeInTheDocument();
    expect(screen.getByTestId("sort-indicator-city")).toBeInTheDocument();
  });

  it("does not show sort indicator for unsorted columns", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} sortable={true} />);
    expect(screen.queryByTestId("sort-indicator-name")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sort-indicator-age")).not.toBeInTheDocument();
  });

  // --- Pagination ---

  it("shows row count", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    expect(screen.getByTestId("datatable-row-count")).toHaveTextContent("5 rows");
  });

  it("shows singular row for single item", () => {
    render(<DataTable columns={mockColumns} rows={[mockRows[0]]} />);
    expect(screen.getByTestId("datatable-row-count")).toHaveTextContent("1 row");
  });

  it("does not show pagination when all rows fit in one page", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} pageSize={10} />);
    expect(screen.queryByTestId("datatable-prev")).not.toBeInTheDocument();
    expect(screen.queryByTestId("datatable-next")).not.toBeInTheDocument();
  });

  it("shows pagination controls when rows exceed pageSize", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} pageSize={2} />);
    expect(screen.getByTestId("datatable-prev")).toBeInTheDocument();
    expect(screen.getByTestId("datatable-next")).toBeInTheDocument();
    expect(screen.getByTestId("datatable-page-info")).toHaveTextContent("Page 1 of 3");
  });

  it("shows only pageSize rows per page", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} pageSize={2} />);
    expect(screen.getAllByTestId("datatable-row")).toHaveLength(2);
  });

  it("navigates to next page", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} pageSize={2} />);
    fireEvent.click(screen.getByTestId("datatable-next"));
    expect(screen.getByTestId("datatable-page-info")).toHaveTextContent("Page 2 of 3");
    expect(screen.getByTestId("datatable-cell-0-name")).toHaveTextContent("Charlie");
    expect(screen.getByTestId("datatable-cell-1-name")).toHaveTextContent("Diana");
  });

  it("navigates to previous page", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} pageSize={2} />);
    fireEvent.click(screen.getByTestId("datatable-next"));
    fireEvent.click(screen.getByTestId("datatable-prev"));
    expect(screen.getByTestId("datatable-page-info")).toHaveTextContent("Page 1 of 3");
    expect(screen.getByTestId("datatable-cell-0-name")).toHaveTextContent("Alice");
  });

  it("disables previous button on first page", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} pageSize={2} />);
    expect(screen.getByTestId("datatable-prev")).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} pageSize={2} />);
    fireEvent.click(screen.getByTestId("datatable-next"));
    fireEvent.click(screen.getByTestId("datatable-next"));
    expect(screen.getByTestId("datatable-next")).toBeDisabled();
  });

  it("last page shows remaining rows", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} pageSize={2} />);
    fireEvent.click(screen.getByTestId("datatable-next"));
    fireEvent.click(screen.getByTestId("datatable-next"));
    expect(screen.getAllByTestId("datatable-row")).toHaveLength(1);
    expect(screen.getByTestId("datatable-cell-0-name")).toHaveTextContent("Eve");
  });

  it("resets to page 0 when sort changes", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} sortable pageSize={2} />);
    fireEvent.click(screen.getByTestId("datatable-next"));
    expect(screen.getByTestId("datatable-page-info")).toHaveTextContent("Page 2 of 3");
    fireEvent.click(screen.getByTestId("sort-button-name"));
    expect(screen.getByTestId("datatable-page-info")).toHaveTextContent("Page 1 of 3");
  });

  it("uses default pageSize of 50", () => {
    const manyRows = Array.from({ length: 60 }, (_, i) => ({
      name: `User ${i}`,
      age: 20 + i,
      city: "City",
    }));
    render(<DataTable columns={mockColumns} rows={manyRows} />);
    expect(screen.getAllByTestId("datatable-row")).toHaveLength(50);
    expect(screen.getByTestId("datatable-page-info")).toHaveTextContent("Page 1 of 2");
  });

  // --- Column Resize ---

  it("renders resize handles for each column", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    expect(screen.getByTestId("resize-handle-name")).toBeInTheDocument();
    expect(screen.getByTestId("resize-handle-age")).toBeInTheDocument();
    expect(screen.getByTestId("resize-handle-city")).toBeInTheDocument();
  });

  it("resize handles have cursor-col-resize class", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    expect(screen.getByTestId("resize-handle-name")).toHaveClass("cursor-col-resize");
  });

  it("resize handles have separator role", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    expect(screen.getByTestId("resize-handle-name")).toHaveAttribute("role", "separator");
  });

  it("applies custom column width from column def", () => {
    const cols = [
      { key: "name", name: "Name", width: 200 },
      { key: "age", name: "Age", width: 100 },
    ];
    render(<DataTable columns={cols} rows={mockRows} />);
    const th = screen.getByTestId("datatable-th-name");
    expect(th.style.width).toBe("200px");
    const thAge = screen.getByTestId("datatable-th-age");
    expect(thAge.style.width).toBe("100px");
  });

  it("uses default width of 150px when no width specified", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    const th = screen.getByTestId("datatable-th-name");
    expect(th.style.width).toBe("150px");
  });

  // --- Large datasets ---

  it("handles 1000 rows with pagination", () => {
    const largeRows = Array.from({ length: 1000 }, (_, i) => ({
      name: `User ${i}`,
      age: 20 + (i % 50),
      city: `City ${i % 10}`,
    }));
    render(<DataTable columns={mockColumns} rows={largeRows} pageSize={100} />);
    expect(screen.getAllByTestId("datatable-row")).toHaveLength(100);
    expect(screen.getByTestId("datatable-row-count")).toHaveTextContent("1000 rows");
    expect(screen.getByTestId("datatable-page-info")).toHaveTextContent("Page 1 of 10");
  });

  it("handles 10000 rows with default pageSize", () => {
    const hugeRows = Array.from({ length: 10000 }, (_, i) => ({
      name: `User ${i}`,
      age: i,
      city: "City",
    }));
    render(<DataTable columns={mockColumns} rows={hugeRows} />);
    expect(screen.getAllByTestId("datatable-row")).toHaveLength(50);
    expect(screen.getByTestId("datatable-row-count")).toHaveTextContent("10000 rows");
  });

  // --- Edge cases ---

  it("handles single column", () => {
    const cols = [{ key: "id", name: "ID" }];
    const rows = [{ id: 1 }, { id: 2 }];
    render(<DataTable columns={cols} rows={rows} />);
    expect(screen.getAllByTestId("datatable-row")).toHaveLength(2);
    expect(screen.getByTestId("datatable-cell-0-id")).toHaveTextContent("1");
  });

  it("handles single row", () => {
    render(<DataTable columns={mockColumns} rows={[mockRows[0]]} />);
    expect(screen.getAllByTestId("datatable-row")).toHaveLength(1);
    expect(screen.getByTestId("datatable-cell-0-name")).toHaveTextContent("Alice");
  });

  it("does not show pagination footer for empty rows", () => {
    render(<DataTable columns={mockColumns} rows={[]} />);
    expect(screen.queryByTestId("datatable-pagination")).not.toBeInTheDocument();
  });

  it("renders all props together", () => {
    render(
      <DataTable
        columns={mockColumns}
        rows={mockRows}
        sortable={true}
        pageSize={3}
        className="custom-table"
        style={{ width: 800 }}
        loading={false}
      />,
    );
    const container = screen.getByTestId("datatable-container");
    expect(container).toHaveClass("custom-table");
    expect(container.style.width).toBe("800px");
    expect(screen.getAllByTestId("datatable-row")).toHaveLength(3);
    expect(screen.getByTestId("sort-button-name")).toBeInTheDocument();
    expect(screen.getByTestId("datatable-page-info")).toHaveTextContent("Page 1 of 2");
  });
});
