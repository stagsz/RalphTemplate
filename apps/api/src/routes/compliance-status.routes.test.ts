/**
 * API integration tests for compliance status endpoints.
 *
 * Tests the full API flow through routes with mocked database services.
 * All compliance status endpoints require authentication and project access.
 *
 * Endpoints tested:
 * - GET /analyses/:id/compliance - Get analysis compliance status
 * - GET /projects/:id/compliance - Get project compliance status
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import type {
  UserRole,
  AnalysisStatus,
  RegulatoryStandardId,
  ComplianceStatus,
} from '@hazop/types';

// ============================================================================
// Type Definitions for Mocks
// ============================================================================

interface HazopAnalysisWithDetails {
  id: string;
  projectId: string;
  documentId: string;
  name: string;
  description: string | null;
  status: AnalysisStatus;
  leadAnalystId: string;
  createdById: string;
  approvedById: string | null;
  approvalComments: string | null;
  createdAt: Date;
  updatedAt: Date;
  approvedAt: Date | null;
  documentName: string;
  leadAnalystName: string;
  leadAnalystEmail: string;
  createdByName: string;
  createdByEmail: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  organization: string;
  status: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StandardComplianceSummary {
  standardId: RegulatoryStandardId;
  standardName: string;
  totalClauses: number;
  compliantCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  notApplicableCount: number;
  notAssessedCount: number;
  compliancePercentage: number;
  overallStatus: ComplianceStatus;
}

interface AnalysisComplianceStatus {
  analysisId: string;
  analysisName: string;
  projectId: string;
  analysisStatus: AnalysisStatus;
  entryCount: number;
  hasLOPA: boolean;
  lopaCount: number;
  standardsChecked: RegulatoryStandardId[];
  overallStatus: ComplianceStatus;
  overallPercentage: number;
  summaries: StandardComplianceSummary[];
  checkedAt: Date;
}

interface ProjectComplianceStatus {
  projectId: string;
  projectName: string;
  analysisCount: number;
  entryCount: number;
  hasLOPA: boolean;
  lopaCount: number;
  standardsChecked: RegulatoryStandardId[];
  overallStatus: ComplianceStatus;
  overallPercentage: number;
  summaries: StandardComplianceSummary[];
  checkedAt: Date;
}

// ============================================================================
// Mock Declarations
// ============================================================================

// Analysis mocks
let mockFindAnalysisById: jest.Mock<() => Promise<HazopAnalysisWithDetails | null>>;

// Project service mocks
let mockUserHasProjectAccess: jest.Mock<() => Promise<boolean>>;
let mockFindProjectById: jest.Mock<() => Promise<Project | null>>;

// Compliance service mocks
let mockGetAnalysisComplianceStatus: jest.Mock<() => Promise<AnalysisComplianceStatus | null>>;
let mockGetProjectComplianceStatus: jest.Mock<() => Promise<ProjectComplianceStatus | null>>;

// Current authenticated user
let mockCurrentUser: { id: string; email: string; role: UserRole; organization: string } | null =
  null;

// ============================================================================
// Mock Setup
// ============================================================================

// Mock hazop analysis service
jest.unstable_mockModule('../services/hazop-analysis.service.js', () => {
  mockFindAnalysisById = jest.fn<() => Promise<HazopAnalysisWithDetails | null>>();

  return {
    findAnalysisById: mockFindAnalysisById,
    findAnalysisEntryById: jest.fn(),
    updateAnalysisEntry: jest.fn(),
    deleteAnalysisEntry: jest.fn(),
    updateEntryRisk: jest.fn(),
    clearEntryRisk: jest.fn(),
    getEntryAnalysisId: jest.fn(),
    createAnalysis: jest.fn(),
    documentBelongsToProject: jest.fn(),
    findAnalysisByIdWithProgress: jest.fn(),
    listProjectAnalyses: jest.fn(),
    updateAnalysis: jest.fn(),
    approveAnalysis: jest.fn(),
    nodeExistsInDocument: jest.fn(),
    createAnalysisEntry: jest.fn(),
    listAnalysisEntries: jest.fn(),
  };
});

// Mock project service
jest.unstable_mockModule('../services/project.service.js', () => {
  mockUserHasProjectAccess = jest.fn<() => Promise<boolean>>();
  mockFindProjectById = jest.fn<() => Promise<Project | null>>();

  return {
    listUserProjects: jest.fn(),
    findProjectById: mockFindProjectById,
    userHasProjectAccess: mockUserHasProjectAccess,
    getUserProjectRole: jest.fn(),
    createProject: jest.fn(),
    updateProject: jest.fn(),
    userExists: jest.fn(),
    isProjectMember: jest.fn(),
    addProjectMember: jest.fn(),
    removeProjectMember: jest.fn(),
    getProjectCreatorId: jest.fn(),
    listProjectMembers: jest.fn(),
  };
});

// Mock project compliance service
jest.unstable_mockModule('../services/project-compliance.service.js', () => {
  mockGetAnalysisComplianceStatus = jest.fn<() => Promise<AnalysisComplianceStatus | null>>();
  mockGetProjectComplianceStatus = jest.fn<() => Promise<ProjectComplianceStatus | null>>();

  return {
    getAnalysisComplianceStatus: mockGetAnalysisComplianceStatus,
    getProjectComplianceStatus: mockGetProjectComplianceStatus,
  };
});

// Mock PID document service (needed by projects routes)
jest.unstable_mockModule('../services/pid-document.service.js', () => ({
  createPIDDocument: jest.fn(),
  findPIDDocumentById: jest.fn(),
  documentBelongsToProject: jest.fn(),
  listProjectDocuments: jest.fn(),
  updatePIDDocumentStatus: jest.fn(),
  deletePIDDocument: jest.fn(),
  createAnalysisNode: jest.fn(),
  nodeIdExistsForDocument: jest.fn(),
  listDocumentNodes: jest.fn(),
  findAnalysisNodeById: jest.fn(),
  updateAnalysisNode: jest.fn(),
  nodeIdExistsForDocumentExcluding: jest.fn(),
  deleteAnalysisNode: jest.fn(),
}));

// Mock storage service (needed by document controller)
jest.unstable_mockModule('../services/storage.service.js', () => ({
  generateStoragePath: jest.fn(),
  uploadFile: jest.fn(),
  retrieveFile: jest.fn(),
  fileExists: jest.fn(),
  deleteFile: jest.fn(),
  getSignedUrl: jest.fn(),
  getSignedDownloadUrl: jest.fn(),
  getSignedViewUrl: jest.fn(),
}));

// Mock risk aggregation service (needed by projects routes)
jest.unstable_mockModule('../services/risk-aggregation.service.js', () => ({
  getAnalysisRiskAggregation: jest.fn(),
  getProjectRiskDashboard: jest.fn(),
}));

// Mock auth middleware
jest.unstable_mockModule('../middleware/auth.middleware.js', () => ({
  authenticate: (_req: Request, _res: Response, next: NextFunction) => {
    if (mockCurrentUser) {
      (_req as Request & { user?: typeof mockCurrentUser }).user = mockCurrentUser;
    }
    next();
  },
  requireAuth: (_req: Request, res: Response, next: NextFunction) => {
    if (!mockCurrentUser) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
      });
      return;
    }
    next();
  },
}));

// Mock upload middleware (needed by projects routes import)
jest.unstable_mockModule('../middleware/upload.middleware.js', () => ({
  uploadPID: {
    single: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  },
  handleMulterError: (_req: Request, _res: Response, next: NextFunction) => next(),
  validatePIDUpload: (_req: Request, _res: Response, next: NextFunction) => next(),
  getUploadedFileBuffer: () => null,
  getUploadMeta: () => null,
}));

// Import routes after setting up mocks
const { default: analysesRoutes } = await import('./analyses.routes.js');
const { default: projectsRoutes } = await import('./projects.routes.js');

// ============================================================================
// Test Helpers
// ============================================================================

function createAuthenticatedUser(
  overrides?: Partial<{ id: string; email: string; role: UserRole; organization: string }>
): { id: string; email: string; role: UserRole; organization: string } {
  return {
    id: '880e8400-e29b-41d4-a716-446655440003',
    email: 'user@example.com',
    role: 'analyst',
    organization: 'Acme Corp',
    ...overrides,
  };
}

function createMockAnalysis(
  overrides?: Partial<HazopAnalysisWithDetails>
): HazopAnalysisWithDetails {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    projectId: '660e8400-e29b-41d4-a716-446655440001',
    documentId: '770e8400-e29b-41d4-a716-446655440002',
    name: 'Test Analysis',
    description: 'Test analysis description',
    status: 'draft' as AnalysisStatus,
    leadAnalystId: '880e8400-e29b-41d4-a716-446655440003',
    createdById: '880e8400-e29b-41d4-a716-446655440003',
    approvedById: null,
    approvalComments: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    approvedAt: null,
    documentName: 'Test P&ID Document.pdf',
    leadAnalystName: 'Test Analyst',
    leadAnalystEmail: 'analyst@example.com',
    createdByName: 'Test Analyst',
    createdByEmail: 'analyst@example.com',
    ...overrides,
  };
}

function createMockProject(overrides?: Partial<Project>): Project {
  return {
    id: '660e8400-e29b-41d4-a716-446655440001',
    name: 'Test Project',
    description: 'Test project description',
    organization: 'Acme Corp',
    status: 'active',
    createdById: '880e8400-e29b-41d4-a716-446655440003',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function createMockComplianceSummary(
  standardId: RegulatoryStandardId = 'IEC_61511'
): StandardComplianceSummary {
  return {
    standardId,
    standardName: 'IEC 61511 - Functional Safety',
    totalClauses: 10,
    compliantCount: 7,
    partiallyCompliantCount: 2,
    nonCompliantCount: 0,
    notApplicableCount: 0,
    notAssessedCount: 1,
    compliancePercentage: 80,
    overallStatus: 'partial_compliance' as ComplianceStatus,
  };
}

function createMockAnalysisComplianceStatus(
  overrides?: Partial<AnalysisComplianceStatus>
): AnalysisComplianceStatus {
  return {
    analysisId: '550e8400-e29b-41d4-a716-446655440000',
    analysisName: 'Test Analysis',
    projectId: '660e8400-e29b-41d4-a716-446655440001',
    analysisStatus: 'draft' as AnalysisStatus,
    entryCount: 15,
    hasLOPA: true,
    lopaCount: 5,
    standardsChecked: ['IEC_61511', 'ISO_31000', 'OSHA_PSM'] as RegulatoryStandardId[],
    overallStatus: 'partial_compliance' as ComplianceStatus,
    overallPercentage: 75,
    summaries: [
      createMockComplianceSummary('IEC_61511'),
      createMockComplianceSummary('ISO_31000'),
      createMockComplianceSummary('OSHA_PSM'),
    ],
    checkedAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  };
}

function createMockProjectComplianceStatus(
  overrides?: Partial<ProjectComplianceStatus>
): ProjectComplianceStatus {
  return {
    projectId: '660e8400-e29b-41d4-a716-446655440001',
    projectName: 'Test Project',
    analysisCount: 3,
    entryCount: 45,
    hasLOPA: true,
    lopaCount: 12,
    standardsChecked: ['IEC_61511', 'ISO_31000', 'OSHA_PSM'] as RegulatoryStandardId[],
    overallStatus: 'partial_compliance' as ComplianceStatus,
    overallPercentage: 78,
    summaries: [
      createMockComplianceSummary('IEC_61511'),
      createMockComplianceSummary('ISO_31000'),
      createMockComplianceSummary('OSHA_PSM'),
    ],
    checkedAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Compliance Status Routes API Tests', () => {
  let analysesApp: Express;
  let projectsApp: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = createAuthenticatedUser();

    // Create fresh Express apps
    analysesApp = express();
    analysesApp.use(express.json());
    analysesApp.use('/analyses', analysesRoutes);

    projectsApp = express();
    projectsApp.use(express.json());
    projectsApp.use('/projects', projectsRoutes);
  });

  // ==========================================================================
  // GET /analyses/:id/compliance - Get analysis compliance status
  // ==========================================================================

  describe('GET /analyses/:id/compliance', () => {
    const validAnalysisId = '550e8400-e29b-41d4-a716-446655440000';

    describe('successful retrieval', () => {
      it('should return compliance status with status 200', async () => {
        const analysis = createMockAnalysis();
        const complianceStatus = createMockAnalysisComplianceStatus();

        mockFindAnalysisById.mockResolvedValue(analysis);
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetAnalysisComplianceStatus.mockResolvedValue(complianceStatus);

        const response = await request(analysesApp).get(`/analyses/${validAnalysisId}/compliance`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.analysisId).toBe(validAnalysisId);
        expect(response.body.data.overallStatus).toBe('partial_compliance');
        expect(response.body.data.overallPercentage).toBe(75);
        expect(response.body.data.summaries).toHaveLength(3);
      });

      it('should return compliance status with all standards when no filter specified', async () => {
        const analysis = createMockAnalysis();
        const complianceStatus = createMockAnalysisComplianceStatus({
          standardsChecked: [
            'IEC_61511',
            'ISO_31000',
            'ISO_9001',
            'ATEX_DSEAR',
            'PED',
            'OSHA_PSM',
            'EPA_RMP',
            'SEVESO_III',
          ] as RegulatoryStandardId[],
        });

        mockFindAnalysisById.mockResolvedValue(analysis);
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetAnalysisComplianceStatus.mockResolvedValue(complianceStatus);

        const response = await request(analysesApp).get(`/analyses/${validAnalysisId}/compliance`);

        expect(response.status).toBe(200);
        expect(response.body.data.standardsChecked).toHaveLength(8);
      });

      it('should filter standards when standards query parameter is provided', async () => {
        const analysis = createMockAnalysis();
        const complianceStatus = createMockAnalysisComplianceStatus({
          standardsChecked: ['IEC_61511', 'OSHA_PSM'] as RegulatoryStandardId[],
          summaries: [
            createMockComplianceSummary('IEC_61511'),
            createMockComplianceSummary('OSHA_PSM'),
          ],
        });

        mockFindAnalysisById.mockResolvedValue(analysis);
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetAnalysisComplianceStatus.mockResolvedValue(complianceStatus);

        const response = await request(analysesApp).get(
          `/analyses/${validAnalysisId}/compliance?standards=IEC_61511,OSHA_PSM`
        );

        expect(response.status).toBe(200);
        expect(response.body.data.standardsChecked).toEqual(['IEC_61511', 'OSHA_PSM']);
        expect(response.body.data.summaries).toHaveLength(2);
      });

      it('should return compliance status with hasLOPA and lopaCount', async () => {
        const analysis = createMockAnalysis();
        const complianceStatus = createMockAnalysisComplianceStatus({
          hasLOPA: true,
          lopaCount: 8,
        });

        mockFindAnalysisById.mockResolvedValue(analysis);
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetAnalysisComplianceStatus.mockResolvedValue(complianceStatus);

        const response = await request(analysesApp).get(`/analyses/${validAnalysisId}/compliance`);

        expect(response.status).toBe(200);
        expect(response.body.data.hasLOPA).toBe(true);
        expect(response.body.data.lopaCount).toBe(8);
      });
    });

    describe('validation errors', () => {
      it('should return 400 for invalid UUID format', async () => {
        const response = await request(analysesApp).get('/analyses/invalid-uuid/compliance');

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toBe('Invalid analysis ID format');
      });

      it('should return 400 for invalid standard IDs', async () => {
        const response = await request(analysesApp).get(
          `/analyses/${validAnalysisId}/compliance?standards=INVALID_STANDARD,IEC_61511`
        );

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors[0].field).toBe('standards');
        expect(response.body.error.errors[0].message).toContain('INVALID_STANDARD');
      });

      it('should return 400 for multiple invalid standard IDs', async () => {
        const response = await request(analysesApp).get(
          `/analyses/${validAnalysisId}/compliance?standards=FOO,BAR,BAZ`
        );

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors[0].message).toContain('FOO');
        expect(response.body.error.errors[0].message).toContain('BAR');
        expect(response.body.error.errors[0].message).toContain('BAZ');
      });
    });

    describe('authorization', () => {
      it('should return 404 when analysis not found', async () => {
        mockFindAnalysisById.mockResolvedValue(null);

        const response = await request(analysesApp).get(`/analyses/${validAnalysisId}/compliance`);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
        expect(response.body.error.message).toBe('Analysis not found');
      });

      it('should return 403 when user has no project access', async () => {
        const analysis = createMockAnalysis();

        mockFindAnalysisById.mockResolvedValue(analysis);
        mockUserHasProjectAccess.mockResolvedValue(false);

        const response = await request(analysesApp).get(`/analyses/${validAnalysisId}/compliance`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('FORBIDDEN');
        expect(response.body.error.message).toContain('do not have access');
      });
    });

    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockCurrentUser = null;

        const response = await request(analysesApp).get(`/analyses/${validAnalysisId}/compliance`);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('error handling', () => {
      it('should return 500 on unexpected errors', async () => {
        const analysis = createMockAnalysis();

        mockFindAnalysisById.mockResolvedValue(analysis);
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetAnalysisComplianceStatus.mockRejectedValue(new Error('Unexpected database error'));

        const response = await request(analysesApp).get(`/analyses/${validAnalysisId}/compliance`);

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
      });

      it('should return 404 if compliance status service returns null', async () => {
        const analysis = createMockAnalysis();

        mockFindAnalysisById.mockResolvedValue(analysis);
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetAnalysisComplianceStatus.mockResolvedValue(null);

        const response = await request(analysesApp).get(`/analyses/${validAnalysisId}/compliance`);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });
  });

  // ==========================================================================
  // GET /projects/:id/compliance - Get project compliance status
  // ==========================================================================

  describe('GET /projects/:id/compliance', () => {
    const validProjectId = '660e8400-e29b-41d4-a716-446655440001';

    describe('successful retrieval', () => {
      it('should return project compliance status with status 200', async () => {
        const complianceStatus = createMockProjectComplianceStatus();

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectComplianceStatus.mockResolvedValue(complianceStatus);

        const response = await request(projectsApp).get(`/projects/${validProjectId}/compliance`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.projectId).toBe(validProjectId);
        expect(response.body.data.projectName).toBe('Test Project');
        expect(response.body.data.overallStatus).toBe('partial_compliance');
        expect(response.body.data.overallPercentage).toBe(78);
      });

      it('should return project compliance status with analysis count', async () => {
        const complianceStatus = createMockProjectComplianceStatus({
          analysisCount: 5,
          entryCount: 100,
        });

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectComplianceStatus.mockResolvedValue(complianceStatus);

        const response = await request(projectsApp).get(`/projects/${validProjectId}/compliance`);

        expect(response.status).toBe(200);
        expect(response.body.data.analysisCount).toBe(5);
        expect(response.body.data.entryCount).toBe(100);
      });

      it('should filter standards when standards query parameter is provided', async () => {
        const complianceStatus = createMockProjectComplianceStatus({
          standardsChecked: ['IEC_61511', 'SEVESO_III'] as RegulatoryStandardId[],
          summaries: [
            createMockComplianceSummary('IEC_61511'),
            createMockComplianceSummary('SEVESO_III'),
          ],
        });

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectComplianceStatus.mockResolvedValue(complianceStatus);

        const response = await request(projectsApp).get(
          `/projects/${validProjectId}/compliance?standards=IEC_61511,SEVESO_III`
        );

        expect(response.status).toBe(200);
        expect(response.body.data.standardsChecked).toEqual(['IEC_61511', 'SEVESO_III']);
        expect(response.body.data.summaries).toHaveLength(2);
      });

      it('should return compliant status when all checks pass', async () => {
        const complianceStatus = createMockProjectComplianceStatus({
          overallStatus: 'compliant' as ComplianceStatus,
          overallPercentage: 100,
        });

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectComplianceStatus.mockResolvedValue(complianceStatus);

        const response = await request(projectsApp).get(`/projects/${validProjectId}/compliance`);

        expect(response.status).toBe(200);
        expect(response.body.data.overallStatus).toBe('compliant');
        expect(response.body.data.overallPercentage).toBe(100);
      });

      it('should return not_assessed status when no analysis exists', async () => {
        const complianceStatus = createMockProjectComplianceStatus({
          analysisCount: 0,
          entryCount: 0,
          overallStatus: 'not_assessed' as ComplianceStatus,
          overallPercentage: 0,
        });

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectComplianceStatus.mockResolvedValue(complianceStatus);

        const response = await request(projectsApp).get(`/projects/${validProjectId}/compliance`);

        expect(response.status).toBe(200);
        expect(response.body.data.overallStatus).toBe('not_assessed');
        expect(response.body.data.analysisCount).toBe(0);
      });
    });

    describe('validation errors', () => {
      it('should return 400 for invalid UUID format', async () => {
        const response = await request(projectsApp).get('/projects/invalid-uuid/compliance');

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toBe('Invalid project ID format');
      });

      it('should return 400 for invalid standard IDs', async () => {
        const response = await request(projectsApp).get(
          `/projects/${validProjectId}/compliance?standards=INVALID_STANDARD,IEC_61511`
        );

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors[0].field).toBe('standards');
      });

      it('should accept single valid standard', async () => {
        const complianceStatus = createMockProjectComplianceStatus({
          standardsChecked: ['IEC_61511'] as RegulatoryStandardId[],
          summaries: [createMockComplianceSummary('IEC_61511')],
        });

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectComplianceStatus.mockResolvedValue(complianceStatus);

        const response = await request(projectsApp).get(
          `/projects/${validProjectId}/compliance?standards=IEC_61511`
        );

        expect(response.status).toBe(200);
        expect(response.body.data.standardsChecked).toEqual(['IEC_61511']);
      });
    });

    describe('authorization', () => {
      it('should return 403 when user has no project access and project exists', async () => {
        const project = createMockProject();

        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(project);

        const response = await request(projectsApp).get(`/projects/${validProjectId}/compliance`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('FORBIDDEN');
        expect(response.body.error.message).toContain('do not have access');
      });

      it('should return 404 when project not found', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(null);

        const response = await request(projectsApp).get(`/projects/${validProjectId}/compliance`);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
        expect(response.body.error.message).toBe('Project not found');
      });
    });

    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockCurrentUser = null;

        const response = await request(projectsApp).get(`/projects/${validProjectId}/compliance`);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('error handling', () => {
      it('should return 500 on unexpected errors', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectComplianceStatus.mockRejectedValue(new Error('Unexpected database error'));

        const response = await request(projectsApp).get(`/projects/${validProjectId}/compliance`);

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
      });

      it('should return 404 if compliance status service returns null', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectComplianceStatus.mockResolvedValue(null);

        const response = await request(projectsApp).get(`/projects/${validProjectId}/compliance`);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });
  });
});
