import { useCallback, useEffect, useRef, useState } from "react";
import type { QueryHistoryEntry } from "@/hooks/useQueryHistory";

interface QueryHistoryProps {
  entries: QueryHistoryEntry[];
  onSelect: (sql: string) => void;
  onClear: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

function truncateSql(sql: string, maxLen: number = 80): string {
  const oneLine = sql.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return oneLine.slice(0, maxLen) + "\u2026";
}

function QueryHistory({ entries, onSelect, onClear }: QueryHistoryProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (sql: string) => {
      onSelect(sql);
      setOpen(false);
    },
    [onSelect],
  );

  const handleClear = useCallback(() => {
    onClear();
    setOpen(false);
  }, [onClear]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative" data-testid="query-history">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
        data-testid="query-history-toggle"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Clock icon */}
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        History
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-96 max-h-80 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
          data-testid="query-history-dropdown"
          role="menu"
        >
          {entries.length === 0 ? (
            <div
              className="px-3 py-4 text-center text-xs text-gray-400"
              data-testid="query-history-empty"
            >
              No queries yet
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {entries.map((entry, index) => (
                  <li key={`${entry.timestamp}-${index}`}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => handleSelect(entry.sql)}
                      data-testid={`query-history-entry-${index}`}
                      role="menuitem"
                    >
                      <div className="text-xs font-mono text-gray-700 truncate">
                        {truncateSql(entry.sql)}
                      </div>
                      <div className="mt-0.5 text-[10px] text-gray-400">
                        {formatRelativeTime(entry.timestamp)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-100 px-3 py-1.5">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  data-testid="query-history-clear"
                  role="menuitem"
                >
                  Clear history
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export type { QueryHistoryProps };
export { formatRelativeTime, truncateSql };
export default QueryHistory;
