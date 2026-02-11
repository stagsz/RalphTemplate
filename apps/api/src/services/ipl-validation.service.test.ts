/**
 * Unit tests for ipl-validation.service.ts
 *
 * Tests the IPL (Independent Protection Layer) validation functions including:
 * - Structure validation (required fields)
 * - PFD validation (range and type-specific limits)
 * - Independence validation
 * - SIL requirements for Safety Instrumented Functions
 * - Human intervention requirements
 * - BPCS requirements
 * - Collection validation and common cause detection
 */

import { describe, it, expect } from '@jest/globals';
import type { IPL, IPLType, SafetyIntegrityLevel } from '@hazop/types';
import {
  validateIPLStructure,
  validateIPLPFD,
  validateIPLIndependence,
  validateSIFRequirements,
  validateHumanInterventionRequirements,
  validateBPCSRequirements,
  validateIPLComprehensive,
  detectCommonCauseFailures,
  calculateCreditableRRF,
  validateIPLCollection,
  getSuggestedPFD,
  getIPLCreditingGuidance,
  requiresSIL,
  toSimpleValidationResult,
  formatValidationSummary,
  MIN_HUMAN_RESPONSE_TIME_MINUTES,
  IPL_MAX_CREDITABLE_PFD,
  IPL_MIN_CREDITABLE_PFD,
  type HumanInterventionRequirements,
  type IPLValidationDetailedResult,
} from './ipl-validation.service.js';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a valid base IPL for testing.
 */
function createValidIPL(overrides: Partial<IPL> = {}): IPL {
  return {
    id: 'test-ipl-1',
    type: 'safety_instrumented_function',
    name: 'LAHH-101',
    description: 'High-high level alarm with shutdown',
    pfd: 0.01,
    independentOfInitiator: true,
    independentOfOtherIPLs: true,
    sil: 2,
    ...overrides,
  };
}

/**
 * Count errors in validation result.
 */
function countErrors(result: IPLValidationDetailedResult): number {
  return result.issues.filter((i) => i.severity === 'error').length;
}

/**
 * Count warnings in validation result.
 */
function countWarnings(result: IPLValidationDetailedResult): number {
  return result.issues.filter((i) => i.severity === 'warning').length;
}

// =============================================================================
// Structure Validation Tests
// =============================================================================

describe('IPL Validation Service', () => {
  describe('validateIPLStructure', () => {
    it('should pass for valid IPL structure', () => {
      const ipl = createValidIPL();
      const errors = validateIPLStructure(ipl);
      expect(errors).toHaveLength(0);
    });

    it('should return error for missing id', () => {
      const ipl = createValidIPL({ id: '' });
      const errors = validateIPLStructure(ipl);
      expect(errors.some((e) => e.code === 'MISSING_ID')).toBe(true);
    });

    it('should return error for missing name', () => {
      const ipl = createValidIPL({ name: '' });
      const errors = validateIPLStructure(ipl);
      expect(errors.some((e) => e.code === 'MISSING_NAME')).toBe(true);
    });

    it('should return error for invalid type', () => {
      const ipl = createValidIPL({ type: 'invalid_type' as IPLType });
      const errors = validateIPLStructure(ipl);
      expect(errors.some((e) => e.code === 'INVALID_TYPE')).toBe(true);
    });

    it('should return error for missing description', () => {
      const ipl = createValidIPL();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ipl as any).description = undefined;
      const errors = validateIPLStructure(ipl);
      expect(errors.some((e) => e.code === 'MISSING_DESCRIPTION')).toBe(true);
    });

    it('should return error for missing PFD', () => {
      const ipl = createValidIPL();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ipl as any).pfd = undefined;
      const errors = validateIPLStructure(ipl);
      expect(errors.some((e) => e.code === 'MISSING_PFD')).toBe(true);
    });

    it('should return error for NaN PFD', () => {
      const ipl = createValidIPL({ pfd: NaN });
      const errors = validateIPLStructure(ipl);
      expect(errors.some((e) => e.code === 'MISSING_PFD')).toBe(true);
    });

    it('should return error for missing independentOfInitiator', () => {
      const ipl = createValidIPL();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ipl as any).independentOfInitiator = undefined;
      const errors = validateIPLStructure(ipl);
      expect(errors.some((e) => e.code === 'MISSING_INDEPENDENCE_INITIATOR')).toBe(true);
    });

    it('should return error for missing independentOfOtherIPLs', () => {
      const ipl = createValidIPL();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ipl as any).independentOfOtherIPLs = undefined;
      const errors = validateIPLStructure(ipl);
      expect(errors.some((e) => e.code === 'MISSING_INDEPENDENCE_OTHER')).toBe(true);
    });
  });

  // ===========================================================================
  // PFD Validation Tests
  // ===========================================================================

  describe('validateIPLPFD', () => {
    it('should pass for valid PFD within range', () => {
      const ipl = createValidIPL({ pfd: 0.01 });
      const errors = validateIPLPFD(ipl);
      const errorIssues = errors.filter((e) => e.severity === 'error');
      expect(errorIssues).toHaveLength(0);
    });

    it('should error for PFD below minimum creditable', () => {
      const ipl = createValidIPL({ pfd: 1e-6 }); // Below MIN_CREDITABLE_PFD
      const errors = validateIPLPFD(ipl);
      expect(errors.some((e) => e.code === 'PFD_OUT_OF_RANGE')).toBe(true);
    });

    it('should error for PFD above maximum creditable', () => {
      const ipl = createValidIPL({ pfd: 1.5 }); // Above MAX_CREDITABLE_PFD
      const errors = validateIPLPFD(ipl);
      expect(errors.some((e) => e.code === 'PFD_OUT_OF_RANGE')).toBe(true);
    });

    it('should warn for PFD below type-specific minimum', () => {
      // BPCS with PFD below 0.01 (typical min for BPCS)
      const ipl = createValidIPL({ type: 'basic_process_control', pfd: 0.001 });
      const errors = validateIPLPFD(ipl);
      expect(errors.some((e) => e.code === 'PFD_BELOW_TYPICAL')).toBe(true);
    });

    it('should warn for PFD above type-specific maximum', () => {
      // BPCS with PFD above 0.1 (max for BPCS)
      const ipl = createValidIPL({ type: 'basic_process_control', pfd: 0.2 });
      const errors = validateIPLPFD(ipl);
      expect(errors.some((e) => e.code === 'PFD_ABOVE_TYPICAL')).toBe(true);
    });

    it('should warn for PFD significantly different from typical', () => {
      // Relief device with PFD 100x higher than typical
      const ipl = createValidIPL({ type: 'relief_device', pfd: 0.5 }); // Typical is 0.01
      const errors = validateIPLPFD(ipl);
      expect(errors.some((e) => e.code === 'PFD_ATYPICAL')).toBe(true);
    });
  });

  // ===========================================================================
  // Independence Validation Tests
  // ===========================================================================

  describe('validateIPLIndependence', () => {
    it('should pass for fully independent IPL', () => {
      const ipl = createValidIPL({
        independentOfInitiator: true,
        independentOfOtherIPLs: true,
      });
      const errors = validateIPLIndependence(ipl);
      expect(errors).toHaveLength(0);
    });

    it('should error when not independent of initiator', () => {
      const ipl = createValidIPL({ independentOfInitiator: false });
      const errors = validateIPLIndependence(ipl);
      expect(errors.some((e) => e.code === 'NOT_INDEPENDENT_OF_INITIATOR')).toBe(true);
      expect(errors.some((e) => e.severity === 'error')).toBe(true);
    });

    it('should warn when not independent of other IPLs', () => {
      const ipl = createValidIPL({ independentOfOtherIPLs: false });
      const errors = validateIPLIndependence(ipl);
      expect(errors.some((e) => e.code === 'POTENTIAL_COMMON_CAUSE')).toBe(true);
      expect(errors.some((e) => e.severity === 'warning')).toBe(true);
    });
  });

  // ===========================================================================
  // SIF Requirements Tests
  // ===========================================================================

  describe('validateSIFRequirements', () => {
    it('should not apply to non-SIF IPLs', () => {
      const ipl = createValidIPL({ type: 'relief_device' });
      const errors = validateSIFRequirements(ipl);
      expect(errors).toHaveLength(0);
    });

    it('should error when SIF has no SIL rating', () => {
      const ipl = createValidIPL({ type: 'safety_instrumented_function', sil: undefined });
      const errors = validateSIFRequirements(ipl);
      expect(errors.some((e) => e.code === 'SIF_MISSING_SIL')).toBe(true);
    });

    it('should error for invalid SIL rating', () => {
      const ipl = createValidIPL({
        type: 'safety_instrumented_function',
        sil: 5 as SafetyIntegrityLevel,
      });
      const errors = validateSIFRequirements(ipl);
      expect(errors.some((e) => e.code === 'INVALID_SIL')).toBe(true);
    });

    it('should warn when PFD is better than SIL allows', () => {
      // SIL 2 range is 0.001 to 0.01, PFD 0.0001 is better
      const ipl = createValidIPL({
        type: 'safety_instrumented_function',
        sil: 2,
        pfd: 0.0001,
      });
      const errors = validateSIFRequirements(ipl);
      expect(errors.some((e) => e.code === 'PFD_BETTER_THAN_SIL')).toBe(true);
    });

    it('should error when PFD exceeds SIL maximum', () => {
      // SIL 2 range is 0.001 to 0.01, PFD 0.05 exceeds max
      const ipl = createValidIPL({
        type: 'safety_instrumented_function',
        sil: 2,
        pfd: 0.05,
      });
      const errors = validateSIFRequirements(ipl);
      expect(errors.some((e) => e.code === 'PFD_EXCEEDS_SIL')).toBe(true);
    });

    it('should pass for valid SIF with matching SIL', () => {
      const ipl = createValidIPL({
        type: 'safety_instrumented_function',
        sil: 2,
        pfd: 0.01, // Within SIL 2 range
      });
      const errors = validateSIFRequirements(ipl);
      const errorIssues = errors.filter((e) => e.severity === 'error');
      expect(errorIssues).toHaveLength(0);
    });

    it('should warn for SIL 4', () => {
      const ipl = createValidIPL({
        type: 'safety_instrumented_function',
        sil: 4,
        pfd: 0.0001,
      });
      const errors = validateSIFRequirements(ipl);
      expect(errors.some((e) => e.code === 'SIL4_REQUIRES_JUSTIFICATION')).toBe(true);
    });
  });

  // ===========================================================================
  // Human Intervention Requirements Tests
  // ===========================================================================

  describe('validateHumanInterventionRequirements', () => {
    it('should not apply to non-human intervention IPLs', () => {
      const ipl = createValidIPL({ type: 'relief_device' });
      const errors = validateHumanInterventionRequirements(ipl);
      expect(errors).toHaveLength(0);
    });

    it('should warn for human intervention with PFD below 0.1', () => {
      const ipl = createValidIPL({
        type: 'human_intervention',
        pfd: 0.05,
      });
      const errors = validateHumanInterventionRequirements(ipl);
      expect(errors.some((e) => e.code === 'HUMAN_IPL_REQUIRES_JUSTIFICATION')).toBe(true);
    });

    it('should error for insufficient response time', () => {
      const ipl = createValidIPL({
        type: 'human_intervention',
        pfd: 0.1,
      });
      const requirements: Partial<HumanInterventionRequirements> = {
        minResponseTime: 5, // Less than MIN_HUMAN_RESPONSE_TIME_MINUTES
      };
      const errors = validateHumanInterventionRequirements(ipl, requirements);
      expect(errors.some((e) => e.code === 'INSUFFICIENT_RESPONSE_TIME')).toBe(true);
    });

    it('should error when no independent alarm', () => {
      const ipl = createValidIPL({
        type: 'human_intervention',
        pfd: 0.1,
      });
      const requirements: Partial<HumanInterventionRequirements> = {
        independentAlarm: false,
      };
      const errors = validateHumanInterventionRequirements(ipl, requirements);
      expect(errors.some((e) => e.code === 'NO_INDEPENDENT_ALARM')).toBe(true);
    });

    it('should warn when no written procedure', () => {
      const ipl = createValidIPL({
        type: 'human_intervention',
        pfd: 0.1,
      });
      const requirements: Partial<HumanInterventionRequirements> = {
        writtenProcedure: false,
      };
      const errors = validateHumanInterventionRequirements(ipl, requirements);
      expect(errors.some((e) => e.code === 'NO_WRITTEN_PROCEDURE')).toBe(true);
    });

    it('should warn when operators not trained', () => {
      const ipl = createValidIPL({
        type: 'human_intervention',
        pfd: 0.1,
      });
      const requirements: Partial<HumanInterventionRequirements> = {
        operatorTrained: false,
      };
      const errors = validateHumanInterventionRequirements(ipl, requirements);
      expect(errors.some((e) => e.code === 'OPERATORS_NOT_TRAINED')).toBe(true);
    });

    it('should pass with adequate response time', () => {
      const ipl = createValidIPL({
        type: 'human_intervention',
        pfd: 0.1,
      });
      const requirements: Partial<HumanInterventionRequirements> = {
        minResponseTime: 20, // Greater than MIN_HUMAN_RESPONSE_TIME_MINUTES
        independentAlarm: true,
        writtenProcedure: true,
        operatorTrained: true,
      };
      const errors = validateHumanInterventionRequirements(ipl, requirements);
      const errorIssues = errors.filter((e) => e.severity === 'error');
      expect(errorIssues).toHaveLength(0);
    });
  });

  // ===========================================================================
  // BPCS Requirements Tests
  // ===========================================================================

  describe('validateBPCSRequirements', () => {
    it('should not apply to non-BPCS IPLs', () => {
      const ipl = createValidIPL({ type: 'relief_device' });
      const errors = validateBPCSRequirements(ipl);
      expect(errors).toHaveLength(0);
    });

    it('should warn for BPCS with PFD below 0.1', () => {
      const ipl = createValidIPL({
        type: 'basic_process_control',
        pfd: 0.05,
      });
      const errors = validateBPCSRequirements(ipl);
      expect(errors.some((e) => e.code === 'BPCS_PFD_TOO_LOW')).toBe(true);
    });

    it('should add independence check warning for BPCS', () => {
      const ipl = createValidIPL({
        type: 'basic_process_control',
        pfd: 0.1,
      });
      const errors = validateBPCSRequirements(ipl);
      expect(errors.some((e) => e.code === 'BPCS_INDEPENDENCE_CHECK')).toBe(true);
    });
  });

  // ===========================================================================
  // Comprehensive Validation Tests
  // ===========================================================================

  describe('validateIPLComprehensive', () => {
    it('should return valid and creditable for fully valid IPL', () => {
      const ipl = createValidIPL();
      const result = validateIPLComprehensive(ipl);
      expect(result.valid).toBe(true);
      expect(result.creditable).toBe(true);
      expect(countErrors(result)).toBe(0);
    });

    it('should return not valid and not creditable for IPL with errors', () => {
      const ipl = createValidIPL({ independentOfInitiator: false });
      const result = validateIPLComprehensive(ipl);
      expect(result.valid).toBe(false);
      expect(result.creditable).toBe(false);
      expect(countErrors(result)).toBeGreaterThan(0);
    });

    it('should return valid but with warnings for marginal IPL', () => {
      const ipl = createValidIPL({
        type: 'human_intervention',
        pfd: 0.05, // Below typical min
      });
      const result = validateIPLComprehensive(ipl);
      expect(result.valid).toBe(true);
      expect(countWarnings(result)).toBeGreaterThan(0);
    });

    it('should provide appropriate summary for valid IPL', () => {
      const ipl = createValidIPL();
      const result = validateIPLComprehensive(ipl);
      expect(result.summary).toContain('passes all validation');
    });

    it('should provide appropriate summary for IPL with warnings', () => {
      const ipl = createValidIPL({
        type: 'basic_process_control',
        pfd: 0.1,
      });
      const result = validateIPLComprehensive(ipl);
      // BPCS always has independence check warning
      expect(result.summary).toContain('warning');
    });

    it('should provide appropriate summary for IPL with errors', () => {
      const ipl = createValidIPL({ independentOfInitiator: false });
      const result = validateIPLComprehensive(ipl);
      expect(result.summary).toContain('error');
    });
  });

  // ===========================================================================
  // Common Cause Detection Tests
  // ===========================================================================

  describe('detectCommonCauseFailures', () => {
    it('should return empty array for single IPL', () => {
      const ipls = [createValidIPL()];
      const warnings = detectCommonCauseFailures(ipls);
      expect(warnings).toHaveLength(0);
    });

    it('should warn for multiple IPLs of same type', () => {
      const ipls = [
        createValidIPL({ id: '1', type: 'relief_device' }),
        createValidIPL({ id: '2', type: 'relief_device' }),
      ];
      const warnings = detectCommonCauseFailures(ipls);
      expect(warnings.some((w) => w.includes('relief_device'))).toBe(true);
    });

    it('should warn for multiple human interventions', () => {
      const ipls = [
        createValidIPL({ id: '1', type: 'human_intervention', pfd: 0.1 }),
        createValidIPL({ id: '2', type: 'human_intervention', pfd: 0.1 }),
      ];
      const warnings = detectCommonCauseFailures(ipls);
      expect(warnings.some((w) => w.includes('human intervention'))).toBe(true);
    });

    it('should warn when both BPCS and SIF are present', () => {
      const ipls = [
        createValidIPL({ id: '1', type: 'basic_process_control', pfd: 0.1 }),
        createValidIPL({ id: '2', type: 'safety_instrumented_function', sil: 2, pfd: 0.01 }),
      ];
      const warnings = detectCommonCauseFailures(ipls);
      expect(warnings.some((w) => w.includes('BPCS') && w.includes('SIF'))).toBe(true);
    });

    it('should warn for IPLs marked not independent of others', () => {
      const ipls = [
        createValidIPL({ id: '1', independentOfOtherIPLs: false }),
        createValidIPL({ id: '2' }),
      ];
      const warnings = detectCommonCauseFailures(ipls);
      expect(warnings.some((w) => w.includes('not fully independent'))).toBe(true);
    });
  });

  // ===========================================================================
  // Creditable RRF Calculation Tests
  // ===========================================================================

  describe('calculateCreditableRRF', () => {
    it('should calculate RRF for all creditable IPLs', () => {
      const ipls = [
        createValidIPL({ id: '1', pfd: 0.01 }), // RRF = 100
        createValidIPL({ id: '2', pfd: 0.1 }), // RRF = 10
      ];
      const results = new Map<string, IPLValidationDetailedResult>();
      results.set('1', { valid: true, creditable: true, issues: [], summary: '' });
      results.set('2', { valid: true, creditable: true, issues: [], summary: '' });

      const rrf = calculateCreditableRRF(ipls, results);
      // Combined PFD = 0.01 * 0.1 = 0.001, RRF = 1000
      expect(rrf).toBe(1000);
    });

    it('should exclude non-creditable IPLs from calculation', () => {
      const ipls = [
        createValidIPL({ id: '1', pfd: 0.01 }), // RRF = 100
        createValidIPL({ id: '2', pfd: 0.1, independentOfInitiator: false }), // Not creditable
      ];
      const results = new Map<string, IPLValidationDetailedResult>();
      results.set('1', { valid: true, creditable: true, issues: [], summary: '' });
      results.set('2', { valid: false, creditable: false, issues: [], summary: '' });

      const rrf = calculateCreditableRRF(ipls, results);
      // Only first IPL counts, RRF = 100
      expect(rrf).toBe(100);
    });

    it('should return 1 when no IPLs are creditable', () => {
      const ipls = [createValidIPL({ id: '1', pfd: 0.01, independentOfInitiator: false })];
      const results = new Map<string, IPLValidationDetailedResult>();
      results.set('1', { valid: false, creditable: false, issues: [], summary: '' });

      const rrf = calculateCreditableRRF(ipls, results);
      expect(rrf).toBe(1);
    });
  });

  // ===========================================================================
  // Collection Validation Tests
  // ===========================================================================

  describe('validateIPLCollection', () => {
    it('should validate all IPLs in collection', () => {
      const ipls = [
        createValidIPL({ id: '1' }),
        createValidIPL({ id: '2', type: 'relief_device', pfd: 0.01 }),
      ];
      const result = validateIPLCollection(ipls);

      expect(result.results.size).toBe(2);
      expect(result.results.has('1')).toBe(true);
      expect(result.results.has('2')).toBe(true);
    });

    it('should correctly identify non-creditable IPLs', () => {
      const ipls = [
        createValidIPL({ id: '1' }),
        createValidIPL({ id: '2', independentOfInitiator: false }),
      ];
      const result = validateIPLCollection(ipls);

      expect(result.nonCreditableIPLs).toContain('2');
      expect(result.nonCreditableIPLs).not.toContain('1');
    });

    it('should include common cause warnings', () => {
      const ipls = [
        createValidIPL({ id: '1', type: 'relief_device', pfd: 0.01 }),
        createValidIPL({ id: '2', type: 'relief_device', pfd: 0.01 }),
      ];
      const result = validateIPLCollection(ipls);

      expect(result.commonCauseWarnings.length).toBeGreaterThan(0);
    });

    it('should calculate total creditable RRF', () => {
      const ipls = [
        createValidIPL({ id: '1', pfd: 0.01 }), // RRF = 100
        createValidIPL({ id: '2', type: 'relief_device', pfd: 0.01 }), // RRF = 100
      ];
      const result = validateIPLCollection(ipls);

      // Combined RRF = 100 * 100 = 10000
      expect(result.totalCreditableRRF).toBe(10000);
    });

    it('should indicate allCreditable correctly', () => {
      const ipls = [
        createValidIPL({ id: '1' }),
        createValidIPL({ id: '2', type: 'relief_device', pfd: 0.01 }),
      ];
      const result = validateIPLCollection(ipls);

      expect(result.allCreditable).toBe(true);
    });

    it('should indicate not allCreditable when some fail', () => {
      const ipls = [
        createValidIPL({ id: '1' }),
        createValidIPL({ id: '2', independentOfInitiator: false }),
      ];
      const result = validateIPLCollection(ipls);

      expect(result.allCreditable).toBe(false);
    });
  });

  // ===========================================================================
  // Utility Function Tests
  // ===========================================================================

  describe('getSuggestedPFD', () => {
    it('should return typical PFD for non-SIF types', () => {
      expect(getSuggestedPFD('relief_device')).toBe(0.01);
      expect(getSuggestedPFD('basic_process_control')).toBe(0.1);
      expect(getSuggestedPFD('human_intervention')).toBe(0.1);
    });

    it('should return SIL-based PFD for SIF with SIL', () => {
      expect(getSuggestedPFD('safety_instrumented_function', 1)).toBe(0.1); // SIL 1 max
      expect(getSuggestedPFD('safety_instrumented_function', 2)).toBe(0.01); // SIL 2 max
      expect(getSuggestedPFD('safety_instrumented_function', 3)).toBe(0.001); // SIL 3 max
    });

    it('should return typical PFD for SIF without SIL', () => {
      expect(getSuggestedPFD('safety_instrumented_function')).toBe(0.01);
    });
  });

  describe('getIPLCreditingGuidance', () => {
    it('should return guidance for each IPL type', () => {
      expect(getIPLCreditingGuidance('safety_instrumented_function')).toContain('IEC 61511');
      expect(getIPLCreditingGuidance('basic_process_control')).toContain('0.1');
      expect(getIPLCreditingGuidance('relief_device')).toContain('PSV');
      expect(getIPLCreditingGuidance('human_intervention')).toContain('Independent alarm');
    });
  });

  describe('requiresSIL', () => {
    it('should return true for safety instrumented function', () => {
      expect(requiresSIL('safety_instrumented_function')).toBe(true);
    });

    it('should return false for other types', () => {
      expect(requiresSIL('relief_device')).toBe(false);
      expect(requiresSIL('basic_process_control')).toBe(false);
      expect(requiresSIL('human_intervention')).toBe(false);
    });
  });

  describe('toSimpleValidationResult', () => {
    it('should convert detailed result to simple result', () => {
      const detailed: IPLValidationDetailedResult = {
        valid: false,
        creditable: false,
        issues: [
          { field: 'pfd', message: 'Error 1', severity: 'error', code: 'E1' },
          { field: 'sil', message: 'Warning 1', severity: 'warning', code: 'W1' },
          { field: 'name', message: 'Error 2', severity: 'error', code: 'E2' },
        ],
        summary: 'Test',
      };
      const simple = toSimpleValidationResult(detailed);

      expect(simple.valid).toBe(false);
      expect(simple.errors).toHaveLength(2); // Only errors, not warnings
      expect(simple.errors).toContain('Error 1');
      expect(simple.errors).toContain('Error 2');
    });
  });

  describe('formatValidationSummary', () => {
    it('should format summary for all creditable', () => {
      const result = validateIPLCollection([
        createValidIPL({ id: '1' }),
        createValidIPL({ id: '2', type: 'relief_device', pfd: 0.01 }),
      ]);
      const summary = formatValidationSummary(result);

      expect(summary).toContain('All 2 IPL(s) are creditable');
    });

    it('should format summary for some non-creditable', () => {
      const result = validateIPLCollection([
        createValidIPL({ id: '1' }),
        createValidIPL({ id: '2', independentOfInitiator: false }),
      ]);
      const summary = formatValidationSummary(result);

      expect(summary).toContain('1 of 2 IPL(s) cannot be credited');
    });

    it('should include RRF in summary', () => {
      const result = validateIPLCollection([createValidIPL({ id: '1', pfd: 0.01 })]);
      const summary = formatValidationSummary(result);

      expect(summary).toContain('RRF');
    });
  });

  // ===========================================================================
  // Constants Tests
  // ===========================================================================

  describe('Constants', () => {
    it('should have MIN_HUMAN_RESPONSE_TIME_MINUTES defined', () => {
      expect(MIN_HUMAN_RESPONSE_TIME_MINUTES).toBeGreaterThan(0);
      expect(MIN_HUMAN_RESPONSE_TIME_MINUTES).toBe(10);
    });

    it('should have IPL_MAX_CREDITABLE_PFD for all types', () => {
      expect(IPL_MAX_CREDITABLE_PFD.safety_instrumented_function).toBeDefined();
      expect(IPL_MAX_CREDITABLE_PFD.basic_process_control).toBeDefined();
      expect(IPL_MAX_CREDITABLE_PFD.relief_device).toBeDefined();
      expect(IPL_MAX_CREDITABLE_PFD.human_intervention).toBeDefined();
    });

    it('should have IPL_MIN_CREDITABLE_PFD for all types', () => {
      expect(IPL_MIN_CREDITABLE_PFD.safety_instrumented_function).toBeDefined();
      expect(IPL_MIN_CREDITABLE_PFD.basic_process_control).toBeDefined();
      expect(IPL_MIN_CREDITABLE_PFD.relief_device).toBeDefined();
      expect(IPL_MIN_CREDITABLE_PFD.human_intervention).toBeDefined();
    });

    it('should have min PFD less than max PFD for each type', () => {
      const types: IPLType[] = [
        'safety_instrumented_function',
        'basic_process_control',
        'relief_device',
        'physical_containment',
        'mechanical',
        'human_intervention',
        'emergency_response',
        'other',
      ];

      for (const type of types) {
        expect(IPL_MIN_CREDITABLE_PFD[type]).toBeLessThanOrEqual(IPL_MAX_CREDITABLE_PFD[type]);
      }
    });
  });
});
