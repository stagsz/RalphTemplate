/**
 * Compliance status badge component.
 *
 * Displays a color-coded badge showing the compliance status with optional icon.
 * Used for indicating regulatory compliance status on analyses and projects.
 *
 * Status types:
 * - Compliant (green): Meets all requirements
 * - Partially Compliant (amber): Meets some requirements
 * - Non-Compliant (red): Does not meet requirements
 * - Not Applicable (gray): Standard does not apply
 * - Not Assessed (light gray): Not yet evaluated
 */

import type { ComplianceStatus } from '@hazop/types';
import { COMPLIANCE_STATUS_LABELS } from '@hazop/types';

/**
 * Color coding for compliance statuses.
 * Uses semantic colors matching the design system.
 */
const STATUS_STYLES: Record<ComplianceStatus, { bg: string; text: string; border: string }> = {
  compliant: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
  },
  partially_compliant: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  non_compliant: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
  },
  not_applicable: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
  not_assessed: {
    bg: 'bg-slate-50',
    text: 'text-slate-400',
    border: 'border-slate-200',
  },
};

/**
 * Icons for compliance status display.
 */
const STATUS_ICONS: Record<ComplianceStatus, React.ReactNode> = {
  compliant: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-600">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
  partially_compliant: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-600">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  non_compliant: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-600">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ),
  not_applicable: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400">
      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10z" clipRule="evenodd" />
    </svg>
  ),
  not_assessed: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-300">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * Props for the ComplianceStatusBadge component.
 */
interface ComplianceStatusBadgeProps {
  /** Compliance status to display */
  status: ComplianceStatus;

  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';

  /** Whether to show the status icon */
  showIcon?: boolean;

  /** Whether to show the status label */
  showLabel?: boolean;

  /** Optional className for additional styling */
  className?: string;
}

/**
 * Display-only badge showing compliance status with color coding.
 * Includes optional icon and label.
 */
export function ComplianceStatusBadge({
  status,
  size = 'sm',
  showIcon = true,
  showLabel = true,
  className = '',
}: ComplianceStatusBadgeProps) {
  const styles = STATUS_STYLES[status];
  const label = COMPLIANCE_STATUS_LABELS[status];

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center rounded font-medium border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && (
        <span className={`flex-shrink-0 ${iconSizes[size]}`}>
          {STATUS_ICONS[status]}
        </span>
      )}
      {showLabel && <span>{label}</span>}
    </span>
  );
}

/**
 * Props for the ComplianceStatusCompact component.
 */
interface ComplianceStatusCompactProps {
  /** Compliance status to display */
  status: ComplianceStatus;

  /** Optional compliance percentage (0-100) */
  percentage?: number;

  /** Size variant */
  size?: 'xs' | 'sm' | 'md';

  /** Optional className for additional styling */
  className?: string;
}

/**
 * Compact compliance status indicator showing only a colored dot and optional percentage.
 * Useful for table cells and tight spaces.
 */
export function ComplianceStatusCompact({
  status,
  percentage,
  size = 'sm',
  className = '',
}: ComplianceStatusCompactProps) {
  const styles = STATUS_STYLES[status];
  const label = COMPLIANCE_STATUS_LABELS[status];

  const dotSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
  };

  // Derive solid dot color from status
  const dotColorClasses: Record<ComplianceStatus, string> = {
    compliant: 'bg-green-500',
    partially_compliant: 'bg-amber-500',
    non_compliant: 'bg-red-500',
    not_applicable: 'bg-slate-400',
    not_assessed: 'bg-slate-300',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={label}>
      <span className={`${dotSizeClasses[size]} rounded-full ${dotColorClasses[status]}`} />
      {percentage !== undefined ? (
        <span className={`font-medium ${textSizeClasses[size]} ${styles.text}`}>
          {percentage.toFixed(0)}%
        </span>
      ) : (
        <span className={`${textSizeClasses[size]} ${styles.text}`}>
          {label}
        </span>
      )}
    </span>
  );
}

/**
 * Props for the CompliancePercentageBadge component.
 */
interface CompliancePercentageBadgeProps {
  /** Compliance percentage (0-100) */
  percentage: number;

  /** Compliance status to determine color */
  status: ComplianceStatus;

  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';

  /** Whether to show the status label alongside percentage */
  showLabel?: boolean;

  /** Optional className for additional styling */
  className?: string;
}

/**
 * Badge showing compliance percentage with color coding based on status.
 * Useful for showing compliance progress on analysis cards.
 */
export function CompliancePercentageBadge({
  percentage,
  status,
  size = 'sm',
  showLabel = false,
  className = '',
}: CompliancePercentageBadgeProps) {
  const styles = STATUS_STYLES[status];
  const label = COMPLIANCE_STATUS_LABELS[status];

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded font-medium border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses[size]} ${className}`}
      title={`${label}: ${percentage.toFixed(0)}% compliant`}
    >
      <span className="font-semibold">{percentage.toFixed(0)}%</span>
      {showLabel && <span>{label}</span>}
    </span>
  );
}
