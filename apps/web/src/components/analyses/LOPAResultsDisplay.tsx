/**
 * LOPA (Layers of Protection Analysis) results display component.
 *
 * Displays the results of a LOPA analysis including:
 * - Gap analysis visualization (current RRF vs required RRF)
 * - Status indicator (adequate, marginal, inadequate)
 * - IPL credit table showing each layer's contribution
 * - Recommendations list based on gap analysis
 *
 * This component is read-only and displays existing LOPA data.
 */

import { useMemo } from 'react';
import { Alert, Table, Tooltip } from '@mantine/core';
import type { LOPAAnalysis, LOPAGapStatus, IPL } from '@hazop/types';
import {
  LOPA_GAP_STATUS_LABELS,
  IPL_TYPE_LABELS,
  SIL_LABELS,
  INITIATING_EVENT_CATEGORY_LABELS,
  LOPA_STATUS_LABELS,
} from '@hazop/types';

/**
 * Color configuration for gap statuses.
 * Maps to semantic colors matching the risk component patterns.
 */
const GAP_STATUS_COLORS: Record<LOPAGapStatus, { bg: string; text: string; border: string; dot: string }> = {
  adequate: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  marginal: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  inadequate: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
};

/**
 * Icon components for gap status.
 */
const GapStatusIcons: Record<LOPAGapStatus, React.ReactNode> = {
  adequate: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
  marginal: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  inadequate: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * Props for the LOPAResultsDisplay component.
 */
export interface LOPAResultsDisplayProps {
  /** The LOPA analysis to display */
  lopa: LOPAAnalysis;

  /** Optional callback when the user wants to edit the LOPA */
  onEdit?: () => void;

  /** Whether to show the full details or a compact view */
  compact?: boolean;

  /** Optional className for additional styling */
  className?: string;
}

/**
 * Format a frequency value for display.
 */
function formatFrequency(value: number): string {
  if (value >= 1) {
    return `${value.toFixed(1)}/yr`;
  }
  if (value >= 0.001) {
    return `${value.toExponential(1)}/yr`;
  }
  return `${value.toExponential(2)}/yr`;
}

/**
 * Format an RRF value for display.
 */
function formatRRF(rrf: number): string {
  if (rrf < 1) {
    return rrf.toFixed(2);
  }
  if (rrf < 10) {
    return rrf.toFixed(1);
  }
  if (rrf < 1000) {
    return Math.round(rrf).toLocaleString();
  }
  if (rrf < 1000000) {
    return `${(rrf / 1000).toFixed(1)}K`;
  }
  return `${(rrf / 1000000).toFixed(1)}M`;
}

/**
 * Format a PFD value for display.
 */
function formatPFD(pfd: number): string {
  if (pfd >= 0.1) {
    return pfd.toFixed(2);
  }
  return pfd.toExponential(1);
}

/**
 * Calculate gap percentage for visual progress bar.
 */
function calculateGapPercentage(gapRatio: number): number {
  // Clamp gap ratio between 0 and 2 for visual display
  const clampedRatio = Math.min(Math.max(gapRatio, 0), 2);
  // Convert to percentage (100% = gap ratio of 1.0)
  return Math.min(clampedRatio * 50, 100);
}

/**
 * Gap status badge component.
 */
function GapStatusBadge({
  gapStatus,
  gapRatio,
  size = 'md',
}: {
  gapStatus: LOPAGapStatus;
  gapRatio: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const colors = GAP_STATUS_COLORS[gapStatus];
  const label = LOPA_GAP_STATUS_LABELS[gapStatus];
  const icon = GapStatusIcons[gapStatus];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded font-medium border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}
    >
      {icon}
      <span>{label}</span>
      <span className="font-mono">({(gapRatio * 100).toFixed(0)}%)</span>
    </span>
  );
}

/**
 * IPL table row component.
 */
function IPLTableRow({ ipl, index }: { ipl: IPL; index: number }) {
  const rrf = 1 / ipl.pfd;

  return (
    <Table.Tr className="hover:bg-slate-50">
      <Table.Td className="text-xs font-mono text-slate-600">
        {index + 1}
      </Table.Td>
      <Table.Td className="text-xs">
        <div className="font-medium text-slate-900">{ipl.name}</div>
        {ipl.description && (
          <div className="text-slate-500 truncate max-w-[200px]" title={ipl.description}>
            {ipl.description}
          </div>
        )}
      </Table.Td>
      <Table.Td className="text-xs">
        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
          {IPL_TYPE_LABELS[ipl.type]}
        </span>
      </Table.Td>
      <Table.Td className="text-xs font-mono text-right text-slate-700">
        {formatPFD(ipl.pfd)}
      </Table.Td>
      <Table.Td className="text-xs font-mono text-right text-slate-900 font-medium">
        {formatRRF(rrf)}
      </Table.Td>
      <Table.Td className="text-xs">
        {ipl.sil && (
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
            {SIL_LABELS[ipl.sil]}
          </span>
        )}
      </Table.Td>
      <Table.Td className="text-xs text-center">
        <div className="flex items-center justify-center gap-2">
          {ipl.independentOfInitiator ? (
            <Tooltip label="Independent of initiating event">
              <span className="text-green-600">✓</span>
            </Tooltip>
          ) : (
            <Tooltip label="Not independent of initiating event">
              <span className="text-red-600">✗</span>
            </Tooltip>
          )}
          {ipl.independentOfOtherIPLs ? (
            <Tooltip label="Independent of other IPLs">
              <span className="text-green-600">✓</span>
            </Tooltip>
          ) : (
            <Tooltip label="Not independent of other IPLs">
              <span className="text-red-600">✗</span>
            </Tooltip>
          )}
        </div>
      </Table.Td>
    </Table.Tr>
  );
}

/**
 * LOPA results display component.
 *
 * Displays comprehensive LOPA analysis results including gap analysis,
 * IPL credit breakdown, and recommendations.
 */
export function LOPAResultsDisplay({
  lopa,
  onEdit,
  compact = false,
  className = '',
}: LOPAResultsDisplayProps) {
  const colors = GAP_STATUS_COLORS[lopa.gapStatus];
  const gapPercentage = calculateGapPercentage(lopa.gapRatio);

  // Calculate metrics for display
  const metrics = useMemo(() => {
    const rrfGap = lopa.requiredRiskReductionFactor - lopa.totalRiskReductionFactor;
    const additionalRRFNeeded = rrfGap > 0 ? rrfGap : 0;
    const ordersOfMagnitude = lopa.totalRiskReductionFactor > 0
      ? Math.log10(lopa.totalRiskReductionFactor)
      : 0;

    return {
      rrfGap,
      additionalRRFNeeded,
      ordersOfMagnitude,
      meetsTarget: lopa.mitigatedEventLikelihood <= lopa.targetFrequency,
    };
  }, [lopa]);

  if (compact) {
    return (
      <div className={`lopa-results-compact ${className}`}>
        <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded">
          <div className="flex items-center gap-3">
            <GapStatusBadge gapStatus={lopa.gapStatus} gapRatio={lopa.gapRatio} size="sm" />
            <span className="text-xs text-slate-500">
              MEL: {formatFrequency(lopa.mitigatedEventLikelihood)} | Target: {formatFrequency(lopa.targetFrequency)}
            </span>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-blue-700 hover:text-blue-800 font-medium"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`lopa-results-display space-y-6 ${className}`}>
      {/* Header with Status */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">LOPA Analysis Results</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Layers of Protection Analysis - Gap Analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded border ${
            lopa.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
            lopa.status === 'in_review' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            lopa.status === 'requires_action' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-slate-50 text-slate-700 border-slate-200'
          }`}>
            {LOPA_STATUS_LABELS[lopa.status]}
          </span>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-blue-700 hover:text-blue-800 font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Gap Analysis Summary */}
      <div className={`p-4 rounded border ${colors.bg} ${colors.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={colors.text}>{GapStatusIcons[lopa.gapStatus]}</span>
            <span className={`text-sm font-semibold ${colors.text}`}>
              {LOPA_GAP_STATUS_LABELS[lopa.gapStatus]}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-lg font-semibold font-mono ${colors.text}`}>
              {(lopa.gapRatio * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500">Gap Ratio</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Risk Reduction</span>
            <span>Required: {formatRRF(lopa.requiredRiskReductionFactor)}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                lopa.gapStatus === 'adequate' ? 'bg-green-500' :
                lopa.gapStatus === 'marginal' ? 'bg-amber-500' :
                'bg-red-500'
              }`}
              style={{ width: `${gapPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-600">
              Achieved: <span className="font-mono font-medium">{formatRRF(lopa.totalRiskReductionFactor)}</span>
            </span>
            {lopa.gapRatio < 1 && (
              <span className="text-red-600">
                Gap: <span className="font-mono font-medium">{formatRRF(metrics.additionalRRFNeeded)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/50 rounded p-2">
            <div className="text-xs text-slate-500">Initiating Event</div>
            <div className="text-sm font-mono font-medium text-slate-900">
              {formatFrequency(lopa.initiatingEventFrequency)}
            </div>
          </div>
          <div className="bg-white/50 rounded p-2">
            <div className="text-xs text-slate-500">Mitigated Likelihood</div>
            <div className={`text-sm font-mono font-medium ${metrics.meetsTarget ? 'text-green-700' : 'text-red-700'}`}>
              {formatFrequency(lopa.mitigatedEventLikelihood)}
            </div>
          </div>
          <div className="bg-white/50 rounded p-2">
            <div className="text-xs text-slate-500">Target Frequency</div>
            <div className="text-sm font-mono font-medium text-slate-900">
              {formatFrequency(lopa.targetFrequency)}
            </div>
          </div>
          <div className="bg-white/50 rounded p-2">
            <div className="text-xs text-slate-500">Risk Reduction</div>
            <div className="text-sm font-mono font-medium text-slate-900">
              {metrics.ordersOfMagnitude.toFixed(1)} orders
            </div>
          </div>
        </div>
      </div>

      {/* Required SIL Alert */}
      {lopa.requiredSIL && (
        <Alert
          color={lopa.gapStatus === 'inadequate' ? 'red' : 'yellow'}
          variant="light"
          styles={{ root: { borderRadius: '4px' } }}
        >
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              Additional Safety Instrumented Function (SIF) required: {SIL_LABELS[lopa.requiredSIL]}
            </span>
          </div>
        </Alert>
      )}

      {/* Scenario Details */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Scenario Details
          </span>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs text-slate-500">Scenario Description</div>
            <div className="text-sm text-slate-900">{lopa.scenarioDescription}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Consequence</div>
            <div className="text-sm text-slate-900">{lopa.consequence}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500">Initiating Event Category</div>
              <div className="text-sm text-slate-900">
                {INITIATING_EVENT_CATEGORY_LABELS[lopa.initiatingEventCategory]}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Initiating Event Description</div>
              <div className="text-sm text-slate-900">{lopa.initiatingEventDescription}</div>
            </div>
          </div>
          {lopa.notes && (
            <div>
              <div className="text-xs text-slate-500">Notes</div>
              <div className="text-sm text-slate-700 italic">{lopa.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* IPL Credit Table */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Independent Protection Layers ({lopa.ipls.length})
          </span>
          <span className="text-xs text-slate-500">
            Total RRF: <span className="font-mono font-medium text-slate-900">{formatRRF(lopa.totalRiskReductionFactor)}</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table striped>
            <Table.Thead>
              <Table.Tr className="bg-slate-50">
                <Table.Th className="font-medium text-slate-700 text-xs w-10">#</Table.Th>
                <Table.Th className="font-medium text-slate-700 text-xs">Name</Table.Th>
                <Table.Th className="font-medium text-slate-700 text-xs">Type</Table.Th>
                <Table.Th className="font-medium text-slate-700 text-xs text-right">PFD</Table.Th>
                <Table.Th className="font-medium text-slate-700 text-xs text-right">RRF</Table.Th>
                <Table.Th className="font-medium text-slate-700 text-xs">SIL</Table.Th>
                <Table.Th className="font-medium text-slate-700 text-xs text-center">
                  <Tooltip label="Independent of initiator / Independent of other IPLs">
                    <span>Ind.</span>
                  </Tooltip>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lopa.ipls.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} className="text-center py-4 text-slate-500 text-sm">
                    No independent protection layers credited
                  </Table.Td>
                </Table.Tr>
              ) : (
                lopa.ipls.map((ipl, index) => (
                  <IPLTableRow key={ipl.id} ipl={ipl} index={index} />
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      {/* Recommendations */}
      {lopa.recommendations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded">
          <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Recommendations ({lopa.recommendations.length})
            </span>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {lopa.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                    lopa.gapStatus === 'inadequate' ? 'bg-red-100 text-red-700' :
                    lopa.gapStatus === 'marginal' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Empty Recommendations State */}
      {lopa.recommendations.length === 0 && lopa.gapStatus !== 'adequate' && (
        <Alert
          color="blue"
          variant="light"
          styles={{ root: { borderRadius: '4px' } }}
        >
          <span className="text-sm">
            No specific recommendations have been documented. Consider reviewing the LOPA analysis with the process safety team.
          </span>
        </Alert>
      )}
    </div>
  );
}

/**
 * Compact LOPA status badge for use in tables and lists.
 */
export function LOPAStatusBadge({
  gapStatus,
  gapRatio,
  size = 'sm',
  className = '',
}: {
  gapStatus: LOPAGapStatus;
  gapRatio: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const colors = GAP_STATUS_COLORS[gapStatus];

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-medium border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      <span>{LOPA_GAP_STATUS_LABELS[gapStatus]}</span>
    </span>
  );
}

/**
 * LOPA summary card for dashboard views.
 */
export function LOPASummaryCard({
  lopa,
  onClick,
  className = '',
}: {
  lopa: LOPAAnalysis;
  onClick?: () => void;
  className?: string;
}) {
  const colors = GAP_STATUS_COLORS[lopa.gapStatus];
  const gapPercentage = calculateGapPercentage(lopa.gapRatio);

  return (
    <div
      className={`bg-white border border-slate-200 rounded p-4 ${onClick ? 'cursor-pointer hover:border-slate-300 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <div className="text-sm font-medium text-slate-900 truncate">
            {lopa.scenarioDescription}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {INITIATING_EVENT_CATEGORY_LABELS[lopa.initiatingEventCategory]}
          </div>
        </div>
        <LOPAStatusBadge gapStatus={lopa.gapStatus} gapRatio={lopa.gapRatio} size="xs" />
      </div>

      <div className="mb-2">
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              lopa.gapStatus === 'adequate' ? 'bg-green-500' :
              lopa.gapStatus === 'marginal' ? 'bg-amber-500' :
              'bg-red-500'
            }`}
            style={{ width: `${gapPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">
          IPLs: <span className="font-medium text-slate-700">{lopa.ipls.length}</span>
        </span>
        <span className="text-slate-500">
          RRF: <span className="font-mono font-medium text-slate-700">{formatRRF(lopa.totalRiskReductionFactor)}</span>
        </span>
        <span className="text-slate-500">
          MEL: <span className="font-mono font-medium text-slate-700">{formatFrequency(lopa.mitigatedEventLikelihood)}</span>
        </span>
      </div>
    </div>
  );
}
