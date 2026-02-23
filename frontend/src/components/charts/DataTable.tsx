import { useState, useMemo, useRef, useCallback } from "react";

interface ColumnDef {
  key: string;
  name: string;
  width?: number;
}

interface DataTableProps {
  columns: ColumnDef[];
  rows: Record<string, unknown>[];
  sortable?: boolean;
  pageSize?: number;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
}

type SortDir = "asc" | "desc";

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function compareValues(a: unknown, b: unknown, dir: SortDir): number {
  const aStr = formatCell(a);
  const bStr = formatCell(b);

  // Try numeric comparison
  const aNum = Number(aStr);
  const bNum = Number(bStr);
  if (aStr !== "" && bStr !== "" && !isNaN(aNum) && !isNaN(bNum)) {
    return dir === "asc" ? aNum - bNum : bNum - aNum;
  }

  // String comparison
  const cmp = aStr.localeCompare(bStr);
  return dir === "asc" ? cmp : -cmp;
}

function DataTable({
  columns,
  rows,
  sortable = false,
  pageSize = 50,
  className,
  style,
  loading = false,
}: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleSort = useCallback(
    (key: string) => {
      if (!sortable) return;
      if (sortColumn === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortColumn(key);
        setSortDir("asc");
      }
      setPage(0);
    },
    [sortable, sortColumn],
  );

  const sortedRows = useMemo(() => {
    if (!sortColumn) return rows;
    return [...rows].sort((a, b) =>
      compareValues(a[sortColumn], b[sortColumn], sortDir),
    );
  }, [rows, sortColumn, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const paginatedRows = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, key: string) => {
      e.preventDefault();
      e.stopPropagation();
      const col = columns.find((c) => c.key === key);
      const startWidth =
        columnWidths[key] ?? col?.width ?? 150;
      resizingRef.current = { key, startX: e.clientX, startWidth };

      const onMouseMove = (ev: MouseEvent) => {
        if (!resizingRef.current) return;
        const diff = ev.clientX - resizingRef.current.startX;
        const newWidth = Math.max(50, resizingRef.current.startWidth + diff);
        setColumnWidths((prev) => ({ ...prev, [resizingRef.current!.key]: newWidth }));
      };

      const onMouseUp = () => {
        resizingRef.current = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [columns, columnWidths],
  );

  const getColumnWidth = useCallback(
    (col: ColumnDef) => columnWidths[col.key] ?? col.width ?? 150,
    [columnWidths],
  );

  return (
    <div
      data-testid="datatable-container"
      className={`relative rounded-lg border border-gray-200 bg-white shadow-sm ${className ?? ""}`}
      style={style}
    >
      {loading && (
        <div
          data-testid="datatable-loading"
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/60"
        >
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table data-testid="datatable-table" className="w-full text-left text-sm">
          <thead>
            <tr data-testid="datatable-header" className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  data-testid={`datatable-th-${col.key}`}
                  className="relative whitespace-nowrap px-4 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase select-none"
                  style={{ width: getColumnWidth(col), minWidth: 50 }}
                >
                  <div className="flex items-center gap-1">
                    {sortable ? (
                      <button
                        data-testid={`sort-button-${col.key}`}
                        className="flex items-center gap-1 hover:text-gray-700"
                        onClick={() => handleSort(col.key)}
                        type="button"
                      >
                        {col.name}
                        {sortColumn === col.key && (
                          <span data-testid={`sort-indicator-${col.key}`}>
                            {sortDir === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </button>
                    ) : (
                      <span>{col.name}</span>
                    )}
                  </div>
                  <div
                    data-testid={`resize-handle-${col.key}`}
                    className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
                    onMouseDown={(e) => handleResizeStart(e, col.key)}
                    role="separator"
                    aria-orientation="vertical"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                  data-testid="datatable-empty"
                >
                  No data
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  data-testid="datatable-row"
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      data-testid={`datatable-cell-${rowIdx}-${col.key}`}
                      className="px-4 py-2.5 text-gray-700"
                      style={{
                        width: getColumnWidth(col),
                        minWidth: 50,
                        maxWidth: getColumnWidth(col),
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCell(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sortedRows.length > 0 && (
        <div
          data-testid="datatable-pagination"
          className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-500"
        >
          <span data-testid="datatable-row-count">
            {sortedRows.length} row{sortedRows.length !== 1 ? "s" : ""}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                data-testid="datatable-prev"
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={currentPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                type="button"
              >
                Previous
              </button>
              <span data-testid="datatable-page-info">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                data-testid="datatable-next"
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                type="button"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { DataTableProps, ColumnDef };
export default DataTable;
