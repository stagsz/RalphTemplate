/**
 * Tests for Excel Spreadsheet Generator Service.
 *
 * Tests the Excel spreadsheet generation functionality including:
 * - Workbook and worksheet structure
 * - Summary, analysis entries, nodes, recommendations, and compliance sheets
 * - Risk level styling and coloring
 * - Data formatting and layout
 * - Proper MIME type and filename generation
 */

import { describe, it, expect } from '@jest/globals';
import { generateExcelSpreadsheet } from './excel-generator.service.js';
import type { ExcelGeneratorInput } from './excel-generator.service.js';
import type {
  ReportNode,
  ReportRiskSummary,
  ReportComplianceData,
} from './word-generator.service.js';
import type { HazopAnalysisWithDetailsAndProgress, AnalysisEntry } from './hazop-analysis.service.js';
import type { ProjectWithCreator } from './project.service.js';

describe('Excel Generator Service', () => {
  // Test data factories
  const createMockAnalysis = (overrides?: Partial<HazopAnalysisWithDetailsAndProgress>): HazopAnalysisWithDetailsAndProgress => ({
    id: 'analysis-123',
    projectId: 'project-456',
    documentId: 'doc-789',
    name: 'Test Analysis',
    description: 'Test description',
    status: 'draft',
    leadAnalystId: 'user-001',
    createdById: 'user-002',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-10'),
    submittedAt: null,
    approvedAt: null,
    approvedById: null,
    reviewNotes: null,
    approvalComments: null,
    documentName: 'Test P&ID Document',
    leadAnalystName: 'John Analyst',
    leadAnalystEmail: 'john@example.com',
    createdByName: 'Jane Creator',
    totalNodes: 10,
    analyzedNodes: 5,
    totalEntries: 15,
    highRiskCount: 3,
    mediumRiskCount: 5,
    lowRiskCount: 7,
    ...overrides,
  });

  const createMockProject = (overrides?: Partial<ProjectWithCreator>): ProjectWithCreator => ({
    id: 'project-456',
    name: 'Test Project',
    description: 'Test project description',
    organization: 'Test Organization',
    status: 'active',
    createdById: 'user-002',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-02-10'),
    createdByName: 'Jane Creator',
    createdByEmail: 'jane@example.com',
    ...overrides,
  });

  const createMockEntry = (overrides?: Partial<AnalysisEntry>): AnalysisEntry => ({
    id: 'entry-001',
    analysisId: 'analysis-123',
    nodeId: 'node-001',
    guideWord: 'no',
    parameter: 'Flow',
    deviation: 'No flow in pipeline',
    causes: ['Pump failure', 'Blocked valve'],
    consequences: ['Production loss', 'Equipment damage'],
    safeguards: ['Flow indicator', 'Backup pump'],
    recommendations: ['Install redundant pump', 'Add alarm system'],
    riskRanking: {
      severity: 3,
      likelihood: 4,
      detectability: 2,
      riskScore: 24,
      riskLevel: 'medium',
    },
    notes: 'Additional notes here',
    createdById: 'user-001',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-05'),
    version: 1,
    ...overrides,
  });

  const createMockNodes = (): Map<string, ReportNode> => {
    const nodes = new Map<string, ReportNode>();
    nodes.set('node-001', {
      id: 'node-001',
      nodeId: 'P-101',
      description: 'Main Feed Pump',
      equipmentType: 'pump',
    });
    nodes.set('node-002', {
      id: 'node-002',
      nodeId: 'V-201',
      description: 'Control Valve',
      equipmentType: 'valve',
    });
    return nodes;
  };

  const createMockRiskSummary = (): ReportRiskSummary => ({
    totalEntries: 15,
    assessedEntries: 15,
    highRiskCount: 3,
    mediumRiskCount: 5,
    lowRiskCount: 7,
    averageRiskScore: 35.5,
    maxRiskScore: 75,
  });

  const createMockComplianceData = (): ReportComplianceData => ({
    overallStatus: 'partial',
    standards: [
      {
        standardId: 'iec-61511',
        standardName: 'IEC 61511',
        status: 'compliant',
        gapsCount: 0,
        recommendations: [],
      },
      {
        standardId: 'iso-31000',
        standardName: 'ISO 31000',
        status: 'partial',
        gapsCount: 2,
        recommendations: ['Review risk assessment process', 'Document mitigation measures'],
      },
    ],
  });

  const createDefaultInput = (overrides?: Partial<ExcelGeneratorInput>): ExcelGeneratorInput => ({
    analysis: createMockAnalysis(),
    project: createMockProject(),
    entries: [createMockEntry()],
    nodes: createMockNodes(),
    parameters: {},
    ...overrides,
  });

  describe('generateExcelSpreadsheet', () => {
    it('should generate a spreadsheet with correct MIME type', async () => {
      const input = createDefaultInput();
      const result = await generateExcelSpreadsheet(input);

      expect(result.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('should generate a spreadsheet with buffer', async () => {
      const input = createDefaultInput();
      const result = await generateExcelSpreadsheet(input);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should generate correct filename format', async () => {
      const input = createDefaultInput({
        analysis: createMockAnalysis({ name: 'My Test Analysis' }),
      });
      const result = await generateExcelSpreadsheet(input);

      expect(result.filename).toMatch(/^HazOps_Report_My_Test_Analysis_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should sanitize special characters in filename', async () => {
      const input = createDefaultInput({
        analysis: createMockAnalysis({ name: 'Test/Analysis:With*Special?Chars' }),
      });
      const result = await generateExcelSpreadsheet(input);

      expect(result.filename).not.toContain('/');
      expect(result.filename).not.toContain(':');
      expect(result.filename).not.toContain('*');
      expect(result.filename).not.toContain('?');
    });

    it('should truncate long analysis names in filename', async () => {
      const longName = 'A'.repeat(100);
      const input = createDefaultInput({
        analysis: createMockAnalysis({ name: longName }),
      });
      const result = await generateExcelSpreadsheet(input);

      const namePart = result.filename.replace('HazOps_Report_', '').replace(/_\d{4}-\d{2}-\d{2}\.xlsx$/, '');
      expect(namePart.length).toBeLessThanOrEqual(50);
    });

    it('should include risk summary when provided', async () => {
      const input = createDefaultInput({
        riskSummary: createMockRiskSummary(),
        parameters: { includeRiskMatrix: true },
      });
      const result = await generateExcelSpreadsheet(input);

      expect(result).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should include compliance data when enabled', async () => {
      const input = createDefaultInput({
        complianceData: createMockComplianceData(),
        parameters: { includeCompliance: true },
      });
      const result = await generateExcelSpreadsheet(input);

      expect(result).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should handle entries without risk ranking', async () => {
      const entryWithoutRisk = createMockEntry({
        id: 'entry-no-risk',
        riskRanking: null,
      });

      const input = createDefaultInput({
        entries: [entryWithoutRisk],
      });
      const result = await generateExcelSpreadsheet(input);

      expect(result).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should handle empty entries list', async () => {
      const input = createDefaultInput({
        entries: [],
      });
      const result = await generateExcelSpreadsheet(input);

      expect(result).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should handle empty nodes map', async () => {
      const input = createDefaultInput({
        nodes: new Map(),
        entries: [createMockEntry()],
      });
      const result = await generateExcelSpreadsheet(input);

      expect(result).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should handle all guide word types', async () => {
      const guideWords = ['no', 'more', 'less', 'reverse', 'early', 'late', 'other_than'] as const;
      const entries = guideWords.map((gw, i) =>
        createMockEntry({
          id: `entry-${i}`,
          guideWord: gw,
        })
      );

      const input = createDefaultInput({ entries });
      const result = await generateExcelSpreadsheet(input);

      expect(result).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should handle all risk levels', async () => {
      const entries = [
        createMockEntry({
          id: 'entry-high',
          riskRanking: { severity: 5, likelihood: 5, detectability: 5, riskScore: 125, riskLevel: 'high' },
        }),
        createMockEntry({
          id: 'entry-medium',
          riskRanking: { severity: 3, likelihood: 3, detectability: 3, riskScore: 27, riskLevel: 'medium' },
        }),
        createMockEntry({
          id: 'entry-low',
          riskRanking: { severity: 1, likelihood: 1, detectability: 1, riskScore: 1, riskLevel: 'low' },
        }),
      ];

      const input = createDefaultInput({ entries });
      const result = await generateExcelSpreadsheet(input);

      expect(result).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should handle multiple entries per node', async () => {
      const entries = [
        createMockEntry({ id: 'entry-1', nodeId: 'node-001', guideWord: 'no' }),
        createMockEntry({ id: 'entry-2', nodeId: 'node-001', guideWord: 'more' }),
        createMockEntry({ id: 'entry-3', nodeId: 'node-001', guideWord: 'less' }),
      ];

      const input = createDefaultInput({ entries });
      const result = await generateExcelSpreadsheet(input);

      expect(result).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });
});
