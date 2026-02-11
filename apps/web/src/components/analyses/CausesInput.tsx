import { useState, useCallback, useEffect, useMemo } from 'react';
import { TextInput, Checkbox, Button, Alert, Loader } from '@mantine/core';
import type { GuideWord, EquipmentType, PreparedAnswer, ApiError } from '@hazop/types';
import { GUIDE_WORD_LABELS } from '@hazop/types';
import { preparedCausesService } from '../../services/prepared-causes.service';

/**
 * Props for the CausesInput component.
 */
export interface CausesInputProps {
  /** User-visible node identifier (e.g., "P-101") */
  nodeIdentifier: string;

  /** Equipment type of the selected node */
  equipmentType: EquipmentType;

  /** Selected guide word */
  guideWord: GuideWord;

  /** Currently selected causes */
  value: string[];

  /** Callback when selected causes change */
  onChange: (causes: string[]) => void;

  /** Whether the input is disabled */
  disabled?: boolean;
}

/**
 * CausesInput component for selecting causes in HazOps analysis.
 *
 * Features:
 * - Fetches context-aware prepared causes based on equipment type and guide word
 * - Multi-select checkboxes for prepared causes
 * - Search/filter within prepared causes
 * - Shows common causes prominently at the top
 * - Allows adding custom causes
 * - Displays cause descriptions on hover/focus
 */
export function CausesInput({
  nodeIdentifier,
  equipmentType,
  guideWord,
  value,
  onChange,
  disabled = false,
}: CausesInputProps) {
  // Prepared causes state
  const [preparedCauses, setPreparedCauses] = useState<PreparedAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [customCause, setCustomCause] = useState('');
  const [showAllCauses, setShowAllCauses] = useState(false);

  /**
   * Fetch prepared causes when context changes.
   */
  useEffect(() => {
    let isMounted = true;

    const fetchCauses = async () => {
      setIsLoading(true);
      setError(null);

      const result = await preparedCausesService.getByContext(equipmentType, guideWord);

      if (!isMounted) return;

      if (result.success && result.data) {
        setPreparedCauses(result.data.answers);
      } else {
        setError(result.error || { code: 'UNKNOWN', message: 'Failed to load prepared causes' });
      }

      setIsLoading(false);
    };

    fetchCauses();

    return () => {
      isMounted = false;
    };
  }, [equipmentType, guideWord]);

  /**
   * Filter causes based on search query.
   */
  const filteredCauses = useMemo(() => {
    if (!searchQuery.trim()) {
      return preparedCauses;
    }

    const searchLower = searchQuery.toLowerCase();
    return preparedCauses.filter(
      (cause) =>
        cause.text.toLowerCase().includes(searchLower) ||
        (cause.description && cause.description.toLowerCase().includes(searchLower))
    );
  }, [preparedCauses, searchQuery]);

  /**
   * Separate common causes from others for display priority.
   */
  const { commonCauses, otherCauses } = useMemo(() => {
    const common = filteredCauses.filter((c) => c.isCommon);
    const others = filteredCauses.filter((c) => !c.isCommon);
    return { commonCauses: common, otherCauses: others };
  }, [filteredCauses]);

  /**
   * Determine which causes to display based on showAllCauses toggle.
   */
  const displayedOtherCauses = useMemo(() => {
    if (showAllCauses || searchQuery.trim()) {
      return otherCauses;
    }
    // Show first 5 other causes when collapsed
    return otherCauses.slice(0, 5);
  }, [otherCauses, showAllCauses, searchQuery]);

  const hasMoreCauses = otherCauses.length > 5 && !showAllCauses && !searchQuery.trim();

  /**
   * Handle toggling a cause selection.
   */
  const handleToggleCause = useCallback(
    (causeText: string) => {
      if (disabled) return;

      const isSelected = value.includes(causeText);
      if (isSelected) {
        onChange(value.filter((c) => c !== causeText));
      } else {
        onChange([...value, causeText]);
      }
    },
    [value, onChange, disabled]
  );

  /**
   * Handle adding a custom cause.
   */
  const handleAddCustomCause = useCallback(() => {
    const trimmedCause = customCause.trim();
    if (!trimmedCause || disabled) return;

    // Check if already selected
    if (value.includes(trimmedCause)) {
      setCustomCause('');
      return;
    }

    onChange([...value, trimmedCause]);
    setCustomCause('');
  }, [customCause, value, onChange, disabled]);

  /**
   * Handle Enter key in custom cause input.
   */
  const handleCustomCauseKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustomCause();
      }
    },
    [handleAddCustomCause]
  );

  /**
   * Check if a cause text is from the prepared list.
   */
  const isPreparedCause = useCallback(
    (causeText: string) => {
      return preparedCauses.some((c) => c.text === causeText);
    },
    [preparedCauses]
  );

  /**
   * Get custom causes (selected causes that aren't from prepared list).
   */
  const customCauses = useMemo(() => {
    return value.filter((c) => !isPreparedCause(c));
  }, [value, isPreparedCause]);

  return (
    <div className="causes-input">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Causes</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {nodeIdentifier} • {GUIDE_WORD_LABELS[guideWord]}
          </p>
        </div>
        {value.length > 0 && (
          <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            {value.length} selected
          </span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert
          color="red"
          variant="light"
          className="mb-3"
          styles={{ root: { borderRadius: '4px' } }}
          onClose={() => setError(null)}
          withCloseButton
        >
          {error.message}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader size="sm" color="blue" />
          <span className="ml-2 text-sm text-slate-500">Loading causes...</span>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Search Input */}
          <div className="mb-3">
            <TextInput
              placeholder="Search causes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
              size="sm"
              styles={{
                input: {
                  borderRadius: '4px',
                  '&:focus': {
                    borderColor: '#1e40af',
                  },
                },
              }}
              rightSection={
                searchQuery && !disabled ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                ) : null
              }
            />
          </div>

          {/* Common Causes Section */}
          {commonCauses.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Common Causes
              </div>
              <div className="space-y-1">
                {commonCauses.map((cause) => (
                  <CauseCheckboxItem
                    key={cause.id}
                    cause={cause}
                    isSelected={value.includes(cause.text)}
                    onToggle={() => handleToggleCause(cause.text)}
                    disabled={disabled}
                    isCommon={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Causes Section */}
          {displayedOtherCauses.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Other Causes
              </div>
              <div className="space-y-1">
                {displayedOtherCauses.map((cause) => (
                  <CauseCheckboxItem
                    key={cause.id}
                    cause={cause}
                    isSelected={value.includes(cause.text)}
                    onToggle={() => handleToggleCause(cause.text)}
                    disabled={disabled}
                    isCommon={false}
                  />
                ))}
              </div>

              {/* Show More Button */}
              {hasMoreCauses && (
                <button
                  type="button"
                  onClick={() => setShowAllCauses(true)}
                  className="mt-2 text-sm text-blue-700 hover:text-blue-800 font-medium"
                  disabled={disabled}
                >
                  Show {otherCauses.length - 5} more causes...
                </button>
              )}

              {/* Collapse Button */}
              {showAllCauses && otherCauses.length > 5 && !searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setShowAllCauses(false)}
                  className="mt-2 text-sm text-slate-500 hover:text-slate-700"
                  disabled={disabled}
                >
                  Show less
                </button>
              )}
            </div>
          )}

          {/* No Results */}
          {filteredCauses.length === 0 && searchQuery.trim() && (
            <div className="text-sm text-slate-500 text-center py-4">
              No causes match "{searchQuery}"
            </div>
          )}

          {/* Custom Causes Section */}
          {customCauses.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Custom Causes
              </div>
              <div className="space-y-1">
                {customCauses.map((causeText) => (
                  <div
                    key={causeText}
                    className="flex items-start gap-2 p-2 rounded bg-amber-50 border border-amber-200"
                  >
                    <Checkbox
                      checked={true}
                      onChange={() => handleToggleCause(causeText)}
                      disabled={disabled}
                      size="sm"
                      styles={{
                        input: {
                          borderRadius: '3px',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                        },
                      }}
                    />
                    <span className="text-sm text-slate-900">{causeText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Custom Cause */}
          <div className="border-t border-slate-200 pt-3 mt-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Add Custom Cause
            </div>
            <div className="flex gap-2">
              <TextInput
                placeholder="Enter a custom cause..."
                value={customCause}
                onChange={(e) => setCustomCause(e.target.value)}
                onKeyDown={handleCustomCauseKeyDown}
                disabled={disabled}
                className="flex-1"
                size="sm"
                styles={{
                  input: {
                    borderRadius: '4px',
                    '&:focus': {
                      borderColor: '#1e40af',
                    },
                  },
                }}
              />
              <Button
                onClick={handleAddCustomCause}
                disabled={!customCause.trim() || disabled}
                size="sm"
                variant="light"
                color="blue"
                styles={{
                  root: {
                    borderRadius: '4px',
                  },
                }}
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Press Enter to add a cause not in the prepared list
            </p>
          </div>
        </>
      )}

      {disabled && (
        <p className="text-xs text-amber-600 mt-3">
          Causes can only be modified when the analysis is in draft status.
        </p>
      )}
    </div>
  );
}

/**
 * Props for CauseCheckboxItem component.
 */
interface CauseCheckboxItemProps {
  cause: PreparedAnswer;
  isSelected: boolean;
  onToggle: () => void;
  disabled: boolean;
  isCommon: boolean;
}

/**
 * Individual cause checkbox item with description tooltip.
 */
function CauseCheckboxItem({
  cause,
  isSelected,
  onToggle,
  disabled,
  isCommon,
}: CauseCheckboxItemProps) {
  return (
    <label
      className={`
        flex items-start gap-2 p-2 rounded cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-200'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-100'}
        ${isCommon && !isSelected ? 'border-l-2 border-l-green-500' : ''}
      `}
    >
      <Checkbox
        checked={isSelected}
        onChange={onToggle}
        disabled={disabled}
        size="sm"
        styles={{
          input: {
            borderRadius: '3px',
            cursor: disabled ? 'not-allowed' : 'pointer',
          },
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-900">{cause.text}</div>
        {cause.description && (
          <div className="text-xs text-slate-500 mt-0.5">{cause.description}</div>
        )}
      </div>
      {isCommon && (
        <span className="shrink-0 text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
          Common
        </span>
      )}
    </label>
  );
}
