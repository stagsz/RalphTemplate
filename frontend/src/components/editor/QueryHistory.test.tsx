import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import QueryHistory, { formatRelativeTime, truncateSql } from "./QueryHistory";
import type { QueryHistoryEntry } from "@/hooks/useQueryHistory";

function makeEntries(count: number): QueryHistoryEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    sql: `SELECT ${i + 1} FROM table_${i + 1}`,
    timestamp: Date.now() - i * 60000, // each 1 minute apart
  }));
}

describe("QueryHistory", () => {
  const defaultProps = {
    entries: [] as QueryHistoryEntry[],
    onSelect: vi.fn(),
    onClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // --- Rendering ---

  it("renders the history container", () => {
    render(<QueryHistory {...defaultProps} />);
    expect(screen.getByTestId("query-history")).toBeInTheDocument();
  });

  it("renders the toggle button", () => {
    render(<QueryHistory {...defaultProps} />);
    expect(screen.getByTestId("query-history-toggle")).toBeInTheDocument();
  });

  it("toggle button shows 'History' text", () => {
    render(<QueryHistory {...defaultProps} />);
    expect(screen.getByTestId("query-history-toggle")).toHaveTextContent("History");
  });

  it("dropdown is not visible by default", () => {
    render(<QueryHistory {...defaultProps} />);
    expect(screen.queryByTestId("query-history-dropdown")).not.toBeInTheDocument();
  });

  it("toggle button has aria-expanded=false initially", () => {
    render(<QueryHistory {...defaultProps} />);
    expect(screen.getByTestId("query-history-toggle")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  // --- Toggle behavior ---

  it("opens dropdown on click", async () => {
    const user = userEvent.setup();
    render(<QueryHistory {...defaultProps} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.getByTestId("query-history-dropdown")).toBeInTheDocument();
  });

  it("sets aria-expanded=true when open", async () => {
    const user = userEvent.setup();
    render(<QueryHistory {...defaultProps} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.getByTestId("query-history-toggle")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("closes dropdown on second click", async () => {
    const user = userEvent.setup();
    render(<QueryHistory {...defaultProps} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.getByTestId("query-history-dropdown")).toBeInTheDocument();

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.queryByTestId("query-history-dropdown")).not.toBeInTheDocument();
  });

  it("dropdown has role=menu", async () => {
    const user = userEvent.setup();
    render(<QueryHistory {...defaultProps} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.getByTestId("query-history-dropdown")).toHaveAttribute(
      "role",
      "menu",
    );
  });

  // --- Empty state ---

  it("shows empty state when no entries", async () => {
    const user = userEvent.setup();
    render(<QueryHistory {...defaultProps} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.getByTestId("query-history-empty")).toBeInTheDocument();
    expect(screen.getByTestId("query-history-empty")).toHaveTextContent(
      "No queries yet",
    );
  });

  it("does not show clear button when empty", async () => {
    const user = userEvent.setup();
    render(<QueryHistory {...defaultProps} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.queryByTestId("query-history-clear")).not.toBeInTheDocument();
  });

  // --- Entries ---

  it("renders entries when provided", async () => {
    const user = userEvent.setup();
    const entries = makeEntries(3);
    render(<QueryHistory {...defaultProps} entries={entries} />);

    await user.click(screen.getByTestId("query-history-toggle"));

    expect(screen.getByTestId("query-history-entry-0")).toBeInTheDocument();
    expect(screen.getByTestId("query-history-entry-1")).toBeInTheDocument();
    expect(screen.getByTestId("query-history-entry-2")).toBeInTheDocument();
  });

  it("displays SQL text in entries", async () => {
    const user = userEvent.setup();
    const entries = [{ sql: "SELECT * FROM users", timestamp: Date.now() }];
    render(<QueryHistory {...defaultProps} entries={entries} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.getByTestId("query-history-entry-0")).toHaveTextContent(
      "SELECT * FROM users",
    );
  });

  it("shows relative time for entries", async () => {
    const user = userEvent.setup();
    const entries = [{ sql: "SELECT 1", timestamp: Date.now() }];
    render(<QueryHistory {...defaultProps} entries={entries} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.getByTestId("query-history-entry-0")).toHaveTextContent(
      "just now",
    );
  });

  it("entries have role=menuitem", async () => {
    const user = userEvent.setup();
    const entries = makeEntries(1);
    render(<QueryHistory {...defaultProps} entries={entries} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.getByTestId("query-history-entry-0")).toHaveAttribute(
      "role",
      "menuitem",
    );
  });

  // --- Selection ---

  it("calls onSelect when entry is clicked", async () => {
    const user = userEvent.setup();
    const entries = [{ sql: "SELECT * FROM users", timestamp: Date.now() }];
    const onSelect = vi.fn();
    render(<QueryHistory {...defaultProps} entries={entries} onSelect={onSelect} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    await user.click(screen.getByTestId("query-history-entry-0"));

    expect(onSelect).toHaveBeenCalledWith("SELECT * FROM users");
  });

  it("closes dropdown after selecting an entry", async () => {
    const user = userEvent.setup();
    const entries = makeEntries(2);
    render(<QueryHistory {...defaultProps} entries={entries} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    await user.click(screen.getByTestId("query-history-entry-0"));

    expect(screen.queryByTestId("query-history-dropdown")).not.toBeInTheDocument();
  });

  // --- Clear ---

  it("shows clear button when entries exist", async () => {
    const user = userEvent.setup();
    const entries = makeEntries(2);
    render(<QueryHistory {...defaultProps} entries={entries} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.getByTestId("query-history-clear")).toBeInTheDocument();
    expect(screen.getByTestId("query-history-clear")).toHaveTextContent(
      "Clear history",
    );
  });

  it("calls onClear when clear button is clicked", async () => {
    const user = userEvent.setup();
    const entries = makeEntries(1);
    const onClear = vi.fn();
    render(<QueryHistory {...defaultProps} entries={entries} onClear={onClear} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    await user.click(screen.getByTestId("query-history-clear"));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("closes dropdown after clearing", async () => {
    const user = userEvent.setup();
    const entries = makeEntries(1);
    render(<QueryHistory {...defaultProps} entries={entries} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    await user.click(screen.getByTestId("query-history-clear"));

    expect(screen.queryByTestId("query-history-dropdown")).not.toBeInTheDocument();
  });

  // --- Close on outside click ---

  it("closes dropdown when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div data-testid="outside">
        <QueryHistory {...defaultProps} entries={makeEntries(1)} />
      </div>,
    );

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.getByTestId("query-history-dropdown")).toBeInTheDocument();

    // mousedown outside triggers outside click handler
    await act(async () => {
      const outside = screen.getByTestId("outside");
      outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    expect(screen.queryByTestId("query-history-dropdown")).not.toBeInTheDocument();
  });

  // --- Close on Escape ---

  it("closes dropdown on Escape key", async () => {
    const user = userEvent.setup();
    render(<QueryHistory {...defaultProps} entries={makeEntries(1)} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    expect(screen.getByTestId("query-history-dropdown")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("query-history-dropdown")).not.toBeInTheDocument();
  });

  // --- Multiple entries ---

  it("renders all entries in order", async () => {
    const user = userEvent.setup();
    const entries = makeEntries(5);
    render(<QueryHistory {...defaultProps} entries={entries} />);

    await user.click(screen.getByTestId("query-history-toggle"));

    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId(`query-history-entry-${i}`)).toBeInTheDocument();
    }
  });

  it("selects the correct entry when multiple exist", async () => {
    const user = userEvent.setup();
    const entries = makeEntries(3);
    const onSelect = vi.fn();
    render(<QueryHistory {...defaultProps} entries={entries} onSelect={onSelect} />);

    await user.click(screen.getByTestId("query-history-toggle"));
    await user.click(screen.getByTestId("query-history-entry-2"));

    expect(onSelect).toHaveBeenCalledWith(entries[2].sql);
  });
});

// --- Utility function unit tests ---

describe("formatRelativeTime", () => {
  it("returns 'just now' for timestamps less than a minute ago", () => {
    expect(formatRelativeTime(Date.now())).toBe("just now");
    expect(formatRelativeTime(Date.now() - 30000)).toBe("just now");
  });

  it("returns minutes for timestamps under an hour", () => {
    expect(formatRelativeTime(Date.now() - 120000)).toBe("2m ago");
    expect(formatRelativeTime(Date.now() - 59 * 60000)).toBe("59m ago");
  });

  it("returns hours for timestamps under 24 hours", () => {
    expect(formatRelativeTime(Date.now() - 3600000)).toBe("1h ago");
    expect(formatRelativeTime(Date.now() - 23 * 3600000)).toBe("23h ago");
  });

  it("returns 'yesterday' for 1 day ago", () => {
    expect(formatRelativeTime(Date.now() - 24 * 3600000)).toBe("yesterday");
  });

  it("returns days for 2-6 days ago", () => {
    expect(formatRelativeTime(Date.now() - 2 * 24 * 3600000)).toBe("2d ago");
    expect(formatRelativeTime(Date.now() - 6 * 24 * 3600000)).toBe("6d ago");
  });

  it("returns formatted date for 7+ days ago", () => {
    const ts = Date.now() - 30 * 24 * 3600000;
    const result = formatRelativeTime(ts);
    // Should be a locale date string, not relative
    expect(result).not.toContain("ago");
    expect(result).not.toBe("yesterday");
  });
});

describe("truncateSql", () => {
  it("returns short SQL unchanged", () => {
    expect(truncateSql("SELECT 1")).toBe("SELECT 1");
  });

  it("collapses whitespace to single spaces", () => {
    expect(truncateSql("SELECT\n  *\n  FROM\n  users")).toBe(
      "SELECT * FROM users",
    );
  });

  it("truncates SQL longer than maxLen with ellipsis", () => {
    const longSql = "SELECT " + "a, ".repeat(50) + "b FROM very_long_table";
    const result = truncateSql(longSql, 80);
    expect(result).toHaveLength(81); // 80 chars + ellipsis character
    expect(result.endsWith("\u2026")).toBe(true);
  });

  it("uses default maxLen of 80", () => {
    const longSql = "x".repeat(100);
    const result = truncateSql(longSql);
    expect(result).toHaveLength(81); // 80 + ellipsis
  });

  it("does not truncate SQL at exactly maxLen", () => {
    const sql = "x".repeat(80);
    expect(truncateSql(sql, 80)).toBe(sql);
  });

  it("trims leading/trailing whitespace", () => {
    expect(truncateSql("  SELECT 1  ")).toBe("SELECT 1");
  });
});
