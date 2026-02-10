import type {
  AnalysisNodeWithCreator,
  EquipmentType,
  ApiResult,
  PaginationMeta,
} from '@hazop/types';
import { api } from './api.client';

/**
 * Response type for listing nodes.
 */
export interface ListNodesResponse {
  data: AnalysisNodeWithCreator[];
  meta: PaginationMeta;
}

/**
 * Response type for creating/updating a node.
 */
export interface NodeResponse {
  node: AnalysisNodeWithCreator;
}

/**
 * Filter options for listing nodes.
 */
export interface ListNodesFilters {
  search?: string;
  equipmentType?: EquipmentType;
}

/**
 * Sort options for listing nodes.
 */
export interface ListNodesSortOptions {
  sortBy?: 'node_id' | 'created_at' | 'updated_at' | 'equipment_type';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination options for listing nodes.
 */
export interface ListNodesPagination {
  page?: number;
  limit?: number;
}

/**
 * Payload for creating a new node.
 */
export interface CreateNodePayload {
  nodeId: string;
  description: string;
  equipmentType: EquipmentType;
  x: number;
  y: number;
}

/**
 * Payload for updating an existing node.
 */
export interface UpdateNodePayload {
  nodeId?: string;
  description?: string;
  equipmentType?: EquipmentType;
  x?: number;
  y?: number;
}

/**
 * Build query string from filter, sort, and pagination options.
 */
function buildQueryString(
  filters: ListNodesFilters,
  sort: ListNodesSortOptions,
  pagination: ListNodesPagination
): string {
  const params = new URLSearchParams();

  if (pagination.page !== undefined) {
    params.set('page', String(pagination.page));
  }
  if (pagination.limit !== undefined) {
    params.set('limit', String(pagination.limit));
  }
  if (sort.sortBy) {
    params.set('sortBy', sort.sortBy);
  }
  if (sort.sortOrder) {
    params.set('sortOrder', sort.sortOrder);
  }
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.equipmentType) {
    params.set('equipmentType', filters.equipmentType);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Nodes service for handling analysis node-related API operations.
 *
 * This service provides methods for:
 * - Listing nodes for a document
 * - Creating new nodes
 * - Updating existing nodes
 * - Deleting nodes
 */
export const nodesService = {
  /**
   * List nodes for a document with optional filtering, sorting, and pagination.
   *
   * @param documentId - The ID of the document
   * @param filters - Filter options (search, equipmentType)
   * @param sort - Sort options (sortBy, sortOrder)
   * @param pagination - Pagination options (page, limit)
   * @returns Promise resolving to the API result with node list and metadata
   */
  async listNodes(
    documentId: string,
    filters: ListNodesFilters = {},
    sort: ListNodesSortOptions = {},
    pagination: ListNodesPagination = {}
  ): Promise<ApiResult<ListNodesResponse>> {
    const queryString = buildQueryString(filters, sort, pagination);
    const result = await api.get<ListNodesResponse>(
      `/documents/${documentId}/nodes${queryString}`
    );

    // The API returns { success, data: Node[], meta } but we need { data: Node[], meta }
    if (result.success && result.data) {
      return {
        success: true,
        data: {
          data: result.data as unknown as AnalysisNodeWithCreator[],
          meta: result.meta!,
        },
      };
    }

    return result as ApiResult<ListNodesResponse>;
  },

  /**
   * Create a new node on a document.
   *
   * @param documentId - The ID of the document to add the node to
   * @param payload - The node creation data
   * @returns Promise resolving to the API result with created node
   */
  async createNode(
    documentId: string,
    payload: CreateNodePayload
  ): Promise<ApiResult<NodeResponse>> {
    return api.post<NodeResponse>(`/documents/${documentId}/nodes`, payload);
  },

  /**
   * Update an existing node.
   *
   * @param nodeId - The ID of the node to update
   * @param payload - The node update data
   * @returns Promise resolving to the API result with updated node
   */
  async updateNode(
    nodeId: string,
    payload: UpdateNodePayload
  ): Promise<ApiResult<NodeResponse>> {
    return api.put<NodeResponse>(`/nodes/${nodeId}`, payload);
  },

  /**
   * Delete a node.
   *
   * @param nodeId - The ID of the node to delete
   * @returns Promise resolving to the API result
   */
  async deleteNode(nodeId: string): Promise<ApiResult<{ message: string }>> {
    return api.delete<{ message: string }>(`/nodes/${nodeId}`);
  },
};
