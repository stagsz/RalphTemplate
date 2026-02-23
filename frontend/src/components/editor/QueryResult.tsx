import { useMemo, useState } from "react";
import type { QueryResult as QueryResultData } from "@/hooks/useDuckDB";
import DataTable from "@/components/charts/DataTable";
import type { ColumnDef } from "@/components/charts/DataTable";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import ScatterChart from "@/components/charts/ScatterChart";
import PieChart from "@/components/charts/PieChart";

type ChartSuggestion =
  | { type: "bar"; xField: string; yField: string }
  | { type: "line"; xField: string; yField: string }
  | { type: "scatter"; xField: string; yField: string }
  | { type: "pie"; nameField: string; valueField: string }
  | null;

interface QueryResultProps {
  result: QueryResultData | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

function isNumericValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  return typeof value === "number" || typeof value === "bigint";
}

function classifyColumns(
  columns: string[],
  rows: unknown[][],
): { numeric: string[]; categorical: string[] } {
  const numeric: string[] = [];
  const categorical: string[] = [];

  for (let j = 0; j < columns.length; j++) {
    let numericCount = 0;
    let nonNullCount = 0;
    const sampleSize = Math.min(rows.length, 100);

    for (let i = 0; i < sampleSize; i++) {
      const val = rows[i][j];
      if (val === null || val === undefined) continue;
      nonNullCount++;
      if (isNumericValue(val)) numericCount++;
    }

    if (nonNullCount > 0 && numericCount / nonNullCount > 0.5) {
      numeric.push(columns[j]);
    } else {
      categorical.push(columns[j]);
    }
  }

  return { numeric, categorical };
}

function suggestChart(
  columns: string[],
  rows: unknown[][],
): ChartSuggestion {
  if (columns.length < 2 || rows.length === 0) return null;

  const { numeric, categorical } = classifyColumns(columns, rows);

  // 1 categorical + 1 numeric with few distinct values → pie
  if (categorical.length === 1 && numeric.length === 1) {
    const distinctCount = new Set(
      rows.map((r) => String(r[columns.indexOf(categorical[0])])),
    ).size;
    if (distinctCount <= 10) {
      return { type: "pie", nameField: categorical[0], valueField: numeric[0] };
    }
    return { type: "bar", xField: categorical[0], yField: numeric[0] };
  }

  // 1 categorical + multiple numeric → bar with first numeric
  if (categorical.length >= 1 && numeric.length >= 1) {
    return { type: "bar", xField: categorical[0], yField: numeric[0] };
  }

  // 2+ numeric, no categorical → scatter
  if (numeric.length >= 2 && categorical.length === 0) {
    return { type: "scatter", xField: numeric[0], yField: numeric[1] };
  }

  return null;
}

function toRecords(
  columns: string[],
  rows: unknown[][],
): Record<string, unknown>[] {
  return rows.map((row) =>
    Object.fromEntries(columns.map((col, j) => [col, row[j]])),
  );
}

function toColumnDefs(columns: string[]): ColumnDef[] {
  return columns.map((col) => ({ key: col, name: col }));
}

function QueryResult({
  result,
  loading = false,
  error = null,
  className,
}: QueryResultProps) {
  const [activeTab, setActiveTab] = useState<"table" | "chart">("table");

  const columnDefs = useMemo(
    () => (result ? toColumnDefs(result.columns) : []),
    [result],
  );

  const records = useMemo(
    () => (result ? toRecords(result.columns, result.rows) : []),
    [result],
  );

  const chartSuggestion = useMemo(
    () => (result ? suggestChart(result.columns, result.rows) : null),
    [result],
  );

  if (error) {
    return (
      <div
        data-testid="query-result-error"
        className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className ?? ""}`}
      >
        <p className="text-sm font-medium text-red-800">Query Error</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        data-testid="query-result-loading"
        className={`flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8 ${className ?? ""}`}
      >
        <span className="text-sm text-gray-500">Running query...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        data-testid="query-result-empty"
        className={`flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8 ${className ?? ""}`}
      >
        <span className="text-sm text-gray-400">
          Run a query to see results
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="query-result"
      className={`flex flex-col rounded-lg border border-gray-200 bg-white ${className ?? ""}`}
    >
      {/* Header: tabs + metadata */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex gap-1">
          <button
            data-testid="tab-table"
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === "table"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("table")}
          >
            Table
          </button>
          <button
            data-testid="tab-chart"
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === "chart"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("chart")}
          >
            Chart
          </button>
        </div>
        <div
          data-testid="query-result-meta"
          className="flex items-center gap-3 text-xs text-gray-500"
        >
          <span data-testid="query-result-row-count">
            {result.rows.length} row{result.rows.length !== 1 ? "s" : ""}
          </span>
          <span data-testid="query-result-duration">
            {result.duration < 1
              ? "<1ms"
              : `${Math.round(result.duration)}ms`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === "table" && (
          <div data-testid="query-result-table">
            <DataTable
              columns={columnDefs}
              rows={records}
              sortable
              pageSize={50}
            />
          </div>
        )}

        {activeTab === "chart" && (
          <div data-testid="query-result-chart" className="p-4">
            {chartSuggestion === null ? (
              <div
                data-testid="chart-no-suggestion"
                className="flex items-center justify-center py-8 text-sm text-gray-400"
              >
                No chart suggestion available for this result shape
              </div>
            ) : (
              <div data-testid="chart-suggested">
                <div className="mb-2 text-xs text-gray-500">
                  <span data-testid="chart-type-label">
                    Suggested: {chartSuggestion.type} chart
                  </span>
                </div>
                {chartSuggestion.type === "bar" && (
                  <BarChart
                    data={records}
                    xField={chartSuggestion.xField}
                    yField={chartSuggestion.yField}
                    style={{ height: 300 }}
                  />
                )}
                {chartSuggestion.type === "line" && (
                  <LineChart
                    data={records}
                    xField={chartSuggestion.xField}
                    yField={chartSuggestion.yField}
                    style={{ height: 300 }}
                  />
                )}
                {chartSuggestion.type === "scatter" && (
                  <ScatterChart
                    data={records}
                    xField={chartSuggestion.xField}
                    yField={chartSuggestion.yField}
                    style={{ height: 300 }}
                  />
                )}
                {chartSuggestion.type === "pie" && (
                  <PieChart
                    data={records}
                    nameField={chartSuggestion.nameField}
                    valueField={chartSuggestion.valueField}
                    style={{ height: 300 }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export type { QueryResultProps, ChartSuggestion };
export { suggestChart, toRecords, toColumnDefs };
export default QueryResult;
