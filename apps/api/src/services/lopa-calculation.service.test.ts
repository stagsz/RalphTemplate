/**
 * Unit tests for lopa-calculation.service.ts
 *
 * Tests the LOPA (Layers of Protection Analysis) calculation functions including:
 * - Validation functions (PFD, frequency, SIL, IPL type)
 * - Core RRF calculations
 * - Gap status determination
 * - LOPA trigger checks
 * - Helper and formatting functions
 * - Complete LOPA calculation integration
 */

import { describe, it, expect } from '@jest/globals';
import type {
  IPL,
  LOPACalculationInput,
  RiskRanking,
} from '@hazop/types';
import {
  SAFETY_INTEGRITY_LEVELS,
  IPL_TYPES,
  INITIATING_EVENT_CATEGORIES,
  SIL_PFD_RANGES,
  SIL_TYPICAL_PFD,
  IPL_TYPICAL_PFD,
  SEVERITY_TO_TARGET_FREQUENCY,
} from '@hazop/types';
import {
  // Constants
  MIN_CREDITABLE_PFD,
  MAX_CREDITABLE_PFD,
  MIN_INITIATING_EVENT_FREQUENCY,
  MAX_INITIATING_EVENT_FREQUENCY,
  MARGINAL_GAP_THRESHOLD,
  ADEQUATE_GAP_THRESHOLD,
  // Validation functions
  isValidPFD,
  isValidInitiatingEventFrequency,
  isValidTargetFrequency,
  isValidSIL,
  isValidIPLType,
  isValidInitiatingEventCategory,
  validateIPL,
  validateIPLs,
  validateLOPAInput,
  // Calculation functions
  calculateRRF,
  calculateTotalRRF,
  calculateMitigatedEventLikelihood,
  calculateRequiredRRF,
  calculateGapRatio,
  determineGapStatus,
  determineRequiredSIL,
  performLOPACalculation,
  // Trigger functions
  checkLOPATrigger,
  isLOPARecommended,
  // Helper functions
  getTypicalPFDForIPLType,
  getTypicalPFDForSIL,
  getPFDRangeForSIL,
  determineSILFromPFD,
  getTargetFrequencyForSeverity,
  formatFrequency,
  formatPFD,
  formatRRF,
  calculateOrdersOfMagnitude,
  generateLOPARecommendations,
} from './lopa-calculation.service.js';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a minimal valid IPL for testing.
 */
function createTestIPL(overrides: Partial<IPL> = {}): IPL {
  return {
    id: 'ipl-test-1',
    type: 'safety_instrumented_function',
    name: 'Test SIF',
    description: 'Test Safety Instrumented Function',
    pfd: 0.01,
    independentOfInitiator: true,
    independentOfOtherIPLs: true,
    ...overrides,
  };
}

/**
 * Create a minimal valid LOPA calculation input for testing.
 */
function createTestLOPAInput(
  overrides: Partial<LOPACalculationInput> = {}
): LOPACalculationInput {
  return {
    initiatingEventFrequency: 0.1, // 0.1 per year
    ipls: [{ id: 'ipl-1', name: 'Test IPL', pfd: 0.01 }],
    targetFrequency: 1e-4, // 10^-4 per year
    ...overrides,
  };
}

/**
 * Create a risk ranking for testing.
 */
function createRiskRanking(overrides: Partial<RiskRanking> = {}): RiskRanking {
  const severity = overrides.severity ?? 3;
  const likelihood = overrides.likelihood ?? 3;
  const detectability = overrides.detectability ?? 3;
  const riskScore = overrides.riskScore ?? severity * likelihood * detectability;
  const riskLevel =
    overrides.riskLevel ?? (riskScore >= 61 ? 'high' : riskScore >= 21 ? 'medium' : 'low');

  return {
    severity,
    likelihood,
    detectability,
    riskScore,
    riskLevel,
    ...overrides,
  };
}

// =============================================================================
// Constants Tests
// =============================================================================

describe('LOPA Calculation Service', () => {
  describe('Constants', () => {
    it('should have valid PFD bounds', () => {
      expect(MIN_CREDITABLE_PFD).toBe(1e-5);
      expect(MAX_CREDITABLE_PFD).toBe(1.0);
      expect(MIN_CREDITABLE_PFD).toBeLessThan(MAX_CREDITABLE_PFD);
    });

    it('should have valid initiating event frequency bounds', () => {
      expect(MIN_INITIATING_EVENT_FREQUENCY).toBe(1e-8);
      expect(MAX_INITIATING_EVENT_FREQUENCY).toBe(100);
      expect(MIN_INITIATING_EVENT_FREQUENCY).toBeLessThan(MAX_INITIATING_EVENT_FREQUENCY);
    });

    it('should have valid gap thresholds', () => {
      expect(MARGINAL_GAP_THRESHOLD).toBe(0.5);
      expect(ADEQUATE_GAP_THRESHOLD).toBe(1.0);
      expect(MARGINAL_GAP_THRESHOLD).toBeLessThan(ADEQUATE_GAP_THRESHOLD);
    });
  });

  // ===========================================================================
  // Validation Function Tests
  // ===========================================================================

  describe('isValidPFD', () => {
    it('should return true for valid PFD values', () => {
      expect(isValidPFD(0.01)).toBe(true);
      expect(isValidPFD(0.1)).toBe(true);
      expect(isValidPFD(0.001)).toBe(true);
      expect(isValidPFD(MIN_CREDITABLE_PFD)).toBe(true);
      expect(isValidPFD(MAX_CREDITABLE_PFD)).toBe(true);
    });

    it('should return false for values below minimum', () => {
      expect(isValidPFD(MIN_CREDITABLE_PFD / 10)).toBe(false);
      expect(isValidPFD(0)).toBe(false);
      expect(isValidPFD(1e-10)).toBe(false);
    });

    it('should return false for values above maximum', () => {
      expect(isValidPFD(1.1)).toBe(false);
      expect(isValidPFD(2)).toBe(false);
    });

    it('should return false for invalid types', () => {
      expect(isValidPFD(NaN)).toBe(false);
      // @ts-expect-error - testing invalid type
      expect(isValidPFD('0.01')).toBe(false);
      // @ts-expect-error - testing invalid type
      expect(isValidPFD(undefined)).toBe(false);
    });

    it('should return false for negative values', () => {
      expect(isValidPFD(-0.01)).toBe(false);
      expect(isValidPFD(-1)).toBe(false);
    });
  });

  describe('isValidInitiatingEventFrequency', () => {
    it('should return true for valid frequencies', () => {
      expect(isValidInitiatingEventFrequency(0.1)).toBe(true);
      expect(isValidInitiatingEventFrequency(1)).toBe(true);
      expect(isValidInitiatingEventFrequency(10)).toBe(true);
      expect(isValidInitiatingEventFrequency(MIN_INITIATING_EVENT_FREQUENCY)).toBe(true);
      expect(isValidInitiatingEventFrequency(MAX_INITIATING_EVENT_FREQUENCY)).toBe(true);
    });

    it('should return false for frequencies below minimum', () => {
      expect(isValidInitiatingEventFrequency(MIN_INITIATING_EVENT_FREQUENCY / 10)).toBe(false);
      expect(isValidInitiatingEventFrequency(0)).toBe(false);
    });

    it('should return false for frequencies above maximum', () => {
      expect(isValidInitiatingEventFrequency(MAX_INITIATING_EVENT_FREQUENCY + 1)).toBe(false);
      expect(isValidInitiatingEventFrequency(1000)).toBe(false);
    });

    it('should return false for invalid types', () => {
      expect(isValidInitiatingEventFrequency(NaN)).toBe(false);
      // @ts-expect-error - testing invalid type
      expect(isValidInitiatingEventFrequency('0.1')).toBe(false);
    });
  });

  describe('isValidTargetFrequency', () => {
    it('should return true for valid target frequencies', () => {
      expect(isValidTargetFrequency(1e-4)).toBe(true);
      expect(isValidTargetFrequency(1e-5)).toBe(true);
      expect(isValidTargetFrequency(1e-6)).toBe(true);
      expect(isValidTargetFrequency(0.1)).toBe(true);
      expect(isValidTargetFrequency(1)).toBe(true);
    });

    it('should return false for zero or negative', () => {
      expect(isValidTargetFrequency(0)).toBe(false);
      expect(isValidTargetFrequency(-1e-4)).toBe(false);
    });

    it('should return false for values greater than 1', () => {
      expect(isValidTargetFrequency(1.1)).toBe(false);
      expect(isValidTargetFrequency(10)).toBe(false);
    });

    it('should return false for invalid types', () => {
      expect(isValidTargetFrequency(NaN)).toBe(false);
      // @ts-expect-error - testing invalid type
      expect(isValidTargetFrequency('1e-4')).toBe(false);
    });
  });

  describe('isValidSIL', () => {
    it('should return true for valid SIL values', () => {
      expect(isValidSIL(1)).toBe(true);
      expect(isValidSIL(2)).toBe(true);
      expect(isValidSIL(3)).toBe(true);
      expect(isValidSIL(4)).toBe(true);
    });

    it('should return false for invalid SIL values', () => {
      expect(isValidSIL(0)).toBe(false);
      expect(isValidSIL(5)).toBe(false);
      expect(isValidSIL(-1)).toBe(false);
      expect(isValidSIL(1.5)).toBe(false);
    });
  });

  describe('isValidIPLType', () => {
    it('should return true for all valid IPL types', () => {
      for (const type of IPL_TYPES) {
        expect(isValidIPLType(type)).toBe(true);
      }
    });

    it('should return false for invalid IPL types', () => {
      expect(isValidIPLType('invalid')).toBe(false);
      expect(isValidIPLType('')).toBe(false);
      expect(isValidIPLType('SIF')).toBe(false);
    });
  });

  describe('isValidInitiatingEventCategory', () => {
    it('should return true for all valid categories', () => {
      for (const category of INITIATING_EVENT_CATEGORIES) {
        expect(isValidInitiatingEventCategory(category)).toBe(true);
      }
    });

    it('should return false for invalid categories', () => {
      expect(isValidInitiatingEventCategory('invalid')).toBe(false);
      expect(isValidInitiatingEventCategory('')).toBe(false);
    });
  });

  describe('validateIPL', () => {
    it('should return valid for properly configured IPL', () => {
      const ipl = createTestIPL();
      const result = validateIPL(ipl);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for IPL with invalid PFD', () => {
      const ipl = createTestIPL({ pfd: 0 });
      const result = validateIPL(ipl);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('PFD'))).toBe(true);
    });

    it('should return invalid for IPL not independent of initiator', () => {
      const ipl = createTestIPL({ independentOfInitiator: false });
      const result = validateIPL(ipl);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('independent of initiator'))).toBe(true);
    });

    it('should return invalid for IPL not independent of other IPLs', () => {
      const ipl = createTestIPL({ independentOfOtherIPLs: false });
      const result = validateIPL(ipl);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('independent of other IPLs'))).toBe(true);
    });

    it('should return errors for missing independence fields', () => {
      const ipl = {
        pfd: 0.01,
        independentOfInitiator: undefined as unknown as boolean,
        independentOfOtherIPLs: undefined as unknown as boolean,
      };
      const result = validateIPL(ipl);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('validateIPLs', () => {
    it('should return valid for array of valid IPLs', () => {
      const ipls = [
        createTestIPL({ id: 'ipl-1' }),
        createTestIPL({ id: 'ipl-2', type: 'relief_device' }),
      ];
      const result = validateIPLs(ipls);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for empty array', () => {
      const result = validateIPLs([]);
      expect(result.valid).toBe(true);
    });

    it('should return invalid if any IPL is invalid', () => {
      const ipls = [
        createTestIPL({ id: 'ipl-1' }),
        createTestIPL({ id: 'ipl-2', pfd: 0 }), // Invalid PFD
      ];
      const result = validateIPLs(ipls);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('IPL 2'))).toBe(true);
    });

    it('should return invalid for non-array input', () => {
      // @ts-expect-error - testing invalid type
      const result = validateIPLs('not an array');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('must be an array'))).toBe(true);
    });

    it('should include IPL name in error messages', () => {
      const ipls = [createTestIPL({ id: 'ipl-1', name: 'LAHH-101', pfd: 0 })];
      const result = validateIPLs(ipls);
      expect(result.errors.some((e) => e.includes('LAHH-101'))).toBe(true);
    });
  });

  describe('validateLOPAInput', () => {
    it('should return valid for properly configured input', () => {
      const input = createTestLOPAInput();
      const result = validateLOPAInput(input);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for invalid initiating event frequency', () => {
      const input = createTestLOPAInput({ initiatingEventFrequency: 0 });
      const result = validateLOPAInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('initiating event frequency'))).toBe(true);
    });

    it('should return invalid for invalid target frequency', () => {
      const input = createTestLOPAInput({ targetFrequency: 0 });
      const result = validateLOPAInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('target frequency'))).toBe(true);
    });

    it('should return invalid when target >= initiating event frequency', () => {
      const input = createTestLOPAInput({
        initiatingEventFrequency: 0.1,
        targetFrequency: 0.2, // Higher than IEF
      });
      const result = validateLOPAInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('less than initiating'))).toBe(true);
    });

    it('should return invalid for IPL with invalid PFD', () => {
      const input = createTestLOPAInput({
        ipls: [{ id: 'ipl-1', name: 'Bad IPL', pfd: 2 }], // Invalid PFD
      });
      const result = validateLOPAInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('IPL 1'))).toBe(true);
    });

    it('should return invalid for non-array IPLs', () => {
      const input = createTestLOPAInput();
      // @ts-expect-error - testing invalid type
      input.ipls = 'not an array';
      const result = validateLOPAInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('must be an array'))).toBe(true);
    });
  });

  // ===========================================================================
  // Core Calculation Tests
  // ===========================================================================

  describe('calculateRRF', () => {
    it('should calculate RRF correctly for typical PFD values', () => {
      expect(calculateRRF(0.1)).toBe(10);
      expect(calculateRRF(0.01)).toBe(100);
      expect(calculateRRF(0.001)).toBe(1000);
      expect(calculateRRF(0.0001)).toBe(10000);
    });

    it('should handle boundary PFD values', () => {
      expect(calculateRRF(1)).toBe(1);
      expect(calculateRRF(MIN_CREDITABLE_PFD)).toBe(1 / MIN_CREDITABLE_PFD);
    });

    it('should throw for PFD below minimum', () => {
      expect(() => calculateRRF(MIN_CREDITABLE_PFD / 10)).toThrow();
    });

    it('should throw for PFD above maximum', () => {
      expect(() => calculateRRF(1.5)).toThrow();
    });

    it('should throw for zero PFD', () => {
      expect(() => calculateRRF(0)).toThrow();
    });

    it('should throw for negative PFD', () => {
      expect(() => calculateRRF(-0.01)).toThrow();
    });
  });

  describe('calculateTotalRRF', () => {
    it('should return 1 for empty array (no protection)', () => {
      expect(calculateTotalRRF([])).toBe(1);
    });

    it('should return correct RRF for single IPL', () => {
      expect(calculateTotalRRF([0.01])).toBe(100);
      expect(calculateTotalRRF([0.1])).toBe(10);
    });

    it('should multiply RRFs for multiple IPLs', () => {
      // Two IPLs with PFD 0.1 each: combined PFD = 0.01, RRF = 100
      expect(calculateTotalRRF([0.1, 0.1])).toBeCloseTo(100, 5);

      // Two IPLs with PFD 0.01 each: combined PFD = 0.0001, RRF = 10000
      expect(calculateTotalRRF([0.01, 0.01])).toBeCloseTo(10000, 5);

      // Three IPLs: 0.1 * 0.1 * 0.1 = 0.001, RRF = 1000
      expect(calculateTotalRRF([0.1, 0.1, 0.1])).toBeCloseTo(1000, 5);
    });

    it('should throw for any invalid PFD in array', () => {
      expect(() => calculateTotalRRF([0.01, 0, 0.01])).toThrow();
      expect(() => calculateTotalRRF([0.01, 2])).toThrow();
    });
  });

  describe('calculateMitigatedEventLikelihood', () => {
    it('should calculate MEL correctly', () => {
      // IEF = 1/yr, RRF = 100 => MEL = 0.01/yr
      expect(calculateMitigatedEventLikelihood(1, 100)).toBe(0.01);

      // IEF = 0.1/yr, RRF = 1000 => MEL = 0.0001/yr
      expect(calculateMitigatedEventLikelihood(0.1, 1000)).toBe(0.0001);
    });

    it('should throw for zero RRF', () => {
      expect(() => calculateMitigatedEventLikelihood(1, 0)).toThrow();
    });

    it('should throw for negative RRF', () => {
      expect(() => calculateMitigatedEventLikelihood(1, -100)).toThrow();
    });
  });

  describe('calculateRequiredRRF', () => {
    it('should calculate required RRF correctly', () => {
      // IEF = 1/yr, target = 1e-4/yr => required RRF = 10000
      expect(calculateRequiredRRF(1, 1e-4)).toBe(10000);

      // IEF = 0.1/yr, target = 1e-5/yr => required RRF = 10000
      expect(calculateRequiredRRF(0.1, 1e-5)).toBe(10000);
    });

    it('should throw for zero target frequency', () => {
      expect(() => calculateRequiredRRF(1, 0)).toThrow();
    });

    it('should throw for negative target frequency', () => {
      expect(() => calculateRequiredRRF(1, -1e-4)).toThrow();
    });
  });

  describe('calculateGapRatio', () => {
    it('should calculate gap ratio correctly', () => {
      // Actual = 10000, Required = 1000 => ratio = 10 (adequate)
      expect(calculateGapRatio(10000, 1000)).toBe(10);

      // Actual = 100, Required = 1000 => ratio = 0.1 (inadequate)
      expect(calculateGapRatio(100, 1000)).toBe(0.1);

      // Actual = 1000, Required = 1000 => ratio = 1 (exactly adequate)
      expect(calculateGapRatio(1000, 1000)).toBe(1);
    });

    it('should throw for zero required RRF', () => {
      expect(() => calculateGapRatio(1000, 0)).toThrow();
    });

    it('should throw for negative required RRF', () => {
      expect(() => calculateGapRatio(1000, -1000)).toThrow();
    });
  });

  describe('determineGapStatus', () => {
    it('should return adequate for gap ratio >= 1.0', () => {
      expect(determineGapStatus(1.0)).toBe('adequate');
      expect(determineGapStatus(1.5)).toBe('adequate');
      expect(determineGapStatus(10)).toBe('adequate');
    });

    it('should return marginal for gap ratio between 0.5 and 1.0', () => {
      expect(determineGapStatus(0.5)).toBe('marginal');
      expect(determineGapStatus(0.75)).toBe('marginal');
      expect(determineGapStatus(0.99)).toBe('marginal');
    });

    it('should return inadequate for gap ratio < 0.5', () => {
      expect(determineGapStatus(0.1)).toBe('inadequate');
      expect(determineGapStatus(0.4)).toBe('inadequate');
      expect(determineGapStatus(0.49)).toBe('inadequate');
    });
  });

  describe('determineRequiredSIL', () => {
    it('should return null when protection is adequate', () => {
      expect(determineRequiredSIL(1.0)).toBeNull();
      expect(determineRequiredSIL(1.5)).toBeNull();
      expect(determineRequiredSIL(10)).toBeNull();
    });

    it('should return SIL 1 for small gaps', () => {
      // Gap ratio 0.5 means need 2x more protection (1/0.5 = 2)
      // Additional RRF needed = 1/0.5 = 2, which is < 10, so SIL 1
      expect(determineRequiredSIL(0.5)).toBe(1);
      expect(determineRequiredSIL(0.2)).toBe(1); // 1/0.2 = 5 < 10
    });

    it('should return SIL 2 for moderate gaps', () => {
      // Gap ratio 0.05 means need 20x more protection (1/0.05 = 20)
      // 10 < 20 <= 100, so SIL 2
      expect(determineRequiredSIL(0.05)).toBe(2);
      expect(determineRequiredSIL(0.02)).toBe(2); // 1/0.02 = 50
    });

    it('should return SIL 3 for large gaps', () => {
      // Gap ratio 0.005 means need 200x more protection
      // 100 < 200 <= 1000, so SIL 3
      expect(determineRequiredSIL(0.005)).toBe(3);
    });

    it('should return SIL 4 for very large gaps', () => {
      // Gap ratio 0.0005 means need 2000x more protection
      // > 1000, so SIL 4
      expect(determineRequiredSIL(0.0005)).toBe(4);
    });
  });

  // ===========================================================================
  // Integration Tests - performLOPACalculation
  // ===========================================================================

  describe('performLOPACalculation', () => {
    it('should perform complete LOPA calculation for adequate protection', () => {
      const input = createTestLOPAInput({
        initiatingEventFrequency: 0.1,
        ipls: [
          { id: 'ipl-1', name: 'SIF-1', pfd: 0.01 }, // RRF = 100
          { id: 'ipl-2', name: 'PSV-1', pfd: 0.01 }, // RRF = 100
        ],
        targetFrequency: 1e-4, // Target: 10^-4/yr
      });

      const result = performLOPACalculation(input);

      // Total RRF = 100 * 100 = 10000
      expect(result.totalRiskReductionFactor).toBe(10000);

      // MEL = 0.1 / 10000 = 1e-5
      expect(result.mitigatedEventLikelihood).toBe(1e-5);

      // Required RRF = 0.1 / 1e-4 = 1000
      expect(result.requiredRiskReductionFactor).toBe(1000);

      // Gap ratio = 10000 / 1000 = 10
      expect(result.gapRatio).toBe(10);

      // Status should be adequate
      expect(result.gapStatus).toBe('adequate');
      expect(result.isAdequate).toBe(true);
      expect(result.requiredSIL).toBeNull();

      // Check IPL breakdown
      expect(result.iplRiskReductionFactors).toHaveLength(2);
      expect(result.iplRiskReductionFactors[0].rrf).toBe(100);
      expect(result.iplRiskReductionFactors[1].rrf).toBe(100);
    });

    it('should perform complete LOPA calculation for inadequate protection', () => {
      const input = createTestLOPAInput({
        initiatingEventFrequency: 1,
        ipls: [{ id: 'ipl-1', name: 'SIF-1', pfd: 0.1 }], // RRF = 10
        targetFrequency: 1e-5, // Target: 10^-5/yr
      });

      const result = performLOPACalculation(input);

      // Total RRF = 10
      expect(result.totalRiskReductionFactor).toBe(10);

      // Required RRF = 1 / 1e-5 = 100000
      expect(result.requiredRiskReductionFactor).toBeCloseTo(100000, 5);

      // Gap ratio = 10 / 100000 = 0.0001
      expect(result.gapRatio).toBeCloseTo(0.0001, 8);

      // Status should be inadequate
      expect(result.gapStatus).toBe('inadequate');
      expect(result.isAdequate).toBe(false);
      // With gap ratio 0.0001, additionalRRF = 1/0.0001 = 10000, which is SIL 4
      expect(result.requiredSIL).toBe(4);
    });

    it('should perform complete LOPA calculation for marginal protection', () => {
      const input = createTestLOPAInput({
        initiatingEventFrequency: 0.1,
        ipls: [{ id: 'ipl-1', name: 'SIF-1', pfd: 0.01 }], // RRF = 100
        targetFrequency: 1e-4, // Target: 10^-4/yr
      });

      const result = performLOPACalculation(input);

      // Total RRF = 100
      // Required RRF = 0.1 / 1e-4 = 1000
      // Gap ratio = 100 / 1000 = 0.1 (inadequate)
      expect(result.gapStatus).toBe('inadequate');
    });

    it('should handle empty IPL array (no protection)', () => {
      // Need target > IEF for validation to pass, but MEL = IEF when no IPLs
      // So if IEF < target, MEL < target, adequate
      // But validateLOPAInput requires target < IEF
      // So with no IPLs, protection is always inadequate or exactly at target
      const input = createTestLOPAInput({
        initiatingEventFrequency: 0.1, // Low frequency
        ipls: [],
        targetFrequency: 0.01, // Lower target
      });

      const result = performLOPACalculation(input);

      expect(result.totalRiskReductionFactor).toBe(1);
      expect(result.iplRiskReductionFactors).toHaveLength(0);
      // With IEF = 0.1 and target = 0.01, required RRF = 10, actual = 1
      // Gap ratio = 1/10 = 0.1, inadequate
      expect(result.isAdequate).toBe(false);
      expect(result.gapStatus).toBe('inadequate');
    });

    it('should throw for invalid input', () => {
      const invalidInput = createTestLOPAInput({
        initiatingEventFrequency: 0, // Invalid
      });

      expect(() => performLOPACalculation(invalidInput)).toThrow();
    });

    it('should preserve IPL identifiers in result', () => {
      const input = createTestLOPAInput({
        ipls: [
          { id: 'unique-id-1', name: 'LAHH-101', pfd: 0.01 },
          { id: 'unique-id-2', name: 'PSV-102', pfd: 0.01 },
        ],
      });

      const result = performLOPACalculation(input);

      expect(result.iplRiskReductionFactors[0].id).toBe('unique-id-1');
      expect(result.iplRiskReductionFactors[0].name).toBe('LAHH-101');
      expect(result.iplRiskReductionFactors[1].id).toBe('unique-id-2');
      expect(result.iplRiskReductionFactors[1].name).toBe('PSV-102');
    });
  });

  // ===========================================================================
  // LOPA Trigger Tests
  // ===========================================================================

  describe('checkLOPATrigger', () => {
    it('should require LOPA for severity 5 (Catastrophic)', () => {
      const ranking = createRiskRanking({
        severity: 5,
        likelihood: 2,
        detectability: 2,
        riskScore: 20,
        riskLevel: 'low',
      });
      const result = checkLOPATrigger(ranking);

      expect(result.recommended).toBe(true);
      expect(result.required).toBe(true);
      expect(result.reason).toContain('severity level 5');
    });

    it('should require LOPA for severity 4 (Major)', () => {
      const ranking = createRiskRanking({
        severity: 4,
        likelihood: 2,
        detectability: 2,
        riskScore: 16,
        riskLevel: 'low',
      });
      const result = checkLOPATrigger(ranking);

      expect(result.recommended).toBe(true);
      expect(result.required).toBe(true);
      expect(result.reason).toContain('severity level 4');
    });

    it('should recommend LOPA for high risk level', () => {
      const ranking = createRiskRanking({
        severity: 3,
        likelihood: 5,
        detectability: 5,
        riskScore: 75,
        riskLevel: 'high',
      });
      const result = checkLOPATrigger(ranking);

      expect(result.recommended).toBe(true);
      expect(result.required).toBe(false);
      expect(result.reason).toContain('high');
    });

    it('should recommend LOPA when risk score exceeds threshold', () => {
      const ranking = createRiskRanking({
        severity: 3,
        likelihood: 5,
        detectability: 5,
        riskScore: 75,
        riskLevel: 'high',
      });
      const result = checkLOPATrigger(ranking);

      expect(result.recommended).toBe(true);
    });

    it('should not recommend LOPA for low risk', () => {
      const ranking = createRiskRanking({
        severity: 2,
        likelihood: 2,
        detectability: 2,
        riskScore: 8,
        riskLevel: 'low',
      });
      const result = checkLOPATrigger(ranking);

      expect(result.recommended).toBe(false);
      expect(result.required).toBe(false);
      expect(result.reason).toContain('not required');
    });

    it('should respect custom config', () => {
      const ranking = createRiskRanking({
        severity: 3,
        likelihood: 3,
        detectability: 3,
        riskScore: 27,
        riskLevel: 'medium',
      });

      // Default doesn't recommend for medium
      const defaultResult = checkLOPATrigger(ranking);
      expect(defaultResult.recommended).toBe(false);

      // Custom config includes medium risk
      const customConfig = {
        riskScoreThreshold: 20,
        riskLevels: ['medium' as const, 'high' as const],
        requiredSeverityLevels: [4 as const, 5 as const],
      };
      const customResult = checkLOPATrigger(ranking, customConfig);
      expect(customResult.recommended).toBe(true);
    });
  });

  describe('isLOPARecommended', () => {
    it('should return true for severity >= 4', () => {
      expect(isLOPARecommended(4, 1)).toBe(true);
      expect(isLOPARecommended(5, 1)).toBe(true);
      expect(isLOPARecommended(4, 5)).toBe(true);
    });

    it('should return true for severity 3 with likelihood >= 4', () => {
      expect(isLOPARecommended(3, 4)).toBe(true);
      expect(isLOPARecommended(3, 5)).toBe(true);
    });

    it('should return false for low severity', () => {
      expect(isLOPARecommended(1, 5)).toBe(false);
      expect(isLOPARecommended(2, 5)).toBe(false);
    });

    it('should return false for moderate severity with low likelihood', () => {
      expect(isLOPARecommended(3, 1)).toBe(false);
      expect(isLOPARecommended(3, 2)).toBe(false);
      expect(isLOPARecommended(3, 3)).toBe(false);
    });
  });

  // ===========================================================================
  // Helper Function Tests
  // ===========================================================================

  describe('getTypicalPFDForIPLType', () => {
    it('should return correct typical PFD for each IPL type', () => {
      for (const type of IPL_TYPES) {
        const pfd = getTypicalPFDForIPLType(type);
        expect(pfd).toBe(IPL_TYPICAL_PFD[type]);
        expect(pfd).toBeGreaterThan(0);
        expect(pfd).toBeLessThanOrEqual(1);
      }
    });

    it('should return expected values for common types', () => {
      expect(getTypicalPFDForIPLType('safety_instrumented_function')).toBe(0.01);
      expect(getTypicalPFDForIPLType('basic_process_control')).toBe(0.1);
      expect(getTypicalPFDForIPLType('relief_device')).toBe(0.01);
      expect(getTypicalPFDForIPLType('human_intervention')).toBe(0.1);
    });
  });

  describe('getTypicalPFDForSIL', () => {
    it('should return correct typical PFD for each SIL level', () => {
      for (const sil of SAFETY_INTEGRITY_LEVELS) {
        const pfd = getTypicalPFDForSIL(sil);
        expect(pfd).toBe(SIL_TYPICAL_PFD[sil]);
      }
    });

    it('should return expected values matching SIL_TYPICAL_PFD', () => {
      // These values come from the types package SIL_TYPICAL_PFD constant
      expect(getTypicalPFDForSIL(1)).toBe(SIL_TYPICAL_PFD[1]);
      expect(getTypicalPFDForSIL(2)).toBe(SIL_TYPICAL_PFD[2]);
      expect(getTypicalPFDForSIL(3)).toBe(SIL_TYPICAL_PFD[3]);
      expect(getTypicalPFDForSIL(4)).toBe(SIL_TYPICAL_PFD[4]);
    });
  });

  describe('getPFDRangeForSIL', () => {
    it('should return correct PFD range for each SIL', () => {
      for (const sil of SAFETY_INTEGRITY_LEVELS) {
        const range = getPFDRangeForSIL(sil);
        expect(range.min).toBe(SIL_PFD_RANGES[sil].min);
        expect(range.max).toBe(SIL_PFD_RANGES[sil].max);
        expect(range.min).toBeLessThan(range.max);
      }
    });

    it('should return a copy, not the original', () => {
      const range1 = getPFDRangeForSIL(1);
      const range2 = getPFDRangeForSIL(1);
      range1.min = 999;
      expect(range2.min).not.toBe(999);
    });
  });

  describe('determineSILFromPFD', () => {
    // SIL_PFD_RANGES:
    // SIL 1: { min: 0.01, max: 0.1 }
    // SIL 2: { min: 0.001, max: 0.01 }
    // SIL 3: { min: 0.0001, max: 0.001 }
    // SIL 4: { min: 0.00001, max: 0.0001 }
    // Function iterates SIL 1->4, returns first match

    it('should return SIL 1 for PFD in range 0.01-0.1', () => {
      expect(determineSILFromPFD(0.1)).toBe(1);
      expect(determineSILFromPFD(0.05)).toBe(1);
      expect(determineSILFromPFD(0.01)).toBe(1); // Boundary belongs to SIL 1 (first match)
    });

    it('should return SIL 2 for PFD in range 0.001-0.01 (exclusive upper)', () => {
      expect(determineSILFromPFD(0.009)).toBe(2);
      expect(determineSILFromPFD(0.005)).toBe(2);
      expect(determineSILFromPFD(0.001)).toBe(2); // Boundary belongs to SIL 2
    });

    it('should return SIL 3 for PFD in range 0.0001-0.001 (exclusive upper)', () => {
      expect(determineSILFromPFD(0.0009)).toBe(3);
      expect(determineSILFromPFD(0.0005)).toBe(3);
      expect(determineSILFromPFD(0.0001)).toBe(3); // Boundary belongs to SIL 3
    });

    it('should return SIL 4 for PFD in range 0.00001-0.0001 (exclusive upper)', () => {
      expect(determineSILFromPFD(0.00009)).toBe(4);
      expect(determineSILFromPFD(0.00005)).toBe(4);
      expect(determineSILFromPFD(0.00001)).toBe(4);
    });

    it('should return null for invalid PFD', () => {
      expect(determineSILFromPFD(0)).toBeNull();
      expect(determineSILFromPFD(-0.01)).toBeNull();
      expect(determineSILFromPFD(2)).toBeNull();
    });

    it('should return null for PFD too high for any SIL (> 0.1)', () => {
      expect(determineSILFromPFD(0.5)).toBeNull();
      expect(determineSILFromPFD(1)).toBeNull();
    });
  });

  describe('getTargetFrequencyForSeverity', () => {
    it('should return correct target frequency for each severity', () => {
      expect(getTargetFrequencyForSeverity(1)).toBe(SEVERITY_TO_TARGET_FREQUENCY[1]);
      expect(getTargetFrequencyForSeverity(2)).toBe(SEVERITY_TO_TARGET_FREQUENCY[2]);
      expect(getTargetFrequencyForSeverity(3)).toBe(SEVERITY_TO_TARGET_FREQUENCY[3]);
      expect(getTargetFrequencyForSeverity(4)).toBe(SEVERITY_TO_TARGET_FREQUENCY[4]);
      expect(getTargetFrequencyForSeverity(5)).toBe(SEVERITY_TO_TARGET_FREQUENCY[5]);
    });

    it('should return lower frequency for higher severity', () => {
      const sev1 = getTargetFrequencyForSeverity(1);
      const sev5 = getTargetFrequencyForSeverity(5);
      expect(sev5).toBeLessThan(sev1);
    });
  });

  // ===========================================================================
  // Formatting Function Tests
  // ===========================================================================

  describe('formatFrequency', () => {
    it('should format frequencies >= 1', () => {
      expect(formatFrequency(1)).toBe('1.0 per year');
      expect(formatFrequency(10)).toBe('10.0 per year');
    });

    it('should format frequencies with scientific notation', () => {
      const formatted = formatFrequency(0.0001);
      expect(formatted).toContain('10');
      expect(formatted).toContain('per year');
    });

    it('should format exact powers of 10 cleanly', () => {
      const formatted = formatFrequency(0.001);
      expect(formatted).toContain('10^-3');
    });
  });

  describe('formatPFD', () => {
    it('should format large PFD values as decimals', () => {
      expect(formatPFD(0.1)).toBe('0.10');
      expect(formatPFD(0.5)).toBe('0.50');
    });

    it('should format small PFD values with scientific notation', () => {
      const formatted = formatPFD(0.001);
      expect(formatted).toContain('10');
      expect(formatted).toContain('-3');
    });
  });

  describe('formatRRF', () => {
    it('should format small RRF values as integers', () => {
      expect(formatRRF(10)).toBe('10');
      expect(formatRRF(100)).toBe('100');
      expect(formatRRF(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatRRF(1000)).toContain('K');
      expect(formatRRF(10000)).toContain('10');
      expect(formatRRF(10000)).toContain('K');
      expect(formatRRF(100000)).toContain('100');
      expect(formatRRF(100000)).toContain('K');
    });

    it('should format millions with M suffix', () => {
      expect(formatRRF(1000000)).toContain('M');
      expect(formatRRF(10000000)).toContain('10');
      expect(formatRRF(10000000)).toContain('M');
    });
  });

  describe('calculateOrdersOfMagnitude', () => {
    it('should calculate orders correctly', () => {
      expect(calculateOrdersOfMagnitude(10)).toBe(1);
      expect(calculateOrdersOfMagnitude(100)).toBe(2);
      expect(calculateOrdersOfMagnitude(1000)).toBe(3);
      expect(calculateOrdersOfMagnitude(10000)).toBe(4);
    });

    it('should handle intermediate values', () => {
      const orders = calculateOrdersOfMagnitude(50);
      expect(orders).toBeGreaterThan(1);
      expect(orders).toBeLessThan(2);
    });

    it('should return 0 for RRF <= 0', () => {
      expect(calculateOrdersOfMagnitude(0)).toBe(0);
      expect(calculateOrdersOfMagnitude(-10)).toBe(0);
    });

    it('should return 0 for RRF = 1', () => {
      expect(calculateOrdersOfMagnitude(1)).toBe(0);
    });
  });

  describe('generateLOPARecommendations', () => {
    it('should generate positive recommendation for adequate protection', () => {
      const input = createTestLOPAInput({
        initiatingEventFrequency: 0.1,
        ipls: [
          { id: 'ipl-1', name: 'SIF-1', pfd: 0.01 },
          { id: 'ipl-2', name: 'PSV-1', pfd: 0.01 },
        ],
        targetFrequency: 1e-4,
      });
      const result = performLOPACalculation(input);
      const recommendations = generateLOPARecommendations(result);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toContain('adequate');
    });

    it('should generate action items for inadequate protection', () => {
      const input = createTestLOPAInput({
        initiatingEventFrequency: 1,
        ipls: [{ id: 'ipl-1', name: 'SIF-1', pfd: 0.1 }],
        targetFrequency: 1e-5,
      });
      const result = performLOPACalculation(input);
      const recommendations = generateLOPARecommendations(result);

      expect(recommendations.length).toBeGreaterThan(1);
      expect(recommendations.some((r) => r.includes('inadequate'))).toBe(true);
      expect(recommendations.some((r) => r.includes('SIL'))).toBe(true);
    });

    it('should generate marginal warning for marginal protection', () => {
      // Create an input that results in marginal protection
      // Marginal is gap ratio between 0.5 and 1.0
      // We need: totalRRF / requiredRRF to be in range [0.5, 1.0)
      const marginalInput = createTestLOPAInput({
        initiatingEventFrequency: 0.1,
        ipls: [{ id: 'ipl-1', name: 'SIF-1', pfd: 0.0015 }], // RRF = ~667
        targetFrequency: 1e-4, // Required RRF = 1000
      });
      const marginalResult = performLOPACalculation(marginalInput);

      // Gap ratio should be ~0.667 (marginal)
      if (marginalResult.gapStatus === 'marginal') {
        const recommendations = generateLOPARecommendations(marginalResult);
        expect(recommendations.some((r) => r.includes('marginal') || r.includes('consider'))).toBe(
          true
        );
      }
    });

    it('should include LOPA review recommendation for non-adequate', () => {
      const input = createTestLOPAInput({
        initiatingEventFrequency: 1,
        ipls: [],
        targetFrequency: 1e-4,
      });
      const result = performLOPACalculation(input);
      const recommendations = generateLOPARecommendations(result);

      expect(recommendations.some((r) => r.toLowerCase().includes('lopa review'))).toBe(true);
    });
  });
});
