/**
 * Word document generator service for HazOps reports.
 *
 * Generates professional Word documents (DOCX format) from HazOps analysis data.
 * Supports customizable content through ReportParameters and multiple templates.
 *
 * Document structure:
 * 1. Cover page with title, project info, dates
 * 2. Executive summary with risk distribution
 * 3. Analysis entries table (core HazOps data)
 * 4. Risk matrix visualization (optional)
 * 5. Compliance status (optional)
 * 6. Recommendations summary (optional)
 */

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  convertInchesToTwip,
  ShadingType,
} from 'docx';
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

/**
 * Analysis node data for report generation.
 */
export interface ReportNode {
  id: string;
  nodeId: string;
  description: string;
  equipmentType: string;
}

/**
 * Risk summary data for report generation.
 */
export interface ReportRiskSummary {
  totalEntries: number;
  assessedEntries: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageRiskScore: number | null;
  maxRiskScore: number | null;
}

/**
 * Compliance status for a single standard.
 */
export interface ComplianceStandardStatus {
  standardId: string;
  standardName: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  gapsCount: number;
  recommendations: string[];
}

/**
 * Full compliance data for report generation.
 */
export interface ReportComplianceData {
  overallStatus: 'compliant' | 'non_compliant' | 'partial';
  standards: ComplianceStandardStatus[];
}

/**
 * Input data for Word document generation.
 */
export interface WordGeneratorInput {
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
 * Result from Word document generation.
 */
export interface WordGeneratorResult {
  /** Generated DOCX file as Buffer */
  buffer: Buffer;

  /** MIME type for the generated file */
  mimeType: string;

  /** Suggested filename for download */
  filename: string;
}

// ============================================================================
// Style Constants
// ============================================================================

/** Professional colors for the document */
const COLORS = {
  primary: '1e3a5f', // Navy blue
  secondary: '4a6785',
  text: '333333',
  textLight: '666666',
  border: 'cccccc',
  headerBg: 'f0f4f8',
  riskHigh: 'fee2e2', // Light red
  riskMedium: 'fef3c7', // Light amber
  riskLow: 'dcfce7', // Light green
  riskHighText: 'dc2626',
  riskMediumText: 'd97706',
  riskLowText: '16a34a',
};

/** Standard cell padding in twips */
const CELL_PADDING = {
  top: 100,
  bottom: 100,
  left: 150,
  right: 150,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get color for risk level.
 */
function getRiskLevelColor(level: RiskLevel | null): { bg: string; text: string } {
  switch (level) {
    case 'high':
      return { bg: COLORS.riskHigh, text: COLORS.riskHighText };
    case 'medium':
      return { bg: COLORS.riskMedium, text: COLORS.riskMediumText };
    case 'low':
      return { bg: COLORS.riskLow, text: COLORS.riskLowText };
    default:
      return { bg: 'ffffff', text: COLORS.textLight };
  }
}

/**
 * Format a date for display in the document.
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
 * Create a standard table cell with consistent styling.
 */
function createCell(
  content: string,
  options?: {
    bold?: boolean;
    header?: boolean;
    width?: number;
    shading?: string;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    color?: string;
  }
): TableCell {
  const { bold = false, header = false, width, shading, alignment, color } = options ?? {};

  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: content,
            bold: bold || header,
            size: header ? 22 : 20,
            color: color ?? (header ? COLORS.primary : COLORS.text),
          }),
        ],
        alignment: alignment ?? AlignmentType.LEFT,
      }),
    ],
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: shading
      ? { type: ShadingType.SOLID, color: shading }
      : header
        ? { type: ShadingType.SOLID, color: COLORS.headerBg }
        : undefined,
    margins: CELL_PADDING,
  });
}

/**
 * Create a table row with standard border styling.
 */
function createRow(cells: TableCell[], isHeader = false): TableRow {
  return new TableRow({
    children: cells,
    tableHeader: isHeader,
  });
}

// ============================================================================
// Document Section Builders
// ============================================================================

/**
 * Create the document header with page numbers.
 */
function createDocumentHeader(title: string): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            size: 18,
            color: COLORS.textLight,
          }),
        ],
        alignment: AlignmentType.LEFT,
        border: {
          bottom: {
            color: COLORS.border,
            space: 1,
            size: 6,
            style: BorderStyle.SINGLE,
          },
        },
      }),
    ],
  });
}

/**
 * Create the document footer with page numbers.
 */
function createDocumentFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Page ',
            size: 18,
            color: COLORS.textLight,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 18,
            color: COLORS.textLight,
          }),
          new TextRun({
            text: ' of ',
            size: 18,
            color: COLORS.textLight,
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: 18,
            color: COLORS.textLight,
          }),
        ],
        alignment: AlignmentType.CENTER,
        border: {
          top: {
            color: COLORS.border,
            space: 1,
            size: 6,
            style: BorderStyle.SINGLE,
          },
        },
      }),
    ],
  });
}

/**
 * Create the cover page section.
 */
function createCoverPage(input: WordGeneratorInput): Paragraph[] {
  const { analysis, project, parameters } = input;
  const title = parameters.customTitle ?? `HazOps Analysis Report: ${analysis.name}`;

  return [
    // Spacer
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),

    // Title
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 56,
          color: COLORS.primary,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),

    // Subtitle
    new Paragraph({
      children: [
        new TextRun({
          text: 'Hazard and Operability Study',
          size: 32,
          color: COLORS.secondary,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    }),

    // Spacer
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),

    // Project info
    new Paragraph({
      children: [
        new TextRun({
          text: 'Project:',
          bold: true,
          size: 24,
          color: COLORS.text,
        }),
        new TextRun({
          text: ` ${project.name}`,
          size: 24,
          color: COLORS.text,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Organization:',
          bold: true,
          size: 24,
          color: COLORS.text,
        }),
        new TextRun({
          text: ` ${project.organization}`,
          size: 24,
          color: COLORS.text,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),

    // Spacer
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),

    // Document info
    new Paragraph({
      children: [
        new TextRun({
          text: `P&ID Document: ${analysis.documentName}`,
          size: 22,
          color: COLORS.textLight,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Lead Analyst: ${analysis.leadAnalystName}`,
          size: 22,
          color: COLORS.textLight,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Status: ${analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1).replace('_', ' ')}`,
          size: 22,
          color: COLORS.textLight,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),

    // Spacer
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),

    // Dates
    new Paragraph({
      children: [
        new TextRun({
          text: `Created: ${formatDate(analysis.createdAt)}`,
          size: 20,
          color: COLORS.textLight,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Report Generated: ${formatDate(new Date())}`,
          size: 20,
          color: COLORS.textLight,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 100 },
    }),

    // Page break after cover
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];
}

/**
 * Create the executive summary section.
 */
function createExecutiveSummary(input: WordGeneratorInput): Paragraph[] {
  const { analysis, riskSummary, parameters } = input;
  const paragraphs: Paragraph[] = [];

  // Section heading
  paragraphs.push(
    new Paragraph({
      text: 'Executive Summary',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  // Analysis overview
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'This HazOps analysis was conducted on ',
          size: 22,
        }),
        new TextRun({
          text: analysis.documentName,
          bold: true,
          size: 22,
        }),
        new TextRun({
          text: ` to identify potential hazards and operability issues. The analysis examined ${analysis.totalNodes} nodes using standard guide words (NO, MORE, LESS, REVERSE, EARLY, LATE, OTHER THAN).`,
          size: 22,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Analysis progress
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Analysis Progress: ${analysis.analyzedNodes} of ${analysis.totalNodes} nodes analyzed (${analysis.totalEntries} total entries)`,
          size: 22,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Risk summary if available
  if (riskSummary && parameters.includeRiskMatrix !== false) {
    paragraphs.push(
      new Paragraph({
        text: 'Risk Distribution',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );

    // Risk counts table
    const riskTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createRow(
          [
            createCell('Risk Level', { header: true, width: 40 }),
            createCell('Count', { header: true, width: 30, alignment: AlignmentType.CENTER }),
            createCell('Percentage', { header: true, width: 30, alignment: AlignmentType.CENTER }),
          ],
          true
        ),
        createRow([
          createCell('High Risk', {
            shading: COLORS.riskHigh,
            color: COLORS.riskHighText,
            bold: true,
          }),
          createCell(String(analysis.highRiskCount), {
            alignment: AlignmentType.CENTER,
            shading: COLORS.riskHigh,
          }),
          createCell(
            riskSummary.assessedEntries > 0
              ? `${((analysis.highRiskCount / riskSummary.assessedEntries) * 100).toFixed(1)}%`
              : 'N/A',
            { alignment: AlignmentType.CENTER, shading: COLORS.riskHigh }
          ),
        ]),
        createRow([
          createCell('Medium Risk', {
            shading: COLORS.riskMedium,
            color: COLORS.riskMediumText,
            bold: true,
          }),
          createCell(String(analysis.mediumRiskCount), {
            alignment: AlignmentType.CENTER,
            shading: COLORS.riskMedium,
          }),
          createCell(
            riskSummary.assessedEntries > 0
              ? `${((analysis.mediumRiskCount / riskSummary.assessedEntries) * 100).toFixed(1)}%`
              : 'N/A',
            { alignment: AlignmentType.CENTER, shading: COLORS.riskMedium }
          ),
        ]),
        createRow([
          createCell('Low Risk', {
            shading: COLORS.riskLow,
            color: COLORS.riskLowText,
            bold: true,
          }),
          createCell(String(analysis.lowRiskCount), {
            alignment: AlignmentType.CENTER,
            shading: COLORS.riskLow,
          }),
          createCell(
            riskSummary.assessedEntries > 0
              ? `${((analysis.lowRiskCount / riskSummary.assessedEntries) * 100).toFixed(1)}%`
              : 'N/A',
            { alignment: AlignmentType.CENTER, shading: COLORS.riskLow }
          ),
        ]),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      },
    });

    paragraphs.push(new Paragraph({ children: [] })); // Spacer
    paragraphs.push(riskTable as unknown as Paragraph);

    // Statistical summary
    if (riskSummary.averageRiskScore !== null) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Average Risk Score: ${riskSummary.averageRiskScore.toFixed(1)} | Maximum Risk Score: ${riskSummary.maxRiskScore ?? 'N/A'}`,
              size: 20,
              color: COLORS.textLight,
            }),
          ],
          spacing: { before: 200 },
        })
      );
    }
  }

  // Page break after executive summary
  paragraphs.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  return paragraphs;
}

/**
 * Create the analysis entries table section.
 */
function createAnalysisEntriesSection(input: WordGeneratorInput): Paragraph[] {
  const { entries, nodes, parameters } = input;
  const paragraphs: Paragraph[] = [];

  // Section heading
  paragraphs.push(
    new Paragraph({
      text: 'Analysis Entries',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  // Filter entries if risk level filter is specified
  let filteredEntries = entries;
  if (parameters.riskLevelFilter && parameters.riskLevelFilter.length > 0) {
    filteredEntries = entries.filter((entry) => {
      if (!entry.riskRanking) return false;
      return parameters.riskLevelFilter!.includes(entry.riskRanking.riskLevel);
    });
  }

  // Filter by node if specified
  if (parameters.nodeFilter && parameters.nodeFilter.length > 0) {
    filteredEntries = filteredEntries.filter((entry) =>
      parameters.nodeFilter!.includes(entry.nodeId)
    );
  }

  if (filteredEntries.length === 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'No analysis entries match the specified filters.',
            italics: true,
            color: COLORS.textLight,
          }),
        ],
      })
    );
    return paragraphs;
  }

  // Group entries by node for better organization
  const entriesByNode = new Map<string, AnalysisEntry[]>();
  for (const entry of filteredEntries) {
    const nodeEntries = entriesByNode.get(entry.nodeId) ?? [];
    nodeEntries.push(entry);
    entriesByNode.set(entry.nodeId, nodeEntries);
  }

  // Create entries for each node
  for (const [nodeId, nodeEntries] of entriesByNode) {
    const node = nodes.get(nodeId);
    const nodeIdentifier = node?.nodeId ?? 'Unknown Node';
    const nodeDescription = node?.description ?? '';
    const equipmentType = node?.equipmentType
      ? EQUIPMENT_TYPE_LABELS[node.equipmentType as keyof typeof EQUIPMENT_TYPE_LABELS] ?? node.equipmentType
      : 'Unknown';

    // Node header
    paragraphs.push(
      new Paragraph({
        text: `Node: ${nodeIdentifier} - ${nodeDescription}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 100 },
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Equipment Type: ${equipmentType}`,
            size: 20,
            color: COLORS.textLight,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // Create table for this node's entries
    const tableRows: TableRow[] = [
      createRow(
        [
          createCell('Guide Word', { header: true, width: 12 }),
          createCell('Parameter', { header: true, width: 12 }),
          createCell('Deviation', { header: true, width: 20 }),
          createCell('Causes', { header: true, width: 18 }),
          createCell('Consequences', { header: true, width: 18 }),
          createCell('Risk', { header: true, width: 10, alignment: AlignmentType.CENTER }),
        ],
        true
      ),
    ];

    for (const entry of nodeEntries) {
      const guideWordLabel =
        GUIDE_WORD_LABELS[entry.guideWord as GuideWord] ?? entry.guideWord;
      const causesText = entry.causes.length > 0 ? entry.causes.join('; ') : '-';
      const consequencesText = entry.consequences.length > 0 ? entry.consequences.join('; ') : '-';

      const riskColors = getRiskLevelColor(entry.riskRanking?.riskLevel ?? null);
      const riskText = entry.riskRanking
        ? `${RISK_LEVEL_LABELS[entry.riskRanking.riskLevel]} (${entry.riskRanking.riskScore})`
        : 'Not Assessed';

      tableRows.push(
        createRow([
          createCell(guideWordLabel, { bold: true }),
          createCell(entry.parameter),
          createCell(entry.deviation),
          createCell(causesText),
          createCell(consequencesText),
          createCell(riskText, {
            alignment: AlignmentType.CENTER,
            shading: entry.riskRanking ? riskColors.bg : undefined,
            color: entry.riskRanking ? riskColors.text : COLORS.textLight,
          }),
        ])
      );
    }

    const entryTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      },
    });

    paragraphs.push(entryTable as unknown as Paragraph);

    // Add safeguards and recommendations if enabled
    if (parameters.includeRecommendations !== false) {
      for (const entry of nodeEntries) {
        if (entry.safeguards.length > 0 || entry.recommendations.length > 0) {
          const guideWordLabel =
            GUIDE_WORD_LABELS[entry.guideWord as GuideWord] ?? entry.guideWord;

          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${guideWordLabel} - ${entry.parameter}:`,
                  bold: true,
                  size: 20,
                }),
              ],
              spacing: { before: 200 },
            })
          );

          if (entry.safeguards.length > 0) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Safeguards: ',
                    bold: true,
                    size: 20,
                  }),
                  new TextRun({
                    text: entry.safeguards.join('; '),
                    size: 20,
                  }),
                ],
                spacing: { before: 50 },
              })
            );
          }

          if (entry.recommendations.length > 0) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Recommendations: ',
                    bold: true,
                    size: 20,
                  }),
                  new TextRun({
                    text: entry.recommendations.join('; '),
                    size: 20,
                  }),
                ],
                spacing: { before: 50 },
              })
            );
          }
        }
      }
    }

    // Add notes if enabled
    if (parameters.includeNotes !== false) {
      for (const entry of nodeEntries) {
        if (entry.notes) {
          const guideWordLabel =
            GUIDE_WORD_LABELS[entry.guideWord as GuideWord] ?? entry.guideWord;

          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Note (${guideWordLabel} - ${entry.parameter}): `,
                  bold: true,
                  italics: true,
                  size: 18,
                  color: COLORS.textLight,
                }),
                new TextRun({
                  text: entry.notes,
                  italics: true,
                  size: 18,
                  color: COLORS.textLight,
                }),
              ],
              spacing: { before: 100 },
            })
          );
        }
      }
    }
  }

  return paragraphs;
}

/**
 * Create the compliance status section.
 */
function createComplianceSection(input: WordGeneratorInput): Paragraph[] {
  const { complianceData, parameters } = input;
  const paragraphs: Paragraph[] = [];

  if (!parameters.includeCompliance || !complianceData) {
    return paragraphs;
  }

  // Page break before compliance section
  paragraphs.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // Section heading
  paragraphs.push(
    new Paragraph({
      text: 'Regulatory Compliance Status',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  // Overall status
  const statusColors: Record<string, { bg: string; text: string }> = {
    compliant: { bg: COLORS.riskLow, text: COLORS.riskLowText },
    non_compliant: { bg: COLORS.riskHigh, text: COLORS.riskHighText },
    partial: { bg: COLORS.riskMedium, text: COLORS.riskMediumText },
  };

  const overallStatusLabel =
    complianceData.overallStatus === 'compliant'
      ? 'Compliant'
      : complianceData.overallStatus === 'non_compliant'
        ? 'Non-Compliant'
        : 'Partially Compliant';

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Overall Compliance Status: ',
          bold: true,
          size: 24,
        }),
        new TextRun({
          text: overallStatusLabel,
          bold: true,
          size: 24,
          color: statusColors[complianceData.overallStatus].text,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Standards table
  if (complianceData.standards.length > 0) {
    const tableRows: TableRow[] = [
      createRow(
        [
          createCell('Standard', { header: true, width: 30 }),
          createCell('Status', { header: true, width: 20, alignment: AlignmentType.CENTER }),
          createCell('Gaps', { header: true, width: 15, alignment: AlignmentType.CENTER }),
          createCell('Key Recommendations', { header: true, width: 35 }),
        ],
        true
      ),
    ];

    for (const standard of complianceData.standards) {
      const statusLabel =
        standard.status === 'compliant'
          ? 'Compliant'
          : standard.status === 'non_compliant'
            ? 'Non-Compliant'
            : standard.status === 'partial'
              ? 'Partial'
              : 'N/A';

      const colors = statusColors[standard.status] ?? { bg: 'ffffff', text: COLORS.textLight };

      tableRows.push(
        createRow([
          createCell(standard.standardName, { bold: true }),
          createCell(statusLabel, {
            alignment: AlignmentType.CENTER,
            shading: colors.bg,
            color: colors.text,
          }),
          createCell(String(standard.gapsCount), { alignment: AlignmentType.CENTER }),
          createCell(
            standard.recommendations.length > 0
              ? standard.recommendations.slice(0, 2).join('; ')
              : '-'
          ),
        ])
      );
    }

    const complianceTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      },
    });

    paragraphs.push(complianceTable as unknown as Paragraph);
  }

  return paragraphs;
}

/**
 * Create the recommendations summary section.
 */
function createRecommendationsSummary(input: WordGeneratorInput): Paragraph[] {
  const { entries, nodes, parameters } = input;
  const paragraphs: Paragraph[] = [];

  if (parameters.includeRecommendations === false) {
    return paragraphs;
  }

  // Collect all recommendations
  const allRecommendations: Array<{
    nodeId: string;
    nodeIdentifier: string;
    guideWord: string;
    parameter: string;
    recommendation: string;
    riskLevel: RiskLevel | null;
  }> = [];

  for (const entry of entries) {
    const node = nodes.get(entry.nodeId);
    for (const recommendation of entry.recommendations) {
      allRecommendations.push({
        nodeId: entry.nodeId,
        nodeIdentifier: node?.nodeId ?? 'Unknown',
        guideWord: GUIDE_WORD_LABELS[entry.guideWord as GuideWord] ?? entry.guideWord,
        parameter: entry.parameter,
        recommendation,
        riskLevel: entry.riskRanking?.riskLevel ?? null,
      });
    }
  }

  if (allRecommendations.length === 0) {
    return paragraphs;
  }

  // Sort by risk level (high first)
  allRecommendations.sort((a, b) => {
    const levelOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const aOrder = a.riskLevel ? levelOrder[a.riskLevel] ?? 3 : 3;
    const bOrder = b.riskLevel ? levelOrder[b.riskLevel] ?? 3 : 3;
    return aOrder - bOrder;
  });

  // Page break before recommendations section
  paragraphs.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // Section heading
  paragraphs.push(
    new Paragraph({
      text: 'Recommendations Summary',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Total Recommendations: ${allRecommendations.length}`,
          size: 22,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Create recommendations table
  const tableRows: TableRow[] = [
    createRow(
      [
        createCell('#', { header: true, width: 5, alignment: AlignmentType.CENTER }),
        createCell('Node', { header: true, width: 15 }),
        createCell('Context', { header: true, width: 20 }),
        createCell('Recommendation', { header: true, width: 50 }),
        createCell('Risk', { header: true, width: 10, alignment: AlignmentType.CENTER }),
      ],
      true
    ),
  ];

  allRecommendations.forEach((rec, index) => {
    const riskColors = getRiskLevelColor(rec.riskLevel);
    const riskText = rec.riskLevel
      ? RISK_LEVEL_LABELS[rec.riskLevel]
      : 'N/A';

    tableRows.push(
      createRow([
        createCell(String(index + 1), { alignment: AlignmentType.CENTER }),
        createCell(rec.nodeIdentifier, { bold: true }),
        createCell(`${rec.guideWord} - ${rec.parameter}`),
        createCell(rec.recommendation),
        createCell(riskText, {
          alignment: AlignmentType.CENTER,
          shading: rec.riskLevel ? riskColors.bg : undefined,
          color: rec.riskLevel ? riskColors.text : COLORS.textLight,
        }),
      ])
    );
  });

  const recommendationsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
    },
  });

  paragraphs.push(recommendationsTable as unknown as Paragraph);

  return paragraphs;
}

/**
 * Create the document footer content with custom text.
 */
function createFooterContent(input: WordGeneratorInput): Paragraph[] {
  const { parameters } = input;
  const paragraphs: Paragraph[] = [];

  if (parameters.customFooter) {
    paragraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: parameters.customFooter,
            size: 18,
            color: COLORS.textLight,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );
  }

  // Document end marker
  paragraphs.push(
    new Paragraph({
      text: '',
      spacing: { before: 400 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '--- End of Report ---',
          size: 18,
          color: COLORS.textLight,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );

  return paragraphs;
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate a Word document from HazOps analysis data.
 *
 * @param input - Input data for document generation
 * @returns Generated document as Buffer with metadata
 */
export async function generateWordDocument(
  input: WordGeneratorInput
): Promise<WordGeneratorResult> {
  const { analysis, parameters } = input;
  const title = parameters.customTitle ?? `HazOps Analysis Report: ${analysis.name}`;

  // Build document sections
  const children: Paragraph[] = [
    ...createCoverPage(input),
    ...createExecutiveSummary(input),
    ...createAnalysisEntriesSection(input),
    ...createComplianceSection(input),
    ...createRecommendationsSummary(input),
    ...createFooterContent(input),
  ];

  // Create the document
  const doc = new Document({
    title,
    description: `HazOps Analysis Report for ${analysis.name}`,
    creator: 'HazOp Assistant',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: createDocumentHeader(title),
        },
        footers: {
          default: createDocumentFooter(),
        },
        children,
      },
    ],
    styles: {
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            size: 32,
            bold: true,
            color: COLORS.primary,
          },
          paragraph: {
            spacing: {
              before: 400,
              after: 200,
            },
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            size: 26,
            bold: true,
            color: COLORS.secondary,
          },
          paragraph: {
            spacing: {
              before: 300,
              after: 150,
            },
          },
        },
      ],
    },
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);

  // Generate filename
  const sanitizedName = analysis.name
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 50);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `HazOps_Report_${sanitizedName}_${timestamp}.docx`;

  return {
    buffer: Buffer.from(buffer),
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename,
  };
}
