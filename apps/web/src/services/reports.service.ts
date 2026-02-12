/**
 * Reports service for handling report-related API operations.
 *
 * This service provides methods for:
 * - Creating report generation jobs (async via queue)
 * - Polling report generation status
 * - Listing project reports
 * - Downloading generated reports
 * - Listing available report templates
 */

import type {
  Report,
  ReportWithDetails,
  ReportTemplate,
  ReportTemplateWithCreator,
  ReportFormat,
  ReportStatus,
  CreateReportPayload,
  ReportJobResponse,
  ReportStatusResponse,
  ReportParameters,
  ApiResult,
  PaginationMeta,
} from '@hazop/types';
import { api } from './api.client';

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response type for creating a report.
 */
export interface CreateReportResponse {
  reportId: string;
  status: ReportStatus;
  statusUrl: string;
  estimatedSeconds?: number;
}

/**
 * Response type for getting report status.
 */
export interface GetReportStatusResponse {
  reportId: string;
  status: ReportStatus;
  progress?: number;
  downloadUrl: string | null;
  errorMessage: string | null;
  completedAt: Date | null;
}

/**
 * Response type for downloading a report.
 */
export interface DownloadReportResponse {
  downloadUrl: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  format: ReportFormat;
  expiresIn: number;
}

/**
 * Response type for listing reports.
 */
export interface ListReportsResponse {
  data: ReportWithDetails[];
  meta: PaginationMeta;
}

/**
 * Response type for listing templates.
 */
export interface ListTemplatesResponse {
  data: ReportTemplateWithCreator[];
  meta: PaginationMeta;
}

// ============================================================================
// Filter and Sort Types
// ============================================================================

/**
 * Filter options for listing reports.
 */
export interface ListReportsFilters {
  search?: string;
  status?: ReportStatus;
  format?: ReportFormat;
  analysisId?: string;
}

/**
 * Sort options for listing reports.
 */
export interface ListReportsSortOptions {
  sortBy?: 'requested_at' | 'generated_at' | 'name' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination options for listing reports.
 */
export interface ListReportsPagination {
  page?: number;
  limit?: number;
}

/**
 * Filter options for listing templates.
 */
export interface ListTemplatesFilters {
  format?: ReportFormat;
  isActive?: boolean;
}

/**
 * Pagination options for listing templates.
 */
export interface ListTemplatesPagination {
  page?: number;
  limit?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build query string from report filter, sort, and pagination options.
 */
function buildReportsQueryString(
  filters: ListReportsFilters,
  sort: ListReportsSortOptions,
  pagination: ListReportsPagination
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
  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.format) {
    params.set('format', filters.format);
  }
  if (filters.analysisId) {
    params.set('analysisId', filters.analysisId);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Build query string from template filter and pagination options.
 */
function buildTemplatesQueryString(
  filters: ListTemplatesFilters,
  pagination: ListTemplatesPagination
): string {
  const params = new URLSearchParams();

  if (pagination.page !== undefined) {
    params.set('page', String(pagination.page));
  }
  if (pagination.limit !== undefined) {
    params.set('limit', String(pagination.limit));
  }
  if (filters.format) {
    params.set('format', filters.format);
  }
  if (filters.isActive !== undefined) {
    params.set('isActive', String(filters.isActive));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================================================
// Service
// ============================================================================

/**
 * Reports service for handling report-related API operations.
 */
export const reportsService = {
  /**
   * Request generation of a report for a HazOps analysis.
   * Report generation is asynchronous via RabbitMQ queue.
   *
   * @param projectId - The ID of the project
   * @param payload - Report creation payload (analysisId, format, template, name, parameters)
   * @returns Promise resolving to the API result with report job info
   */
  async createReport(
    projectId: string,
    payload: CreateReportPayload
  ): Promise<ApiResult<CreateReportResponse>> {
    return api.post<CreateReportResponse>(`/projects/${projectId}/reports`, payload);
  },

  /**
   * Get the current status of a report generation job.
   * Use this for polling until status is 'completed' or 'failed'.
   *
   * @param reportId - The ID of the report
   * @returns Promise resolving to the API result with status info
   */
  async getReportStatus(reportId: string): Promise<ApiResult<GetReportStatusResponse>> {
    return api.get<GetReportStatusResponse>(`/reports/${reportId}/status`);
  },

  /**
   * Download a generated report.
   * Returns a signed URL for downloading the file.
   *
   * @param reportId - The ID of the report
   * @param expiresIn - Optional URL expiration time in seconds (1-604800, default: 3600)
   * @returns Promise resolving to the API result with download info
   */
  async downloadReport(
    reportId: string,
    expiresIn?: number
  ): Promise<ApiResult<DownloadReportResponse>> {
    const params = expiresIn ? `?expiresIn=${expiresIn}` : '';
    return api.get<DownloadReportResponse>(`/reports/${reportId}/download${params}`);
  },

  /**
   * List project reports with optional filtering, sorting, and pagination.
   *
   * @param projectId - The ID of the project
   * @param filters - Filter options (search, status, format, analysisId)
   * @param sort - Sort options (sortBy, sortOrder)
   * @param pagination - Pagination options (page, limit)
   * @returns Promise resolving to the API result with reports list and metadata
   */
  async listReports(
    projectId: string,
    filters: ListReportsFilters = {},
    sort: ListReportsSortOptions = {},
    pagination: ListReportsPagination = {}
  ): Promise<ApiResult<ListReportsResponse>> {
    const queryString = buildReportsQueryString(filters, sort, pagination);
    const result = await api.get<ListReportsResponse>(`/projects/${projectId}/reports${queryString}`);

    // Handle API response format variations
    if (result.success && result.data) {
      return {
        success: true,
        data: {
          data: result.data as unknown as ReportWithDetails[],
          meta: result.meta!,
        },
      };
    }

    return result as ApiResult<ListReportsResponse>;
  },

  /**
   * List available report templates with optional filtering and pagination.
   *
   * @param filters - Filter options (format, isActive)
   * @param pagination - Pagination options (page, limit)
   * @returns Promise resolving to the API result with templates list and metadata
   */
  async listTemplates(
    filters: ListTemplatesFilters = {},
    pagination: ListTemplatesPagination = {}
  ): Promise<ApiResult<ListTemplatesResponse>> {
    const queryString = buildTemplatesQueryString(filters, pagination);
    const result = await api.get<ListTemplatesResponse>(`/templates${queryString}`);

    // Handle API response format variations
    if (result.success && result.data) {
      return {
        success: true,
        data: {
          data: result.data as unknown as ReportTemplateWithCreator[],
          meta: result.meta!,
        },
      };
    }

    return result as ApiResult<ListTemplatesResponse>;
  },
};
