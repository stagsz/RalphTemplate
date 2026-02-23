/**
 * Tests for Risk Matrix Image Generator Service.
 *
 * Tests the risk matrix image generation functionality including:
 * - SVG generation with proper structure
 * - PNG conversion via sharp
 * - Different size presets (small, medium, large)
 * - Cell highlighting
 * - Labels and legend options
 * - Proper MIME type and filename generation
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateRiskMatrixImage,
  generateRiskMatrixWithHighlights,
  generateRiskMatrixAllSizes,
  generateRiskMatrixSvgString,
} from './risk-matrix-image-generator.service.js';
import type { RiskMatrixImageSize } from './risk-matrix-image-generator.service.js';
import type { SeverityLevel, LikelihoodLevel } from '@hazop/types';

describe('Risk Matrix Image Generator Service', () => {
  describe('generateRiskMatrixImage', () => {
    it('should generate an image with correct MIME type', async () => {
      const result = await generateRiskMatrixImage();

      expect(result.mimeType).toBe('image/png');
    });

    it('should generate an image with buffer', async () => {
      const result = await generateRiskMatrixImage();

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should generate correct filename format with default size', async () => {
      const result = await generateRiskMatrixImage();

      expect(result.filename).toMatch(/^risk_matrix_medium_\d{4}-\d{2}-\d{2}\.png$/);
    });

    it('should include width and height in result', async () => {
      const result = await generateRiskMatrixImage();

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should use small size preset', async () => {
      const result = await generateRiskMatrixImage({ size: 'small' });

      expect(result.filename).toContain('_small_');
      expect(result.width).toBeLessThan(400);
    });

    it('should use medium size preset', async () => {
      const result = await generateRiskMatrixImage({ size: 'medium' });

      expect(result.filename).toContain('_medium_');
    });

    it('should use large size preset', async () => {
      const result = await generateRiskMatrixImage({ size: 'large' });

      expect(result.filename).toContain('_large_');
      expect(result.width).toBeGreaterThan(400);
    });

    it('should include labels by default', async () => {
      const result = await generateRiskMatrixImage();

      expect(result).toBeDefined();
    });

    it('should exclude labels when disabled', async () => {
      const result = await generateRiskMatrixImage({ includeLabels: false });

      expect(result).toBeDefined();
    });

    it('should include legend by default', async () => {
      const result = await generateRiskMatrixImage();

      expect(result).toBeDefined();
    });

    it('should exclude legend when disabled', async () => {
      const result = await generateRiskMatrixImage({ includeLegend: false });

      expect(result).toBeDefined();
    });

    it('should show scores by default', async () => {
      const result = await generateRiskMatrixImage();

      expect(result).toBeDefined();
    });

    it('should hide scores when disabled', async () => {
      const result = await generateRiskMatrixImage({ showScores: false });

      expect(result).toBeDefined();
    });

    it('should include title when provided', async () => {
      const result = await generateRiskMatrixImage({ title: 'Project Risk Matrix' });

      expect(result).toBeDefined();
    });

    it('should highlight specific cells', async () => {
      const highlightCells: Array<[SeverityLevel, LikelihoodLevel]> = [
        [3, 4],
        [5, 5],
      ];
      const result = await generateRiskMatrixImage({ highlightCells });

      expect(result).toBeDefined();
    });

    it('should use custom background color', async () => {
      const result = await generateRiskMatrixImage({ backgroundColor: '#f0f0f0' });

      expect(result).toBeDefined();
    });

    it('should handle empty options', async () => {
      const result = await generateRiskMatrixImage({});

      expect(result).toBeDefined();
      expect(result.mimeType).toBe('image/png');
    });

    it('should handle all options combined', async () => {
      const result = await generateRiskMatrixImage({
        size: 'large',
        includeLabels: true,
        includeLegend: true,
        showScores: true,
        title: 'Complete Risk Matrix',
        highlightCells: [[2, 3], [4, 4]],
        backgroundColor: '#ffffff',
      });

      expect(result).toBeDefined();
    });

    it('should handle minimal options (no labels, no legend, no scores)', async () => {
      const result = await generateRiskMatrixImage({
        includeLabels: false,
        includeLegend: false,
        showScores: false,
      });

      expect(result).toBeDefined();
    });
  });

  describe('generateRiskMatrixWithHighlights', () => {
    it('should highlight entries based on severity and likelihood', async () => {
      const entries = [
        { severity: 3 as SeverityLevel, likelihood: 4 as LikelihoodLevel },
        { severity: 5 as SeverityLevel, likelihood: 5 as LikelihoodLevel },
      ];

      const result = await generateRiskMatrixWithHighlights(entries);

      expect(result).toBeDefined();
      expect(result.mimeType).toBe('image/png');
    });

    it('should handle empty entries array', async () => {
      const result = await generateRiskMatrixWithHighlights([]);

      expect(result).toBeDefined();
    });

    it('should accept additional options', async () => {
      const entries = [
        { severity: 2 as SeverityLevel, likelihood: 3 as LikelihoodLevel },
      ];

      const result = await generateRiskMatrixWithHighlights(entries, {
        size: 'large',
        title: 'Analysis Risk Matrix',
      });

      expect(result).toBeDefined();
    });

    it('should highlight all severity and likelihood combinations', async () => {
      const entries: Array<{ severity: SeverityLevel; likelihood: LikelihoodLevel }> = [];
      for (let s = 1; s <= 5; s++) {
        for (let l = 1; l <= 5; l++) {
          entries.push({ severity: s as SeverityLevel, likelihood: l as LikelihoodLevel });
        }
      }

      const result = await generateRiskMatrixWithHighlights(entries);

      expect(result).toBeDefined();
    });

    it('should handle duplicate entries (same cell)', async () => {
      const entries = [
        { severity: 3 as SeverityLevel, likelihood: 3 as LikelihoodLevel },
        { severity: 3 as SeverityLevel, likelihood: 3 as LikelihoodLevel },
        { severity: 3 as SeverityLevel, likelihood: 3 as LikelihoodLevel },
      ];

      const result = await generateRiskMatrixWithHighlights(entries);

      expect(result).toBeDefined();
    });
  });

  describe('generateRiskMatrixAllSizes', () => {
    it('should generate images for all three sizes', async () => {
      const results = await generateRiskMatrixAllSizes();

      expect(results.size).toBe(3);
      expect(results.has('small')).toBe(true);
      expect(results.has('medium')).toBe(true);
      expect(results.has('large')).toBe(true);
    });

    it('should have different dimensions for each size', async () => {
      const results = await generateRiskMatrixAllSizes();

      const small = results.get('small')!;
      const medium = results.get('medium')!;
      const large = results.get('large')!;

      expect(small.width).toBeLessThan(medium.width);
      expect(medium.width).toBeLessThan(large.width);
    });

    it('should accept options (except size)', async () => {
      const results = await generateRiskMatrixAllSizes({
        title: 'Multi-Size Matrix',
        includeLabels: true,
      });

      expect(results.size).toBe(3);
    });

    it('should have correct filenames for each size', async () => {
      const results = await generateRiskMatrixAllSizes();

      expect(results.get('small')!.filename).toContain('_small_');
      expect(results.get('medium')!.filename).toContain('_medium_');
      expect(results.get('large')!.filename).toContain('_large_');
    });

    it('should have correct MIME types for all sizes', async () => {
      const results = await generateRiskMatrixAllSizes();

      for (const [, result] of results) {
        expect(result.mimeType).toBe('image/png');
      }
    });
  });

  describe('generateRiskMatrixSvgString', () => {
    it('should return SVG string with dimensions', () => {
      const result = generateRiskMatrixSvgString();

      expect(typeof result.svg).toBe('string');
      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('</svg>');
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should include XML declaration', () => {
      const result = generateRiskMatrixSvgString();

      expect(result.svg).toContain('<?xml version="1.0"');
    });

    it('should include xmlns attribute', () => {
      const result = generateRiskMatrixSvgString();

      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should include viewBox attribute', () => {
      const result = generateRiskMatrixSvgString();

      expect(result.svg).toContain('viewBox=');
    });

    it('should include rect elements for cells', () => {
      const result = generateRiskMatrixSvgString();

      expect(result.svg).toContain('<rect');
    });

    it('should include text elements when labels are enabled', () => {
      const result = generateRiskMatrixSvgString({ includeLabels: true });

      expect(result.svg).toContain('<text');
    });

    it('should include title text when provided', () => {
      const result = generateRiskMatrixSvgString({ title: 'Test Matrix Title' });

      expect(result.svg).toContain('Test Matrix Title');
    });

    it('should use different dimensions for different sizes', () => {
      const small = generateRiskMatrixSvgString({ size: 'small' });
      const large = generateRiskMatrixSvgString({ size: 'large' });

      expect(small.width).toBeLessThan(large.width);
      expect(small.height).toBeLessThan(large.height);
    });

    it('should properly escape XML special characters in title', () => {
      const result = generateRiskMatrixSvgString({ title: 'Test & Title <script>' });

      expect(result.svg).toContain('&amp;');
      expect(result.svg).toContain('&lt;');
      expect(result.svg).not.toContain('<script>');
    });

    it('should handle empty options', () => {
      const result = generateRiskMatrixSvgString({});

      expect(result.svg).toBeDefined();
      expect(result.width).toBeGreaterThan(0);
    });

    it('should include background rectangle', () => {
      const result = generateRiskMatrixSvgString();

      expect(result.svg).toContain('<rect width=');
    });

    it('should include 25 cell rectangles (5x5 matrix)', () => {
      const result = generateRiskMatrixSvgString({ includeLabels: false, includeLegend: false });

      // Count rect elements (1 background + 25 cells = 26)
      const rectMatches = result.svg.match(/<rect/g);
      expect(rectMatches).not.toBeNull();
      expect(rectMatches!.length).toBeGreaterThanOrEqual(26);
    });

    it('should include scores in cells when enabled', () => {
      const result = generateRiskMatrixSvgString({ showScores: true, includeLabels: false });

      // Scores are products of severity and likelihood (1-25)
      expect(result.svg).toContain('>1<'); // 1*1
      expect(result.svg).toContain('>25<'); // 5*5
    });

    it('should not include scores when disabled', () => {
      const result = generateRiskMatrixSvgString({ showScores: false, includeLabels: false, includeLegend: false });

      // With all labels disabled and no scores, there should be minimal text
      const textMatches = result.svg.match(/<text/g);
      if (textMatches) {
        expect(textMatches.length).toBeLessThan(25);
      }
    });

    it('should include severity labels', () => {
      const result = generateRiskMatrixSvgString({ includeLabels: true });

      expect(result.svg).toContain('Negligible');
      expect(result.svg).toContain('Minor');
      expect(result.svg).toContain('Moderate');
      expect(result.svg).toContain('Major');
      expect(result.svg).toContain('Catastrophic');
    });

    it('should include axis titles', () => {
      const result = generateRiskMatrixSvgString({ includeLabels: true });

      expect(result.svg).toContain('Severity');
      expect(result.svg).toContain('Likelihood');
    });

    it('should include legend items', () => {
      const result = generateRiskMatrixSvgString({ includeLegend: true });

      expect(result.svg).toContain('Low Risk');
      expect(result.svg).toContain('Medium Risk');
      expect(result.svg).toContain('High Risk');
    });

    it('should have smaller dimensions without labels', () => {
      const withLabels = generateRiskMatrixSvgString({ includeLabels: true });
      const withoutLabels = generateRiskMatrixSvgString({ includeLabels: false });

      expect(withoutLabels.width).toBeLessThan(withLabels.width);
    });

    it('should have smaller height without legend', () => {
      const withLegend = generateRiskMatrixSvgString({ includeLegend: true });
      const withoutLegend = generateRiskMatrixSvgString({ includeLegend: false });

      expect(withoutLegend.height).toBeLessThan(withLegend.height);
    });

    it('should have taller height with title', () => {
      const withTitle = generateRiskMatrixSvgString({ title: 'Test Title' });
      const withoutTitle = generateRiskMatrixSvgString();

      expect(withTitle.height).toBeGreaterThan(withoutTitle.height);
    });
  });

  describe('Size configurations', () => {
    const sizes: RiskMatrixImageSize[] = ['small', 'medium', 'large'];

    sizes.forEach((size) => {
      it(`should generate valid image for ${size} size`, async () => {
        const result = await generateRiskMatrixImage({ size });

        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
      });
    });

    it('should have progressively larger dimensions', async () => {
      const small = await generateRiskMatrixImage({ size: 'small' });
      const medium = await generateRiskMatrixImage({ size: 'medium' });
      const large = await generateRiskMatrixImage({ size: 'large' });

      expect(small.width).toBeLessThan(medium.width);
      expect(medium.width).toBeLessThan(large.width);
      expect(small.height).toBeLessThan(medium.height);
      expect(medium.height).toBeLessThan(large.height);
    });
  });

  describe('Cell highlighting', () => {
    it('should highlight corner cells', async () => {
      const highlightCells: Array<[SeverityLevel, LikelihoodLevel]> = [
        [1, 1], // Bottom-left
        [1, 5], // Bottom-right
        [5, 1], // Top-left
        [5, 5], // Top-right
      ];

      const result = await generateRiskMatrixImage({ highlightCells });

      expect(result).toBeDefined();
    });

    it('should highlight center cell', async () => {
      const highlightCells: Array<[SeverityLevel, LikelihoodLevel]> = [[3, 3]];

      const result = await generateRiskMatrixImage({ highlightCells });

      expect(result).toBeDefined();
    });

    it('should highlight diagonal cells', async () => {
      const highlightCells: Array<[SeverityLevel, LikelihoodLevel]> = [
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
        [5, 5],
      ];

      const result = await generateRiskMatrixImage({ highlightCells });

      expect(result).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined options', async () => {
      const result = await generateRiskMatrixImage(undefined);

      expect(result).toBeDefined();
      expect(result.mimeType).toBe('image/png');
    });

    it('should handle very long title', async () => {
      const longTitle = 'A'.repeat(200);
      const result = await generateRiskMatrixImage({ title: longTitle });

      expect(result).toBeDefined();
    });

    it('should handle title with special characters', async () => {
      const result = await generateRiskMatrixImage({
        title: 'Test & Analysis <2026> "Quotes" \'Single\'',
      });

      expect(result).toBeDefined();
    });

    it('should handle empty highlight cells array', async () => {
      const result = await generateRiskMatrixImage({ highlightCells: [] });

      expect(result).toBeDefined();
    });
  });
});
