/**
 * Risk Threshold Configuration Service.
 *
 * Provides configurable risk level thresholds for risk assessment customization.
 * Allows organizations or projects to define their own risk classification boundaries
 * while maintaining sensible defaults aligned with industry standards.
 *
 * Two threshold configurations are supported:
 * 1. Full Risk Thresholds (3D): For severity × likelihood × detectability (1-125)
 * 2. Matrix Thresholds (2D): For severity × likelihood only (1-25)
 */

import {
  type RiskLevel,
  RISK_THRESHOLDS,
  RISK_MATRIX_THRESHOLDS,
} from '@hazop/types';

// ============================================================================
// Types
// ============================================================================

/**
 * A range definition for a risk level threshold.
 */
export interface ThresholdRange {
  /** Minimum score for this level (inclusive) */
  min: number;
  /** Maximum score for this level (inclusive) */
  max: number;
}

/**
 * Complete threshold configuration for 3D risk calculation (1-125 range).
 */
export interface RiskThresholdConfig {
  /** Low risk threshold range */
  low: ThresholdRange;
  /** Medium risk threshold range */
  medium: ThresholdRange;
  /** High risk threshold range */
  high: ThresholdRange;
}

/**
 * Complete threshold configuration for 2D risk matrix (1-25 range).
 */
export interface RiskMatrixThresholdConfig {
  /** Low risk threshold range */
  low: ThresholdRange;
  /** Medium risk threshold range */
  medium: ThresholdRange;
  /** High risk threshold range */
  high: ThresholdRange;
}

/**
 * Combined threshold configuration for both 3D and 2D calculations.
 */
export interface CombinedThresholdConfig {
  /** Full risk thresholds for 3D calculation (1-125) */
  full: RiskThresholdConfig;
  /** Matrix thresholds for 2D calculation (1-25) */
  matrix: RiskMatrixThresholdConfig;
}

/**
 * Validation result for threshold configuration.
 */
export interface ThresholdValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** Error messages if invalid */
  errors: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Minimum possible score for 3D risk calculation */
const MIN_FULL_SCORE = 1;
/** Maximum possible score for 3D risk calculation (5 × 5 × 5) */
const MAX_FULL_SCORE = 125;

/** Minimum possible score for 2D matrix calculation */
const MIN_MATRIX_SCORE = 1;
/** Maximum possible score for 2D matrix calculation (5 × 5) */
const MAX_MATRIX_SCORE = 25;

/** Risk levels in order from lowest to highest */
const RISK_LEVEL_ORDER: RiskLevel[] = ['low', 'medium', 'high'];

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default threshold configuration for 3D risk calculation.
 * Matches the constants defined in @hazop/types.
 *
 * - Low: 1-20 (acceptable risk, monitor and review)
 * - Medium: 21-60 (requires attention, mitigation recommended)
 * - High: 61-125 (unacceptable, immediate action required)
 */
export const DEFAULT_RISK_THRESHOLDS: Readonly<RiskThresholdConfig> = {
  low: { min: RISK_THRESHOLDS.low.min, max: RISK_THRESHOLDS.low.max },
  medium: { min: RISK_THRESHOLDS.medium.min, max: RISK_THRESHOLDS.medium.max },
  high: { min: RISK_THRESHOLDS.high.min, max: RISK_THRESHOLDS.high.max },
} as const;

/**
 * Default threshold configuration for 2D risk matrix.
 * Matches the constants defined in @hazop/types.
 *
 * - Low: 1-4 (acceptable risk)
 * - Medium: 5-14 (requires attention)
 * - High: 15-25 (unacceptable, action required)
 */
export const DEFAULT_MATRIX_THRESHOLDS: Readonly<RiskMatrixThresholdConfig> = {
  low: { min: RISK_MATRIX_THRESHOLDS.low.min, max: RISK_MATRIX_THRESHOLDS.low.max },
  medium: { min: RISK_MATRIX_THRESHOLDS.medium.min, max: RISK_MATRIX_THRESHOLDS.medium.max },
  high: { min: RISK_MATRIX_THRESHOLDS.high.min, max: RISK_MATRIX_THRESHOLDS.high.max },
} as const;

/**
 * Default combined threshold configuration.
 */
export const DEFAULT_COMBINED_THRESHOLDS: Readonly<CombinedThresholdConfig> = {
  full: DEFAULT_RISK_THRESHOLDS,
  matrix: DEFAULT_MATRIX_THRESHOLDS,
} as const;

// ============================================================================
// Alternative Preset Configurations
// ============================================================================

/**
 * Conservative threshold configuration for 3D risk calculation.
 * Lower boundaries mean more items are classified as higher risk.
 * Suitable for high-consequence industries (nuclear, aerospace, pharmaceutical).
 *
 * - Low: 1-10
 * - Medium: 11-40
 * - High: 41-125
 */
export const CONSERVATIVE_RISK_THRESHOLDS: Readonly<RiskThresholdConfig> = {
  low: { min: 1, max: 10 },
  medium: { min: 11, max: 40 },
  high: { min: 41, max: 125 },
} as const;

/**
 * Conservative threshold configuration for 2D risk matrix.
 *
 * - Low: 1-2
 * - Medium: 3-8
 * - High: 9-25
 */
export const CONSERVATIVE_MATRIX_THRESHOLDS: Readonly<RiskMatrixThresholdConfig> = {
  low: { min: 1, max: 2 },
  medium: { min: 3, max: 8 },
  high: { min: 9, max: 25 },
} as const;

/**
 * Relaxed threshold configuration for 3D risk calculation.
 * Higher boundaries mean fewer items are classified as higher risk.
 * Suitable for lower-consequence environments with good safeguards.
 *
 * - Low: 1-30
 * - Medium: 31-80
 * - High: 81-125
 */
export const RELAXED_RISK_THRESHOLDS: Readonly<RiskThresholdConfig> = {
  low: { min: 1, max: 30 },
  medium: { min: 31, max: 80 },
  high: { min: 81, max: 125 },
} as const;

/**
 * Relaxed threshold configuration for 2D risk matrix.
 *
 * - Low: 1-6
 * - Medium: 7-16
 * - High: 17-25
 */
export const RELAXED_MATRIX_THRESHOLDS: Readonly<RiskMatrixThresholdConfig> = {
  low: { min: 1, max: 6 },
  medium: { min: 7, max: 16 },
  high: { min: 17, max: 25 },
} as const;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a threshold range.
 *
 * @param range - The range to validate
 * @param levelName - Name of the risk level for error messages
 * @param minAllowed - Minimum allowed value
 * @param maxAllowed - Maximum allowed value
 * @returns Array of validation error messages (empty if valid)
 */
function validateRange(
  range: ThresholdRange,
  levelName: string,
  minAllowed: number,
  maxAllowed: number
): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(range.min)) {
    errors.push(`${levelName} min must be an integer`);
  }
  if (!Number.isInteger(range.max)) {
    errors.push(`${levelName} max must be an integer`);
  }
  if (range.min < minAllowed) {
    errors.push(`${levelName} min (${range.min}) must be >= ${minAllowed}`);
  }
  if (range.max > maxAllowed) {
    errors.push(`${levelName} max (${range.max}) must be <= ${maxAllowed}`);
  }
  if (range.min > range.max) {
    errors.push(`${levelName} min (${range.min}) must be <= max (${range.max})`);
  }

  return errors;
}

/**
 * Validate that thresholds are contiguous (no gaps or overlaps).
 *
 * @param config - The threshold configuration to validate
 * @returns Array of validation error messages (empty if valid)
 */
function validateContiguity(config: RiskThresholdConfig): string[] {
  const errors: string[] = [];

  // Check that medium starts immediately after low
  if (config.medium.min !== config.low.max + 1) {
    errors.push(
      `Gap or overlap between low (max: ${config.low.max}) and medium (min: ${config.medium.min}). ` +
        `Medium min should be ${config.low.max + 1}`
    );
  }

  // Check that high starts immediately after medium
  if (config.high.min !== config.medium.max + 1) {
    errors.push(
      `Gap or overlap between medium (max: ${config.medium.max}) and high (min: ${config.high.min}). ` +
        `High min should be ${config.medium.max + 1}`
    );
  }

  return errors;
}

/**
 * Validate a complete risk threshold configuration (3D).
 *
 * Validates:
 * - All ranges have valid min/max values
 * - Ranges cover the full 1-125 score range
 * - Ranges are contiguous (no gaps or overlaps)
 *
 * @param config - The configuration to validate
 * @returns Validation result with errors if any
 */
export function validateRiskThresholdConfig(
  config: RiskThresholdConfig
): ThresholdValidationResult {
  const errors: string[] = [];

  // Validate individual ranges
  errors.push(...validateRange(config.low, 'Low', MIN_FULL_SCORE, MAX_FULL_SCORE));
  errors.push(...validateRange(config.medium, 'Medium', MIN_FULL_SCORE, MAX_FULL_SCORE));
  errors.push(...validateRange(config.high, 'High', MIN_FULL_SCORE, MAX_FULL_SCORE));

  // Validate coverage
  if (config.low.min !== MIN_FULL_SCORE) {
    errors.push(`Low min must be ${MIN_FULL_SCORE} to cover the full range`);
  }
  if (config.high.max !== MAX_FULL_SCORE) {
    errors.push(`High max must be ${MAX_FULL_SCORE} to cover the full range`);
  }

  // Validate contiguity
  errors.push(...validateContiguity(config));

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a risk matrix threshold configuration (2D).
 *
 * Validates:
 * - All ranges have valid min/max values
 * - Ranges cover the full 1-25 score range
 * - Ranges are contiguous (no gaps or overlaps)
 *
 * @param config - The configuration to validate
 * @returns Validation result with errors if any
 */
export function validateMatrixThresholdConfig(
  config: RiskMatrixThresholdConfig
): ThresholdValidationResult {
  const errors: string[] = [];

  // Validate individual ranges
  errors.push(...validateRange(config.low, 'Low', MIN_MATRIX_SCORE, MAX_MATRIX_SCORE));
  errors.push(...validateRange(config.medium, 'Medium', MIN_MATRIX_SCORE, MAX_MATRIX_SCORE));
  errors.push(...validateRange(config.high, 'High', MIN_MATRIX_SCORE, MAX_MATRIX_SCORE));

  // Validate coverage
  if (config.low.min !== MIN_MATRIX_SCORE) {
    errors.push(`Low min must be ${MIN_MATRIX_SCORE} to cover the full range`);
  }
  if (config.high.max !== MAX_MATRIX_SCORE) {
    errors.push(`High max must be ${MAX_MATRIX_SCORE} to cover the full range`);
  }

  // Validate contiguity
  errors.push(...validateContiguity(config));

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a combined threshold configuration.
 *
 * @param config - The configuration to validate
 * @returns Validation result with errors if any
 */
export function validateCombinedThresholdConfig(
  config: CombinedThresholdConfig
): ThresholdValidationResult {
  const fullValidation = validateRiskThresholdConfig(config.full);
  const matrixValidation = validateMatrixThresholdConfig(config.matrix);

  const errors: string[] = [
    ...fullValidation.errors.map((e) => `Full: ${e}`),
    ...matrixValidation.errors.map((e) => `Matrix: ${e}`),
  ];

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Configuration Factory Functions
// ============================================================================

/**
 * Create a risk threshold configuration from boundary values.
 *
 * This is a convenience function that takes the two boundary points
 * (low/medium and medium/high) and creates a complete configuration.
 *
 * @param lowMediumBoundary - Score at which risk transitions from low to medium
 * @param mediumHighBoundary - Score at which risk transitions from medium to high
 * @returns A validated threshold configuration
 * @throws Error if the resulting configuration is invalid
 */
export function createRiskThresholdConfig(
  lowMediumBoundary: number,
  mediumHighBoundary: number
): RiskThresholdConfig {
  const config: RiskThresholdConfig = {
    low: { min: MIN_FULL_SCORE, max: lowMediumBoundary },
    medium: { min: lowMediumBoundary + 1, max: mediumHighBoundary },
    high: { min: mediumHighBoundary + 1, max: MAX_FULL_SCORE },
  };

  const validation = validateRiskThresholdConfig(config);
  if (!validation.valid) {
    throw new Error(
      `Invalid threshold configuration: ${validation.errors.join('; ')}`
    );
  }

  return config;
}

/**
 * Create a matrix threshold configuration from boundary values.
 *
 * @param lowMediumBoundary - Score at which risk transitions from low to medium
 * @param mediumHighBoundary - Score at which risk transitions from medium to high
 * @returns A validated threshold configuration
 * @throws Error if the resulting configuration is invalid
 */
export function createMatrixThresholdConfig(
  lowMediumBoundary: number,
  mediumHighBoundary: number
): RiskMatrixThresholdConfig {
  const config: RiskMatrixThresholdConfig = {
    low: { min: MIN_MATRIX_SCORE, max: lowMediumBoundary },
    medium: { min: lowMediumBoundary + 1, max: mediumHighBoundary },
    high: { min: mediumHighBoundary + 1, max: MAX_MATRIX_SCORE },
  };

  const validation = validateMatrixThresholdConfig(config);
  if (!validation.valid) {
    throw new Error(
      `Invalid matrix threshold configuration: ${validation.errors.join('; ')}`
    );
  }

  return config;
}

/**
 * Create a combined threshold configuration.
 *
 * @param fullLowMediumBoundary - Full score boundary between low and medium
 * @param fullMediumHighBoundary - Full score boundary between medium and high
 * @param matrixLowMediumBoundary - Matrix score boundary between low and medium
 * @param matrixMediumHighBoundary - Matrix score boundary between medium and high
 * @returns A validated combined threshold configuration
 * @throws Error if either configuration is invalid
 */
export function createCombinedThresholdConfig(
  fullLowMediumBoundary: number,
  fullMediumHighBoundary: number,
  matrixLowMediumBoundary: number,
  matrixMediumHighBoundary: number
): CombinedThresholdConfig {
  return {
    full: createRiskThresholdConfig(fullLowMediumBoundary, fullMediumHighBoundary),
    matrix: createMatrixThresholdConfig(matrixLowMediumBoundary, matrixMediumHighBoundary),
  };
}

// ============================================================================
// Risk Level Determination with Custom Thresholds
// ============================================================================

/**
 * Determine risk level from a score using custom thresholds.
 *
 * @param score - The risk score to classify
 * @param config - The threshold configuration to use
 * @returns The determined risk level
 * @throws Error if score is outside valid range or config is invalid
 */
export function determineRiskLevelWithConfig(
  score: number,
  config: RiskThresholdConfig
): RiskLevel {
  if (!Number.isInteger(score) || score < MIN_FULL_SCORE || score > MAX_FULL_SCORE) {
    throw new Error(
      `Invalid risk score: ${score}. Must be an integer between ${MIN_FULL_SCORE} and ${MAX_FULL_SCORE}.`
    );
  }

  if (score <= config.low.max) {
    return 'low';
  }
  if (score <= config.medium.max) {
    return 'medium';
  }
  return 'high';
}

/**
 * Determine risk level from a base score using custom matrix thresholds.
 *
 * @param baseScore - The base risk score (1-25) to classify
 * @param config - The matrix threshold configuration to use
 * @returns The determined risk level
 * @throws Error if score is outside valid range
 */
export function determineMatrixRiskLevelWithConfig(
  baseScore: number,
  config: RiskMatrixThresholdConfig
): RiskLevel {
  if (!Number.isInteger(baseScore) || baseScore < MIN_MATRIX_SCORE || baseScore > MAX_MATRIX_SCORE) {
    throw new Error(
      `Invalid base risk score: ${baseScore}. Must be an integer between ${MIN_MATRIX_SCORE} and ${MAX_MATRIX_SCORE}.`
    );
  }

  if (baseScore <= config.low.max) {
    return 'low';
  }
  if (baseScore <= config.medium.max) {
    return 'medium';
  }
  return 'high';
}

// ============================================================================
// Configuration Retrieval Functions
// ============================================================================

/**
 * Get the default risk threshold configuration.
 *
 * @returns A copy of the default threshold configuration
 */
export function getDefaultRiskThresholds(): RiskThresholdConfig {
  return {
    low: { ...DEFAULT_RISK_THRESHOLDS.low },
    medium: { ...DEFAULT_RISK_THRESHOLDS.medium },
    high: { ...DEFAULT_RISK_THRESHOLDS.high },
  };
}

/**
 * Get the default matrix threshold configuration.
 *
 * @returns A copy of the default matrix threshold configuration
 */
export function getDefaultMatrixThresholds(): RiskMatrixThresholdConfig {
  return {
    low: { ...DEFAULT_MATRIX_THRESHOLDS.low },
    medium: { ...DEFAULT_MATRIX_THRESHOLDS.medium },
    high: { ...DEFAULT_MATRIX_THRESHOLDS.high },
  };
}

/**
 * Get the conservative risk threshold configuration.
 *
 * @returns A copy of the conservative threshold configuration
 */
export function getConservativeRiskThresholds(): RiskThresholdConfig {
  return {
    low: { ...CONSERVATIVE_RISK_THRESHOLDS.low },
    medium: { ...CONSERVATIVE_RISK_THRESHOLDS.medium },
    high: { ...CONSERVATIVE_RISK_THRESHOLDS.high },
  };
}

/**
 * Get the conservative matrix threshold configuration.
 *
 * @returns A copy of the conservative matrix threshold configuration
 */
export function getConservativeMatrixThresholds(): RiskMatrixThresholdConfig {
  return {
    low: { ...CONSERVATIVE_MATRIX_THRESHOLDS.low },
    medium: { ...CONSERVATIVE_MATRIX_THRESHOLDS.medium },
    high: { ...CONSERVATIVE_MATRIX_THRESHOLDS.high },
  };
}

/**
 * Get the relaxed risk threshold configuration.
 *
 * @returns A copy of the relaxed threshold configuration
 */
export function getRelaxedRiskThresholds(): RiskThresholdConfig {
  return {
    low: { ...RELAXED_RISK_THRESHOLDS.low },
    medium: { ...RELAXED_RISK_THRESHOLDS.medium },
    high: { ...RELAXED_RISK_THRESHOLDS.high },
  };
}

/**
 * Get the relaxed matrix threshold configuration.
 *
 * @returns A copy of the relaxed matrix threshold configuration
 */
export function getRelaxedMatrixThresholds(): RiskMatrixThresholdConfig {
  return {
    low: { ...RELAXED_MATRIX_THRESHOLDS.low },
    medium: { ...RELAXED_MATRIX_THRESHOLDS.medium },
    high: { ...RELAXED_MATRIX_THRESHOLDS.high },
  };
}

/**
 * Get a named preset configuration.
 *
 * @param preset - The preset name ('default', 'conservative', or 'relaxed')
 * @returns The threshold configuration for the named preset
 * @throws Error if preset name is unknown
 */
export function getPresetRiskThresholds(
  preset: 'default' | 'conservative' | 'relaxed'
): RiskThresholdConfig {
  switch (preset) {
    case 'default':
      return getDefaultRiskThresholds();
    case 'conservative':
      return getConservativeRiskThresholds();
    case 'relaxed':
      return getRelaxedRiskThresholds();
    default:
      throw new Error(`Unknown preset: ${preset}`);
  }
}

/**
 * Get a named preset matrix configuration.
 *
 * @param preset - The preset name ('default', 'conservative', or 'relaxed')
 * @returns The matrix threshold configuration for the named preset
 * @throws Error if preset name is unknown
 */
export function getPresetMatrixThresholds(
  preset: 'default' | 'conservative' | 'relaxed'
): RiskMatrixThresholdConfig {
  switch (preset) {
    case 'default':
      return getDefaultMatrixThresholds();
    case 'conservative':
      return getConservativeMatrixThresholds();
    case 'relaxed':
      return getRelaxedMatrixThresholds();
    default:
      throw new Error(`Unknown preset: ${preset}`);
  }
}

// ============================================================================
// Configuration Comparison Functions
// ============================================================================

/**
 * Compare two threshold configurations for equality.
 *
 * @param a - First configuration
 * @param b - Second configuration
 * @returns True if configurations are equivalent
 */
export function areThresholdConfigsEqual(
  a: RiskThresholdConfig,
  b: RiskThresholdConfig
): boolean {
  return (
    a.low.min === b.low.min &&
    a.low.max === b.low.max &&
    a.medium.min === b.medium.min &&
    a.medium.max === b.medium.max &&
    a.high.min === b.high.min &&
    a.high.max === b.high.max
  );
}

/**
 * Compare two matrix threshold configurations for equality.
 *
 * @param a - First configuration
 * @param b - Second configuration
 * @returns True if configurations are equivalent
 */
export function areMatrixThresholdConfigsEqual(
  a: RiskMatrixThresholdConfig,
  b: RiskMatrixThresholdConfig
): boolean {
  return (
    a.low.min === b.low.min &&
    a.low.max === b.low.max &&
    a.medium.min === b.medium.min &&
    a.medium.max === b.medium.max &&
    a.high.min === b.high.min &&
    a.high.max === b.high.max
  );
}

/**
 * Get the boundaries from a threshold configuration.
 *
 * @param config - The threshold configuration
 * @returns Object with the two boundary values
 */
export function getThresholdBoundaries(
  config: RiskThresholdConfig
): { lowMediumBoundary: number; mediumHighBoundary: number } {
  return {
    lowMediumBoundary: config.low.max,
    mediumHighBoundary: config.medium.max,
  };
}

/**
 * Get the boundaries from a matrix threshold configuration.
 *
 * @param config - The matrix threshold configuration
 * @returns Object with the two boundary values
 */
export function getMatrixThresholdBoundaries(
  config: RiskMatrixThresholdConfig
): { lowMediumBoundary: number; mediumHighBoundary: number } {
  return {
    lowMediumBoundary: config.low.max,
    mediumHighBoundary: config.medium.max,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the list of available preset names.
 *
 * @returns Array of available preset names
 */
export function getAvailablePresets(): ('default' | 'conservative' | 'relaxed')[] {
  return ['default', 'conservative', 'relaxed'];
}

/**
 * Get a description of a preset configuration.
 *
 * @param preset - The preset name
 * @returns Human-readable description of the preset
 */
export function getPresetDescription(
  preset: 'default' | 'conservative' | 'relaxed'
): string {
  switch (preset) {
    case 'default':
      return 'Standard thresholds suitable for most industrial applications. ' +
        'Low: 1-20, Medium: 21-60, High: 61-125.';
    case 'conservative':
      return 'Lower thresholds for high-consequence industries (nuclear, aerospace, pharmaceutical). ' +
        'More items classified as higher risk. Low: 1-10, Medium: 11-40, High: 41-125.';
    case 'relaxed':
      return 'Higher thresholds for lower-consequence environments with established safeguards. ' +
        'Fewer items classified as higher risk. Low: 1-30, Medium: 31-80, High: 81-125.';
    default:
      throw new Error(`Unknown preset: ${preset}`);
  }
}

/**
 * Get the risk levels in order from lowest to highest.
 *
 * @returns Array of risk levels in ascending order
 */
export function getRiskLevelOrder(): RiskLevel[] {
  return [...RISK_LEVEL_ORDER];
}
