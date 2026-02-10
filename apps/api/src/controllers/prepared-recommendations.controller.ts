/**
 * Prepared Recommendations controller for handling prepared recommendation requests.
 *
 * Handles:
 * - GET /prepared-recommendations - List all prepared recommendations
 * - GET /prepared-recommendations/common - List common/recommended recommendations
 * - GET /prepared-recommendations/stats - Get statistics about prepared recommendations
 * - GET /prepared-recommendations/by-equipment/:type - Get recommendations for equipment type
 * - GET /prepared-recommendations/by-guide-word/:guideWord - Get recommendations for guide word
 * - GET /prepared-recommendations/context - Get recommendations for equipment type and guide word
 * - GET /prepared-recommendations/search - Search recommendations by text
 * - GET /prepared-recommendations/:id - Get a single prepared recommendation by ID
 */

import type { Request, Response } from 'express';
import type { EquipmentType, GuideWord } from '@hazop/types';
import {
  getAllPreparedRecommendations,
  getPreparedRecommendationsFiltered,
  getPreparedRecommendationsForEquipmentType,
  getPreparedRecommendationsForGuideWord,
  getPreparedRecommendationsForContext,
  searchPreparedRecommendations,
  getCommonPreparedRecommendations,
  getPreparedRecommendationById,
  getPreparedRecommendationStats,
  isValidEquipmentType,
  isValidGuideWord,
} from '../services/prepared-recommendations.service.js';

/**
 * GET /prepared-recommendations
 * List all prepared recommendations with optional filtering.
 *
 * Query parameters:
 * - equipmentType: Filter by equipment type
 * - guideWord: Filter by guide word
 * - commonOnly: Only return common recommendations (true/false)
 * - search: Search text
 *
 * Returns:
 * - 200: Prepared recommendations list
 *
 * Response body:
 * {
 *   success: true,
 *   data: PreparedAnswersFilteredResponse
 * }
 */
export function listPreparedRecommendations(req: Request, res: Response): void {
  const { equipmentType, guideWord, commonOnly, search } = req.query;

  // If no filters, return all
  if (!equipmentType && !guideWord && !commonOnly && !search) {
    const result = getAllPreparedRecommendations();
    res.status(200).json({
      success: true,
      data: result,
    });
    return;
  }

  // Validate equipment type if provided
  if (equipmentType && !isValidEquipmentType(equipmentType as string)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid equipment type: ${equipmentType}`,
      },
    });
    return;
  }

  // Validate guide word if provided
  if (guideWord && !isValidGuideWord(guideWord as string)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid guide word: ${guideWord}`,
      },
    });
    return;
  }

  const result = getPreparedRecommendationsFiltered({
    equipmentType: equipmentType as EquipmentType | undefined,
    guideWord: guideWord as GuideWord | undefined,
    commonOnly: commonOnly === 'true',
    search: search as string | undefined,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /prepared-recommendations/common
 * List common/recommended prepared recommendations.
 *
 * Returns:
 * - 200: Common prepared recommendations
 */
export function listCommonPreparedRecommendations(_req: Request, res: Response): void {
  const result = getCommonPreparedRecommendations();

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /prepared-recommendations/stats
 * Get statistics about prepared recommendations.
 *
 * Returns:
 * - 200: Statistics including counts by equipment type and guide word
 */
export function getPreparedRecommendationsStatistics(_req: Request, res: Response): void {
  const stats = getPreparedRecommendationStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
}

/**
 * GET /prepared-recommendations/by-equipment/:type
 * Get prepared recommendations for a specific equipment type.
 *
 * Path parameters:
 * - type: Equipment type (pump, valve, reactor, etc.)
 *
 * Returns:
 * - 200: Prepared recommendations for the equipment type
 * - 400: Invalid equipment type
 */
export function getPreparedRecommendationsByEquipmentType(req: Request, res: Response): void {
  const { type } = req.params;

  if (!type || !isValidEquipmentType(type)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid equipment type: ${type}`,
      },
    });
    return;
  }

  const result = getPreparedRecommendationsForEquipmentType(type);

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /prepared-recommendations/by-guide-word/:guideWord
 * Get prepared recommendations for a specific guide word.
 *
 * Path parameters:
 * - guideWord: Guide word (no, more, less, etc.)
 *
 * Returns:
 * - 200: Prepared recommendations for the guide word
 * - 400: Invalid guide word
 */
export function getPreparedRecommendationsByGuideWord(req: Request, res: Response): void {
  const { guideWord } = req.params;

  if (!guideWord || !isValidGuideWord(guideWord)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid guide word: ${guideWord}`,
      },
    });
    return;
  }

  const result = getPreparedRecommendationsForGuideWord(guideWord);

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /prepared-recommendations/context
 * Get prepared recommendations for a specific equipment type and guide word combination.
 *
 * Query parameters:
 * - equipmentType: Required - Equipment type
 * - guideWord: Required - Guide word
 *
 * Returns:
 * - 200: Prepared recommendations for the context
 * - 400: Missing or invalid parameters
 */
export function getPreparedRecommendationsByContext(req: Request, res: Response): void {
  const { equipmentType, guideWord } = req.query;

  if (!equipmentType) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Equipment type is required',
      },
    });
    return;
  }

  if (!guideWord) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Guide word is required',
      },
    });
    return;
  }

  if (!isValidEquipmentType(equipmentType as string)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid equipment type: ${equipmentType}`,
      },
    });
    return;
  }

  if (!isValidGuideWord(guideWord as string)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid guide word: ${guideWord}`,
      },
    });
    return;
  }

  const result = getPreparedRecommendationsForContext(
    equipmentType as EquipmentType,
    guideWord as GuideWord
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /prepared-recommendations/search
 * Search prepared recommendations by text.
 *
 * Query parameters:
 * - q: Required - Search text
 *
 * Returns:
 * - 200: Matching prepared recommendations
 * - 400: Missing search query
 */
export function searchPreparedRecommendationsHandler(req: Request, res: Response): void {
  const { q } = req.query;

  if (!q || (typeof q === 'string' && q.trim().length === 0)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Search query is required',
      },
    });
    return;
  }

  const result = searchPreparedRecommendations(q as string);

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /prepared-recommendations/:id
 * Get a single prepared recommendation by ID.
 *
 * Path parameters:
 * - id: Prepared recommendation ID
 *
 * Returns:
 * - 200: The prepared recommendation
 * - 404: Prepared recommendation not found
 */
export function getPreparedRecommendation(req: Request, res: Response): void {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Prepared recommendation ID is required',
      },
    });
    return;
  }

  const recommendation = getPreparedRecommendationById(id);

  if (!recommendation) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Prepared recommendation with ID '${id}' not found`,
      },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: recommendation,
  });
}
