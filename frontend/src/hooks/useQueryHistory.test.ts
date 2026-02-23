import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useQueryHistory } from "./useQueryHistory";

const STORAGE_KEY = "findbi-query-history";

describe("useQueryHistory", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // --- Initial state ---

  it("returns empty entries when localStorage is empty", () => {
    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.entries).toEqual([]);
  });

  it("loads existing entries from localStorage", () => {
    const entries = [
      { sql: "SELECT 1", timestamp: 1000 },
      { sql: "SELECT 2", timestamp: 900 },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.entries).toEqual(entries);
  });

  it("returns empty entries when localStorage has invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not json{{{");

    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.entries).toEqual([]);
  });

  it("returns empty entries when localStorage has non-array value", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));

    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.entries).toEqual([]);
  });

  it("filters out malformed entries from localStorage", () => {
    const data = [
      { sql: "SELECT 1", timestamp: 1000 },
      { sql: 123, timestamp: 900 }, // sql is not string
      { sql: "SELECT 3" }, // missing timestamp
      null,
      "not an object",
      { sql: "SELECT 4", timestamp: 800 },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.entries).toEqual([
      { sql: "SELECT 1", timestamp: 1000 },
      { sql: "SELECT 4", timestamp: 800 },
    ]);
  });

  // --- addEntry ---

  it("adds a new entry to the beginning", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("SELECT 1");
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].sql).toBe("SELECT 1");
    expect(typeof result.current.entries[0].timestamp).toBe("number");
  });

  it("adds newest entries first", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("SELECT 1");
    });
    act(() => {
      result.current.addEntry("SELECT 2");
    });

    expect(result.current.entries[0].sql).toBe("SELECT 2");
    expect(result.current.entries[1].sql).toBe("SELECT 1");
  });

  it("trims the sql before storing", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("  SELECT 1  ");
    });

    expect(result.current.entries[0].sql).toBe("SELECT 1");
  });

  it("does not add empty string", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("");
    });

    expect(result.current.entries).toHaveLength(0);
  });

  it("does not add whitespace-only string", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("   \n  ");
    });

    expect(result.current.entries).toHaveLength(0);
  });

  it("deduplicates consecutive identical queries", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("SELECT 1");
    });
    act(() => {
      result.current.addEntry("SELECT 1");
    });

    expect(result.current.entries).toHaveLength(1);
  });

  it("deduplicates after trimming whitespace", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("SELECT 1");
    });
    act(() => {
      result.current.addEntry("  SELECT 1  ");
    });

    expect(result.current.entries).toHaveLength(1);
  });

  it("allows same query after a different query in between", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("SELECT 1");
    });
    act(() => {
      result.current.addEntry("SELECT 2");
    });
    act(() => {
      result.current.addEntry("SELECT 1");
    });

    expect(result.current.entries).toHaveLength(3);
  });

  it("limits entries to 50", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.addEntry(`SELECT ${i}`);
      }
    });

    expect(result.current.entries).toHaveLength(50);
    expect(result.current.entries[0].sql).toBe("SELECT 59");
    expect(result.current.entries[49].sql).toBe("SELECT 10");
  });

  it("persists entries to localStorage", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("SELECT 1");
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].sql).toBe("SELECT 1");
  });

  it("handles localStorage write failure gracefully", () => {
    const { result } = renderHook(() => useQueryHistory());

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });

    // Should not throw
    act(() => {
      result.current.addEntry("SELECT 1");
    });

    // Entry still added to state
    expect(result.current.entries).toHaveLength(1);
  });

  it("records a timestamp close to Date.now()", () => {
    const { result } = renderHook(() => useQueryHistory());
    const before = Date.now();

    act(() => {
      result.current.addEntry("SELECT 1");
    });

    const after = Date.now();
    const ts = result.current.entries[0].timestamp;
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  // --- clearHistory ---

  it("clears all entries", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("SELECT 1");
      result.current.addEntry("SELECT 2");
    });
    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.entries).toEqual([]);
  });

  it("removes localStorage key on clear", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("SELECT 1");
    });
    act(() => {
      result.current.clearHistory();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("handles localStorage removeItem failure gracefully", () => {
    const { result } = renderHook(() => useQueryHistory());

    act(() => {
      result.current.addEntry("SELECT 1");
    });

    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    // Should not throw
    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.entries).toEqual([]);
  });

  // --- Stability of returned functions ---

  it("addEntry is referentially stable", () => {
    const { result, rerender } = renderHook(() => useQueryHistory());
    const first = result.current.addEntry;
    rerender();
    expect(result.current.addEntry).toBe(first);
  });

  it("clearHistory is referentially stable", () => {
    const { result, rerender } = renderHook(() => useQueryHistory());
    const first = result.current.clearHistory;
    rerender();
    expect(result.current.clearHistory).toBe(first);
  });
});
