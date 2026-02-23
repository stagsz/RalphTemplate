interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "flat";
  comparison?: string;
  className?: string;
  style?: React.CSSProperties;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <svg
        data-testid="trend-up"
        className="h-5 w-5 text-emerald-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 3a.75.75 0 0 1 .75.75v10.19l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3.75A.75.75 0 0 1 10 3Z"
          clipRule="evenodd"
          transform="rotate(180 10 10)"
        />
      </svg>
    );
  }

  if (trend === "down") {
    return (
      <svg
        data-testid="trend-down"
        className="h-5 w-5 text-red-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 3a.75.75 0 0 1 .75.75v10.19l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3.75A.75.75 0 0 1 10 3Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg
      data-testid="trend-flat"
      className="h-5 w-5 text-gray-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3 10a.75.75 0 0 1 .75-.75h10.19l-3.22-3.22a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H3.75A.75.75 0 0 1 3 10Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function KPICard({
  title,
  value,
  unit,
  trend,
  comparison,
  className,
  style,
}: KPICardProps) {
  return (
    <div
      data-testid="kpi-card"
      className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className ?? ""}`}
      style={style}
    >
      <p data-testid="kpi-title" className="text-sm font-medium text-gray-500">
        {title}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <p data-testid="kpi-value" className="text-3xl font-semibold text-gray-900">
          {value}
        </p>
        {unit && (
          <span data-testid="kpi-unit" className="text-sm text-gray-500">
            {unit}
          </span>
        )}
      </div>
      {(trend || comparison) && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend && <TrendIcon trend={trend} />}
          {comparison && (
            <span data-testid="kpi-comparison" className="text-sm text-gray-600">
              {comparison}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export type { KPICardProps };
export default KPICard;
