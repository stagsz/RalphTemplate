/**
 * IPL (Independent Protection Layer) Validation Service.
 *
 * Provides comprehensive validation for Independent Protection Layers
 * used in LOPA (Layers of Protection Analysis). Ensures IPLs meet
 * industry standards and credibility criteria.
 *
 * IPL Credibility Criteria (per CCPS Guidelines):
 * 1. Specificity - Designed to prevent or mitigate a specific consequence
 * 2. Independence - Independent of initiating event and other IPLs
 * 3. Dependability - Can be counted on to perform its intended function
 * 4. Auditability - Subject to periodic validation/testing
 *
 * Reference Standards:
 * - IEC 61511: Functional safety for process industries
 * - CCPS Guidelines for Initiating Events and Independent Protection Layers
 * - ISA 84.00.01: Application of Safety Instrumented Systems
 */

import {
  type IPL,
  type IPLType,
  type SafetyIntegrityLevel,
  type LOPAValidationResult,
  IPL_TYPES,
  SIL_PFD_RANGES,
  IPL_TYPICAL_PFD,
} from '@hazop/types';

import {
  isValidPFD,
  isValidIPLType,
  isValidSIL,
  MIN_CREDITABLE_PFD,
  MAX_CREDITABLE_PFD,
} from './lopa-calculation.service.js';

// ============================================================================
// IPL Validation Constants
// ============================================================================

/**
 * Minimum response time (in minutes) for human intervention to be creditable.
 * Per CCPS guidelines, operators need at least 10-20 minutes to respond.
 */
export const MIN_HUMAN_RESPONSE_TIME_MINUTES = 10;

/**
 * Maximum PFD values that can be claimed for different IPL types.
 * These represent the highest (worst) PFD that can reasonably be credited.
 */
export const IPL_MAX_CREDITABLE_PFD: Record<IPLType, number> = {
  safety_instrumented_function: 0.1, // SIL 1 max
  basic_process_control: 0.1, // BPCS rarely credited below 0.1
  relief_device: 0.1, // Poorly maintained or marginal sizing
  physical_containment: 0.1, // Basic containment without full capacity
  mechanical: 0.1, // Check valve in challenging service
  human_intervention: 0.1, // Best case with ideal conditions
  emergency_response: 0.1, // On-site response team
  other: 0.1, // Conservative default
};

/**
 * Minimum PFD values for different IPL types (best case realistic lower bounds).
 * These represent the lowest (best) PFD that can realistically be claimed.
 */
export const IPL_MIN_CREDITABLE_PFD: Record<IPLType, number> = {
  safety_instrumented_function: 0.00001, // SIL 4 with full lifecycle management
  basic_process_control: 0.01, // BPCS with redundancy
  relief_device: 0.001, // Well-maintained, properly sized PSV
  physical_containment: 0.001, // Fully engineered containment
  mechanical: 0.001, // Check valve in clean service with redundancy
  human_intervention: 0.01, // Exceptional cases only
  emergency_response: 0.01, // Highly trained on-site team
  other: 0.01, // Conservative default
};

/**
 * IPL types that require specific additional validation.
 */
export const IPL_TYPES_REQUIRING_SIL: IPLType[] = ['safety_instrumented_function'];

/**
 * IPL types that have special crediting constraints.
 */
export const IPL_TYPES_WITH_CONSTRAINTS: IPLType[] = [
  'human_intervention',
  'basic_process_control',
  'emergency_response',
];

/**
 * Common equipment/system categories that may share failure modes.
 * Used for detecting potential common cause failures.
 */
export const COMMON_CAUSE_CATEGORIES = [
  'power_supply',
  'instrument_air',
  'cooling_water',
  'control_system',
  'operator_action',
  'maintenance',
  'environmental',
] as const;

export type CommonCauseCategory = (typeof COMMON_CAUSE_CATEGORIES)[number];

// ============================================================================
// IPL Validation Types
// ============================================================================

/**
 * Detailed validation error with context for IPL validation.
 */
export interface IPLValidationError {
  /** Field or aspect that failed validation */
  field: string;
  /** Error message describing the issue */
  message: string;
  /** Error severity: error prevents credit, warning requires review */
  severity: 'error' | 'warning';
  /** Error code for programmatic handling */
  code: string;
}

/**
 * Extended validation result with detailed error information.
 */
export interface IPLValidationDetailedResult {
  /** Whether the IPL passes all validation checks */
  valid: boolean;
  /** Whether the IPL can be credited in LOPA (no errors, warnings OK) */
  creditable: boolean;
  /** Array of validation errors and warnings */
  issues: IPLValidationError[];
  /** Summary of validation status */
  summary: string;
}

/**
 * Result of validating multiple IPLs together.
 */
export interface IPLCollectionValidationResult {
  /** Overall validation result */
  valid: boolean;
  /** Whether all IPLs can be credited */
  allCreditable: boolean;
  /** Individual IPL validation results by ID */
  results: Map<string, IPLValidationDetailedResult>;
  /** Common cause failure warnings */
  commonCauseWarnings: string[];
  /** Total credited risk reduction factor */
  totalCreditableRRF: number;
  /** IPL IDs that cannot be credited */
  nonCreditableIPLs: string[];
}

/**
 * Human intervention crediting requirements.
 */
export interface HumanInterventionRequirements {
  /** Minimum time available for operator response (minutes) */
  minResponseTime: number;
  /** Whether alarm is independent of the initiating event */
  independentAlarm: boolean;
  /** Whether written procedure exists */
  writtenProcedure: boolean;
  /** Whether operators are trained on the response */
  operatorTrained: boolean;
  /** Whether response has been practiced/drilled */
  responsePracticed: boolean;
}

// ============================================================================
// Single IPL Validation Functions
// ============================================================================

/**
 * Validate an IPL's basic structure and required fields.
 *
 * @param ipl - The IPL to validate
 * @returns Array of validation errors for structural issues
 */
export function validateIPLStructure(ipl: Partial<IPL>): IPLValidationError[] {
  const errors: IPLValidationError[] = [];

  // Required fields
  if (!ipl.id || typeof ipl.id !== 'string' || ipl.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'IPL must have a valid identifier',
      severity: 'error',
      code: 'MISSING_ID',
    });
  }

  if (!ipl.name || typeof ipl.name !== 'string' || ipl.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'IPL must have a name',
      severity: 'error',
      code: 'MISSING_NAME',
    });
  }

  if (!ipl.type || !isValidIPLType(ipl.type)) {
    errors.push({
      field: 'type',
      message: `Invalid IPL type. Must be one of: ${IPL_TYPES.join(', ')}`,
      severity: 'error',
      code: 'INVALID_TYPE',
    });
  }

  if (!ipl.description || typeof ipl.description !== 'string') {
    errors.push({
      field: 'description',
      message: 'IPL must have a description',
      severity: 'error',
      code: 'MISSING_DESCRIPTION',
    });
  }

  if (typeof ipl.pfd !== 'number' || isNaN(ipl.pfd)) {
    errors.push({
      field: 'pfd',
      message: 'IPL must have a valid numeric PFD value',
      severity: 'error',
      code: 'MISSING_PFD',
    });
  }

  if (typeof ipl.independentOfInitiator !== 'boolean') {
    errors.push({
      field: 'independentOfInitiator',
      message: 'Independence of initiator must be specified (true/false)',
      severity: 'error',
      code: 'MISSING_INDEPENDENCE_INITIATOR',
    });
  }

  if (typeof ipl.independentOfOtherIPLs !== 'boolean') {
    errors.push({
      field: 'independentOfOtherIPLs',
      message: 'Independence of other IPLs must be specified (true/false)',
      severity: 'error',
      code: 'MISSING_INDEPENDENCE_OTHER',
    });
  }

  return errors;
}

/**
 * Validate IPL PFD value against creditable ranges.
 *
 * @param ipl - The IPL to validate
 * @returns Array of validation errors for PFD issues
 */
export function validateIPLPFD(ipl: IPL): IPLValidationError[] {
  const errors: IPLValidationError[] = [];

  // Basic PFD validation
  if (!isValidPFD(ipl.pfd)) {
    errors.push({
      field: 'pfd',
      message: `PFD value ${ipl.pfd} is outside creditable range (${MIN_CREDITABLE_PFD} to ${MAX_CREDITABLE_PFD})`,
      severity: 'error',
      code: 'PFD_OUT_OF_RANGE',
    });
    return errors;
  }

  // Type-specific PFD validation
  const maxPFD = IPL_MAX_CREDITABLE_PFD[ipl.type];
  const minPFD = IPL_MIN_CREDITABLE_PFD[ipl.type];

  if (ipl.pfd < minPFD) {
    errors.push({
      field: 'pfd',
      message: `PFD value ${ipl.pfd} is lower than typically creditable for ${ipl.type} (min: ${minPFD}). Requires detailed justification.`,
      severity: 'warning',
      code: 'PFD_BELOW_TYPICAL',
    });
  }

  if (ipl.pfd > maxPFD) {
    errors.push({
      field: 'pfd',
      message: `PFD value ${ipl.pfd} exceeds maximum creditable for ${ipl.type} (max: ${maxPFD})`,
      severity: 'warning',
      code: 'PFD_ABOVE_TYPICAL',
    });
  }

  // Warn if PFD differs significantly from typical value
  const typicalPFD = IPL_TYPICAL_PFD[ipl.type];
  const ratio = ipl.pfd / typicalPFD;
  if (ratio < 0.1 || ratio > 10) {
    errors.push({
      field: 'pfd',
      message: `PFD value ${ipl.pfd} differs significantly from typical value ${typicalPFD} for ${ipl.type}. Review and document justification.`,
      severity: 'warning',
      code: 'PFD_ATYPICAL',
    });
  }

  return errors;
}

/**
 * Validate IPL independence requirements.
 *
 * @param ipl - The IPL to validate
 * @returns Array of validation errors for independence issues
 */
export function validateIPLIndependence(ipl: IPL): IPLValidationError[] {
  const errors: IPLValidationError[] = [];

  if (ipl.independentOfInitiator === false) {
    errors.push({
      field: 'independentOfInitiator',
      message: 'IPL is not independent of the initiating event and cannot be credited in LOPA',
      severity: 'error',
      code: 'NOT_INDEPENDENT_OF_INITIATOR',
    });
  }

  if (ipl.independentOfOtherIPLs === false) {
    errors.push({
      field: 'independentOfOtherIPLs',
      message: 'IPL shares common cause with other IPLs. Review for potential common mode failures.',
      severity: 'warning',
      code: 'POTENTIAL_COMMON_CAUSE',
    });
  }

  return errors;
}

/**
 * Validate SIL-specific requirements for Safety Instrumented Functions.
 *
 * @param ipl - The IPL to validate
 * @returns Array of validation errors for SIL-related issues
 */
export function validateSIFRequirements(ipl: IPL): IPLValidationError[] {
  const errors: IPLValidationError[] = [];

  if (ipl.type !== 'safety_instrumented_function') {
    return errors; // Not applicable
  }

  // SIF must have a SIL rating
  if (ipl.sil === undefined || ipl.sil === null) {
    errors.push({
      field: 'sil',
      message: 'Safety Instrumented Function must have a SIL rating',
      severity: 'error',
      code: 'SIF_MISSING_SIL',
    });
    return errors;
  }

  if (!isValidSIL(ipl.sil)) {
    errors.push({
      field: 'sil',
      message: `Invalid SIL rating: ${ipl.sil}. Must be 1, 2, 3, or 4`,
      severity: 'error',
      code: 'INVALID_SIL',
    });
    return errors;
  }

  // Validate PFD is consistent with claimed SIL
  const silRange = SIL_PFD_RANGES[ipl.sil];
  if (ipl.pfd < silRange.min) {
    errors.push({
      field: 'pfd',
      message: `PFD ${ipl.pfd} is better than SIL ${ipl.sil} allows (min: ${silRange.min}). Either increase SIL rating or use conservative PFD.`,
      severity: 'warning',
      code: 'PFD_BETTER_THAN_SIL',
    });
  }

  if (ipl.pfd > silRange.max) {
    errors.push({
      field: 'pfd',
      message: `PFD ${ipl.pfd} exceeds SIL ${ipl.sil} maximum (${silRange.max}). SIF does not meet claimed SIL performance.`,
      severity: 'error',
      code: 'PFD_EXCEEDS_SIL',
    });
  }

  // SIL 4 requires special justification
  if (ipl.sil === 4) {
    errors.push({
      field: 'sil',
      message: 'SIL 4 is rarely used in process industry and requires extensive lifecycle management documentation',
      severity: 'warning',
      code: 'SIL4_REQUIRES_JUSTIFICATION',
    });
  }

  return errors;
}

/**
 * Validate requirements for human intervention IPLs.
 *
 * @param ipl - The IPL to validate
 * @param requirements - Optional human intervention requirements
 * @returns Array of validation errors for human intervention issues
 */
export function validateHumanInterventionRequirements(
  ipl: IPL,
  requirements?: Partial<HumanInterventionRequirements>
): IPLValidationError[] {
  const errors: IPLValidationError[] = [];

  if (ipl.type !== 'human_intervention') {
    return errors; // Not applicable
  }

  // Human intervention is generally limited in credit
  if (ipl.pfd < 0.1) {
    errors.push({
      field: 'pfd',
      message: `Human intervention IPL with PFD ${ipl.pfd} requires documented: independent alarm, written procedure, trained operators, and sufficient response time (>${MIN_HUMAN_RESPONSE_TIME_MINUTES} min)`,
      severity: 'warning',
      code: 'HUMAN_IPL_REQUIRES_JUSTIFICATION',
    });
  }

  if (requirements) {
    if (
      requirements.minResponseTime !== undefined &&
      requirements.minResponseTime < MIN_HUMAN_RESPONSE_TIME_MINUTES
    ) {
      errors.push({
        field: 'responseTime',
        message: `Response time ${requirements.minResponseTime} min is less than minimum ${MIN_HUMAN_RESPONSE_TIME_MINUTES} min required for human intervention credit`,
        severity: 'error',
        code: 'INSUFFICIENT_RESPONSE_TIME',
      });
    }

    if (requirements.independentAlarm === false) {
      errors.push({
        field: 'alarm',
        message: 'Human intervention requires an independent alarm to be creditable',
        severity: 'error',
        code: 'NO_INDEPENDENT_ALARM',
      });
    }

    if (requirements.writtenProcedure === false) {
      errors.push({
        field: 'procedure',
        message: 'Human intervention requires a written procedure to be creditable',
        severity: 'warning',
        code: 'NO_WRITTEN_PROCEDURE',
      });
    }

    if (requirements.operatorTrained === false) {
      errors.push({
        field: 'training',
        message: 'Human intervention requires trained operators to be creditable',
        severity: 'warning',
        code: 'OPERATORS_NOT_TRAINED',
      });
    }
  }

  return errors;
}

/**
 * Validate BPCS (Basic Process Control System) specific requirements.
 *
 * @param ipl - The IPL to validate
 * @returns Array of validation errors for BPCS issues
 */
export function validateBPCSRequirements(ipl: IPL): IPLValidationError[] {
  const errors: IPLValidationError[] = [];

  if (ipl.type !== 'basic_process_control') {
    return errors;
  }

  // BPCS typically cannot be credited below 0.1
  if (ipl.pfd < 0.1) {
    errors.push({
      field: 'pfd',
      message: `BPCS with PFD ${ipl.pfd} is below typical minimum (0.1). BPCS is not typically credited below 0.1 per IEC 61511.`,
      severity: 'warning',
      code: 'BPCS_PFD_TOO_LOW',
    });
  }

  // BPCS cannot be the same as the control system causing the initiating event
  errors.push({
    field: 'independence',
    message: 'Verify BPCS is not the same control loop that could cause the initiating event',
    severity: 'warning',
    code: 'BPCS_INDEPENDENCE_CHECK',
  });

  return errors;
}

/**
 * Perform comprehensive validation of a single IPL.
 *
 * @param ipl - The IPL to validate
 * @param humanRequirements - Optional requirements for human intervention IPLs
 * @returns Detailed validation result
 */
export function validateIPLComprehensive(
  ipl: IPL,
  humanRequirements?: Partial<HumanInterventionRequirements>
): IPLValidationDetailedResult {
  const allIssues: IPLValidationError[] = [];

  // Run all validation checks
  allIssues.push(...validateIPLStructure(ipl));

  // Only continue if structure is valid
  if (allIssues.filter((e) => e.severity === 'error').length === 0) {
    allIssues.push(...validateIPLPFD(ipl));
    allIssues.push(...validateIPLIndependence(ipl));
    allIssues.push(...validateSIFRequirements(ipl));
    allIssues.push(...validateHumanInterventionRequirements(ipl, humanRequirements));
    allIssues.push(...validateBPCSRequirements(ipl));
  }

  const errors = allIssues.filter((e) => e.severity === 'error');
  const warnings = allIssues.filter((e) => e.severity === 'warning');

  const valid = errors.length === 0;
  const creditable = valid; // Only creditable if no errors

  let summary: string;
  if (errors.length === 0 && warnings.length === 0) {
    summary = 'IPL passes all validation checks';
  } else if (errors.length === 0) {
    summary = `IPL is valid with ${warnings.length} warning(s) to review`;
  } else {
    summary = `IPL has ${errors.length} error(s) preventing credit`;
  }

  return {
    valid,
    creditable,
    issues: allIssues,
    summary,
  };
}

// ============================================================================
// Collection Validation Functions
// ============================================================================

/**
 * Detect potential common cause failures between IPLs.
 *
 * @param ipls - Array of IPLs to check
 * @returns Array of warning messages for potential common causes
 */
export function detectCommonCauseFailures(ipls: IPL[]): string[] {
  const warnings: string[] = [];

  // Check for multiple IPLs of the same type
  const typeCount = new Map<IPLType, number>();
  for (const ipl of ipls) {
    typeCount.set(ipl.type, (typeCount.get(ipl.type) || 0) + 1);
  }

  for (const [type, count] of typeCount.entries()) {
    if (count > 1) {
      warnings.push(
        `Multiple IPLs of type "${type}" (${count}) may share common cause failures. Verify independence.`
      );
    }
  }

  // Check for multiple human interventions
  const humanIPLs = ipls.filter((ipl) => ipl.type === 'human_intervention');
  if (humanIPLs.length > 1) {
    warnings.push(
      'Multiple human intervention IPLs credited. Verify different operators/actions and no common error modes.'
    );
  }

  // Check for BPCS and SIF potentially sharing common elements
  const hasBPCS = ipls.some((ipl) => ipl.type === 'basic_process_control');
  const hasSIF = ipls.some((ipl) => ipl.type === 'safety_instrumented_function');
  if (hasBPCS && hasSIF) {
    warnings.push(
      'Both BPCS and SIF are credited. Verify they do not share sensors, final elements, or power supplies.'
    );
  }

  // Check for any IPLs marked as not independent of others
  const dependentIPLs = ipls.filter((ipl) => ipl.independentOfOtherIPLs === false);
  if (dependentIPLs.length > 0) {
    warnings.push(
      `${dependentIPLs.length} IPL(s) marked as not fully independent of other IPLs. Common cause factors must be addressed.`
    );
  }

  return warnings;
}

/**
 * Calculate total creditable risk reduction factor from validated IPLs.
 *
 * @param ipls - Array of IPLs
 * @param validationResults - Map of validation results by IPL ID
 * @returns Total RRF from creditable IPLs only
 */
export function calculateCreditableRRF(
  ipls: IPL[],
  validationResults: Map<string, IPLValidationDetailedResult>
): number {
  let totalPFD = 1;

  for (const ipl of ipls) {
    const result = validationResults.get(ipl.id);
    if (result?.creditable) {
      totalPFD *= ipl.pfd;
    }
  }

  return totalPFD > 0 ? 1 / totalPFD : 1;
}

/**
 * Validate a collection of IPLs including common cause analysis.
 *
 * @param ipls - Array of IPLs to validate
 * @returns Collection validation result
 */
export function validateIPLCollection(ipls: IPL[]): IPLCollectionValidationResult {
  // Validate each IPL individually
  const results = new Map<string, IPLValidationDetailedResult>();
  const nonCreditableIPLs: string[] = [];

  for (const ipl of ipls) {
    const result = validateIPLComprehensive(ipl);
    results.set(ipl.id, result);
    if (!result.creditable) {
      nonCreditableIPLs.push(ipl.id);
    }
  }

  // Detect common cause failures
  const commonCauseWarnings = detectCommonCauseFailures(ipls);

  // Calculate creditable RRF
  const totalCreditableRRF = calculateCreditableRRF(ipls, results);

  // Determine overall validity
  const allValid = Array.from(results.values()).every((r) => r.valid);
  const allCreditable = nonCreditableIPLs.length === 0;

  return {
    valid: allValid,
    allCreditable,
    results,
    commonCauseWarnings,
    totalCreditableRRF,
    nonCreditableIPLs,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get suggested PFD value for an IPL type.
 *
 * @param type - IPL type
 * @param sil - Optional SIL rating for SIFs
 * @returns Suggested PFD value
 */
export function getSuggestedPFD(type: IPLType, sil?: SafetyIntegrityLevel): number {
  if (type === 'safety_instrumented_function' && sil && isValidSIL(sil)) {
    // Use the upper bound of SIL range (conservative)
    return SIL_PFD_RANGES[sil].max;
  }
  return IPL_TYPICAL_PFD[type];
}

/**
 * Get crediting guidance for an IPL type.
 *
 * @param type - IPL type
 * @returns Guidance text for crediting this IPL type
 */
export function getIPLCreditingGuidance(type: IPLType): string {
  const guidance: Record<IPLType, string> = {
    safety_instrumented_function:
      'SIF must be designed, implemented, and maintained per IEC 61511. PFD must match claimed SIL rating. Requires documented SIL verification.',
    basic_process_control:
      'BPCS typically credited at PFD 0.1 maximum. Cannot be credited if it is part of the initiating cause. Verify independence from SIF.',
    relief_device:
      'PSV must be properly sized for the scenario. Regular testing required. Credit depends on installation, maintenance, and set pressure.',
    physical_containment:
      'Dike/bund must be designed for full volume containment. Credit depends on integrity management and inspection program.',
    mechanical:
      'Check valves, excess flow valves, and restrictors must be appropriate for service. Regular testing required. May not be suitable for all fluids.',
    human_intervention:
      'Requires: (1) Independent alarm, (2) Written procedure, (3) Trained operators, (4) Minimum 10-20 minutes response time. Rarely credited below PFD 0.1.',
    emergency_response:
      'Typically credited for mitigation only, not prevention. Requires on-site response capability and regular drills.',
    other:
      'Non-standard IPLs require detailed justification including specificity, independence, dependability, and auditability documentation.',
  };

  return guidance[type];
}

/**
 * Determine if an IPL type requires SIL rating.
 *
 * @param type - IPL type
 * @returns Whether SIL rating is required
 */
export function requiresSIL(type: IPLType): boolean {
  return IPL_TYPES_REQUIRING_SIL.includes(type);
}

/**
 * Format validation result as a simple validation result for compatibility.
 *
 * @param result - Detailed validation result
 * @returns Simple validation result
 */
export function toSimpleValidationResult(
  result: IPLValidationDetailedResult
): LOPAValidationResult {
  return {
    valid: result.valid,
    errors: result.issues
      .filter((i) => i.severity === 'error')
      .map((i) => i.message),
  };
}

/**
 * Format collection validation as summary text.
 *
 * @param result - Collection validation result
 * @returns Summary text describing the validation outcome
 */
export function formatValidationSummary(result: IPLCollectionValidationResult): string {
  const lines: string[] = [];

  if (result.allCreditable) {
    lines.push(`All ${result.results.size} IPL(s) are creditable.`);
  } else {
    lines.push(
      `${result.nonCreditableIPLs.length} of ${result.results.size} IPL(s) cannot be credited.`
    );
  }

  lines.push(`Total creditable RRF: ${result.totalCreditableRRF.toLocaleString()}`);

  if (result.commonCauseWarnings.length > 0) {
    lines.push(`${result.commonCauseWarnings.length} common cause warning(s) to review.`);
  }

  return lines.join(' ');
}
