/**
 * Prepared Causes service for frontend API integration.
 *
 * Provides methods for fetching prepared cause answer templates
 * from the backend API. Causes are used in HazOps analysis to
 * identify possible causes of process deviations.
 */

import type {
  PreparedAnswer,
  PreparedAnswersResponse,
  PreparedAnswersFilteredResponse,
  GuideWord,
  EquipmentType,
  ApiResult,
} from '@hazop/types';
import { api } from './api.client';

/**
 * Prepared causes service for handling prepared cause API operations.
 *
 * This service provides methods for:
 * - Listing all prepared causes with optional filtering
 * - Getting causes by equipment type
 * - Getting causes by guide word
 * - Getting causes by context (equipment type + guide word)
 * - Searching causes by text
 */
export const preparedCausesService = {
  /**
   * List all prepared causes with optional filtering.
   *
   * @param options - Filter options (equipmentType, guideWord, commonOnly, search)
   * @returns Promise resolving to the API result with prepared causes
   */
  async listCauses(options?: {
    equipmentType?: EquipmentType;
    guideWord?: GuideWord;
    commonOnly?: boolean;
    search?: string;
  }): Promise<ApiResult<PreparedAnswersResponse>> {
    const params = new URLSearchParams();
    if (options?.equipmentType) params.set('equipmentType', options.equipmentType);
    if (options?.guideWord) params.set('guideWord', options.guideWord);
    if (options?.commonOnly) params.set('commonOnly', 'true');
    if (options?.search) params.set('search', options.search);

    const queryString = params.toString();
    const endpoint = queryString ? `/prepared-causes?${queryString}` : '/prepared-causes';

    return api.get<PreparedAnswersResponse>(endpoint, { authenticated: false });
  },

  /**
   * Get prepared causes for a specific equipment type.
   *
   * @param equipmentType - The equipment type to filter by
   * @returns Promise resolving to the API result with filtered causes
   */
  async getByEquipmentType(
    equipmentType: EquipmentType
  ): Promise<ApiResult<PreparedAnswersFilteredResponse>> {
    return api.get<PreparedAnswersFilteredResponse>(
      `/prepared-causes/by-equipment/${equipmentType}`,
      { authenticated: false }
    );
  },

  /**
   * Get prepared causes for a specific guide word.
   *
   * @param guideWord - The guide word to filter by
   * @returns Promise resolving to the API result with filtered causes
   */
  async getByGuideWord(
    guideWord: GuideWord
  ): Promise<ApiResult<PreparedAnswersFilteredResponse>> {
    return api.get<PreparedAnswersFilteredResponse>(
      `/prepared-causes/by-guide-word/${guideWord}`,
      { authenticated: false }
    );
  },

  /**
   * Get prepared causes for a specific equipment type and guide word context.
   * This is the primary method for getting context-aware cause suggestions.
   *
   * @param equipmentType - The equipment type
   * @param guideWord - The guide word
   * @returns Promise resolving to the API result with filtered causes
   */
  async getByContext(
    equipmentType: EquipmentType,
    guideWord: GuideWord
  ): Promise<ApiResult<PreparedAnswersFilteredResponse>> {
    return api.get<PreparedAnswersFilteredResponse>(
      `/prepared-causes/context?equipmentType=${equipmentType}&guideWord=${guideWord}`,
      { authenticated: false }
    );
  },

  /**
   * Search prepared causes by text.
   *
   * @param searchText - Text to search for
   * @returns Promise resolving to the API result with matching causes
   */
  async search(searchText: string): Promise<ApiResult<PreparedAnswersResponse>> {
    return api.get<PreparedAnswersResponse>(
      `/prepared-causes/search?q=${encodeURIComponent(searchText)}`,
      { authenticated: false }
    );
  },

  /**
   * Get common/recommended prepared causes.
   *
   * @returns Promise resolving to the API result with common causes
   */
  async getCommon(): Promise<ApiResult<PreparedAnswersResponse>> {
    return api.get<PreparedAnswersResponse>('/prepared-causes/common', { authenticated: false });
  },
};
