import { useState, useCallback, useMemo, useEffect } from 'react';
import { TextInput, Textarea, Button, Alert, Popover } from '@mantine/core';
import type {
  GuideWord,
  EquipmentType,
  AnalysisEntry,
  ApiError,
} from '@hazop/types';
import { GUIDE_WORD_LABELS } from '@hazop/types';
import { analysesService } from '../../services/analyses.service';

/**
 * Common process parameters for HazOps analysis.
 * These are the standard parameters that can deviate in process systems.
 * Organized by applicability to different equipment types.
 */
const COMMON_PARAMETERS = [
  // Flow-related parameters (most common)
  { value: 'flow', label: 'Flow', description: 'Fluid flow rate through the system' },
  { value: 'pressure', label: 'Pressure', description: 'System or equipment pressure' },
  { value: 'temperature', label: 'Temperature', description: 'Process or fluid temperature' },
  { value: 'level', label: 'Level', description: 'Liquid level in vessels or tanks' },

  // Composition/Quality parameters
  { value: 'composition', label: 'Composition', description: 'Chemical composition or purity' },
  { value: 'concentration', label: 'Concentration', description: 'Concentration of a component' },
  { value: 'pH', label: 'pH', description: 'Acidity or alkalinity of the fluid' },
  { value: 'viscosity', label: 'Viscosity', description: 'Fluid thickness or resistance to flow' },
  { value: 'density', label: 'Density', description: 'Mass per unit volume' },

  // Timing parameters
  { value: 'time', label: 'Time', description: 'Duration or timing of process step' },
  { value: 'sequence', label: 'Sequence', description: 'Order of process operations' },
  { value: 'frequency', label: 'Frequency', description: 'Rate of occurrence' },

  // Physical parameters
  { value: 'speed', label: 'Speed', description: 'Rotational or linear speed' },
  { value: 'vibration', label: 'Vibration', description: 'Mechanical vibration levels' },
  { value: 'mixing', label: 'Mixing', description: 'Degree of mixing or agitation' },

  // Electrical parameters
  { value: 'voltage', label: 'Voltage', description: 'Electrical potential difference' },
  { value: 'current', label: 'Current', description: 'Electrical current flow' },
  { value: 'power', label: 'Power', description: 'Electrical or mechanical power' },

  // Control parameters
  { value: 'signal', label: 'Signal', description: 'Control or instrument signal' },
  { value: 'setpoint', label: 'Setpoint', description: 'Controller target value' },

  // Other parameters
  { value: 'reaction', label: 'Reaction', description: 'Chemical reaction rate or extent' },
  { value: 'heat_transfer', label: 'Heat Transfer', description: 'Rate of heat exchange' },
  { value: 'phase', label: 'Phase', description: 'Physical state (solid/liquid/gas)' },
  { value: 'contamination', label: 'Contamination', description: 'Presence of unwanted materials' },
  { value: 'corrosion', label: 'Corrosion', description: 'Material degradation rate' },
];

/**
 * Props for the DeviationInputForm component.
 */
export interface DeviationInputFormProps {
  /** ID of the HazOps analysis session */
  analysisId: string;

  /** ID of the selected node */
  nodeId: string;

  /** User-visible node identifier (e.g., "P-101") */
  nodeIdentifier: string;

  /** Equipment type of the selected node */
  nodeEquipmentType: EquipmentType;

  /** Selected guide word */
  guideWord: GuideWord;

  /** Whether the form is disabled (e.g., analysis not in draft status) */
  disabled?: boolean;

  /** Callback when an entry is successfully created */
  onEntryCreated?: (entry: AnalysisEntry) => void;

  /** Callback to clear the current selection */
  onClear?: () => void;
}

/**
 * DeviationInputForm component for entering deviation details in HazOps analysis.
 *
 * Features:
 * - Parameter field with autocomplete suggestions
 * - Deviation text input (multi-line)
 * - Form validation (both fields required)
 * - Loading state during submission
 * - Error handling with user-friendly messages
 *
 * This form is displayed in the analysis workspace after a node and guide word
 * are selected. It creates a new analysis entry when submitted.
 */
export function DeviationInputForm({
  analysisId,
  nodeId,
  nodeIdentifier,
  nodeEquipmentType,
  guideWord,
  disabled = false,
  onEntryCreated,
  onClear,
}: DeviationInputFormProps) {
  // Form state
  const [parameter, setParameter] = useState('');
  const [deviation, setDeviation] = useState('');

  // Autocomplete state
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(COMMON_PARAMETERS);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  /**
   * Filter suggestions based on input value.
   */
  useEffect(() => {
    if (!parameter.trim()) {
      setFilteredSuggestions(COMMON_PARAMETERS);
      return;
    }

    const searchLower = parameter.toLowerCase();
    const filtered = COMMON_PARAMETERS.filter(
      (p) =>
        p.value.toLowerCase().includes(searchLower) ||
        p.label.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
    );
    setFilteredSuggestions(filtered);
  }, [parameter]);

  /**
   * Check if the form is valid for submission.
   */
  const isFormValid = useMemo(() => {
    return parameter.trim().length > 0 && deviation.trim().length > 0;
  }, [parameter, deviation]);

  /**
   * Generate default deviation text based on guide word and parameter.
   */
  const generateDeviationHint = useCallback((): string => {
    if (!parameter.trim()) return '';

    const paramLabel = parameter.trim();
    const guideWordLabel = GUIDE_WORD_LABELS[guideWord];

    switch (guideWord) {
      case 'no':
        return `No ${paramLabel} - complete absence or cessation`;
      case 'more':
        return `${paramLabel} higher than design intent`;
      case 'less':
        return `${paramLabel} lower than design intent`;
      case 'reverse':
        return `${paramLabel} in opposite direction`;
      case 'early':
        return `${paramLabel} occurs earlier than intended`;
      case 'late':
        return `${paramLabel} occurs later than intended`;
      case 'other_than':
        return `Wrong or unexpected ${paramLabel}`;
      default:
        return `${guideWordLabel} ${paramLabel}`;
    }
  }, [parameter, guideWord]);

  /**
   * Handle selecting a parameter from autocomplete.
   */
  const handleSelectParameter = useCallback((value: string) => {
    setParameter(value);
    setIsAutocompleteOpen(false);
  }, []);

  /**
   * Handle form submission.
   */
  const handleSubmit = useCallback(async () => {
    if (!isFormValid || disabled) return;

    setIsSubmitting(true);
    setError(null);

    const result = await analysesService.createAnalysisEntry(analysisId, {
      nodeId,
      guideWord,
      parameter: parameter.trim(),
      deviation: deviation.trim(),
    });

    setIsSubmitting(false);

    if (result.success && result.data) {
      // Reset form
      setParameter('');
      setDeviation('');

      // Notify parent
      if (onEntryCreated) {
        onEntryCreated(result.data.entry);
      }
    } else {
      setError(result.error || { code: 'UNKNOWN', message: 'Failed to create analysis entry' });
    }
  }, [isFormValid, disabled, analysisId, nodeId, guideWord, parameter, deviation, onEntryCreated]);

  /**
   * Handle Enter key to submit form (only in deviation field).
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey && isFormValid && !isSubmitting && !disabled) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [isFormValid, isSubmitting, disabled, handleSubmit]
  );

  /**
   * Handle parameter input focus.
   */
  const handleParameterFocus = useCallback(() => {
    setIsAutocompleteOpen(true);
  }, []);

  /**
   * Handle parameter input blur.
   */
  const handleParameterBlur = useCallback(() => {
    // Delay closing to allow click on suggestions
    setTimeout(() => setIsAutocompleteOpen(false), 200);
  }, []);

  return (
    <div className="deviation-input-form" onKeyDown={handleKeyDown}>
      {/* Form Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Deviation Analysis</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {nodeIdentifier} • {GUIDE_WORD_LABELS[guideWord]}
          </p>
        </div>
        {onClear && (
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            onClick={onClear}
            disabled={isSubmitting}
            styles={{ root: { borderRadius: '4px' } }}
          >
            Clear
          </Button>
        )}
      </div>

      {error && (
        <Alert
          color="red"
          variant="light"
          className="mb-4"
          styles={{ root: { borderRadius: '4px' } }}
          onClose={() => setError(null)}
          withCloseButton
        >
          {error.message}
        </Alert>
      )}

      {/* Parameter Field with Autocomplete */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Parameter <span className="text-red-500">*</span>
        </label>
        <Popover
          opened={isAutocompleteOpen && filteredSuggestions.length > 0 && !disabled}
          position="bottom-start"
          width="target"
          shadow="md"
          withinPortal
        >
          <Popover.Target>
            <TextInput
              placeholder="e.g., flow, pressure, temperature"
              value={parameter}
              onChange={(e) => setParameter(e.target.value)}
              onFocus={handleParameterFocus}
              onBlur={handleParameterBlur}
              disabled={isSubmitting || disabled}
              autoFocus
              rightSection={
                parameter.trim() && !disabled ? (
                  <button
                    type="button"
                    onClick={() => setParameter('')}
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
              styles={{
                input: {
                  borderRadius: '4px',
                  '&:focus': {
                    borderColor: '#1e40af',
                  },
                },
              }}
            />
          </Popover.Target>
          <Popover.Dropdown
            styles={{
              dropdown: {
                padding: 0,
                maxHeight: '200px',
                overflowY: 'auto',
              },
            }}
          >
            <div className="divide-y divide-slate-100">
              {filteredSuggestions.slice(0, 8).map((suggestion) => (
                <button
                  key={suggestion.value}
                  type="button"
                  onClick={() => handleSelectParameter(suggestion.label)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  <div className="text-sm font-medium text-slate-900">
                    {suggestion.label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {suggestion.description}
                  </div>
                </button>
              ))}
            </div>
          </Popover.Dropdown>
        </Popover>
        <p className="text-xs text-slate-400 mt-1">
          The process parameter that deviates from normal operation
        </p>
      </div>

      {/* Deviation Description Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Deviation <span className="text-red-500">*</span>
        </label>
        <Textarea
          placeholder={generateDeviationHint() || 'Describe the deviation from normal operation...'}
          value={deviation}
          onChange={(e) => setDeviation(e.target.value)}
          disabled={isSubmitting || disabled}
          minRows={2}
          maxRows={4}
          styles={{
            input: {
              borderRadius: '4px',
              '&:focus': {
                borderColor: '#1e40af',
              },
            },
          }}
        />
        <p className="text-xs text-slate-400 mt-1">
          Describe how the parameter deviates (Ctrl+Enter to submit)
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!isFormValid || disabled}
          styles={{
            root: {
              borderRadius: '4px',
              backgroundColor: '#1e40af',
              '&:hover': {
                backgroundColor: '#1e3a8a',
              },
              '&:disabled': {
                backgroundColor: '#94a3b8',
              },
            },
          }}
        >
          Add Entry
        </Button>
      </div>

      {disabled && (
        <p className="text-xs text-amber-600 mt-3">
          Analysis entries can only be added when the analysis is in draft status.
        </p>
      )}
    </div>
  );
}
