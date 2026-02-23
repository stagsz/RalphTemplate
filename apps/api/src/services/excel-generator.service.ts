/**
 * Excel spreadsheet generator service for HazOps reports.
 *
 * Generates professional Excel workbooks (.xlsx format) from HazOps analysis data.
 * Optimized for data tables, filtering, and further analysis by engineers.
 *
 * Workbook structure:
 * 1. Summary sheet - Analysis overview, risk distribution, statistics
 * 2. Analysis Entries sheet - Full HazOps analysis data table
 * 3. Nodes sheet - Equipment node details
 * 4. Recommendations sheet - All recommendations with risk context
 * 5. Compliance sheet (optional) - Regulatory compliance status
 */

import ExcelJS from 'exceljs';
import type {
  ReportParameters,
  RiskLevel,
  GuideWord,
} from '@hazop/types';
import {
  GUIDE_WORD_LABELS,
  SEVERITY_LABELS,
  LIKELIHOOD_LABELS,
  DETECTABILITY_LABELS,
  RISK_LEVEL_LABELS,
  EQUIPMENT_TYPE_LABELS,
} from '@hazop/types';
import type {
  HazopAnalysisWithDetailsAndProgress,
  AnalysisEntry,
} from './hazop-analysis.service.js';
import type { ProjectWithCreator } from './project.service.js';
import type {
  ReportNode,
  ReportRiskSummary,
  ReportComplianceData,
} from './word-generator.service.js';

/**
 * Input data for Excel spreadsheet generation.
 */
export interface ExcelGeneratorInput {
  /** HazOps analysis with details and progress metrics */
  analysis: HazopAnalysisWithDetailsAndProgress;

  /** Project information */
  project: ProjectWithCreator;

  /** All analysis entries */
  entries: AnalysisEntry[];

  /** Nodes map (id -> node data) */
  nodes: Map<string, ReportNode>;

  /** Report generation parameters */
  parameters: ReportParameters;

  /** Risk summary data (if includeRiskMatrix is true) */
  riskSummary?: ReportRiskSummary;

  /** Compliance data (if includeCompliance is true) */
  complianceData?: ReportComplianceData;

  /** Report name/title override */
  reportName?: string;
}

/**
 * Result from Excel spreadsheet generation.
 */
export interface ExcelGeneratorResult {
  /** Generated XLSX file as Buffer */
  buffer: Buffer;

  /** MIME type for the generated file */
  mimeType: string;

  /** Suggested filename for download */
  filename: string;
}

// ============================================================================
// Style Constants
// ============================================================================

/** Professional colors for the workbook (ARGB format) */
const COLORS = {
  primary: 'FF1E3A5F', // Navy blue
  secondary: 'FF4A6785',
  text: 'FF333333',
  textLight: 'FF666666',
  border: 'FFCCCCCC',
  headerBg: 'FFF0F4F8', // Light blue
  riskHigh: 'FFFEE2E2', // Light red
  riskMedium: 'FFFEF3C7', // Light amber
  riskLow: 'FFDCFCE7', // Light green
  riskHighText: 'FFDC2626',
  riskMediumText: 'FFD97706',
  riskLowText: 'FF16A34A',
  white: 'FFFFFFFF',
  alternateRow: 'FFF9FAFB', // Very light gray for alternating rows
};

/** Standard border style */
const THIN_BORDER: Partial<ExcelJS.Border> = {
  style: 'thin',
  color: { argb: COLORS.border },
};

const BORDERS: Partial<ExcelJS.Borders> = {
  top: THIN_BORDER,
  left: THIN_BORDER,
  bottom: THIN_BORDER,
  right: THIN_BORDER,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get fill color for risk level.
 */
function getRiskLevelFill(level: RiskLevel | null): ExcelJS.Fill {
  switch (level) {
    case 'high':
      return { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.riskHigh } };
    case 'medium':
      return { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.riskMedium } };
    case 'low':
      return { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.riskLow } };
    default:
      return { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.white } };
  }
}

/**
 * Get text color for risk level.
 */
function getRiskLevelTextColor(level: RiskLevel | null): Partial<ExcelJS.Font> {
  switch (level) {
    case 'high':
      return { color: { argb: COLORS.riskHighText }, bold: true };
    case 'medium':
      return { color: { argb: COLORS.riskMediumText }, bold: true };
    case 'low':
      return { color: { argb: COLORS.riskLowText }, bold: true };
    default:
      return { color: { argb: COLORS.textLight } };
  }
}

/**
 * Format a date for display.
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Apply header row styling to a row.
 */
function styleHeaderRow(row: ExcelJS.Row): void {
  row.height = 22;
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg },
    };
    cell.font = {
      bold: true,
      color: { argb: COLORS.primary },
      size: 11,
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true,
    };
    cell.border = BORDERS;
  });
}

/**
 * Apply data row styling to a row.
 */
function styleDataRow(row: ExcelJS.Row, isAlternate: boolean): void {
  row.eachCell((cell) => {
    if (!cell.fill || (cell.fill as ExcelJS.FillPattern).fgColor?.argb === COLORS.white) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isAlternate ? COLORS.alternateRow : COLORS.white },
      };
    }
    if (!cell.font) {
      cell.font = { size: 10, color: { argb: COLORS.text } };
    }
    cell.alignment = {
      vertical: 'top',
      horizontal: 'left',
      wrapText: true,
    };
    cell.border = BORDERS;
  });
}

/**
 * Add auto-filter to a worksheet.
 */
function addAutoFilter(worksheet: ExcelJS.Worksheet, startCol: number, endCol: number, headerRow: number): void {
  const startCell = worksheet.getCell(headerRow, startCol).address;
  const endCell = worksheet.getCell(headerRow, endCol).address;
  worksheet.autoFilter = `${startCell}:${endCell}`;
}

// ============================================================================
// Worksheet Builders
// ============================================================================

/**
 * Create the Summary worksheet.
 */
function createSummarySheet(
  workbook: ExcelJS.Workbook,
  input: ExcelGeneratorInput
): void {
  const { analysis, project, parameters, riskSummary } = input;
  const worksheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: COLORS.primary } },
  });

  const title = parameters.customTitle ?? `HazOps Analysis Report: ${analysis.name}`;

  // Title section
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 18, color: { argb: COLORS.primary } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells('A2:F2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = 'Hazard and Operability Study';
  subtitleCell.font = { size: 14, color: { argb: COLORS.secondary } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Project Information section
  let row = 4;
  worksheet.getCell(`A${row}`).value = 'Project Information';
  worksheet.getCell(`A${row}`).font = { bold: true, size: 12, color: { argb: COLORS.primary } };
  worksheet.mergeCells(`A${row}:F${row}`);
  row++;

  const projectInfo = [
    ['Project Name', project.name],
    ['Organization', project.organization],
    ['P&ID Document', analysis.documentName],
    ['Lead Analyst', analysis.leadAnalystName],
    ['Analysis Status', analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1).replace('_', ' ')],
    ['Created Date', formatDate(analysis.createdAt)],
    ['Report Generated', formatDate(new Date())],
  ];

  for (const [label, value] of projectInfo) {
    worksheet.getCell(`A${row}`).value = label;
    worksheet.getCell(`A${row}`).font = { bold: true, size: 10 };
    worksheet.getCell(`B${row}`).value = value;
    worksheet.getCell(`B${row}`).font = { size: 10 };
    row++;
  }

  // Analysis Progress section
  row += 1;
  worksheet.getCell(`A${row}`).value = 'Analysis Progress';
  worksheet.getCell(`A${row}`).font = { bold: true, size: 12, color: { argb: COLORS.primary } };
  worksheet.mergeCells(`A${row}:F${row}`);
  row++;

  const progressInfo = [
    ['Total Nodes', analysis.totalNodes],
    ['Analyzed Nodes', analysis.analyzedNodes],
    ['Total Entries', analysis.totalEntries],
    ['Completion', `${analysis.totalNodes > 0 ? ((analysis.analyzedNodes / analysis.totalNodes) * 100).toFixed(1) : 0}%`],
  ];

  for (const [label, value] of progressInfo) {
    worksheet.getCell(`A${row}`).value = label;
    worksheet.getCell(`A${row}`).font = { bold: true, size: 10 };
    worksheet.getCell(`B${row}`).value = value;
    worksheet.getCell(`B${row}`).font = { size: 10 };
    row++;
  }

  // Risk Distribution section
  if (riskSummary && parameters.includeRiskMatrix !== false) {
    row += 1;
    worksheet.getCell(`A${row}`).value = 'Risk Distribution';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 12, color: { argb: COLORS.primary } };
    worksheet.mergeCells(`A${row}:F${row}`);
    row++;

    // Risk table header
    const riskHeaderRow = row;
    worksheet.getCell(`A${row}`).value = 'Risk Level';
    worksheet.getCell(`B${row}`).value = 'Count';
    worksheet.getCell(`C${row}`).value = 'Percentage';
    styleHeaderRow(worksheet.getRow(row));
    row++;

    // Risk data rows
    const riskData = [
      { label: 'High Risk', count: analysis.highRiskCount, level: 'high' as RiskLevel },
      { label: 'Medium Risk', count: analysis.mediumRiskCount, level: 'medium' as RiskLevel },
      { label: 'Low Risk', count: analysis.lowRiskCount, level: 'low' as RiskLevel },
    ];

    for (const risk of riskData) {
      const percentage = riskSummary.assessedEntries > 0
        ? ((risk.count / riskSummary.assessedEntries) * 100).toFixed(1) + '%'
        : 'N/A';

      worksheet.getCell(`A${row}`).value = risk.label;
      worksheet.getCell(`A${row}`).fill = getRiskLevelFill(risk.level);
      worksheet.getCell(`A${row}`).font = getRiskLevelTextColor(risk.level);

      worksheet.getCell(`B${row}`).value = risk.count;
      worksheet.getCell(`B${row}`).fill = getRiskLevelFill(risk.level);
      worksheet.getCell(`B${row}`).alignment = { horizontal: 'center' };

      worksheet.getCell(`C${row}`).value = percentage;
      worksheet.getCell(`C${row}`).fill = getRiskLevelFill(risk.level);
      worksheet.getCell(`C${row}`).alignment = { horizontal: 'center' };

      worksheet.getRow(row).eachCell((cell) => {
        cell.border = BORDERS;
      });
      row++;
    }

    // Statistics
    row++;
    if (riskSummary.averageRiskScore !== null) {
      worksheet.getCell(`A${row}`).value = 'Average Risk Score';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 10 };
      worksheet.getCell(`B${row}`).value = riskSummary.averageRiskScore.toFixed(1);
      row++;
    }
    if (riskSummary.maxRiskScore !== null) {
      worksheet.getCell(`A${row}`).value = 'Maximum Risk Score';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 10 };
      worksheet.getCell(`B${row}`).value = riskSummary.maxRiskScore;
      row++;
    }
  }

  // Set column widths
  worksheet.getColumn('A').width = 25;
  worksheet.getColumn('B').width = 30;
  worksheet.getColumn('C').width = 15;
  worksheet.getColumn('D').width = 15;
  worksheet.getColumn('E').width = 15;
  worksheet.getColumn('F').width = 15;

  // Freeze panes
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
}

/**
 * Create the Analysis Entries worksheet.
 */
function createAnalysisEntriesSheet(
  workbook: ExcelJS.Workbook,
  input: ExcelGeneratorInput
): void {
  const { entries, nodes, parameters } = input;
  const worksheet = workbook.addWorksheet('Analysis Entries', {
    properties: { tabColor: { argb: COLORS.secondary } },
  });

  // Filter entries
  let filteredEntries = entries;
  if (parameters.riskLevelFilter && parameters.riskLevelFilter.length > 0) {
    filteredEntries = entries.filter((entry) => {
      if (!entry.riskRanking) return false;
      return parameters.riskLevelFilter!.includes(entry.riskRanking.riskLevel);
    });
  }

  if (parameters.nodeFilter && parameters.nodeFilter.length > 0) {
    filteredEntries = filteredEntries.filter((entry) =>
      parameters.nodeFilter!.includes(entry.nodeId)
    );
  }

  // Define columns
  const columns = [
    { header: 'Node ID', key: 'nodeId', width: 15 },
    { header: 'Node Description', key: 'nodeDescription', width: 25 },
    { header: 'Equipment Type', key: 'equipmentType', width: 18 },
    { header: 'Guide Word', key: 'guideWord', width: 12 },
    { header: 'Parameter', key: 'parameter', width: 15 },
    { header: 'Deviation', key: 'deviation', width: 25 },
    { header: 'Causes', key: 'causes', width: 35 },
    { header: 'Consequences', key: 'consequences', width: 35 },
    { header: 'Safeguards', key: 'safeguards', width: 35 },
    { header: 'Recommendations', key: 'recommendations', width: 35 },
    { header: 'Severity', key: 'severity', width: 10 },
    { header: 'Likelihood', key: 'likelihood', width: 10 },
    { header: 'Detectability', key: 'detectability', width: 12 },
    { header: 'Risk Score', key: 'riskScore', width: 10 },
    { header: 'Risk Level', key: 'riskLevel', width: 12 },
  ];

  if (parameters.includeNotes !== false) {
    columns.push({ header: 'Notes', key: 'notes', width: 30 });
  }

  worksheet.columns = columns;

  // Style header row
  styleHeaderRow(worksheet.getRow(1));

  // Add data rows
  let rowIndex = 2;
  for (const entry of filteredEntries) {
    const node = nodes.get(entry.nodeId);
    const nodeIdentifier = node?.nodeId ?? 'Unknown';
    const nodeDescription = node?.description ?? '';
    const equipmentType = node?.equipmentType
      ? EQUIPMENT_TYPE_LABELS[node.equipmentType as keyof typeof EQUIPMENT_TYPE_LABELS] ?? node.equipmentType
      : 'Unknown';
    const guideWordLabel = GUIDE_WORD_LABELS[entry.guideWord as GuideWord] ?? entry.guideWord;

    const rowData: Record<string, string | number | null> = {
      nodeId: nodeIdentifier,
      nodeDescription,
      equipmentType,
      guideWord: guideWordLabel,
      parameter: entry.parameter,
      deviation: entry.deviation,
      causes: entry.causes.length > 0 ? entry.causes.join('; ') : '',
      consequences: entry.consequences.length > 0 ? entry.consequences.join('; ') : '',
      safeguards: entry.safeguards.length > 0 ? entry.safeguards.join('; ') : '',
      recommendations: entry.recommendations.length > 0 ? entry.recommendations.join('; ') : '',
      severity: entry.riskRanking?.severity ?? null,
      likelihood: entry.riskRanking?.likelihood ?? null,
      detectability: entry.riskRanking?.detectability ?? null,
      riskScore: entry.riskRanking?.riskScore ?? null,
      riskLevel: entry.riskRanking ? RISK_LEVEL_LABELS[entry.riskRanking.riskLevel] : 'Not Assessed',
    };

    if (parameters.includeNotes !== false) {
      rowData.notes = entry.notes ?? '';
    }

    const row = worksheet.addRow(rowData);

    // Style risk level cell
    const riskLevelCell = row.getCell('riskLevel');
    const riskLevel = entry.riskRanking?.riskLevel ?? null;
    riskLevelCell.fill = getRiskLevelFill(riskLevel);
    Object.assign(riskLevelCell.font || {}, getRiskLevelTextColor(riskLevel));

    // Style risk score cell with same color
    const riskScoreCell = row.getCell('riskScore');
    riskScoreCell.fill = getRiskLevelFill(riskLevel);
    riskScoreCell.alignment = { horizontal: 'center' };

    // Style numeric cells
    row.getCell('severity').alignment = { horizontal: 'center' };
    row.getCell('likelihood').alignment = { horizontal: 'center' };
    row.getCell('detectability').alignment = { horizontal: 'center' };

    // Apply row styling
    styleDataRow(row, rowIndex % 2 === 0);
    rowIndex++;
  }

  // Add auto-filter
  addAutoFilter(worksheet, 1, columns.length, 1);

  // Freeze panes (freeze header row)
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
}

/**
 * Create the Nodes worksheet.
 */
function createNodesSheet(
  workbook: ExcelJS.Workbook,
  input: ExcelGeneratorInput
): void {
  const { nodes, entries } = input;
  const worksheet = workbook.addWorksheet('Nodes', {
    properties: { tabColor: { argb: '22C55E' } }, // Green
  });

  // Define columns
  worksheet.columns = [
    { header: 'Node ID', key: 'nodeId', width: 15 },
    { header: 'Description', key: 'description', width: 35 },
    { header: 'Equipment Type', key: 'equipmentType', width: 20 },
    { header: 'Total Entries', key: 'totalEntries', width: 12 },
    { header: 'High Risk', key: 'highRisk', width: 10 },
    { header: 'Medium Risk', key: 'mediumRisk', width: 12 },
    { header: 'Low Risk', key: 'lowRisk', width: 10 },
    { header: 'Not Assessed', key: 'notAssessed', width: 12 },
  ];

  // Style header row
  styleHeaderRow(worksheet.getRow(1));

  // Calculate stats per node
  const nodeStats = new Map<string, { high: number; medium: number; low: number; none: number; total: number }>();
  for (const entry of entries) {
    const stats = nodeStats.get(entry.nodeId) ?? { high: 0, medium: 0, low: 0, none: 0, total: 0 };
    stats.total++;
    if (entry.riskRanking) {
      switch (entry.riskRanking.riskLevel) {
        case 'high':
          stats.high++;
          break;
        case 'medium':
          stats.medium++;
          break;
        case 'low':
          stats.low++;
          break;
      }
    } else {
      stats.none++;
    }
    nodeStats.set(entry.nodeId, stats);
  }

  // Add data rows
  let rowIndex = 2;
  for (const [nodeDbId, node] of nodes) {
    const stats = nodeStats.get(nodeDbId) ?? { high: 0, medium: 0, low: 0, none: 0, total: 0 };
    const equipmentType = node.equipmentType
      ? EQUIPMENT_TYPE_LABELS[node.equipmentType as keyof typeof EQUIPMENT_TYPE_LABELS] ?? node.equipmentType
      : 'Unknown';

    const row = worksheet.addRow({
      nodeId: node.nodeId,
      description: node.description,
      equipmentType,
      totalEntries: stats.total,
      highRisk: stats.high,
      mediumRisk: stats.medium,
      lowRisk: stats.low,
      notAssessed: stats.none,
    });

    // Style risk count cells
    if (stats.high > 0) {
      row.getCell('highRisk').fill = getRiskLevelFill('high');
      row.getCell('highRisk').font = getRiskLevelTextColor('high');
    }
    if (stats.medium > 0) {
      row.getCell('mediumRisk').fill = getRiskLevelFill('medium');
      row.getCell('mediumRisk').font = getRiskLevelTextColor('medium');
    }
    if (stats.low > 0) {
      row.getCell('lowRisk').fill = getRiskLevelFill('low');
      row.getCell('lowRisk').font = getRiskLevelTextColor('low');
    }

    // Center numeric cells
    row.getCell('totalEntries').alignment = { horizontal: 'center' };
    row.getCell('highRisk').alignment = { horizontal: 'center' };
    row.getCell('mediumRisk').alignment = { horizontal: 'center' };
    row.getCell('lowRisk').alignment = { horizontal: 'center' };
    row.getCell('notAssessed').alignment = { horizontal: 'center' };

    styleDataRow(row, rowIndex % 2 === 0);
    rowIndex++;
  }

  // Add auto-filter
  addAutoFilter(worksheet, 1, 8, 1);

  // Freeze panes
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
}

/**
 * Create the Recommendations worksheet.
 */
function createRecommendationsSheet(
  workbook: ExcelJS.Workbook,
  input: ExcelGeneratorInput
): void {
  const { entries, nodes, parameters } = input;

  if (parameters.includeRecommendations === false) {
    return;
  }

  const worksheet = workbook.addWorksheet('Recommendations', {
    properties: { tabColor: { argb: 'F59E0B' } }, // Amber
  });

  // Collect all recommendations
  const allRecommendations: Array<{
    nodeId: string;
    nodeIdentifier: string;
    guideWord: string;
    parameter: string;
    deviation: string;
    recommendation: string;
    riskLevel: RiskLevel | null;
    riskScore: number | null;
  }> = [];

  for (const entry of entries) {
    const node = nodes.get(entry.nodeId);
    for (const recommendation of entry.recommendations) {
      allRecommendations.push({
        nodeId: entry.nodeId,
        nodeIdentifier: node?.nodeId ?? 'Unknown',
        guideWord: GUIDE_WORD_LABELS[entry.guideWord as GuideWord] ?? entry.guideWord,
        parameter: entry.parameter,
        deviation: entry.deviation,
        recommendation,
        riskLevel: entry.riskRanking?.riskLevel ?? null,
        riskScore: entry.riskRanking?.riskScore ?? null,
      });
    }
  }

  // Sort by risk level (high first)
  allRecommendations.sort((a, b) => {
    const levelOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const aOrder = a.riskLevel ? levelOrder[a.riskLevel] ?? 3 : 3;
    const bOrder = b.riskLevel ? levelOrder[b.riskLevel] ?? 3 : 3;
    return aOrder - bOrder;
  });

  // Define columns
  worksheet.columns = [
    { header: '#', key: 'index', width: 6 },
    { header: 'Node ID', key: 'nodeId', width: 15 },
    { header: 'Guide Word', key: 'guideWord', width: 12 },
    { header: 'Parameter', key: 'parameter', width: 15 },
    { header: 'Deviation', key: 'deviation', width: 25 },
    { header: 'Recommendation', key: 'recommendation', width: 50 },
    { header: 'Risk Score', key: 'riskScore', width: 10 },
    { header: 'Risk Level', key: 'riskLevel', width: 12 },
  ];

  // Style header row
  styleHeaderRow(worksheet.getRow(1));

  // Add data rows
  let rowIndex = 2;
  for (let i = 0; i < allRecommendations.length; i++) {
    const rec = allRecommendations[i];
    const row = worksheet.addRow({
      index: i + 1,
      nodeId: rec.nodeIdentifier,
      guideWord: rec.guideWord,
      parameter: rec.parameter,
      deviation: rec.deviation,
      recommendation: rec.recommendation,
      riskScore: rec.riskScore ?? 'N/A',
      riskLevel: rec.riskLevel ? RISK_LEVEL_LABELS[rec.riskLevel] : 'Not Assessed',
    });

    // Style risk cells
    const riskLevelCell = row.getCell('riskLevel');
    riskLevelCell.fill = getRiskLevelFill(rec.riskLevel);
    Object.assign(riskLevelCell.font || {}, getRiskLevelTextColor(rec.riskLevel));

    const riskScoreCell = row.getCell('riskScore');
    riskScoreCell.fill = getRiskLevelFill(rec.riskLevel);
    riskScoreCell.alignment = { horizontal: 'center' };

    row.getCell('index').alignment = { horizontal: 'center' };

    styleDataRow(row, rowIndex % 2 === 0);
    rowIndex++;
  }

  // Add auto-filter
  if (allRecommendations.length > 0) {
    addAutoFilter(worksheet, 1, 8, 1);
  }

  // Freeze panes
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
}

/**
 * Create the Compliance worksheet.
 */
function createComplianceSheet(
  workbook: ExcelJS.Workbook,
  input: ExcelGeneratorInput
): void {
  const { complianceData, parameters } = input;

  if (!parameters.includeCompliance || !complianceData) {
    return;
  }

  const worksheet = workbook.addWorksheet('Compliance', {
    properties: { tabColor: { argb: 'EF4444' } }, // Red
  });

  // Overall status section
  worksheet.mergeCells('A1:D1');
  worksheet.getCell('A1').value = 'Regulatory Compliance Status';
  worksheet.getCell('A1').font = { bold: true, size: 14, color: { argb: COLORS.primary } };
  worksheet.getRow(1).height = 24;

  // Overall status
  const overallStatusLabel =
    complianceData.overallStatus === 'compliant'
      ? 'Compliant'
      : complianceData.overallStatus === 'non_compliant'
        ? 'Non-Compliant'
        : 'Partially Compliant';

  const statusColors: Record<string, { fill: ExcelJS.Fill; font: Partial<ExcelJS.Font> }> = {
    compliant: { fill: getRiskLevelFill('low'), font: getRiskLevelTextColor('low') },
    non_compliant: { fill: getRiskLevelFill('high'), font: getRiskLevelTextColor('high') },
    partial: { fill: getRiskLevelFill('medium'), font: getRiskLevelTextColor('medium') },
  };

  worksheet.getCell('A3').value = 'Overall Status:';
  worksheet.getCell('A3').font = { bold: true };
  worksheet.getCell('B3').value = overallStatusLabel;
  worksheet.getCell('B3').fill = statusColors[complianceData.overallStatus]?.fill ?? getRiskLevelFill(null);
  worksheet.getCell('B3').font = {
    ...statusColors[complianceData.overallStatus]?.font,
    bold: true,
    size: 12,
  };
  worksheet.getCell('B3').border = BORDERS;

  // Standards table
  if (complianceData.standards.length > 0) {
    const startRow = 5;
    worksheet.getCell(`A${startRow}`).value = 'Compliance by Standard';
    worksheet.getCell(`A${startRow}`).font = { bold: true, size: 12, color: { argb: COLORS.primary } };
    worksheet.mergeCells(`A${startRow}:E${startRow}`);

    const headerRow = startRow + 1;
    worksheet.getCell(`A${headerRow}`).value = 'Standard';
    worksheet.getCell(`B${headerRow}`).value = 'Status';
    worksheet.getCell(`C${headerRow}`).value = 'Gaps';
    worksheet.getCell(`D${headerRow}`).value = 'Key Recommendations';
    styleHeaderRow(worksheet.getRow(headerRow));

    let rowIndex = headerRow + 1;
    for (const standard of complianceData.standards) {
      const statusLabel =
        standard.status === 'compliant'
          ? 'Compliant'
          : standard.status === 'non_compliant'
            ? 'Non-Compliant'
            : standard.status === 'partial'
              ? 'Partial'
              : 'N/A';

      worksheet.getCell(`A${rowIndex}`).value = standard.standardName;
      worksheet.getCell(`A${rowIndex}`).font = { bold: true };

      const statusCell = worksheet.getCell(`B${rowIndex}`);
      statusCell.value = statusLabel;
      const cellColors = statusColors[standard.status];
      if (cellColors) {
        statusCell.fill = cellColors.fill;
        statusCell.font = cellColors.font;
      }

      worksheet.getCell(`C${rowIndex}`).value = standard.gapsCount;
      worksheet.getCell(`C${rowIndex}`).alignment = { horizontal: 'center' };

      worksheet.getCell(`D${rowIndex}`).value =
        standard.recommendations.length > 0 ? standard.recommendations.join('; ') : '-';

      styleDataRow(worksheet.getRow(rowIndex), rowIndex % 2 === 0);
      rowIndex++;
    }

    // Add auto-filter
    addAutoFilter(worksheet, 1, 4, headerRow);
  }

  // Set column widths
  worksheet.getColumn('A').width = 25;
  worksheet.getColumn('B').width = 15;
  worksheet.getColumn('C').width = 10;
  worksheet.getColumn('D').width = 50;

  // Freeze panes
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 6 }];
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate an Excel workbook from HazOps analysis data.
 *
 * @param input - Input data for spreadsheet generation
 * @returns Generated workbook as Buffer with metadata
 */
export async function generateExcelSpreadsheet(
  input: ExcelGeneratorInput
): Promise<ExcelGeneratorResult> {
  const { analysis, parameters } = input;

  // Create workbook
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  const title = parameters.customTitle ?? `HazOps Analysis Report: ${analysis.name}`;
  workbook.creator = 'HazOp Assistant';
  workbook.lastModifiedBy = 'HazOp Assistant';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.title = title;
  workbook.subject = `HazOps Analysis Report for ${analysis.name}`;

  // Build worksheets
  createSummarySheet(workbook, input);
  createAnalysisEntriesSheet(workbook, input);
  createNodesSheet(workbook, input);
  createRecommendationsSheet(workbook, input);
  createComplianceSheet(workbook, input);

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Generate filename
  const sanitizedName = analysis.name
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 50);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `HazOps_Report_${sanitizedName}_${timestamp}.xlsx`;

  return {
    buffer: Buffer.from(buffer),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename,
  };
}
