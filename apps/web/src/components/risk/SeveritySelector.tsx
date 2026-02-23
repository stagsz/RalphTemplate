/**
 * Severity level dropdown selector component.
 *
 * Displays a 1-5 severity scale with descriptions for risk assessment.
 * Each option shows the severity level number, label, and a brief description.
 *
 * Severity Scale (per industry standard HazOps methodology):
 * - 1: Negligible - No injury, minimal equipment damage
 * - 2: Minor - First aid injury, minor equipment damage
 * - 3: Moderate - Lost workday injury, moderate equipment damage
 * - 4: Major - Permanent disability, major equipment damage, environmental release
 * - 5: Catastrophic - Fatality, multiple casualties, major environmental disaster
 */

import { Select, type ComboboxItem } from '@mantine/core';
import {
  SEVERITY_LEVELS,
  SEVERITY_LABELS,
  SEVERITY_DESCRIPTIONS,
  type SeverityLevel,
} from '@hazop/types';

/**
 * Select option with severity value and description.
 */
interface SeverityOption extends ComboboxItem {
  value: string;
  label: string;
  description: string;
}

/**
 * Severity selector options with labels and descriptions.
 */
const SEVERITY_OPTIONS: SeverityOption[] = SEVERITY_LEVELS.map((level) => ({
  value: String(level),
  label: `${level} - ${SEVERITY_LABELS[level]}`,
  description: SEVERITY_DESCRIPTIONS[level],
}));

/**
 * Color coding for severity levels (background and text).
 * Uses semantic colors appropriate for industrial safety applications.
 */
const SEVERITY_COLORS: Record<SeverityLevel, { bg: string; text: string }> = {
  1: { bg: 'bg-green-50', text: 'text-green-800' },
  2: { bg: 'bg-lime-50', text: 'text-lime-800' },
  3: { bg: 'bg-amber-50', text: 'text-amber-800' },
  4: { bg: 'bg-orange-50', text: 'text-orange-800' },
  5: { bg: 'bg-red-50', text: 'text-red-800' },
};

/**
 * Props for the SeveritySelector component.
 */
interface SeveritySelectorProps {
  /** Currently selected severity level (1-5) or null if not set */
  value: SeverityLevel | null;

  /** Callback when severity level changes */
  onChange: (value: SeverityLevel | null) => void;

  /** Optional placeholder text when no value selected */
  placeholder?: string;

  /** Whether the selector is disabled */
  disabled?: boolean;

  /** Optional error message to display */
  error?: string;

  /** Optional label for the field */
  label?: string;

  /** Whether the field is required */
  required?: boolean;

  /** Size of the selector (xs, sm, md, lg) */
  size?: 'xs' | 'sm' | 'md' | 'lg';

  /** Optional className for additional styling */
  className?: string;
}

/**
 * Dropdown selector for severity level (1-5 scale).
 * Shows label and description for each severity level.
 */
export function SeveritySelector({
  value,
  onChange,
  placeholder = 'Select severity',
  disabled = false,
  error,
  label,
  required = false,
  size = 'sm',
  className = '',
}: SeveritySelectorProps) {
  /**
   * Handle selection change.
   * Converts string value back to SeverityLevel number.
   */
  const handleChange = (selectedValue: string | null) => {
    if (selectedValue === null || selectedValue === '') {
      onChange(null);
    } else {
      const numValue = parseInt(selectedValue, 10);
      if (numValue >= 1 && numValue <= 5) {
        onChange(numValue as SeverityLevel);
      }
    }
  };

  /**
   * Render option with severity info and description.
   */
  const renderOption = ({ option }: { option: ComboboxItem }) => {
    const severityOption = option as SeverityOption;
    const level = parseInt(severityOption.value, 10) as SeverityLevel;
    const colors = SEVERITY_COLORS[level];

    return (
      <div className="py-1">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-semibold ${colors.bg} ${colors.text}`}
          >
            {level}
          </span>
          <span className="font-medium text-slate-900">{SEVERITY_LABELS[level]}</span>
        </div>
        <div className="ml-7 text-xs text-slate-500 mt-0.5">{severityOption.description}</div>
      </div>
    );
  };

  return (
    <div className={className}>
      <Select
        label={label}
        placeholder={placeholder}
        size={size}
        data={SEVERITY_OPTIONS}
        value={value !== null ? String(value) : null}
        onChange={handleChange}
        disabled={disabled}
        error={error}
        required={required}
        clearable
        renderOption={renderOption}
        styles={{
          input: {
            borderRadius: '4px',
            '&:focus': {
              borderColor: '#1e40af',
            },
          },
          label: {
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#334155',
            marginBottom: '4px',
          },
          error: {
            fontSize: '0.75rem',
          },
        }}
      />
    </div>
  );
}

/**
 * Display-only severity badge component.
 * Shows the severity level with appropriate color coding.
 */
interface SeverityBadgeProps {
  /** Severity level (1-5) */
  value: SeverityLevel;

  /** Whether to show the full label or just the number */
  showLabel?: boolean;

  /** Size variant */
  size?: 'xs' | 'sm' | 'md';
}

export function SeverityBadge({ value, showLabel = true, size = 'sm' }: SeverityBadgeProps) {
  const colors = SEVERITY_COLORS[value];

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium ${colors.bg} ${colors.text} ${sizeClasses[size]}`}
    >
      <span className="font-semibold">{value}</span>
      {showLabel && <span>- {SEVERITY_LABELS[value]}</span>}
    </span>
  );
}
