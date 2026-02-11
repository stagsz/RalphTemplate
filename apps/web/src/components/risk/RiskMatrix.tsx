/**
 * Interactive 5x5 risk matrix visualization component.
 *
 * Displays a standard industry risk matrix with severity (rows) vs. likelihood (columns).
 * Each cell is color-coded by risk level (Low/Medium/High) and can be clicked to select
 * a specific severity/likelihood combination.
 *
 * Matrix Layout:
 * - Y-axis (rows): Severity levels 5 down to 1 (Catastrophic at top, Negligible at bottom)
 * - X-axis (columns): Likelihood levels 1 to 5 (Rare to Almost Certain)
 * - Cell colors: Green (Low), Amber (Medium), Red (High) based on RISK_MATRIX_MAPPING
 *
 * Note: This is a 2D visualization showing base risk (Severity × Likelihood).
 * The full 3D risk calculation also includes Detectability as a modifier.
 */

import {
  SEVERITY_LEVELS,
  SEVERITY_LABELS,
  LIKELIHOOD_LEVELS,
  LIKELIHOOD_LABELS,
  RISK_MATRIX_MAPPING,
  type SeverityLevel,
  type LikelihoodLevel,
  type RiskLevel,
} from '@hazop/types';

/**
 * Color styling for risk level cells.
 * Uses semantic colors for industrial safety applications.
 */
const RISK_LEVEL_CELL_COLORS: Record<RiskLevel, { bg: string; hoverBg: string; selectedBg: string; text: string; border: string }> = {
  low: {
    bg: 'bg-green-100',
    hoverBg: 'hover:bg-green-200',
    selectedBg: 'bg-green-300',
    text: 'text-green-900',
    border: 'border-green-300',
  },
  medium: {
    bg: 'bg-amber-100',
    hoverBg: 'hover:bg-amber-200',
    selectedBg: 'bg-amber-300',
    text: 'text-amber-900',
    border: 'border-amber-300',
  },
  high: {
    bg: 'bg-red-100',
    hoverBg: 'hover:bg-red-200',
    selectedBg: 'bg-red-300',
    text: 'text-red-900',
    border: 'border-red-300',
  },
};

/**
 * Props for the RiskMatrix component.
 */
interface RiskMatrixProps {
  /** Currently selected severity level (for highlighting the active cell) */
  selectedSeverity?: SeverityLevel | null;

  /** Currently selected likelihood level (for highlighting the active cell) */
  selectedLikelihood?: LikelihoodLevel | null;

  /** Callback when a cell is clicked */
  onCellClick?: (severity: SeverityLevel, likelihood: LikelihoodLevel) => void;

  /** Whether the matrix is interactive (cells clickable) */
  interactive?: boolean;

  /** Whether to show the base score (S × L) in each cell */
  showScores?: boolean;

  /** Whether to show abbreviated axis labels */
  compactLabels?: boolean;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Optional className for additional styling */
  className?: string;
}

/**
 * Interactive 5x5 risk matrix visualization.
 * Standard industry tool for visualizing risk based on severity vs. likelihood.
 */
export function RiskMatrix({
  selectedSeverity,
  selectedLikelihood,
  onCellClick,
  interactive = true,
  showScores = true,
  compactLabels = false,
  size = 'md',
  className = '',
}: RiskMatrixProps) {
  // Severity levels in display order (5 at top, 1 at bottom)
  const severityOrder = [...SEVERITY_LEVELS].reverse() as SeverityLevel[];

  const sizeConfig = {
    sm: {
      cell: 'w-8 h-8 text-xs',
      label: 'text-xs',
      headerCell: 'px-1 py-1',
    },
    md: {
      cell: 'w-12 h-12 text-sm',
      label: 'text-xs',
      headerCell: 'px-2 py-2',
    },
    lg: {
      cell: 'w-16 h-16 text-base',
      label: 'text-sm',
      headerCell: 'px-3 py-2',
    },
  };

  const config = sizeConfig[size];

  /**
   * Render a single matrix cell.
   */
  const renderCell = (severity: SeverityLevel, likelihood: LikelihoodLevel) => {
    const riskLevel = RISK_MATRIX_MAPPING[severity][likelihood];
    const colors = RISK_LEVEL_CELL_COLORS[riskLevel];
    const isSelected = selectedSeverity === severity && selectedLikelihood === likelihood;
    const baseScore = severity * likelihood;

    const cellClasses = [
      config.cell,
      'flex items-center justify-center font-medium border transition-colors',
      isSelected ? colors.selectedBg : colors.bg,
      isSelected ? 'ring-2 ring-slate-900 ring-offset-1' : '',
      colors.text,
      colors.border,
      interactive ? `cursor-pointer ${colors.hoverBg}` : '',
    ].join(' ');

    const handleClick = () => {
      if (interactive && onCellClick) {
        onCellClick(severity, likelihood);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (interactive && onCellClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onCellClick(severity, likelihood);
      }
    };

    return (
      <div
        key={`${severity}-${likelihood}`}
        className={cellClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        aria-pressed={interactive ? isSelected : undefined}
        aria-label={`Severity ${severity} (${SEVERITY_LABELS[severity]}), Likelihood ${likelihood} (${LIKELIHOOD_LABELS[likelihood]}), Risk Level ${riskLevel}`}
        title={`S${severity} × L${likelihood} = ${baseScore} (${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk)`}
      >
        {showScores ? baseScore : ''}
      </div>
    );
  };

  /**
   * Get the display label for severity (compact or full).
   */
  const getSeverityLabel = (level: SeverityLevel) => {
    if (compactLabels) {
      return `S${level}`;
    }
    return SEVERITY_LABELS[level];
  };

  /**
   * Get the display label for likelihood (compact or full).
   */
  const getLikelihoodLabel = (level: LikelihoodLevel) => {
    if (compactLabels) {
      return `L${level}`;
    }
    return LIKELIHOOD_LABELS[level];
  };

  return (
    <div className={`inline-block ${className}`}>
      {/* Matrix container with grid layout */}
      <div className="inline-grid" style={{ gridTemplateColumns: `auto repeat(5, auto)` }}>
        {/* Top-left empty corner cell */}
        <div className={`${config.headerCell}`} />

        {/* Likelihood header row */}
        {LIKELIHOOD_LEVELS.map((likelihood) => (
          <div
            key={`header-${likelihood}`}
            className={`${config.headerCell} ${config.label} text-center font-medium text-slate-600`}
            title={LIKELIHOOD_LABELS[likelihood]}
          >
            {getLikelihoodLabel(likelihood)}
          </div>
        ))}

        {/* Matrix rows (severity high to low) */}
        {severityOrder.map((severity) => (
          <>
            {/* Severity label cell */}
            <div
              key={`label-${severity}`}
              className={`${config.headerCell} ${config.label} font-medium text-slate-600 flex items-center justify-end pr-2`}
              title={SEVERITY_LABELS[severity]}
            >
              {getSeverityLabel(severity)}
            </div>

            {/* Risk cells for this severity row */}
            {LIKELIHOOD_LEVELS.map((likelihood) => renderCell(severity, likelihood))}
          </>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded ${RISK_LEVEL_CELL_COLORS.low.bg} border ${RISK_LEVEL_CELL_COLORS.low.border}`} />
          <span className="text-xs text-slate-600">Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded ${RISK_LEVEL_CELL_COLORS.medium.bg} border ${RISK_LEVEL_CELL_COLORS.medium.border}`} />
          <span className="text-xs text-slate-600">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded ${RISK_LEVEL_CELL_COLORS.high.bg} border ${RISK_LEVEL_CELL_COLORS.high.border}`} />
          <span className="text-xs text-slate-600">High</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Props for the RiskMatrixCompact component.
 */
interface RiskMatrixCompactProps {
  /** Currently selected severity level (for highlighting the active cell) */
  selectedSeverity?: SeverityLevel | null;

  /** Currently selected likelihood level (for highlighting the active cell) */
  selectedLikelihood?: LikelihoodLevel | null;

  /** Whether to show axis labels */
  showLabels?: boolean;

  /** Optional className for additional styling */
  className?: string;
}

/**
 * Compact read-only risk matrix for display in tight spaces (e.g., cards, summaries).
 * Shows the matrix with the selected cell highlighted but no interactivity.
 */
export function RiskMatrixCompact({
  selectedSeverity,
  selectedLikelihood,
  showLabels = false,
  className = '',
}: RiskMatrixCompactProps) {
  // Severity levels in display order (5 at top, 1 at bottom)
  const severityOrder = [...SEVERITY_LEVELS].reverse() as SeverityLevel[];

  return (
    <div className={`inline-block ${className}`}>
      <div
        className="inline-grid gap-px"
        style={{ gridTemplateColumns: showLabels ? `auto repeat(5, 1fr)` : `repeat(5, 1fr)` }}
      >
        {/* Header row with labels */}
        {showLabels && (
          <>
            <div className="w-4" />
            {LIKELIHOOD_LEVELS.map((l) => (
              <div key={`h-${l}`} className="w-4 h-3 text-[8px] text-center text-slate-400">
                {l}
              </div>
            ))}
          </>
        )}

        {/* Matrix rows */}
        {severityOrder.map((severity) => (
          <>
            {showLabels && (
              <div key={`l-${severity}`} className="w-4 h-4 text-[8px] text-slate-400 flex items-center justify-end pr-0.5">
                {severity}
              </div>
            )}
            {LIKELIHOOD_LEVELS.map((likelihood) => {
              const riskLevel = RISK_MATRIX_MAPPING[severity][likelihood];
              const colors = RISK_LEVEL_CELL_COLORS[riskLevel];
              const isSelected = selectedSeverity === severity && selectedLikelihood === likelihood;

              return (
                <div
                  key={`${severity}-${likelihood}`}
                  className={`w-4 h-4 ${isSelected ? colors.selectedBg : colors.bg} ${isSelected ? 'ring-1 ring-slate-900' : ''}`}
                  title={`S${severity} × L${likelihood} (${riskLevel})`}
                />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

/**
 * Props for the RiskMatrixWithSelection component.
 */
interface RiskMatrixWithSelectionProps {
  /** Currently selected severity level */
  severity: SeverityLevel | null;

  /** Currently selected likelihood level */
  likelihood: LikelihoodLevel | null;

  /** Callback when severity changes */
  onSeverityChange: (value: SeverityLevel | null) => void;

  /** Callback when likelihood changes */
  onLikelihoodChange: (value: LikelihoodLevel | null) => void;

  /** Whether the matrix is disabled */
  disabled?: boolean;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Optional className for additional styling */
  className?: string;
}

/**
 * Risk matrix with integrated selection capability.
 * Clicking a cell updates both severity and likelihood.
 * Shows axis labels and provides a clear selection interface.
 */
export function RiskMatrixWithSelection({
  severity,
  likelihood,
  onSeverityChange,
  onLikelihoodChange,
  disabled = false,
  size = 'md',
  className = '',
}: RiskMatrixWithSelectionProps) {
  const handleCellClick = (s: SeverityLevel, l: LikelihoodLevel) => {
    if (!disabled) {
      onSeverityChange(s);
      onLikelihoodChange(l);
    }
  };

  const selectedRiskLevel = severity && likelihood
    ? RISK_MATRIX_MAPPING[severity][likelihood]
    : null;

  return (
    <div className={className}>
      {/* Axis labels */}
      <div className="flex items-start gap-4">
        {/* Y-axis label */}
        <div className="flex flex-col items-center pt-8">
          <span className="text-xs font-medium text-slate-500 writing-mode-vertical rotate-180" style={{ writingMode: 'vertical-rl' }}>
            Severity
          </span>
        </div>

        <div>
          {/* Matrix */}
          <RiskMatrix
            selectedSeverity={severity}
            selectedLikelihood={likelihood}
            onCellClick={handleCellClick}
            interactive={!disabled}
            showScores={true}
            compactLabels={false}
            size={size}
          />

          {/* X-axis label */}
          <div className="text-center mt-2">
            <span className="text-xs font-medium text-slate-500">Likelihood</span>
          </div>
        </div>
      </div>

      {/* Selection summary */}
      {severity && likelihood && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded">
          <div className="text-sm">
            <span className="font-medium text-slate-700">Selected: </span>
            <span className="text-slate-600">
              Severity {severity} ({SEVERITY_LABELS[severity]}) × Likelihood {likelihood} ({LIKELIHOOD_LABELS[likelihood]})
            </span>
          </div>
          <div className="text-sm mt-1">
            <span className="font-medium text-slate-700">Base Score: </span>
            <span className="text-slate-600">{severity * likelihood}</span>
            <span className="text-slate-400 mx-2">|</span>
            <span className="font-medium text-slate-700">Risk Level: </span>
            <span className={`font-medium ${RISK_LEVEL_CELL_COLORS[selectedRiskLevel!].text.replace('900', '700')}`}>
              {selectedRiskLevel!.charAt(0).toUpperCase() + selectedRiskLevel!.slice(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
