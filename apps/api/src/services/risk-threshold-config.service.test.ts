/**
 * Unit tests for risk-threshold-config.service.ts
 *
 * Tests the risk threshold configuration functions including:
 * - Validation of threshold configurations
 * - Factory functions for creating configurations
 * - Risk level determination with custom thresholds
 * - Preset configurations (default, conservative, relaxed)
 */

import { describe, it, expect } from '@jest/globals';
import {
  // Types
  type RiskThresholdConfig,
  type RiskMatrixThresholdConfig,
  type CombinedThresholdConfig,
  // Constants
  DEFAULT_RISK_THRESHOLDS,
  DEFAULT_MATRIX_THRESHOLDS,
  CONSERVATIVE_RISK_THRESHOLDS,
  CONSERVATIVE_MATRIX_THRESHOLDS,
  RELAXED_RISK_THRESHOLDS,
  RELAXED_MATRIX_THRESHOLDS,
  // Validation functions
  validateRiskThresholdConfig,
  validateMatrixThresholdConfig,
  validateCombinedThresholdConfig,
  // Factory functions
  createRiskThresholdConfig,
  createMatrixThresholdConfig,
  createCombinedThresholdConfig,
  // Risk level determination
  determineRiskLevelWithConfig,
  determineMatrixRiskLevelWithConfig,
  // Retrieval functions
  getDefaultRiskThresholds,
  getDefaultMatrixThresholds,
  getConservativeRiskThresholds,
  getConservativeMatrixThresholds,
  getRelaxedRiskThresholds,
  getRelaxedMatrixThresholds,
  getPresetRiskThresholds,
  getPresetMatrixThresholds,
  // Comparison functions
  areThresholdConfigsEqual,
  areMatrixThresholdConfigsEqual,
  getThresholdBoundaries,
  getMatrixThresholdBoundaries,
  // Utility functions
  getAvailablePresets,
  getPresetDescription,
  getRiskLevelOrder,
} from './risk-threshold-config.service.js';

describe('Risk Threshold Configuration Service', () => {
  // ==========================================================================
  // Default Configuration Constants
  // ==========================================================================

  describe('DEFAULT_RISK_THRESHOLDS', () => {
    it('should have correct low threshold', () => {
      expect(DEFAULT_RISK_THRESHOLDS.low.min).toBe(1);
      expect(DEFAULT_RISK_THRESHOLDS.low.max).toBe(20);
    });

    it('should have correct medium threshold', () => {
      expect(DEFAULT_RISK_THRESHOLDS.medium.min).toBe(21);
      expect(DEFAULT_RISK_THRESHOLDS.medium.max).toBe(60);
    });

    it('should have correct high threshold', () => {
      expect(DEFAULT_RISK_THRESHOLDS.high.min).toBe(61);
      expect(DEFAULT_RISK_THRESHOLDS.high.max).toBe(125);
    });
  });

  describe('DEFAULT_MATRIX_THRESHOLDS', () => {
    it('should have correct low threshold', () => {
      expect(DEFAULT_MATRIX_THRESHOLDS.low.min).toBe(1);
      expect(DEFAULT_MATRIX_THRESHOLDS.low.max).toBe(4);
    });

    it('should have correct medium threshold', () => {
      expect(DEFAULT_MATRIX_THRESHOLDS.medium.min).toBe(5);
      expect(DEFAULT_MATRIX_THRESHOLDS.medium.max).toBe(14);
    });

    it('should have correct high threshold', () => {
      expect(DEFAULT_MATRIX_THRESHOLDS.high.min).toBe(15);
      expect(DEFAULT_MATRIX_THRESHOLDS.high.max).toBe(25);
    });
  });

  // ==========================================================================
  // Validation Functions
  // ==========================================================================

  describe('validateRiskThresholdConfig', () => {
    it('should validate default configuration as valid', () => {
      const result = validateRiskThresholdConfig(DEFAULT_RISK_THRESHOLDS);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate conservative configuration as valid', () => {
      const result = validateRiskThresholdConfig(CONSERVATIVE_RISK_THRESHOLDS);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate relaxed configuration as valid', () => {
      const result = validateRiskThresholdConfig(RELAXED_RISK_THRESHOLDS);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration with gap between low and medium', () => {
      const config: RiskThresholdConfig = {
        low: { min: 1, max: 20 },
        medium: { min: 25, max: 60 }, // Gap: 21-24 not covered
        high: { min: 61, max: 125 },
      };

      const result = validateRiskThresholdConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Gap or overlap'))).toBe(true);
    });

    it('should reject configuration with overlap between medium and high', () => {
      const config: RiskThresholdConfig = {
        low: { min: 1, max: 20 },
        medium: { min: 21, max: 70 },
        high: { min: 65, max: 125 }, // Overlap: 65-70
      };

      const result = validateRiskThresholdConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Gap or overlap'))).toBe(true);
    });

    it('should reject configuration that does not start at 1', () => {
      const config: RiskThresholdConfig = {
        low: { min: 5, max: 20 }, // Does not start at 1
        medium: { min: 21, max: 60 },
        high: { min: 61, max: 125 },
      };

      const result = validateRiskThresholdConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Low min must be 1'))).toBe(true);
    });

    it('should reject configuration that does not end at 125', () => {
      const config: RiskThresholdConfig = {
        low: { min: 1, max: 20 },
        medium: { min: 21, max: 60 },
        high: { min: 61, max: 100 }, // Does not end at 125
      };

      const result = validateRiskThresholdConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('High max must be 125'))).toBe(true);
    });

    it('should reject configuration with min > max', () => {
      const config: RiskThresholdConfig = {
        low: { min: 20, max: 1 }, // Inverted
        medium: { min: 21, max: 60 },
        high: { min: 61, max: 125 },
      };

      const result = validateRiskThresholdConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('min') && e.includes('max'))).toBe(true);
    });

    it('should reject configuration with non-integer values', () => {
      const config: RiskThresholdConfig = {
        low: { min: 1, max: 20.5 },
        medium: { min: 21, max: 60 },
        high: { min: 61, max: 125 },
      };

      const result = validateRiskThresholdConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('integer'))).toBe(true);
    });
  });

  describe('validateMatrixThresholdConfig', () => {
    it('should validate default configuration as valid', () => {
      const result = validateMatrixThresholdConfig(DEFAULT_MATRIX_THRESHOLDS);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration that does not start at 1', () => {
      const config: RiskMatrixThresholdConfig = {
        low: { min: 2, max: 4 },
        medium: { min: 5, max: 14 },
        high: { min: 15, max: 25 },
      };

      const result = validateMatrixThresholdConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Low min must be 1'))).toBe(true);
    });

    it('should reject configuration that does not end at 25', () => {
      const config: RiskMatrixThresholdConfig = {
        low: { min: 1, max: 4 },
        medium: { min: 5, max: 14 },
        high: { min: 15, max: 20 },
      };

      const result = validateMatrixThresholdConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('High max must be 25'))).toBe(true);
    });

    it('should reject configuration with values outside range', () => {
      const config: RiskMatrixThresholdConfig = {
        low: { min: 1, max: 4 },
        medium: { min: 5, max: 14 },
        high: { min: 15, max: 30 }, // Exceeds 25
      };

      const result = validateMatrixThresholdConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('max') && e.includes('<='))).toBe(true);
    });
  });

  describe('validateCombinedThresholdConfig', () => {
    it('should validate valid combined configuration', () => {
      const config: CombinedThresholdConfig = {
        full: DEFAULT_RISK_THRESHOLDS,
        matrix: DEFAULT_MATRIX_THRESHOLDS,
      };

      const result = validateCombinedThresholdConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report errors from both configurations', () => {
      const config: CombinedThresholdConfig = {
        full: {
          low: { min: 5, max: 20 }, // Invalid: doesn't start at 1
          medium: { min: 21, max: 60 },
          high: { min: 61, max: 125 },
        },
        matrix: {
          low: { min: 1, max: 4 },
          medium: { min: 5, max: 14 },
          high: { min: 15, max: 20 }, // Invalid: doesn't end at 25
        },
      };

      const result = validateCombinedThresholdConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Full:'))).toBe(true);
      expect(result.errors.some((e) => e.includes('Matrix:'))).toBe(true);
    });
  });

  // ==========================================================================
  // Factory Functions
  // ==========================================================================

  describe('createRiskThresholdConfig', () => {
    it('should create valid configuration with default boundaries', () => {
      const config = createRiskThresholdConfig(20, 60);

      expect(config.low).toEqual({ min: 1, max: 20 });
      expect(config.medium).toEqual({ min: 21, max: 60 });
      expect(config.high).toEqual({ min: 61, max: 125 });
    });

    it('should create valid configuration with conservative boundaries', () => {
      const config = createRiskThresholdConfig(10, 40);

      expect(config.low).toEqual({ min: 1, max: 10 });
      expect(config.medium).toEqual({ min: 11, max: 40 });
      expect(config.high).toEqual({ min: 41, max: 125 });
    });

    it('should create valid configuration with relaxed boundaries', () => {
      const config = createRiskThresholdConfig(30, 80);

      expect(config.low).toEqual({ min: 1, max: 30 });
      expect(config.medium).toEqual({ min: 31, max: 80 });
      expect(config.high).toEqual({ min: 81, max: 125 });
    });

    it('should throw error for invalid boundaries', () => {
      // Low boundary >= medium boundary
      expect(() => createRiskThresholdConfig(60, 50)).toThrow();
    });

    it('should throw error for boundary at 0', () => {
      expect(() => createRiskThresholdConfig(0, 60)).toThrow();
    });

    it('should throw error for boundary at 125', () => {
      // Medium boundary at 125 would leave no room for high
      expect(() => createRiskThresholdConfig(20, 125)).toThrow();
    });
  });

  describe('createMatrixThresholdConfig', () => {
    it('should create valid configuration with default boundaries', () => {
      const config = createMatrixThresholdConfig(4, 14);

      expect(config.low).toEqual({ min: 1, max: 4 });
      expect(config.medium).toEqual({ min: 5, max: 14 });
      expect(config.high).toEqual({ min: 15, max: 25 });
    });

    it('should create valid configuration with conservative boundaries', () => {
      const config = createMatrixThresholdConfig(2, 8);

      expect(config.low).toEqual({ min: 1, max: 2 });
      expect(config.medium).toEqual({ min: 3, max: 8 });
      expect(config.high).toEqual({ min: 9, max: 25 });
    });

    it('should throw error for invalid boundaries', () => {
      expect(() => createMatrixThresholdConfig(14, 10)).toThrow();
    });
  });

  describe('createCombinedThresholdConfig', () => {
    it('should create valid combined configuration', () => {
      const config = createCombinedThresholdConfig(20, 60, 4, 14);

      expect(config.full.low).toEqual({ min: 1, max: 20 });
      expect(config.matrix.low).toEqual({ min: 1, max: 4 });
    });

    it('should throw error if full config is invalid', () => {
      expect(() => createCombinedThresholdConfig(60, 50, 4, 14)).toThrow();
    });

    it('should throw error if matrix config is invalid', () => {
      expect(() => createCombinedThresholdConfig(20, 60, 14, 10)).toThrow();
    });
  });

  // ==========================================================================
  // Risk Level Determination with Custom Thresholds
  // ==========================================================================

  describe('determineRiskLevelWithConfig', () => {
    const customConfig: RiskThresholdConfig = {
      low: { min: 1, max: 15 },
      medium: { min: 16, max: 50 },
      high: { min: 51, max: 125 },
    };

    it('should determine low risk correctly', () => {
      expect(determineRiskLevelWithConfig(1, customConfig)).toBe('low');
      expect(determineRiskLevelWithConfig(10, customConfig)).toBe('low');
      expect(determineRiskLevelWithConfig(15, customConfig)).toBe('low');
    });

    it('should determine medium risk correctly', () => {
      expect(determineRiskLevelWithConfig(16, customConfig)).toBe('medium');
      expect(determineRiskLevelWithConfig(30, customConfig)).toBe('medium');
      expect(determineRiskLevelWithConfig(50, customConfig)).toBe('medium');
    });

    it('should determine high risk correctly', () => {
      expect(determineRiskLevelWithConfig(51, customConfig)).toBe('high');
      expect(determineRiskLevelWithConfig(80, customConfig)).toBe('high');
      expect(determineRiskLevelWithConfig(125, customConfig)).toBe('high');
    });

    it('should handle boundary transitions correctly', () => {
      // At boundary 15 (last low)
      expect(determineRiskLevelWithConfig(15, customConfig)).toBe('low');
      // At boundary 16 (first medium)
      expect(determineRiskLevelWithConfig(16, customConfig)).toBe('medium');
      // At boundary 50 (last medium)
      expect(determineRiskLevelWithConfig(50, customConfig)).toBe('medium');
      // At boundary 51 (first high)
      expect(determineRiskLevelWithConfig(51, customConfig)).toBe('high');
    });

    it('should throw error for invalid score', () => {
      expect(() => determineRiskLevelWithConfig(0, customConfig)).toThrow('Invalid risk score');
      expect(() => determineRiskLevelWithConfig(126, customConfig)).toThrow('Invalid risk score');
      expect(() => determineRiskLevelWithConfig(50.5, customConfig)).toThrow('Invalid risk score');
    });

    it('should work with default thresholds', () => {
      expect(determineRiskLevelWithConfig(20, DEFAULT_RISK_THRESHOLDS)).toBe('low');
      expect(determineRiskLevelWithConfig(21, DEFAULT_RISK_THRESHOLDS)).toBe('medium');
      expect(determineRiskLevelWithConfig(60, DEFAULT_RISK_THRESHOLDS)).toBe('medium');
      expect(determineRiskLevelWithConfig(61, DEFAULT_RISK_THRESHOLDS)).toBe('high');
    });
  });

  describe('determineMatrixRiskLevelWithConfig', () => {
    const customConfig: RiskMatrixThresholdConfig = {
      low: { min: 1, max: 3 },
      medium: { min: 4, max: 10 },
      high: { min: 11, max: 25 },
    };

    it('should determine low risk correctly', () => {
      expect(determineMatrixRiskLevelWithConfig(1, customConfig)).toBe('low');
      expect(determineMatrixRiskLevelWithConfig(2, customConfig)).toBe('low');
      expect(determineMatrixRiskLevelWithConfig(3, customConfig)).toBe('low');
    });

    it('should determine medium risk correctly', () => {
      expect(determineMatrixRiskLevelWithConfig(4, customConfig)).toBe('medium');
      expect(determineMatrixRiskLevelWithConfig(7, customConfig)).toBe('medium');
      expect(determineMatrixRiskLevelWithConfig(10, customConfig)).toBe('medium');
    });

    it('should determine high risk correctly', () => {
      expect(determineMatrixRiskLevelWithConfig(11, customConfig)).toBe('high');
      expect(determineMatrixRiskLevelWithConfig(18, customConfig)).toBe('high');
      expect(determineMatrixRiskLevelWithConfig(25, customConfig)).toBe('high');
    });

    it('should throw error for invalid score', () => {
      expect(() => determineMatrixRiskLevelWithConfig(0, customConfig)).toThrow(
        'Invalid base risk score'
      );
      expect(() => determineMatrixRiskLevelWithConfig(26, customConfig)).toThrow(
        'Invalid base risk score'
      );
    });
  });

  // ==========================================================================
  // Configuration Retrieval Functions
  // ==========================================================================

  describe('getDefaultRiskThresholds', () => {
    it('should return a copy of default thresholds', () => {
      const thresholds = getDefaultRiskThresholds();

      expect(thresholds).toEqual(DEFAULT_RISK_THRESHOLDS);
    });

    it('should return a new object each time', () => {
      const thresholds1 = getDefaultRiskThresholds();
      const thresholds2 = getDefaultRiskThresholds();

      expect(thresholds1).not.toBe(thresholds2);
      expect(thresholds1.low).not.toBe(thresholds2.low);
    });
  });

  describe('getDefaultMatrixThresholds', () => {
    it('should return a copy of default matrix thresholds', () => {
      const thresholds = getDefaultMatrixThresholds();

      expect(thresholds).toEqual(DEFAULT_MATRIX_THRESHOLDS);
    });
  });

  describe('getConservativeRiskThresholds', () => {
    it('should return conservative thresholds', () => {
      const thresholds = getConservativeRiskThresholds();

      expect(thresholds).toEqual(CONSERVATIVE_RISK_THRESHOLDS);
      expect(thresholds.low.max).toBe(10);
      expect(thresholds.medium.max).toBe(40);
    });
  });

  describe('getConservativeMatrixThresholds', () => {
    it('should return conservative matrix thresholds', () => {
      const thresholds = getConservativeMatrixThresholds();

      expect(thresholds).toEqual(CONSERVATIVE_MATRIX_THRESHOLDS);
      expect(thresholds.low.max).toBe(2);
      expect(thresholds.medium.max).toBe(8);
    });
  });

  describe('getRelaxedRiskThresholds', () => {
    it('should return relaxed thresholds', () => {
      const thresholds = getRelaxedRiskThresholds();

      expect(thresholds).toEqual(RELAXED_RISK_THRESHOLDS);
      expect(thresholds.low.max).toBe(30);
      expect(thresholds.medium.max).toBe(80);
    });
  });

  describe('getRelaxedMatrixThresholds', () => {
    it('should return relaxed matrix thresholds', () => {
      const thresholds = getRelaxedMatrixThresholds();

      expect(thresholds).toEqual(RELAXED_MATRIX_THRESHOLDS);
      expect(thresholds.low.max).toBe(6);
      expect(thresholds.medium.max).toBe(16);
    });
  });

  describe('getPresetRiskThresholds', () => {
    it('should return default thresholds for "default"', () => {
      const thresholds = getPresetRiskThresholds('default');
      expect(thresholds).toEqual(DEFAULT_RISK_THRESHOLDS);
    });

    it('should return conservative thresholds for "conservative"', () => {
      const thresholds = getPresetRiskThresholds('conservative');
      expect(thresholds).toEqual(CONSERVATIVE_RISK_THRESHOLDS);
    });

    it('should return relaxed thresholds for "relaxed"', () => {
      const thresholds = getPresetRiskThresholds('relaxed');
      expect(thresholds).toEqual(RELAXED_RISK_THRESHOLDS);
    });

    it('should throw error for unknown preset', () => {
      expect(() => getPresetRiskThresholds('unknown' as 'default')).toThrow(
        'Unknown preset'
      );
    });
  });

  describe('getPresetMatrixThresholds', () => {
    it('should return default matrix thresholds for "default"', () => {
      const thresholds = getPresetMatrixThresholds('default');
      expect(thresholds).toEqual(DEFAULT_MATRIX_THRESHOLDS);
    });

    it('should return conservative matrix thresholds for "conservative"', () => {
      const thresholds = getPresetMatrixThresholds('conservative');
      expect(thresholds).toEqual(CONSERVATIVE_MATRIX_THRESHOLDS);
    });

    it('should return relaxed matrix thresholds for "relaxed"', () => {
      const thresholds = getPresetMatrixThresholds('relaxed');
      expect(thresholds).toEqual(RELAXED_MATRIX_THRESHOLDS);
    });
  });

  // ==========================================================================
  // Comparison Functions
  // ==========================================================================

  describe('areThresholdConfigsEqual', () => {
    it('should return true for identical configurations', () => {
      const config1 = getDefaultRiskThresholds();
      const config2 = getDefaultRiskThresholds();

      expect(areThresholdConfigsEqual(config1, config2)).toBe(true);
    });

    it('should return false for different configurations', () => {
      const config1 = getDefaultRiskThresholds();
      const config2 = getConservativeRiskThresholds();

      expect(areThresholdConfigsEqual(config1, config2)).toBe(false);
    });

    it('should return false for slightly different configurations', () => {
      const config1 = getDefaultRiskThresholds();
      const config2 = { ...getDefaultRiskThresholds(), low: { min: 1, max: 19 } };

      expect(areThresholdConfigsEqual(config1, config2)).toBe(false);
    });
  });

  describe('areMatrixThresholdConfigsEqual', () => {
    it('should return true for identical configurations', () => {
      const config1 = getDefaultMatrixThresholds();
      const config2 = getDefaultMatrixThresholds();

      expect(areMatrixThresholdConfigsEqual(config1, config2)).toBe(true);
    });

    it('should return false for different configurations', () => {
      const config1 = getDefaultMatrixThresholds();
      const config2 = getConservativeMatrixThresholds();

      expect(areMatrixThresholdConfigsEqual(config1, config2)).toBe(false);
    });
  });

  describe('getThresholdBoundaries', () => {
    it('should return correct boundaries for default config', () => {
      const boundaries = getThresholdBoundaries(DEFAULT_RISK_THRESHOLDS);

      expect(boundaries.lowMediumBoundary).toBe(20);
      expect(boundaries.mediumHighBoundary).toBe(60);
    });

    it('should return correct boundaries for conservative config', () => {
      const boundaries = getThresholdBoundaries(CONSERVATIVE_RISK_THRESHOLDS);

      expect(boundaries.lowMediumBoundary).toBe(10);
      expect(boundaries.mediumHighBoundary).toBe(40);
    });

    it('should return correct boundaries for relaxed config', () => {
      const boundaries = getThresholdBoundaries(RELAXED_RISK_THRESHOLDS);

      expect(boundaries.lowMediumBoundary).toBe(30);
      expect(boundaries.mediumHighBoundary).toBe(80);
    });
  });

  describe('getMatrixThresholdBoundaries', () => {
    it('should return correct boundaries for default config', () => {
      const boundaries = getMatrixThresholdBoundaries(DEFAULT_MATRIX_THRESHOLDS);

      expect(boundaries.lowMediumBoundary).toBe(4);
      expect(boundaries.mediumHighBoundary).toBe(14);
    });

    it('should return correct boundaries for conservative config', () => {
      const boundaries = getMatrixThresholdBoundaries(CONSERVATIVE_MATRIX_THRESHOLDS);

      expect(boundaries.lowMediumBoundary).toBe(2);
      expect(boundaries.mediumHighBoundary).toBe(8);
    });
  });

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  describe('getAvailablePresets', () => {
    it('should return all available preset names', () => {
      const presets = getAvailablePresets();

      expect(presets).toContain('default');
      expect(presets).toContain('conservative');
      expect(presets).toContain('relaxed');
      expect(presets).toHaveLength(3);
    });
  });

  describe('getPresetDescription', () => {
    it('should return description for default preset', () => {
      const description = getPresetDescription('default');

      expect(description).toContain('Standard');
      expect(description).toContain('1-20');
      expect(description).toContain('21-60');
      expect(description).toContain('61-125');
    });

    it('should return description for conservative preset', () => {
      const description = getPresetDescription('conservative');

      expect(description).toContain('high-consequence');
      expect(description).toContain('1-10');
      expect(description).toContain('11-40');
      expect(description).toContain('41-125');
    });

    it('should return description for relaxed preset', () => {
      const description = getPresetDescription('relaxed');

      expect(description).toContain('lower-consequence');
      expect(description).toContain('1-30');
      expect(description).toContain('31-80');
      expect(description).toContain('81-125');
    });

    it('should throw error for unknown preset', () => {
      expect(() => getPresetDescription('unknown' as 'default')).toThrow('Unknown preset');
    });
  });

  describe('getRiskLevelOrder', () => {
    it('should return risk levels in ascending order', () => {
      const order = getRiskLevelOrder();

      expect(order).toEqual(['low', 'medium', 'high']);
    });

    it('should return a new array each time', () => {
      const order1 = getRiskLevelOrder();
      const order2 = getRiskLevelOrder();

      expect(order1).not.toBe(order2);
    });
  });

  // ==========================================================================
  // Integration Tests: Preset Validation
  // ==========================================================================

  describe('Preset Configuration Validation', () => {
    it('all presets should be valid configurations', () => {
      const presets = getAvailablePresets();

      for (const preset of presets) {
        const riskConfig = getPresetRiskThresholds(preset);
        const matrixConfig = getPresetMatrixThresholds(preset);

        const riskValidation = validateRiskThresholdConfig(riskConfig);
        const matrixValidation = validateMatrixThresholdConfig(matrixConfig);

        expect(riskValidation.valid).toBe(true);
        expect(matrixValidation.valid).toBe(true);
      }
    });

    it('all presets should have contiguous thresholds', () => {
      const presets = getAvailablePresets();

      for (const preset of presets) {
        const config = getPresetRiskThresholds(preset);

        // Verify contiguity
        expect(config.medium.min).toBe(config.low.max + 1);
        expect(config.high.min).toBe(config.medium.max + 1);
      }
    });

    it('all presets should cover full score range', () => {
      const presets = getAvailablePresets();

      for (const preset of presets) {
        const config = getPresetRiskThresholds(preset);

        expect(config.low.min).toBe(1);
        expect(config.high.max).toBe(125);
      }
    });
  });

  // ==========================================================================
  // Integration Tests: Round-Trip
  // ==========================================================================

  describe('Round-Trip Configuration', () => {
    it('should create config from boundaries and extract same boundaries', () => {
      const originalLowMedium = 25;
      const originalMediumHigh = 70;

      const config = createRiskThresholdConfig(originalLowMedium, originalMediumHigh);
      const { lowMediumBoundary, mediumHighBoundary } = getThresholdBoundaries(config);

      expect(lowMediumBoundary).toBe(originalLowMedium);
      expect(mediumHighBoundary).toBe(originalMediumHigh);
    });

    it('should create matrix config from boundaries and extract same boundaries', () => {
      const originalLowMedium = 5;
      const originalMediumHigh = 12;

      const config = createMatrixThresholdConfig(originalLowMedium, originalMediumHigh);
      const { lowMediumBoundary, mediumHighBoundary } = getMatrixThresholdBoundaries(config);

      expect(lowMediumBoundary).toBe(originalLowMedium);
      expect(mediumHighBoundary).toBe(originalMediumHigh);
    });
  });
});
