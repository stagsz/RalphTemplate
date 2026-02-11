/**
 * Prepared Consequences service for frontend API integration.
 *
 * Provides methods for fetching prepared consequence answer templates
 * from the backend API. Consequences are used in HazOps analysis to
 * identify possible consequences of process deviations.
 */

import type {
  PreparedAnswersResponse,
  PreparedAnswersFilteredResponse,
  GuideWord,
  EquipmentType,
  ApiResult,
} from '@hazop/types';
import { api } from './api.client';

/**
 * Prepared consequences service for handling prepared consequence API operations.
 *
 * This service provides methods for:
 * - Listing all prepared consequences with optional filtering
 * - Getting consequences by equipment type
 * - Getting consequences by guide word
 * - Getting consequences by context (equipment type + guide word)
 * - Searching consequences by text
 */
export const preparedConsequencesService = {
  /**
   * List all prepared consequences with optional filtering.
   *
   * @param options - Filter options (equipmentType, guideWord, commonOnly, search)
   * @returns Promise resolving to the API result with prepared consequences
   */
  async listConsequences(options?: {
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
    const endpoint = queryString ? `/prepared-consequences?${queryString}` : '/prepared-consequences';

    return api.get<PreparedAnswersResponse>(endpoint, { authenticated: false });
  },

  /**
   * Get prepared consequences for a specific equipment type.
   *
   * @param equipmentType - The equipment type to filter by
   * @returns Promise resolving to the API result with filtered consequences
   */
  async getByEquipmentType(
    equipmentType: EquipmentType
  ): Promise<ApiResult<PreparedAnswersFilteredResponse>> {
    return api.get<PreparedAnswersFilteredResponse>(
      `/prepared-consequences/by-equipment/${equipmentType}`,
      { authenticated: false }
    );
  },

  /**
   * Get prepared consequences for a specific guide word.
   *
   * @param guideWord - The guide word to filter by
   * @returns Promise resolving to the API result with filtered consequences
   */
  async getByGuideWord(
    guideWord: GuideWord
  ): Promise<ApiResult<PreparedAnswersFilteredResponse>> {
    return api.get<PreparedAnswersFilteredResponse>(
      `/prepared-consequences/by-guide-word/${guideWord}`,
      { authenticated: false }
    );
  },

  /**
   * Get prepared consequences for a specific equipment type and guide word context.
   * This is the primary method for getting context-aware consequence suggestions.
   *
   * @param equipmentType - The equipment type
   * @param guideWord - The guide word
   * @returns Promise resolving to the API result with filtered consequences
   */
  async getByContext(
    equipmentType: EquipmentType,
    guideWord: GuideWord
  ): Promise<ApiResult<PreparedAnswersFilteredResponse>> {
    return api.get<PreparedAnswersFilteredResponse>(
      `/prepared-consequences/context?equipmentType=${equipmentType}&guideWord=${guideWord}`,
      { authenticated: false }
    );
  },

  /**
   * Search prepared consequences by text.
   *
   * @param searchText - Text to search for
   * @returns Promise resolving to the API result with matching consequences
   */
  async search(searchText: string): Promise<ApiResult<PreparedAnswersResponse>> {
    return api.get<PreparedAnswersResponse>(
      `/prepared-consequences/search?q=${encodeURIComponent(searchText)}`,
      { authenticated: false }
    );
  },

  /**
   * Get common/recommended prepared consequences.
   *
   * @returns Promise resolving to the API result with common consequences
   */
  async getCommon(): Promise<ApiResult<PreparedAnswersResponse>> {
    return api.get<PreparedAnswersResponse>('/prepared-consequences/common', { authenticated: false });
  },
};
