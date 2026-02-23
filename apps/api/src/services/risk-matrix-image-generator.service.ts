/**
 * Risk Matrix Image Generator Service.
 *
 * Generates PNG images of the 5x5 risk matrix for use in reports.
 * The matrix visualizes risk levels based on severity (Y-axis) and
 * likelihood (X-axis) combinations.
 *
 * Generated images are suitable for embedding in Word documents, PDFs,
 * PowerPoint presentations, and web views.
 */

import sharp from 'sharp';
import type {
  SeverityLevel,
  LikelihoodLevel,
  RiskLevel,
} from '@hazop/types';
import {
  SEVERITY_LEVELS,
  LIKELIHOOD_LEVELS,
  SEVERITY_LABELS,
  LIKELIHOOD_LABELS,
  RISK_MATRIX_MAPPING,
} from '@hazop/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Size preset for generated risk matrix images.
 */
export type RiskMatrixImageSize = 'small' | 'medium' | 'large';

/**
 * Configuration options for risk matrix image generation.
 */
export interface RiskMatrixImageOptions {
  /** Image size preset (default: 'medium') */
  size?: RiskMatrixImageSize;

  /** Whether to include axis labels (default: true) */
  includeLabels?: boolean;

  /** Whether to include the legend (default: true) */
  includeLegend?: boolean;

  /** Whether to show base scores in cells (default: true) */
  showScores?: boolean;

  /** Optional title text at the top */
  title?: string;

  /** Highlight specific cells (array of [severity, likelihood] pairs) */
  highlightCells?: Array<[SeverityLevel, LikelihoodLevel]>;

  /** Background color (default: white) */
  backgroundColor?: string;
}

/**
 * Result from risk matrix image generation.
 */
export interface RiskMatrixImageResult {
  /** Generated PNG image as Buffer */
  buffer: Buffer;

  /** MIME type for the generated image */
  mimeType: string;

  /** Suggested filename for download */
  filename: string;

  /** Image width in pixels */
  width: number;

  /** Image height in pixels */
  height: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Size configurations for different presets.
 */
const SIZE_CONFIGS: Record<RiskMatrixImageSize, {
  cellSize: number;
  labelWidth: number;
  labelHeight: number;
  fontSize: number;
  scoreFontSize: number;
  titleFontSize: number;
  legendHeight: number;
  padding: number;
}> = {
  small: {
    cellSize: 40,
    labelWidth: 80,
    labelHeight: 30,
    fontSize: 10,
    scoreFontSize: 12,
    titleFontSize: 14,
    legendHeight: 30,
    padding: 10,
  },
  medium: {
    cellSize: 60,
    labelWidth: 100,
    labelHeight: 40,
    fontSize: 12,
    scoreFontSize: 16,
    titleFontSize: 18,
    legendHeight: 40,
    padding: 15,
  },
  large: {
    cellSize: 80,
    labelWidth: 120,
    labelHeight: 50,
    fontSize: 14,
    scoreFontSize: 20,
    titleFontSize: 22,
    legendHeight: 50,
    padding: 20,
  },
};

/**
 * Risk level colors matching the document generators.
 * Using colors that work well in both light and dark contexts.
 */
const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  low: {
    bg: '#dcfce7',      // Light green
    text: '#166534',    // Dark green
    border: '#86efac',  // Medium green
  },
  medium: {
    bg: '#fef3c7',      // Light amber
    text: '#92400e',    // Dark amber
    border: '#fcd34d',  // Medium amber
  },
  high: {
    bg: '#fee2e2',      // Light red
    text: '#991b1b',    // Dark red
    border: '#fca5a5',  // Medium red
  },
};

/**
 * General styling colors.
 */
const STYLE_COLORS = {
  background: '#ffffff',
  text: '#374151',
  textLight: '#6b7280',
  border: '#d1d5db',
  highlight: '#3b82f6',
  labelBg: '#f9fafb',
};

// ============================================================================
// SVG Generation Functions
// ============================================================================

/**
 * Escape XML special characters for SVG text content.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate SVG for a single matrix cell.
 */
function generateCellSvg(
  x: number,
  y: number,
  cellSize: number,
  severity: SeverityLevel,
  likelihood: LikelihoodLevel,
  showScore: boolean,
  scoreFontSize: number,
  isHighlighted: boolean
): string {
  const riskLevel = RISK_MATRIX_MAPPING[severity][likelihood];
  const colors = RISK_COLORS[riskLevel];
  const baseScore = severity * likelihood;

  const strokeWidth = isHighlighted ? 3 : 1;
  const strokeColor = isHighlighted ? STYLE_COLORS.highlight : colors.border;

  let svg = `
    <rect
      x="${x}"
      y="${y}"
      width="${cellSize}"
      height="${cellSize}"
      fill="${colors.bg}"
      stroke="${strokeColor}"
      stroke-width="${strokeWidth}"
      rx="2"
    />`;

  if (showScore) {
    svg += `
    <text
      x="${x + cellSize / 2}"
      y="${y + cellSize / 2 + scoreFontSize / 3}"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="${scoreFontSize}"
      font-weight="600"
      fill="${colors.text}"
    >${baseScore}</text>`;
  }

  return svg;
}

/**
 * Generate SVG for the severity (Y-axis) labels.
 */
function generateSeverityLabels(
  x: number,
  startY: number,
  labelWidth: number,
  cellSize: number,
  fontSize: number
): string {
  let svg = '';

  // Generate labels from severity 5 down to 1 (top to bottom)
  const severities = [...SEVERITY_LEVELS].reverse() as SeverityLevel[];

  for (let i = 0; i < severities.length; i++) {
    const severity = severities[i];
    const y = startY + i * cellSize;
    const label = SEVERITY_LABELS[severity];

    svg += `
    <text
      x="${x + labelWidth - 8}"
      y="${y + cellSize / 2 + fontSize / 3}"
      text-anchor="end"
      font-family="Arial, sans-serif"
      font-size="${fontSize}"
      fill="${STYLE_COLORS.text}"
    >${severity} - ${escapeXml(label)}</text>`;
  }

  return svg;
}

/**
 * Generate SVG for the likelihood (X-axis) labels.
 */
function generateLikelihoodLabels(
  startX: number,
  y: number,
  labelHeight: number,
  cellSize: number,
  fontSize: number
): string {
  let svg = '';

  for (let i = 0; i < LIKELIHOOD_LEVELS.length; i++) {
    const likelihood = LIKELIHOOD_LEVELS[i];
    const x = startX + i * cellSize;
    const label = LIKELIHOOD_LABELS[likelihood];

    // Rotate label for better fit
    svg += `
    <text
      x="${x + cellSize / 2}"
      y="${y + labelHeight - 8}"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="${fontSize}"
      fill="${STYLE_COLORS.text}"
    >${likelihood}</text>`;
  }

  return svg;
}

/**
 * Generate SVG for axis titles.
 */
function generateAxisTitles(
  labelWidth: number,
  labelHeight: number,
  gridWidth: number,
  gridHeight: number,
  padding: number,
  fontSize: number,
  titleY: number
): string {
  // Y-axis title (Severity) - rotated
  const severityTitleX = padding;
  const severityTitleY = titleY + labelHeight + gridHeight / 2;

  // X-axis title (Likelihood)
  const likelihoodTitleX = labelWidth + gridWidth / 2 + padding;
  const likelihoodTitleY = titleY + labelHeight + gridHeight + labelHeight - 5;

  return `
    <text
      x="${severityTitleX + fontSize / 2}"
      y="${severityTitleY}"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="${fontSize}"
      font-weight="600"
      fill="${STYLE_COLORS.text}"
      transform="rotate(-90, ${severityTitleX + fontSize / 2}, ${severityTitleY})"
    >Severity</text>
    <text
      x="${likelihoodTitleX}"
      y="${likelihoodTitleY}"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="${fontSize}"
      font-weight="600"
      fill="${STYLE_COLORS.text}"
    >Likelihood</text>`;
}

/**
 * Generate SVG for the legend.
 */
function generateLegend(
  startX: number,
  y: number,
  legendHeight: number,
  fontSize: number
): string {
  const boxSize = legendHeight * 0.5;
  const spacing = 100;

  const levels: RiskLevel[] = ['low', 'medium', 'high'];
  const labels = ['Low Risk', 'Medium Risk', 'High Risk'];

  let svg = '';
  let currentX = startX;

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const label = labels[i];
    const colors = RISK_COLORS[level];

    svg += `
    <rect
      x="${currentX}"
      y="${y + (legendHeight - boxSize) / 2}"
      width="${boxSize}"
      height="${boxSize}"
      fill="${colors.bg}"
      stroke="${colors.border}"
      stroke-width="1"
      rx="2"
    />
    <text
      x="${currentX + boxSize + 8}"
      y="${y + legendHeight / 2 + fontSize / 3}"
      text-anchor="start"
      font-family="Arial, sans-serif"
      font-size="${fontSize}"
      fill="${STYLE_COLORS.text}"
    >${label}</text>`;

    currentX += spacing;
  }

  return svg;
}

/**
 * Generate the complete SVG for the risk matrix.
 */
function generateRiskMatrixSvg(options: RiskMatrixImageOptions): {
  svg: string;
  width: number;
  height: number;
} {
  const size = options.size ?? 'medium';
  const config = SIZE_CONFIGS[size];

  const includeLabels = options.includeLabels !== false;
  const includeLegend = options.includeLegend !== false;
  const showScores = options.showScores !== false;
  const title = options.title;
  const highlightCells = options.highlightCells ?? [];
  const backgroundColor = options.backgroundColor ?? STYLE_COLORS.background;

  // Calculate dimensions
  const gridWidth = 5 * config.cellSize;
  const gridHeight = 5 * config.cellSize;

  const labelWidth = includeLabels ? config.labelWidth : 0;
  const labelHeight = includeLabels ? config.labelHeight : 0;
  const axisTitleSpace = includeLabels ? config.fontSize * 2 : 0;

  const titleHeight = title ? config.titleFontSize * 2 : 0;
  const legendHeight = includeLegend ? config.legendHeight : 0;

  const totalWidth = config.padding * 2 + axisTitleSpace + labelWidth + gridWidth;
  const totalHeight = config.padding * 2 + titleHeight + labelHeight + gridHeight + labelHeight + legendHeight;

  // Build SVG content
  let svgContent = '';

  // Background
  svgContent += `<rect width="${totalWidth}" height="${totalHeight}" fill="${backgroundColor}"/>`;

  // Title
  let currentY = config.padding;
  if (title) {
    svgContent += `
    <text
      x="${totalWidth / 2}"
      y="${currentY + config.titleFontSize}"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="${config.titleFontSize}"
      font-weight="700"
      fill="${STYLE_COLORS.text}"
    >${escapeXml(title)}</text>`;
    currentY += titleHeight;
  }

  // Grid starting position
  const gridStartX = config.padding + axisTitleSpace + labelWidth;
  const gridStartY = currentY + labelHeight;

  // Create highlight set for quick lookup
  const highlightSet = new Set(
    highlightCells.map(([s, l]) => `${s}-${l}`)
  );

  // Draw matrix cells
  const severities = [...SEVERITY_LEVELS].reverse() as SeverityLevel[];
  for (let row = 0; row < severities.length; row++) {
    const severity = severities[row];
    for (let col = 0; col < LIKELIHOOD_LEVELS.length; col++) {
      const likelihood = LIKELIHOOD_LEVELS[col];
      const cellX = gridStartX + col * config.cellSize;
      const cellY = gridStartY + row * config.cellSize;
      const isHighlighted = highlightSet.has(`${severity}-${likelihood}`);

      svgContent += generateCellSvg(
        cellX,
        cellY,
        config.cellSize,
        severity,
        likelihood,
        showScores,
        config.scoreFontSize,
        isHighlighted
      );
    }
  }

  // Draw labels
  if (includeLabels) {
    // Severity labels (Y-axis)
    svgContent += generateSeverityLabels(
      config.padding + axisTitleSpace,
      gridStartY,
      labelWidth,
      config.cellSize,
      config.fontSize
    );

    // Likelihood labels (X-axis) - top
    svgContent += generateLikelihoodLabels(
      gridStartX,
      currentY,
      labelHeight,
      config.cellSize,
      config.fontSize
    );

    // Axis titles
    svgContent += generateAxisTitles(
      labelWidth,
      labelHeight,
      gridWidth,
      gridHeight,
      config.padding,
      config.fontSize,
      currentY
    );
  }

  // Draw legend
  if (includeLegend) {
    const legendY = gridStartY + gridHeight + labelHeight + 5;
    svgContent += generateLegend(
      gridStartX,
      legendY,
      config.legendHeight,
      config.fontSize
    );
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${totalWidth}"
  height="${totalHeight}"
  viewBox="0 0 ${totalWidth} ${totalHeight}"
>
  ${svgContent}
</svg>`;

  return { svg, width: totalWidth, height: totalHeight };
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate a risk matrix image.
 *
 * Creates a PNG image of the 5x5 risk matrix showing severity vs likelihood.
 * The matrix uses standard HazOps color coding:
 * - Green: Low risk (score 1-4)
 * - Amber: Medium risk (score 5-14)
 * - Red: High risk (score 15-25)
 *
 * @param options - Configuration options for the image
 * @returns Generated image as Buffer with metadata
 */
export async function generateRiskMatrixImage(
  options: RiskMatrixImageOptions = {}
): Promise<RiskMatrixImageResult> {
  // Generate SVG
  const { svg, width, height } = generateRiskMatrixSvg(options);

  // Convert SVG to PNG using sharp
  const buffer = await sharp(Buffer.from(svg))
    .png({
      compressionLevel: 9,
      palette: true,
    })
    .toBuffer();

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const sizeLabel = options.size ?? 'medium';
  const filename = `risk_matrix_${sizeLabel}_${timestamp}.png`;

  return {
    buffer,
    mimeType: 'image/png',
    filename,
    width,
    height,
  };
}

/**
 * Generate a risk matrix image with specific entries highlighted.
 *
 * Useful for showing where specific analysis entries fall on the matrix.
 *
 * @param entries - Array of risk rankings to highlight on the matrix
 * @param options - Additional configuration options
 * @returns Generated image as Buffer with metadata
 */
export async function generateRiskMatrixWithHighlights(
  entries: Array<{ severity: SeverityLevel; likelihood: LikelihoodLevel }>,
  options: Omit<RiskMatrixImageOptions, 'highlightCells'> = {}
): Promise<RiskMatrixImageResult> {
  const highlightCells: Array<[SeverityLevel, LikelihoodLevel]> = entries.map(
    (entry) => [entry.severity, entry.likelihood]
  );

  return generateRiskMatrixImage({
    ...options,
    highlightCells,
  });
}

/**
 * Generate risk matrix images in all sizes.
 *
 * Useful for creating responsive images or providing multiple resolution options.
 *
 * @param options - Configuration options (size will be overridden)
 * @returns Map of size to generated image result
 */
export async function generateRiskMatrixAllSizes(
  options: Omit<RiskMatrixImageOptions, 'size'> = {}
): Promise<Map<RiskMatrixImageSize, RiskMatrixImageResult>> {
  const sizes: RiskMatrixImageSize[] = ['small', 'medium', 'large'];
  const results = new Map<RiskMatrixImageSize, RiskMatrixImageResult>();

  for (const size of sizes) {
    const result = await generateRiskMatrixImage({ ...options, size });
    results.set(size, result);
  }

  return results;
}

/**
 * Generate SVG string for the risk matrix (without converting to PNG).
 *
 * Useful when SVG format is preferred over PNG.
 *
 * @param options - Configuration options for the image
 * @returns SVG string with dimensions
 */
export function generateRiskMatrixSvgString(
  options: RiskMatrixImageOptions = {}
): { svg: string; width: number; height: number } {
  return generateRiskMatrixSvg(options);
}
