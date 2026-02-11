import { useState, useCallback, useEffect, useMemo } from 'react';
import { TextInput, Checkbox, Button, Alert, Loader } from '@mantine/core';
import type { GuideWord, EquipmentType, PreparedAnswer, ApiError } from '@hazop/types';
import { GUIDE_WORD_LABELS } from '@hazop/types';
import { preparedConsequencesService } from '../../services/prepared-consequences.service';

/**
 * Props for the ConsequencesInput component.
 */
export interface ConsequencesInputProps {
  /** User-visible node identifier (e.g., "P-101") */
  nodeIdentifier: string;

  /** Equipment type of the selected node */
  equipmentType: EquipmentType;

  /** Selected guide word */
  guideWord: GuideWord;

  /** Currently selected consequences */
  value: string[];

  /** Callback when selected consequences change */
  onChange: (consequences: string[]) => void;

  /** Whether the input is disabled */
  disabled?: boolean;
}

/**
 * ConsequencesInput component for selecting consequences in HazOps analysis.
 *
 * Features:
 * - Fetches context-aware prepared consequences based on equipment type and guide word
 * - Multi-select checkboxes for prepared consequences
 * - Search/filter within prepared consequences
 * - Shows common consequences prominently at the top
 * - Allows adding custom consequences
 * - Displays consequence descriptions on hover/focus
 */
export function ConsequencesInput({
  nodeIdentifier,
  equipmentType,
  guideWord,
  value,
  onChange,
  disabled = false,
}: ConsequencesInputProps) {
  // Prepared consequences state
  const [preparedConsequences, setPreparedConsequences] = useState<PreparedAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [customConsequence, setCustomConsequence] = useState('');
  const [showAllConsequences, setShowAllConsequences] = useState(false);

  /**
   * Fetch prepared consequences when context changes.
   */
  useEffect(() => {
    let isMounted = true;

    const fetchConsequences = async () => {
      setIsLoading(true);
      setError(null);

      const result = await preparedConsequencesService.getByContext(equipmentType, guideWord);

      if (!isMounted) return;

      if (result.success && result.data) {
        setPreparedConsequences(result.data.answers);
      } else {
        setError(result.error || { code: 'UNKNOWN', message: 'Failed to load prepared consequences' });
      }

      setIsLoading(false);
    };

    fetchConsequences();

    return () => {
      isMounted = false;
    };
  }, [equipmentType, guideWord]);

  /**
   * Filter consequences based on search query.
   */
  const filteredConsequences = useMemo(() => {
    if (!searchQuery.trim()) {
      return preparedConsequences;
    }

    const searchLower = searchQuery.toLowerCase();
    return preparedConsequences.filter(
      (consequence) =>
        consequence.text.toLowerCase().includes(searchLower) ||
        (consequence.description && consequence.description.toLowerCase().includes(searchLower))
    );
  }, [preparedConsequences, searchQuery]);

  /**
   * Separate common consequences from others for display priority.
   */
  const { commonConsequences, otherConsequences } = useMemo(() => {
    const common = filteredConsequences.filter((c) => c.isCommon);
    const others = filteredConsequences.filter((c) => !c.isCommon);
    return { commonConsequences: common, otherConsequences: others };
  }, [filteredConsequences]);

  /**
   * Determine which consequences to display based on showAllConsequences toggle.
   */
  const displayedOtherConsequences = useMemo(() => {
    if (showAllConsequences || searchQuery.trim()) {
      return otherConsequences;
    }
    // Show first 5 other consequences when collapsed
    return otherConsequences.slice(0, 5);
  }, [otherConsequences, showAllConsequences, searchQuery]);

  const hasMoreConsequences = otherConsequences.length > 5 && !showAllConsequences && !searchQuery.trim();

  /**
   * Handle toggling a consequence selection.
   */
  const handleToggleConsequence = useCallback(
    (consequenceText: string) => {
      if (disabled) return;

      const isSelected = value.includes(consequenceText);
      if (isSelected) {
        onChange(value.filter((c) => c !== consequenceText));
      } else {
        onChange([...value, consequenceText]);
      }
    },
    [value, onChange, disabled]
  );

  /**
   * Handle adding a custom consequence.
   */
  const handleAddCustomConsequence = useCallback(() => {
    const trimmedConsequence = customConsequence.trim();
    if (!trimmedConsequence || disabled) return;

    // Check if already selected
    if (value.includes(trimmedConsequence)) {
      setCustomConsequence('');
      return;
    }

    onChange([...value, trimmedConsequence]);
    setCustomConsequence('');
  }, [customConsequence, value, onChange, disabled]);

  /**
   * Handle Enter key in custom consequence input.
   */
  const handleCustomConsequenceKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustomConsequence();
      }
    },
    [handleAddCustomConsequence]
  );

  /**
   * Check if a consequence text is from the prepared list.
   */
  const isPreparedConsequence = useCallback(
    (consequenceText: string) => {
      return preparedConsequences.some((c) => c.text === consequenceText);
    },
    [preparedConsequences]
  );

  /**
   * Get custom consequences (selected consequences that aren't from prepared list).
   */
  const customConsequences = useMemo(() => {
    return value.filter((c) => !isPreparedConsequence(c));
  }, [value, isPreparedConsequence]);

  return (
    <div className="consequences-input">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Consequences</h4>
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
          <span className="ml-2 text-sm text-slate-500">Loading consequences...</span>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Search Input */}
          <div className="mb-3">
            <TextInput
              placeholder="Search consequences..."
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

          {/* Common Consequences Section */}
          {commonConsequences.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Common Consequences
              </div>
              <div className="space-y-1">
                {commonConsequences.map((consequence) => (
                  <ConsequenceCheckboxItem
                    key={consequence.id}
                    consequence={consequence}
                    isSelected={value.includes(consequence.text)}
                    onToggle={() => handleToggleConsequence(consequence.text)}
                    disabled={disabled}
                    isCommon={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Consequences Section */}
          {displayedOtherConsequences.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Other Consequences
              </div>
              <div className="space-y-1">
                {displayedOtherConsequences.map((consequence) => (
                  <ConsequenceCheckboxItem
                    key={consequence.id}
                    consequence={consequence}
                    isSelected={value.includes(consequence.text)}
                    onToggle={() => handleToggleConsequence(consequence.text)}
                    disabled={disabled}
                    isCommon={false}
                  />
                ))}
              </div>

              {/* Show More Button */}
              {hasMoreConsequences && (
                <button
                  type="button"
                  onClick={() => setShowAllConsequences(true)}
                  className="mt-2 text-sm text-blue-700 hover:text-blue-800 font-medium"
                  disabled={disabled}
                >
                  Show {otherConsequences.length - 5} more consequences...
                </button>
              )}

              {/* Collapse Button */}
              {showAllConsequences && otherConsequences.length > 5 && !searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setShowAllConsequences(false)}
                  className="mt-2 text-sm text-slate-500 hover:text-slate-700"
                  disabled={disabled}
                >
                  Show less
                </button>
              )}
            </div>
          )}

          {/* No Results */}
          {filteredConsequences.length === 0 && searchQuery.trim() && (
            <div className="text-sm text-slate-500 text-center py-4">
              No consequences match "{searchQuery}"
            </div>
          )}

          {/* Custom Consequences Section */}
          {customConsequences.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Custom Consequences
              </div>
              <div className="space-y-1">
                {customConsequences.map((consequenceText) => (
                  <div
                    key={consequenceText}
                    className="flex items-start gap-2 p-2 rounded bg-amber-50 border border-amber-200"
                  >
                    <Checkbox
                      checked={true}
                      onChange={() => handleToggleConsequence(consequenceText)}
                      disabled={disabled}
                      size="sm"
                      styles={{
                        input: {
                          borderRadius: '3px',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                        },
                      }}
                    />
                    <span className="text-sm text-slate-900">{consequenceText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Custom Consequence */}
          <div className="border-t border-slate-200 pt-3 mt-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Add Custom Consequence
            </div>
            <div className="flex gap-2">
              <TextInput
                placeholder="Enter a custom consequence..."
                value={customConsequence}
                onChange={(e) => setCustomConsequence(e.target.value)}
                onKeyDown={handleCustomConsequenceKeyDown}
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
                onClick={handleAddCustomConsequence}
                disabled={!customConsequence.trim() || disabled}
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
              Press Enter to add a consequence not in the prepared list
            </p>
          </div>
        </>
      )}

      {disabled && (
        <p className="text-xs text-amber-600 mt-3">
          Consequences can only be modified when the analysis is in draft status.
        </p>
      )}
    </div>
  );
}

/**
 * Props for ConsequenceCheckboxItem component.
 */
interface ConsequenceCheckboxItemProps {
  consequence: PreparedAnswer;
  isSelected: boolean;
  onToggle: () => void;
  disabled: boolean;
  isCommon: boolean;
}

/**
 * Individual consequence checkbox item with description tooltip.
 */
function ConsequenceCheckboxItem({
  consequence,
  isSelected,
  onToggle,
  disabled,
  isCommon,
}: ConsequenceCheckboxItemProps) {
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
        <div className="text-sm text-slate-900">{consequence.text}</div>
        {consequence.description && (
          <div className="text-xs text-slate-500 mt-0.5">{consequence.description}</div>
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
