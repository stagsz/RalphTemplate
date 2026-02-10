/**
 * Prepared Consequences controller for handling prepared consequence requests.
 *
 * Handles:
 * - GET /prepared-consequences - List all prepared consequences
 * - GET /prepared-consequences/common - List common/recommended consequences
 * - GET /prepared-consequences/stats - Get statistics about prepared consequences
 * - GET /prepared-consequences/by-equipment/:type - Get consequences for equipment type
 * - GET /prepared-consequences/by-guide-word/:guideWord - Get consequences for guide word
 * - GET /prepared-consequences/context - Get consequences for equipment type and guide word
 * - GET /prepared-consequences/search - Search consequences by text
 * - GET /prepared-consequences/:id - Get a single prepared consequence by ID
 */

import type { Request, Response } from 'express';
import type { EquipmentType, GuideWord } from '@hazop/types';
import {
  getAllPreparedConsequences,
  getPreparedConsequencesFiltered,
  getPreparedConsequencesForEquipmentType,
  getPreparedConsequencesForGuideWord,
  getPreparedConsequencesForContext,
  searchPreparedConsequences,
  getCommonPreparedConsequences,
  getPreparedConsequenceById,
  getPreparedConsequenceStats,
  isValidEquipmentType,
  isValidGuideWord,
} from '../services/prepared-consequences.service.js';

/**
 * GET /prepared-consequences
 * List all prepared consequences with optional filtering.
 *
 * Query parameters:
 * - equipmentType: Filter by equipment type
 * - guideWord: Filter by guide word
 * - commonOnly: Only return common consequences (true/false)
 * - search: Search text
 *
 * Returns:
 * - 200: Prepared consequences list
 *
 * Response body:
 * {
 *   success: true,
 *   data: PreparedAnswersFilteredResponse
 * }
 */
export function listPreparedConsequences(req: Request, res: Response): void {
  const { equipmentType, guideWord, commonOnly, search } = req.query;

  // If no filters, return all
  if (!equipmentType && !guideWord && !commonOnly && !search) {
    const result = getAllPreparedConsequences();
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

  const result = getPreparedConsequencesFiltered({
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
 * GET /prepared-consequences/common
 * List common/recommended prepared consequences.
 *
 * Returns:
 * - 200: Common prepared consequences
 */
export function listCommonPreparedConsequences(_req: Request, res: Response): void {
  const result = getCommonPreparedConsequences();

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /prepared-consequences/stats
 * Get statistics about prepared consequences.
 *
 * Returns:
 * - 200: Statistics including counts by equipment type and guide word
 */
export function getPreparedConsequencesStatistics(_req: Request, res: Response): void {
  const stats = getPreparedConsequenceStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
}

/**
 * GET /prepared-consequences/by-equipment/:type
 * Get prepared consequences for a specific equipment type.
 *
 * Path parameters:
 * - type: Equipment type (pump, valve, reactor, etc.)
 *
 * Returns:
 * - 200: Prepared consequences for the equipment type
 * - 400: Invalid equipment type
 */
export function getPreparedConsequencesByEquipmentType(req: Request, res: Response): void {
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

  const result = getPreparedConsequencesForEquipmentType(type);

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /prepared-consequences/by-guide-word/:guideWord
 * Get prepared consequences for a specific guide word.
 *
 * Path parameters:
 * - guideWord: Guide word (no, more, less, etc.)
 *
 * Returns:
 * - 200: Prepared consequences for the guide word
 * - 400: Invalid guide word
 */
export function getPreparedConsequencesByGuideWord(req: Request, res: Response): void {
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

  const result = getPreparedConsequencesForGuideWord(guideWord);

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /prepared-consequences/context
 * Get prepared consequences for a specific equipment type and guide word combination.
 *
 * Query parameters:
 * - equipmentType: Required - Equipment type
 * - guideWord: Required - Guide word
 *
 * Returns:
 * - 200: Prepared consequences for the context
 * - 400: Missing or invalid parameters
 */
export function getPreparedConsequencesByContext(req: Request, res: Response): void {
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

  const result = getPreparedConsequencesForContext(
    equipmentType as EquipmentType,
    guideWord as GuideWord
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /prepared-consequences/search
 * Search prepared consequences by text.
 *
 * Query parameters:
 * - q: Required - Search text
 *
 * Returns:
 * - 200: Matching prepared consequences
 * - 400: Missing search query
 */
export function searchPreparedConsequencesHandler(req: Request, res: Response): void {
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

  const result = searchPreparedConsequences(q as string);

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * GET /prepared-consequences/:id
 * Get a single prepared consequence by ID.
 *
 * Path parameters:
 * - id: Prepared consequence ID
 *
 * Returns:
 * - 200: The prepared consequence
 * - 404: Prepared consequence not found
 */
export function getPreparedConsequence(req: Request, res: Response): void {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Prepared consequence ID is required',
      },
    });
    return;
  }

  const consequence = getPreparedConsequenceById(id);

  if (!consequence) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Prepared consequence with ID '${id}' not found`,
      },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: consequence,
  });
}
