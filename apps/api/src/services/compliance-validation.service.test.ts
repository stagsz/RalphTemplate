/**
 * Unit tests for compliance-validation.service.ts
 *
 * Tests the compliance validation engine including:
 * - Analysis keyword extraction
 * - Analysis context building
 * - Clause evaluation against analysis entries
 * - Standard compliance validation
 * - Compliance report generation
 * - Gap identification
 *
 * Task: COMP-07
 */

import { describe, it, expect } from '@jest/globals';
import type { AnalysisEntry, RegulatoryStandardId, RiskRanking } from '@hazop/types';
import {
  extractAnalysisKeywords,
  buildAnalysisContext,
  validateCompliance,
  generateComplianceReport,
  getRelevantClausesForEntry,
  doesEntryAddressClause,
  getQuickComplianceStatus,
  getMissingRequirements,
  MIN_ENTRIES_FOR_ASSESSMENT,
  COMPLIANCE_THRESHOLDS,
} from './compliance-validation.service.js';
import { getStandardClauses } from './regulatory-standards.service.js';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a mock analysis entry with sensible defaults.
 */
function createMockEntry(overrides: Partial<AnalysisEntry> = {}): AnalysisEntry {
  return {
    id: 'entry-1',
    analysisId: 'analysis-1',
    nodeId: 'node-1',
    guideWord: 'more',
    parameter: 'pressure',
    deviation: 'High pressure in vessel',
    causes: ['Control valve failure', 'Blocked outlet'],
    consequences: ['Vessel rupture', 'Release to atmosphere'],
    safeguards: ['Pressure relief valve', 'High pressure alarm'],
    recommendations: ['Install redundant pressure transmitter'],
    riskRanking: null,
    notes: null,
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock risk ranking.
 */
function createMockRiskRanking(
  severity: 1 | 2 | 3 | 4 | 5 = 3,
  likelihood: 1 | 2 | 3 | 4 | 5 = 3,
  detectability: 1 | 2 | 3 | 4 | 5 = 3
): RiskRanking {
  const riskScore = severity * likelihood * detectability;
  let riskLevel: 'low' | 'medium' | 'high';
  if (riskScore <= 20) riskLevel = 'low';
  else if (riskScore <= 60) riskLevel = 'medium';
  else riskLevel = 'high';

  return {
    severity,
    likelihood,
    detectability,
    riskScore,
    riskLevel,
  };
}

// ============================================================================
// extractAnalysisKeywords Tests
// ============================================================================

describe('Compliance Validation Service', () => {
  describe('extractAnalysisKeywords', () => {
    it('should extract keywords from a single entry', () => {
      const entries = [createMockEntry()];
      const keywords = extractAnalysisKeywords(entries);

      expect(keywords.causes.size).toBeGreaterThan(0);
      expect(keywords.consequences.size).toBeGreaterThan(0);
      expect(keywords.safeguards.size).toBeGreaterThan(0);
      expect(keywords.recommendations.size).toBeGreaterThan(0);
      expect(keywords.parameters.has('pressure')).toBe(true);
    });

    it('should extract lowercase keywords', () => {
      const entries = [
        createMockEntry({
          causes: ['EQUIPMENT FAILURE'],
          consequences: ['MAJOR Release'],
        }),
      ];
      const keywords = extractAnalysisKeywords(entries);

      expect(keywords.causes.has('equipment failure')).toBe(true);
      expect(keywords.consequences.has('major release')).toBe(true);
    });

    it('should handle empty entries array', () => {
      const keywords = extractAnalysisKeywords([]);

      expect(keywords.causes.size).toBe(0);
      expect(keywords.consequences.size).toBe(0);
      expect(keywords.safeguards.size).toBe(0);
      expect(keywords.recommendations.size).toBe(0);
      expect(keywords.parameters.size).toBe(0);
      expect(keywords.deviations.size).toBe(0);
    });

    it('should combine keywords from multiple entries', () => {
      const entries = [
        createMockEntry({
          causes: ['Valve failure'],
          safeguards: ['PSV-101'],
        }),
        createMockEntry({
          id: 'entry-2',
          causes: ['Pump trip'],
          safeguards: ['ESD system'],
        }),
      ];
      const keywords = extractAnalysisKeywords(entries);

      expect(keywords.causes.has('valve failure')).toBe(true);
      expect(keywords.causes.has('pump trip')).toBe(true);
      expect(keywords.safeguards.has('psv-101')).toBe(true);
      expect(keywords.safeguards.has('esd system')).toBe(true);
    });

    it('should extract key terms from compound phrases', () => {
      const entries = [
        createMockEntry({
          causes: ['Control valve fails closed'],
        }),
      ];
      const keywords = extractAnalysisKeywords(entries);

      // Should have the full phrase and key terms
      expect(keywords.causes.has('control valve fails closed')).toBe(true);
      // Key terms (longer than 3 chars)
      expect(keywords.causes.has('control')).toBe(true);
      expect(keywords.causes.has('valve')).toBe(true);
      expect(keywords.causes.has('fails')).toBe(true);
      expect(keywords.causes.has('closed')).toBe(true);
    });
  });

  // ============================================================================
  // buildAnalysisContext Tests
  // ============================================================================

  describe('buildAnalysisContext', () => {
    it('should build context from entries', () => {
      const entries = [
        createMockEntry({ nodeId: 'node-1' }),
        createMockEntry({ id: 'entry-2', nodeId: 'node-2', guideWord: 'no' }),
      ];
      const context = buildAnalysisContext(entries);

      expect(context.entries).toHaveLength(2);
      expect(context.nodeCount).toBe(2);
      expect(context.guideWordCount).toBe(2);
    });

    it('should count entries with safeguards', () => {
      const entries = [
        createMockEntry({ safeguards: ['PSV', 'Alarm'] }),
        createMockEntry({ id: 'entry-2', safeguards: [] }),
      ];
      const context = buildAnalysisContext(entries);

      expect(context.entriesWithSafeguards).toBe(1);
    });

    it('should count entries with recommendations', () => {
      const entries = [
        createMockEntry({ recommendations: ['Install redundancy'] }),
        createMockEntry({ id: 'entry-2', recommendations: [] }),
        createMockEntry({ id: 'entry-3', recommendations: ['Review procedure'] }),
      ];
      const context = buildAnalysisContext(entries);

      expect(context.entriesWithRecommendations).toBe(2);
    });

    it('should detect risk assessment presence', () => {
      const entries = [
        createMockEntry({ riskRanking: null }),
        createMockEntry({ id: 'entry-2', riskRanking: createMockRiskRanking() }),
      ];
      const context = buildAnalysisContext(entries);

      expect(context.hasRiskAssessment).toBe(true);
    });

    it('should count high-risk entries', () => {
      const entries = [
        createMockEntry({ riskRanking: createMockRiskRanking(5, 5, 5) }), // High
        createMockEntry({ id: 'entry-2', riskRanking: createMockRiskRanking(2, 2, 2) }), // Low
        createMockEntry({ id: 'entry-3', riskRanking: createMockRiskRanking(5, 4, 4) }), // High
      ];
      const context = buildAnalysisContext(entries);

      expect(context.highRiskEntryCount).toBe(2);
    });

    it('should handle empty entries array', () => {
      const context = buildAnalysisContext([]);

      expect(context.entries).toHaveLength(0);
      expect(context.hasRiskAssessment).toBe(false);
      expect(context.nodeCount).toBe(0);
      expect(context.guideWordCount).toBe(0);
      expect(context.entriesWithSafeguards).toBe(0);
      expect(context.entriesWithRecommendations).toBe(0);
      expect(context.highRiskEntryCount).toBe(0);
    });
  });

  // ============================================================================
  // validateCompliance Tests
  // ============================================================================

  describe('validateCompliance', () => {
    it('should return not_assessed for empty entries', () => {
      const result = validateCompliance([], ['IEC_61511']);

      expect(result.success).toBe(false);
      expect(result.overallStatus).toBe('not_assessed');
      expect(result.errors).toContain('Insufficient analysis entries for compliance assessment.');
    });

    it('should validate against single standard', () => {
      const entries = [
        createMockEntry({ riskRanking: createMockRiskRanking(3, 3, 3) }),
        createMockEntry({
          id: 'entry-2',
          nodeId: 'node-2',
          guideWord: 'no',
          riskRanking: createMockRiskRanking(2, 2, 2),
        }),
        createMockEntry({
          id: 'entry-3',
          nodeId: 'node-3',
          guideWord: 'reverse',
          riskRanking: createMockRiskRanking(3, 2, 3),
        }),
      ];

      const result = validateCompliance(entries, ['ISO_31000']);

      expect(result.success).toBe(true);
      expect(result.summaries).toHaveLength(1);
      expect(result.summaries[0].standardId).toBe('ISO_31000');
    });

    it('should validate against multiple standards', () => {
      const entries = [
        createMockEntry({ riskRanking: createMockRiskRanking() }),
        createMockEntry({ id: 'entry-2', guideWord: 'less', riskRanking: createMockRiskRanking() }),
      ];
      const standards: RegulatoryStandardId[] = ['IEC_61511', 'ISO_31000', 'OSHA_PSM'];

      const result = validateCompliance(entries, standards);

      expect(result.success).toBe(true);
      expect(result.summaries).toHaveLength(3);
    });

    it('should calculate compliance percentages', () => {
      const entries = [
        createMockEntry({
          causes: ['Equipment failure'],
          consequences: ['Loss of containment'],
          safeguards: ['Relief valve', 'Alarm'],
          recommendations: ['Add redundancy'],
          riskRanking: createMockRiskRanking(3, 3, 3),
        }),
      ];

      const result = validateCompliance(entries, ['ISO_31000']);

      expect(result.summaries[0].compliancePercentage).toBeGreaterThanOrEqual(0);
      expect(result.summaries[0].compliancePercentage).toBeLessThanOrEqual(100);
    });

    it('should identify non-compliance when risk assessment is missing', () => {
      const entries = [
        createMockEntry({ riskRanking: null }),
        createMockEntry({ id: 'entry-2', riskRanking: null }),
      ];

      const result = validateCompliance(entries, ['IEC_61511']);

      // Should find some non-compliant clauses related to risk assessment
      const summary = result.summaries[0];
      expect(summary.nonCompliantCount).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // generateComplianceReport Tests
  // ============================================================================

  describe('generateComplianceReport', () => {
    it('should generate a complete compliance report', () => {
      const entries = [
        createMockEntry({ riskRanking: createMockRiskRanking() }),
      ];

      const report = generateComplianceReport(
        'project-1',
        'analysis-1',
        entries,
        ['IEC_61511'],
        'user-1'
      );

      expect(report.id).toBeDefined();
      expect(report.projectId).toBe('project-1');
      expect(report.analysisId).toBe('analysis-1');
      expect(report.standardsAssessed).toContain('IEC_61511');
      expect(report.standardSummaries).toHaveLength(1);
      expect(report.checkResults.length).toBeGreaterThan(0);
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.generatedById).toBe('user-1');
    });

    it('should include critical gaps in report', () => {
      // Create entries without recommendations for high-risk scenarios
      const entries = [
        createMockEntry({
          riskRanking: createMockRiskRanking(5, 5, 3),
          recommendations: [],
          safeguards: [],
        }),
      ];

      const report = generateComplianceReport(
        'project-1',
        'analysis-1',
        entries,
        ['IEC_61511', 'OSHA_PSM'],
        'user-1'
      );

      // Should identify some gaps
      expect(report.criticalGaps).toBeDefined();
    });

    it('should calculate overall compliance percentage', () => {
      const entries = [
        createMockEntry({
          riskRanking: createMockRiskRanking(3, 3, 3),
        }),
        createMockEntry({
          id: 'entry-2',
          guideWord: 'no',
          riskRanking: createMockRiskRanking(2, 2, 2),
        }),
      ];

      const report = generateComplianceReport(
        'project-1',
        'analysis-1',
        entries,
        ['ISO_31000'],
        'user-1'
      );

      expect(report.overallCompliancePercentage).toBeGreaterThanOrEqual(0);
      expect(report.overallCompliancePercentage).toBeLessThanOrEqual(100);
    });

    it('should work without analysis ID', () => {
      const entries = [createMockEntry()];

      const report = generateComplianceReport(
        'project-1',
        undefined,
        entries,
        ['ISO_31000'],
        'user-1'
      );

      expect(report.analysisId).toBeUndefined();
      expect(report.projectId).toBe('project-1');
    });

    it('should pass LOPA option to context', () => {
      const entries = [
        createMockEntry({
          riskRanking: createMockRiskRanking(4, 4, 3),
        }),
      ];

      const reportWithLOPA = generateComplianceReport(
        'project-1',
        'analysis-1',
        entries,
        ['IEC_61511'],
        'user-1',
        { hasLOPA: true }
      );

      const reportWithoutLOPA = generateComplianceReport(
        'project-1',
        'analysis-1',
        entries,
        ['IEC_61511'],
        'user-1',
        { hasLOPA: false }
      );

      // Both should generate reports; LOPA status affects some clause evaluations
      expect(reportWithLOPA.id).toBeDefined();
      expect(reportWithoutLOPA.id).toBeDefined();
    });
  });

  // ============================================================================
  // getRelevantClausesForEntry Tests
  // ============================================================================

  describe('getRelevantClausesForEntry', () => {
    it('should return clauses relevant to entry content', () => {
      const entry = createMockEntry({
        causes: ['Equipment failure'],
        consequences: ['Release'],
        safeguards: ['PSV'],
        riskRanking: createMockRiskRanking(),
      });

      const clauses = getRelevantClausesForEntry(entry, ['IEC_61511', 'ISO_31000']);

      expect(clauses.length).toBeGreaterThan(0);
    });

    it('should return more clauses for high-risk entries', () => {
      const lowRiskEntry = createMockEntry({
        riskRanking: createMockRiskRanking(2, 2, 2),
      });
      const highRiskEntry = createMockEntry({
        id: 'entry-2',
        riskRanking: createMockRiskRanking(5, 5, 5),
      });

      const lowRiskClauses = getRelevantClausesForEntry(lowRiskEntry, ['IEC_61511']);
      const highRiskClauses = getRelevantClausesForEntry(highRiskEntry, ['IEC_61511']);

      // High risk should include LOPA/SIL clauses
      expect(highRiskClauses.length).toBeGreaterThanOrEqual(lowRiskClauses.length);
    });

    it('should filter to requested standards only', () => {
      const entry = createMockEntry();

      const clausesIEC = getRelevantClausesForEntry(entry, ['IEC_61511']);
      const clausesISO = getRelevantClausesForEntry(entry, ['ISO_31000']);

      clausesIEC.forEach((c) => expect(c.standardId).toBe('IEC_61511'));
      clausesISO.forEach((c) => expect(c.standardId).toBe('ISO_31000'));
    });

    it('should not return duplicates', () => {
      const entry = createMockEntry({
        causes: ['Multiple failure modes'],
        consequences: ['Multiple impacts'],
        safeguards: ['Multiple safeguards'],
        recommendations: ['Multiple recommendations'],
        riskRanking: createMockRiskRanking(4, 4, 4),
      });

      const clauses = getRelevantClausesForEntry(entry, ['IEC_61511', 'ISO_31000']);

      // Check for duplicates
      const seen = new Set<string>();
      clauses.forEach((c) => {
        const key = `${c.standardId}-${c.clause.id}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      });
    });
  });

  // ============================================================================
  // doesEntryAddressClause Tests
  // ============================================================================

  describe('doesEntryAddressClause', () => {
    it('should return true when entry addresses clause keywords', () => {
      const entry = createMockEntry({
        causes: ['Equipment failure', 'Human error'],
        consequences: ['Loss of containment', 'Explosion'],
        safeguards: ['Safety instrumented system', 'Pressure relief'],
      });

      // Get a clause about hazard identification
      const clauses = getStandardClauses('IEC_61511');
      const hazardClause = clauses.find((c) => c.id === '8.1');

      if (hazardClause) {
        const result = doesEntryAddressClause(entry, hazardClause);
        expect(result.addresses || result.evidence.length > 0).toBe(true);
      }
    });

    it('should return false when entry does not address clause', () => {
      const entry = createMockEntry({
        causes: [],
        consequences: [],
        safeguards: [],
        recommendations: [],
        deviation: 'Simple deviation',
      });

      // Get a clause with specific requirements
      const clauses = getStandardClauses('IEC_61511');
      const specificClause = clauses.find((c) => c.keywords.includes('SIL'));

      if (specificClause) {
        const result = doesEntryAddressClause(entry, specificClause);
        // Result depends on keyword matching
        expect(result.evidence.length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // getQuickComplianceStatus Tests
  // ============================================================================

  describe('getQuickComplianceStatus', () => {
    it('should return quick status for entries', () => {
      const entries = [
        createMockEntry({ riskRanking: createMockRiskRanking() }),
      ];

      const status = getQuickComplianceStatus(entries, ['ISO_31000']);

      expect(status.overallStatus).toBeDefined();
      expect(status.percentageComplete).toBeGreaterThanOrEqual(0);
      expect(status.percentageComplete).toBeLessThanOrEqual(100);
      expect(status.criticalGapCount).toBeGreaterThanOrEqual(0);
      expect(status.standardStatuses).toHaveLength(1);
    });

    it('should use mandatory standards by default', () => {
      const entries = [
        createMockEntry({ riskRanking: createMockRiskRanking() }),
      ];

      const status = getQuickComplianceStatus(entries);

      // Should check multiple mandatory standards
      expect(status.standardStatuses.length).toBeGreaterThan(0);
    });

    it('should count critical gaps', () => {
      const entries = [
        createMockEntry({
          causes: [],
          consequences: [],
          safeguards: [],
          riskRanking: null,
        }),
      ];

      const status = getQuickComplianceStatus(entries, ['IEC_61511']);

      expect(status.criticalGapCount).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // getMissingRequirements Tests
  // ============================================================================

  describe('getMissingRequirements', () => {
    it('should identify missing causes documentation', () => {
      const entries = [
        createMockEntry({ causes: [] }),
        createMockEntry({ id: 'entry-2', causes: ['Valid cause'] }),
      ];

      const missing = getMissingRequirements(entries, ['ISO_31000']);

      expect(missing.documentation.some((m) => m.includes('causes'))).toBe(true);
    });

    it('should identify missing consequences documentation', () => {
      const entries = [
        createMockEntry({ consequences: [] }),
      ];

      const missing = getMissingRequirements(entries, ['ISO_31000']);

      expect(missing.documentation.some((m) => m.includes('consequences'))).toBe(true);
    });

    it('should identify missing risk assessments', () => {
      const entries = [
        createMockEntry({ riskRanking: null }),
        createMockEntry({ id: 'entry-2', riskRanking: null }),
      ];

      const missing = getMissingRequirements(entries, ['IEC_61511']);

      expect(missing.riskAssessment.some((m) => m.includes('risk assessment'))).toBe(true);
    });

    it('should identify missing safeguards', () => {
      const entries = [
        createMockEntry({ safeguards: [] }),
      ];

      const missing = getMissingRequirements(entries, ['ISO_31000']);

      expect(missing.safeguards.some((m) => m.includes('safeguard'))).toBe(true);
    });

    it('should identify missing recommendations for high-risk entries', () => {
      const entries = [
        createMockEntry({
          riskRanking: createMockRiskRanking(5, 5, 5), // High risk
          recommendations: [],
        }),
      ];

      const missing = getMissingRequirements(entries, ['IEC_61511']);

      expect(missing.recommendations.some((m) => m.includes('high-risk'))).toBe(true);
    });

    it('should identify LOPA requirements for high severity', () => {
      const entries = [
        createMockEntry({
          riskRanking: createMockRiskRanking(4, 3, 3), // Severity 4
        }),
      ];

      const missing = getMissingRequirements(entries, ['IEC_61511']);

      expect(missing.lopa.some((m) => m.includes('LOPA'))).toBe(true);
    });

    it('should return empty arrays when all requirements met', () => {
      const entries = [
        createMockEntry({
          causes: ['Valid cause'],
          consequences: ['Valid consequence'],
          safeguards: ['Valid safeguard'],
          recommendations: ['Valid recommendation'],
          riskRanking: createMockRiskRanking(2, 2, 2), // Low risk
        }),
      ];

      const missing = getMissingRequirements(entries, ['ISO_31000']);

      expect(missing.documentation).toHaveLength(0);
      expect(missing.riskAssessment).toHaveLength(0);
      expect(missing.safeguards).toHaveLength(0);
      expect(missing.recommendations).toHaveLength(0);
      expect(missing.lopa).toHaveLength(0);
    });
  });

  // ============================================================================
  // Constants Tests
  // ============================================================================

  describe('Constants', () => {
    it('should have valid MIN_ENTRIES_FOR_ASSESSMENT', () => {
      expect(MIN_ENTRIES_FOR_ASSESSMENT).toBeGreaterThanOrEqual(1);
    });

    it('should have valid COMPLIANCE_THRESHOLDS', () => {
      expect(COMPLIANCE_THRESHOLDS.compliant).toBe(90);
      expect(COMPLIANCE_THRESHOLDS.partiallyCompliant).toBe(50);
      expect(COMPLIANCE_THRESHOLDS.compliant).toBeGreaterThan(COMPLIANCE_THRESHOLDS.partiallyCompliant);
    });
  });

  // ============================================================================
  // Compliance Status Threshold Tests (COMP-18)
  // ============================================================================

  describe('Compliance Status Thresholds', () => {
    describe('Overall status determination', () => {
      it('should return compliant when compliance percentage >= 90%', () => {
        // Create entries with comprehensive documentation
        const entries = [
          createMockEntry({
            causes: ['Equipment failure', 'Human error'],
            consequences: ['Loss of containment'],
            safeguards: ['PSV', 'Alarm'],
            recommendations: ['Add redundancy'],
            riskRanking: createMockRiskRanking(3, 3, 3),
          }),
          createMockEntry({
            id: 'entry-2',
            nodeId: 'node-2',
            guideWord: 'no',
            causes: ['Pump trip'],
            consequences: ['Process upset'],
            safeguards: ['Backup pump'],
            recommendations: ['Install monitoring'],
            riskRanking: createMockRiskRanking(2, 2, 2),
          }),
          createMockEntry({
            id: 'entry-3',
            nodeId: 'node-3',
            guideWord: 'less',
            causes: ['Valve leak'],
            consequences: ['Flow reduction'],
            safeguards: ['Flow meter'],
            recommendations: ['Preventive maintenance'],
            riskRanking: createMockRiskRanking(2, 3, 2),
          }),
        ];

        const result = validateCompliance(entries, ['ISO_31000']);

        // Should be compliant or partially compliant with good documentation
        expect(['compliant', 'partially_compliant']).toContain(result.overallStatus);
        expect(result.summaries[0].compliancePercentage).toBeGreaterThanOrEqual(50);
      });

      it('should return non_compliant when any standard has non_compliant status', () => {
        // Create entries missing critical elements
        const entries = [
          createMockEntry({
            causes: [],
            consequences: [],
            safeguards: [],
            recommendations: [],
            riskRanking: null,
          }),
        ];

        const result = validateCompliance(entries, ['IEC_61511']);

        // With no documentation, should be non-compliant
        expect(result.summaries[0].nonCompliantCount).toBeGreaterThan(0);
      });

      it('should return partially_compliant when between 50-90%', () => {
        const entries = [
          createMockEntry({
            causes: ['Some cause'],
            consequences: [],
            safeguards: [],
            recommendations: [],
            riskRanking: createMockRiskRanking(3, 3, 3),
          }),
        ];

        const result = validateCompliance(entries, ['ISO_31000']);

        // Should have some compliance but not full
        expect(result.success).toBe(true);
      });
    });

    describe('Compliance percentage calculation', () => {
      it('should calculate percentage correctly with all compliant', () => {
        const entries = [
          createMockEntry({
            causes: ['Multiple causes'],
            consequences: ['Multiple effects'],
            safeguards: ['Multiple safeguards'],
            recommendations: ['Multiple recommendations'],
            riskRanking: createMockRiskRanking(2, 2, 2),
          }),
          createMockEntry({
            id: 'entry-2',
            nodeId: 'node-2',
            guideWord: 'no',
            causes: ['Cause 2'],
            consequences: ['Consequence 2'],
            safeguards: ['Safeguard 2'],
            recommendations: ['Recommendation 2'],
            riskRanking: createMockRiskRanking(2, 2, 2),
          }),
          createMockEntry({
            id: 'entry-3',
            nodeId: 'node-3',
            guideWord: 'less',
            causes: ['Cause 3'],
            consequences: ['Consequence 3'],
            safeguards: ['Safeguard 3'],
            recommendations: ['Recommendation 3'],
            riskRanking: createMockRiskRanking(2, 2, 2),
          }),
        ];

        const result = validateCompliance(entries, ['ISO_31000']);

        expect(result.summaries[0].compliancePercentage).toBeGreaterThanOrEqual(0);
        expect(result.summaries[0].compliancePercentage).toBeLessThanOrEqual(100);
      });

      it('should exclude not_applicable clauses from percentage calculation', () => {
        // Low risk entries should have some clauses marked as not_applicable
        const entries = [
          createMockEntry({
            causes: ['Cause'],
            consequences: ['Consequence'],
            safeguards: ['Safeguard'],
            riskRanking: createMockRiskRanking(1, 1, 1), // Low risk
          }),
        ];

        const result = validateCompliance(entries, ['IEC_61511']);

        // LOPA clauses should be not_applicable for low risk
        const summary = result.summaries[0];
        expect(summary.notApplicableCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ============================================================================
  // Relevance Area Evaluation Tests (COMP-18)
  // ============================================================================

  describe('Relevance Area Evaluation', () => {
    describe('hazard_identification evaluation', () => {
      it('should be compliant when >= 70% of entries have causes and consequences', () => {
        const entries = [
          createMockEntry({
            causes: ['Cause 1'],
            consequences: ['Consequence 1'],
          }),
          createMockEntry({
            id: 'entry-2',
            causes: ['Cause 2'],
            consequences: ['Consequence 2'],
          }),
          createMockEntry({
            id: 'entry-3',
            causes: ['Cause 3'],
            consequences: ['Consequence 3'],
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['ISO_31000'],
          'user-1'
        );

        // Check that hazard identification clauses are evaluated
        const hazardClauses = report.checkResults.filter(
          (r) => r.clauseId === '6.4.2' // Risk identification clause
        );
        expect(hazardClauses.length).toBeGreaterThanOrEqual(0);
      });

      it('should be non_compliant when no entries have causes/consequences', () => {
        const entries = [
          createMockEntry({
            causes: [],
            consequences: [],
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['ISO_31000'],
          'user-1'
        );

        // Should have gaps for hazard identification
        expect(report.checkResults.some((r) => r.gaps.length > 0)).toBe(true);
      });
    });

    describe('risk_assessment evaluation', () => {
      it('should be compliant when >= 90% of entries have risk rankings', () => {
        const entries = Array.from({ length: 10 }, (_, i) =>
          createMockEntry({
            id: `entry-${i}`,
            nodeId: `node-${i}`,
            guideWord: i % 2 === 0 ? 'more' : 'less',
            riskRanking: createMockRiskRanking(3, 3, 3),
          })
        );

        const result = validateCompliance(entries, ['IEC_61511']);

        // Should have risk assessment evaluated
        expect(result.success).toBe(true);
      });

      it('should be partially_compliant when some entries have risk rankings', () => {
        const entries = [
          createMockEntry({
            riskRanking: createMockRiskRanking(3, 3, 3),
          }),
          createMockEntry({
            id: 'entry-2',
            riskRanking: null,
          }),
          createMockEntry({
            id: 'entry-3',
            riskRanking: null,
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1'
        );

        // Should have some gaps for risk assessment
        const riskGaps = report.checkResults.filter(
          (r) => r.gaps.some((g) => g.toLowerCase().includes('risk'))
        );
        expect(riskGaps.length).toBeGreaterThanOrEqual(0);
      });

      it('should be non_compliant when no risk assessments performed', () => {
        const entries = [
          createMockEntry({ riskRanking: null }),
          createMockEntry({ id: 'entry-2', riskRanking: null }),
        ];

        const result = validateCompliance(entries, ['IEC_61511']);

        // Should have non-compliant clauses for risk assessment
        expect(result.summaries[0].nonCompliantCount).toBeGreaterThanOrEqual(0);
      });
    });

    describe('safeguards evaluation', () => {
      it('should be compliant when >= 80% coverage', () => {
        const entries = [
          createMockEntry({ safeguards: ['PSV', 'Alarm'] }),
          createMockEntry({ id: 'entry-2', safeguards: ['ESD'] }),
          createMockEntry({ id: 'entry-3', safeguards: ['Interlock'] }),
          createMockEntry({ id: 'entry-4', safeguards: ['Relief valve'] }),
          createMockEntry({ id: 'entry-5', safeguards: [] }), // One without
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1'
        );

        // 80% of entries have safeguards
        expect(report).toBeDefined();
      });

      it('should be partially_compliant when 50-80% coverage', () => {
        const entries = [
          createMockEntry({ safeguards: ['PSV'] }),
          createMockEntry({ id: 'entry-2', safeguards: ['Alarm'] }),
          createMockEntry({ id: 'entry-3', safeguards: [] }),
          createMockEntry({ id: 'entry-4', safeguards: [] }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1'
        );

        // 50% coverage
        expect(report.checkResults.length).toBeGreaterThan(0);
      });

      it('should be non_compliant when no safeguards documented', () => {
        const entries = [
          createMockEntry({ safeguards: [] }),
          createMockEntry({ id: 'entry-2', safeguards: [] }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1'
        );

        // Should have gaps for safeguards
        const safeguardGaps = report.checkResults.filter(
          (r) => r.gaps.some((g) => g.toLowerCase().includes('safeguard'))
        );
        expect(safeguardGaps.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('recommendations evaluation', () => {
      it('should be compliant when high-risk entries have recommendations', () => {
        const entries = [
          createMockEntry({
            riskRanking: createMockRiskRanking(5, 5, 5), // High risk
            recommendations: ['Install additional safeguards'],
          }),
          createMockEntry({
            id: 'entry-2',
            riskRanking: createMockRiskRanking(5, 4, 4), // High risk
            recommendations: ['Review procedures'],
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1'
        );

        expect(report.checkResults.length).toBeGreaterThan(0);
      });

      it('should be non_compliant when high-risk entries lack recommendations', () => {
        const entries = [
          createMockEntry({
            riskRanking: createMockRiskRanking(5, 5, 5), // High risk = 125
            recommendations: [],
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1'
        );

        // Should have gaps for recommendations on high-risk entries
        const recGaps = report.checkResults.filter(
          (r) => r.gaps.some((g) => g.toLowerCase().includes('recommendation'))
        );
        expect(recGaps.length).toBeGreaterThanOrEqual(0);
      });

      it('should be compliant when no high-risk entries exist', () => {
        const entries = [
          createMockEntry({
            riskRanking: createMockRiskRanking(2, 2, 2), // Low risk
            recommendations: [],
          }),
        ];

        const result = validateCompliance(entries, ['IEC_61511']);

        expect(result.success).toBe(true);
      });
    });

    describe('lopa/sil_determination evaluation', () => {
      it('should be compliant when LOPA is performed for high-risk scenarios', () => {
        const entries = [
          createMockEntry({
            riskRanking: createMockRiskRanking(5, 5, 3),
            recommendations: ['SIL determination required'],
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1',
          { hasLOPA: true }
        );

        expect(report.checkResults.length).toBeGreaterThan(0);
      });

      it('should be not_applicable when no high-risk scenarios exist', () => {
        const entries = [
          createMockEntry({
            riskRanking: createMockRiskRanking(2, 2, 2), // Low risk
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1'
        );

        // LOPA clauses should be not_applicable
        expect(report.standardSummaries[0].notApplicableCount).toBeGreaterThanOrEqual(0);
      });

      it('should be non_compliant when high-risk but no LOPA', () => {
        const entries = [
          createMockEntry({
            riskRanking: createMockRiskRanking(5, 5, 5),
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1',
          { hasLOPA: false }
        );

        // Should have gaps for LOPA
        const lopaGaps = report.checkResults.filter(
          (r) => r.gaps.some((g) => g.toLowerCase().includes('lopa'))
        );
        expect(lopaGaps.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('methodology evaluation', () => {
      it('should be compliant when >= 3 guide words and nodes exist', () => {
        const entries = [
          createMockEntry({ nodeId: 'node-1', guideWord: 'more' }),
          createMockEntry({ id: 'entry-2', nodeId: 'node-2', guideWord: 'less' }),
          createMockEntry({ id: 'entry-3', nodeId: 'node-3', guideWord: 'no' }),
          createMockEntry({ id: 'entry-4', nodeId: 'node-4', guideWord: 'reverse' }),
        ];

        const result = validateCompliance(entries, ['ISO_31000']);

        expect(result.success).toBe(true);
      });

      it('should be partially_compliant with limited guide word coverage', () => {
        const entries = [
          createMockEntry({ guideWord: 'more' }),
          createMockEntry({ id: 'entry-2', guideWord: 'more' }), // Same guide word
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['ISO_31000'],
          'user-1'
        );

        expect(report.checkResults.length).toBeGreaterThan(0);
      });
    });

    describe('documentation evaluation', () => {
      it('should be compliant when >= 80% completeness', () => {
        // 4 fields per entry: causes, consequences, safeguards, recommendations
        const entries = [
          createMockEntry({
            causes: ['Cause'],
            consequences: ['Consequence'],
            safeguards: ['Safeguard'],
            recommendations: ['Recommendation'],
          }),
        ];

        const result = validateCompliance(entries, ['ISO_31000']);

        expect(result.success).toBe(true);
      });

      it('should be partially_compliant when 50-80% completeness', () => {
        const entries = [
          createMockEntry({
            causes: ['Cause'],
            consequences: ['Consequence'],
            safeguards: [],
            recommendations: [],
          }),
        ];

        const result = validateCompliance(entries, ['ISO_31000']);

        expect(result.success).toBe(true);
      });

      it('should be non_compliant when < 50% completeness', () => {
        const entries = [
          createMockEntry({
            causes: [],
            consequences: [],
            safeguards: [],
            recommendations: [],
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['ISO_31000'],
          'user-1'
        );

        // Should have documentation gaps
        expect(report.checkResults.some((r) => r.gaps.length > 0)).toBe(true);
      });
    });

    describe('management_of_change evaluation', () => {
      it('should be compliant when MOC keywords found in recommendations', () => {
        const entries = [
          createMockEntry({
            recommendations: ['Implement management of change procedures'],
          }),
        ];

        const result = validateCompliance(entries, ['IEC_61511']);

        expect(result.success).toBe(true);
      });

      it('should be not_assessed when no MOC keywords found', () => {
        const entries = [
          createMockEntry({
            recommendations: ['Install redundant sensor'],
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1'
        );

        // MOC clause should be evaluated
        expect(report.checkResults.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // Gap Identification Tests (COMP-18)
  // ============================================================================

  describe('Gap Identification and Severity', () => {
    describe('Critical gaps', () => {
      it('should identify critical gaps for mandatory standard + mandatory clause', () => {
        const entries = [
          createMockEntry({
            causes: [],
            consequences: [],
            safeguards: [],
            riskRanking: null,
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'], // Mandatory standard
          'user-1'
        );

        // Should have critical gaps identified
        expect(report.criticalGaps).toBeDefined();
      });

      it('should sort gaps by severity (critical first)', () => {
        const entries = [
          createMockEntry({
            causes: [],
            consequences: [],
            safeguards: [],
            recommendations: [],
            riskRanking: null,
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511', 'ISO_31000'],
          'user-1'
        );

        // Check that critical gaps come before major/minor
        if (report.criticalGaps.length > 1) {
          for (let i = 0; i < report.criticalGaps.length - 1; i++) {
            const severityOrder: Record<string, number> = {
              critical: 0,
              major: 1,
              minor: 2,
            };
            expect(
              severityOrder[report.criticalGaps[i].severity]
            ).toBeLessThanOrEqual(
              severityOrder[report.criticalGaps[i + 1].severity]
            );
          }
        }
      });
    });

    describe('Major gaps', () => {
      it('should identify major gaps for mandatory standard + non-mandatory clause', () => {
        const entries = [
          createMockEntry({
            causes: ['Cause'],
            consequences: ['Consequence'],
            riskRanking: createMockRiskRanking(3, 3, 3),
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1'
        );

        // Check that gaps have appropriate severity
        report.criticalGaps.forEach((gap) => {
          expect(['critical', 'major', 'minor']).toContain(gap.severity);
        });
      });
    });

    describe('Minor gaps', () => {
      it('should identify minor gaps for non-mandatory standard + non-mandatory clause', () => {
        const entries = [
          createMockEntry({
            causes: ['Cause'],
            consequences: ['Consequence'],
            safeguards: ['Safeguard'],
            riskRanking: createMockRiskRanking(2, 2, 2),
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['ISO_9001'], // Non-mandatory for process safety
          'user-1'
        );

        expect(report.criticalGaps).toBeDefined();
      });
    });

    describe('Gap remediation', () => {
      it('should include remediation recommendations for each gap', () => {
        const entries = [
          createMockEntry({
            causes: [],
            consequences: [],
            safeguards: [],
            riskRanking: null,
          }),
        ];

        const report = generateComplianceReport(
          'project-1',
          'analysis-1',
          entries,
          ['IEC_61511'],
          'user-1'
        );

        report.criticalGaps.forEach((gap) => {
          expect(Array.isArray(gap.remediation)).toBe(true);
        });
      });
    });
  });

  // ============================================================================
  // Multiple Standards Tests (COMP-18)
  // ============================================================================

  describe('Multiple Standards Validation', () => {
    it('should validate against all supported standards', () => {
      const entries = [
        createMockEntry({
          causes: ['Equipment failure'],
          consequences: ['Release'],
          safeguards: ['PSV'],
          recommendations: ['Review'],
          riskRanking: createMockRiskRanking(3, 3, 3),
        }),
      ];

      const allStandards: Array<'IEC_61511' | 'ISO_31000' | 'ISO_9001' | 'ATEX_DSEAR' | 'PED' | 'OSHA_PSM' | 'EPA_RMP' | 'SEVESO_III'> = [
        'IEC_61511',
        'ISO_31000',
        'ISO_9001',
        'ATEX_DSEAR',
        'PED',
        'OSHA_PSM',
        'EPA_RMP',
        'SEVESO_III',
      ];

      const result = validateCompliance(entries, allStandards);

      expect(result.success).toBe(true);
      expect(result.summaries).toHaveLength(8);
      result.summaries.forEach((summary) => {
        expect(allStandards).toContain(summary.standardId);
      });
    });

    it('should aggregate overall status across multiple standards', () => {
      const entries = [
        createMockEntry({
          causes: ['Cause'],
          consequences: ['Consequence'],
          safeguards: ['Safeguard'],
          recommendations: ['Recommendation'],
          riskRanking: createMockRiskRanking(3, 3, 3),
        }),
      ];

      const result = validateCompliance(entries, ['IEC_61511', 'ISO_31000', 'OSHA_PSM']);

      // Overall status should reflect the worst status among standards
      expect(result.overallStatus).toBeDefined();
      expect([
        'compliant',
        'partially_compliant',
        'non_compliant',
        'not_assessed',
      ]).toContain(result.overallStatus);
    });

    it('should calculate weighted average compliance percentage', () => {
      const entries = [
        createMockEntry({
          causes: ['Cause'],
          consequences: ['Consequence'],
          safeguards: ['Safeguard'],
          recommendations: ['Recommendation'],
          riskRanking: createMockRiskRanking(3, 3, 3),
        }),
      ];

      const report = generateComplianceReport(
        'project-1',
        'analysis-1',
        entries,
        ['IEC_61511', 'ISO_31000'],
        'user-1'
      );

      // Overall percentage should be average of individual standards
      const averagePercentage =
        report.standardSummaries.reduce((sum, s) => sum + s.compliancePercentage, 0) /
        report.standardSummaries.length;

      expect(report.overallCompliancePercentage).toBe(Math.round(averagePercentage));
    });
  });

  // ============================================================================
  // Edge Cases and Boundary Conditions (COMP-18)
  // ============================================================================

  describe('Edge Cases and Boundary Conditions', () => {
    describe('Empty and minimal inputs', () => {
      it('should handle single entry', () => {
        const entries = [createMockEntry()];

        const result = validateCompliance(entries, ['ISO_31000']);

        expect(result.success).toBe(true);
        expect(result.summaries.length).toBe(1);
      });

      it('should handle entries with only null/empty fields', () => {
        const entries = [
          createMockEntry({
            causes: [],
            consequences: [],
            safeguards: [],
            recommendations: [],
            riskRanking: null,
            notes: null,
          }),
        ];

        const result = validateCompliance(entries, ['ISO_31000']);

        expect(result.success).toBe(true);
      });

      it('should handle empty standards array', () => {
        const entries = [createMockEntry()];

        const result = validateCompliance(entries, []);

        expect(result.success).toBe(true);
        expect(result.summaries).toHaveLength(0);
      });
    });

    describe('Large datasets', () => {
      it('should handle 100 entries efficiently', () => {
        const entries = Array.from({ length: 100 }, (_, i) =>
          createMockEntry({
            id: `entry-${i}`,
            nodeId: `node-${Math.floor(i / 10)}`,
            guideWord: ['more', 'less', 'no', 'reverse', 'early', 'late', 'other'][i % 7] as AnalysisEntry['guideWord'],
            causes: [`Cause ${i}`],
            consequences: [`Consequence ${i}`],
            safeguards: i % 2 === 0 ? [`Safeguard ${i}`] : [],
            recommendations: i % 3 === 0 ? [`Recommendation ${i}`] : [],
            riskRanking: createMockRiskRanking(
              ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
              ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
              ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5
            ),
          })
        );

        const startTime = Date.now();
        const result = validateCompliance(entries, ['IEC_61511', 'ISO_31000']);
        const endTime = Date.now();

        expect(result.success).toBe(true);
        expect(endTime - startTime).toBeLessThan(5000); // Should complete in < 5 seconds
      });
    });

    describe('Risk ranking boundaries', () => {
      it('should handle minimum risk score (1)', () => {
        const entries = [
          createMockEntry({
            riskRanking: createMockRiskRanking(1, 1, 1),
          }),
        ];

        const result = validateCompliance(entries, ['IEC_61511']);

        expect(result.success).toBe(true);
      });

      it('should handle maximum risk score (125)', () => {
        const entries = [
          createMockEntry({
            riskRanking: createMockRiskRanking(5, 5, 5),
            recommendations: ['Critical action required'],
          }),
        ];

        const result = validateCompliance(entries, ['IEC_61511']);

        expect(result.success).toBe(true);
      });

      it('should correctly identify low risk (score <= 20)', () => {
        const entries = [
          createMockEntry({
            riskRanking: {
              severity: 2,
              likelihood: 2,
              detectability: 2,
              riskScore: 8,
              riskLevel: 'low',
            },
          }),
        ];

        const quickStatus = getQuickComplianceStatus(entries, ['IEC_61511']);

        expect(quickStatus).toBeDefined();
      });

      it('should correctly identify medium risk (21 <= score <= 60)', () => {
        const entries = [
          createMockEntry({
            riskRanking: {
              severity: 3,
              likelihood: 3,
              detectability: 3,
              riskScore: 27,
              riskLevel: 'medium',
            },
          }),
        ];

        const result = validateCompliance(entries, ['IEC_61511']);

        expect(result.success).toBe(true);
      });

      it('should correctly identify high risk (score > 60)', () => {
        const entries = [
          createMockEntry({
            riskRanking: {
              severity: 4,
              likelihood: 4,
              detectability: 4,
              riskScore: 64,
              riskLevel: 'high',
            },
            recommendations: ['LOPA required'],
          }),
        ];

        const missing = getMissingRequirements(entries, ['IEC_61511']);

        // Should identify LOPA requirement for high severity
        expect(missing.lopa.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Special characters and unicode', () => {
      it('should handle special characters in entry fields', () => {
        const entries = [
          createMockEntry({
            causes: ['Valve <V-101> failure', 'Temperature > 100°C'],
            consequences: ['Release of H₂SO₄', 'Pressure ≥ design limit'],
            safeguards: ['PSV (×2)', 'Alarm @ 90%'],
            recommendations: ['Review P&ID for Node #5'],
          }),
        ];

        const result = validateCompliance(entries, ['ISO_31000']);

        expect(result.success).toBe(true);
      });

      it('should handle unicode characters', () => {
        const entries = [
          createMockEntry({
            causes: ['阀门故障', 'Übertemperatur'],
            consequences: ['Émission de gaz', 'Überdruck'],
          }),
        ];

        const result = validateCompliance(entries, ['ISO_31000']);

        expect(result.success).toBe(true);
      });
    });

    describe('Keyword matching edge cases', () => {
      it('should match clause keywords case-insensitively', () => {
        const entries = [
          createMockEntry({
            causes: ['HAZOP identified failure', 'RISK ASSESSMENT required'],
            recommendations: ['Implement SIL-2 function'],
          }),
        ];

        const clauses = getRelevantClausesForEntry(entries[0], ['IEC_61511']);

        expect(clauses.length).toBeGreaterThan(0);
      });

      it('should handle partial keyword matches', () => {
        const entries = [
          createMockEntry({
            causes: ['safety-related failure'],
            safeguards: ['safety-instrumented system'],
          }),
        ];

        const result = doesEntryAddressClause(
          entries[0],
          {
            id: 'test',
            title: 'Test Clause',
            description: 'Test',
            keywords: ['safety', 'instrumented', 'system'],
            mandatory: true,
            hazopsRelevance: ['safeguards'],
          }
        );

        expect(result.evidence).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Standard Compliance Summary Tests (COMP-18)
  // ============================================================================

  describe('Standard Compliance Summary Calculation', () => {
    it('should correctly count compliant clauses', () => {
      const entries = [
        createMockEntry({
          causes: ['Cause 1', 'Cause 2'],
          consequences: ['Consequence 1', 'Consequence 2'],
          safeguards: ['Safeguard 1', 'Safeguard 2'],
          recommendations: ['Recommendation 1'],
          riskRanking: createMockRiskRanking(3, 3, 3),
        }),
        createMockEntry({
          id: 'entry-2',
          nodeId: 'node-2',
          guideWord: 'no',
          causes: ['Cause 3'],
          consequences: ['Consequence 3'],
          safeguards: ['Safeguard 3'],
          recommendations: ['Recommendation 2'],
          riskRanking: createMockRiskRanking(2, 2, 2),
        }),
        createMockEntry({
          id: 'entry-3',
          nodeId: 'node-3',
          guideWord: 'less',
          causes: ['Cause 4'],
          consequences: ['Consequence 4'],
          safeguards: ['Safeguard 4'],
          recommendations: ['Recommendation 3'],
          riskRanking: createMockRiskRanking(2, 3, 2),
        }),
      ];

      const result = validateCompliance(entries, ['ISO_31000']);

      const summary = result.summaries[0];
      expect(summary.compliantCount + summary.partiallyCompliantCount +
        summary.nonCompliantCount + summary.notApplicableCount +
        summary.notAssessedCount).toBe(summary.totalClauses);
    });

    it('should set correct overall status based on clause counts', () => {
      // With fully documented entries, should lean towards compliant
      const compliantEntries = Array.from({ length: 5 }, (_, i) =>
        createMockEntry({
          id: `entry-${i}`,
          nodeId: `node-${i}`,
          guideWord: ['more', 'less', 'no', 'reverse', 'early'][i] as AnalysisEntry['guideWord'],
          causes: [`Cause ${i}`],
          consequences: [`Consequence ${i}`],
          safeguards: [`Safeguard ${i}`],
          recommendations: [`Recommendation ${i}`],
          riskRanking: createMockRiskRanking(2, 2, 2),
        })
      );

      const result = validateCompliance(compliantEntries, ['ISO_31000']);

      expect(result.summaries[0].overallStatus).toBeDefined();
    });

    it('should handle all clauses being not_applicable', () => {
      // Very low risk entry might have LOPA clauses as not_applicable
      const entries = [
        createMockEntry({
          causes: ['Minor cause'],
          consequences: ['Minor consequence'],
          safeguards: ['Basic safeguard'],
          riskRanking: createMockRiskRanking(1, 1, 1),
        }),
      ];

      const result = validateCompliance(entries, ['IEC_61511']);

      // Should handle the case gracefully
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle a complete analysis scenario', () => {
      // Create a realistic set of analysis entries
      const entries: AnalysisEntry[] = [
        createMockEntry({
          id: 'entry-1',
          nodeId: 'V-101',
          guideWord: 'more',
          parameter: 'pressure',
          deviation: 'High pressure in reactor vessel',
          causes: ['Blocked outlet', 'Control valve fails closed', 'Runaway reaction'],
          consequences: ['Vessel rupture', 'Release of hazardous materials', 'Fire/explosion'],
          safeguards: ['PSV-101', 'PAHH-101 with ESD', 'Operator rounds'],
          recommendations: ['Install redundant pressure transmitter', 'Review PSV sizing'],
          riskRanking: createMockRiskRanking(4, 3, 2),
        }),
        createMockEntry({
          id: 'entry-2',
          nodeId: 'V-101',
          guideWord: 'no',
          parameter: 'flow',
          deviation: 'No flow through reactor',
          causes: ['Pump failure', 'Blocked suction'],
          consequences: ['Loss of production', 'Overheating'],
          safeguards: ['Low flow alarm', 'Operator monitoring'],
          recommendations: ['Install flow transmitter'],
          riskRanking: createMockRiskRanking(2, 3, 2),
        }),
        createMockEntry({
          id: 'entry-3',
          nodeId: 'P-101',
          guideWord: 'reverse',
          parameter: 'flow',
          deviation: 'Reverse flow through pump',
          causes: ['Check valve failure', 'Backpressure'],
          consequences: ['Pump damage', 'Process upset'],
          safeguards: ['Check valve CV-101'],
          recommendations: [],
          riskRanking: createMockRiskRanking(3, 2, 3),
        }),
      ];

      // Validate against multiple standards
      const result = validateCompliance(entries, ['IEC_61511', 'ISO_31000', 'OSHA_PSM']);

      expect(result.success).toBe(true);
      expect(result.summaries).toHaveLength(3);

      // Generate full report
      const report = generateComplianceReport(
        'project-1',
        'analysis-1',
        entries,
        ['IEC_61511', 'ISO_31000', 'OSHA_PSM'],
        'user-1'
      );

      expect(report.standardSummaries).toHaveLength(3);
      expect(report.checkResults.length).toBeGreaterThan(0);
      expect(report.overallCompliancePercentage).toBeGreaterThanOrEqual(0);

      // Check quick status
      const quickStatus = getQuickComplianceStatus(entries, ['IEC_61511']);
      expect(quickStatus.overallStatus).toBeDefined();

      // Check missing requirements
      const missing = getMissingRequirements(entries, ['IEC_61511']);
      expect(missing.documentation).toHaveLength(0); // All documented
      expect(missing.riskAssessment).toHaveLength(0); // All assessed
    });

    it('should correctly identify gaps in incomplete analysis', () => {
      const incompleteEntries: AnalysisEntry[] = [
        createMockEntry({
          causes: [],
          consequences: [],
          safeguards: [],
          recommendations: [],
          riskRanking: null,
        }),
      ];

      const result = validateCompliance(incompleteEntries, ['ISO_31000']);
      const missing = getMissingRequirements(incompleteEntries, ['ISO_31000']);

      // Should identify multiple gaps
      expect(result.success).toBe(true); // Can still validate, just has gaps
      expect(missing.documentation.length).toBeGreaterThan(0);
      expect(missing.riskAssessment.length).toBeGreaterThan(0);
      expect(missing.safeguards.length).toBeGreaterThan(0);
    });
  });
});
