import { useCallback, useState } from "react";

const STORAGE_KEY = "findbi-query-history";
const MAX_ENTRIES = 50;

export interface QueryHistoryEntry {
  sql: string;
  timestamp: number;
}

function loadEntries(): QueryHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry: unknown): entry is QueryHistoryEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as QueryHistoryEntry).sql === "string" &&
        typeof (entry as QueryHistoryEntry).timestamp === "number",
    );
  } catch {
    return [];
  }
}

function saveEntries(entries: QueryHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useQueryHistory() {
  const [entries, setEntries] = useState<QueryHistoryEntry[]>(loadEntries);

  const addEntry = useCallback((sql: string) => {
    setEntries((prev) => {
      const trimmed = sql.trim();
      if (!trimmed) return prev;

      // Dedup: skip if same as most recent entry
      if (prev.length > 0 && prev[0].sql === trimmed) return prev;

      const newEntry: QueryHistoryEntry = {
        sql: trimmed,
        timestamp: Date.now(),
      };
      const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      saveEntries(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setEntries([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { entries, addEntry, clearHistory } as const;
}
