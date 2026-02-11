/**
 * API integration tests for project endpoints.
 *
 * Tests the full API flow through routes with mocked database services.
 * All project endpoints require authentication, and many require authorization.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import type { UserRole, ProjectStatus, ProjectMemberRole, RiskLevel, GuideWord } from '@hazop/types';
import type {
  ListProjectsResult,
  ProjectWithCreator,
  ProjectWithMembership,
  ProjectMemberWithUser,
} from '../services/project.service.js';

// Project risk dashboard types for testing
interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
}

interface ScorePercentiles {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

interface RiskThresholdConfig {
  lowMax: number;
  mediumMax: number;
}

interface RiskRanking {
  severity: 1 | 2 | 3 | 4 | 5;
  likelihood: 1 | 2 | 3 | 4 | 5;
  detectability: 1 | 2 | 3 | 4 | 5;
  riskScore: number;
  riskLevel: RiskLevel;
}

interface NodeRiskSummary {
  nodeId: string;
  nodeIdentifier: string;
  nodeDescription: string | null;
  equipmentType: string;
  entryCount: number;
  assessedCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageRiskScore: number | null;
  maxRiskScore: number | null;
  overallRiskLevel: RiskLevel | null;
}

interface GuideWordRiskSummary {
  guideWord: GuideWord;
  entryCount: number;
  assessedCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageRiskScore: number | null;
  maxRiskScore: number | null;
}

interface AnalysisRiskSummary {
  analysisId: string;
  analysisName: string;
  status: string;
  leadAnalystId: string;
  leadAnalystName: string;
  entryCount: number;
  assessedEntries: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  maxRiskScore: number | null;
  overallRiskLevel: RiskLevel | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectHighRiskEntry {
  entryId: string;
  analysisId: string;
  analysisName: string;
  nodeId: string;
  nodeIdentifier: string;
  guideWord: GuideWord;
  parameter: string;
  riskRanking: RiskRanking;
}

interface ProjectRiskDashboard {
  projectId: string;
  projectName: string;
  statistics: {
    totalAnalyses: number;
    draftAnalyses: number;
    inReviewAnalyses: number;
    approvedAnalyses: number;
    totalEntries: number;
    assessedEntries: number;
    unassessedEntries: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    averageRiskScore: number | null;
    maxRiskScore: number | null;
    minRiskScore: number | null;
  };
  distribution: RiskDistribution | null;
  percentiles: ScorePercentiles | null;
  analysisSummaries: AnalysisRiskSummary[];
  byNode: NodeRiskSummary[];
  byGuideWord: GuideWordRiskSummary[];
  highestRiskEntries: ProjectHighRiskEntry[];
  thresholds: RiskThresholdConfig;
}

// Mock implementations - must be declared before jest.unstable_mockModule
let mockListUserProjects: jest.Mock<() => Promise<ListProjectsResult>>;
let mockCreateProject: jest.Mock<() => Promise<ProjectWithCreator>>;
let mockFindProjectById: jest.Mock<() => Promise<ProjectWithCreator | null>>;
let mockUpdateProject: jest.Mock<() => Promise<ProjectWithCreator | null>>;
let mockUserHasProjectAccess: jest.Mock<() => Promise<boolean>>;
let mockGetUserProjectRole: jest.Mock<() => Promise<ProjectMemberRole | null>>;
let mockUserExists: jest.Mock<() => Promise<boolean>>;
let mockIsProjectMember: jest.Mock<() => Promise<boolean>>;
let mockAddProjectMember: jest.Mock<() => Promise<ProjectMemberWithUser>>;
let mockRemoveProjectMember: jest.Mock<() => Promise<boolean>>;
let mockGetProjectCreatorId: jest.Mock<() => Promise<string | null>>;
let mockListProjectMembers: jest.Mock<() => Promise<ProjectMemberWithUser[]>>;

// Risk aggregation service mock
let mockGetProjectRiskDashboard: jest.Mock<() => Promise<ProjectRiskDashboard | null>>;

// Current authenticated user for tests
let mockCurrentUser: { id: string; email: string; role: UserRole; organization: string } | null =
  null;

// Set up mocks before importing modules that depend on them
jest.unstable_mockModule('../services/project.service.js', () => {
  mockListUserProjects = jest.fn<() => Promise<ListProjectsResult>>();
  mockCreateProject = jest.fn<() => Promise<ProjectWithCreator>>();
  mockFindProjectById = jest.fn<() => Promise<ProjectWithCreator | null>>();
  mockUpdateProject = jest.fn<() => Promise<ProjectWithCreator | null>>();
  mockUserHasProjectAccess = jest.fn<() => Promise<boolean>>();
  mockGetUserProjectRole = jest.fn<() => Promise<ProjectMemberRole | null>>();
  mockUserExists = jest.fn<() => Promise<boolean>>();
  mockIsProjectMember = jest.fn<() => Promise<boolean>>();
  mockAddProjectMember = jest.fn<() => Promise<ProjectMemberWithUser>>();
  mockRemoveProjectMember = jest.fn<() => Promise<boolean>>();
  mockGetProjectCreatorId = jest.fn<() => Promise<string | null>>();
  mockListProjectMembers = jest.fn<() => Promise<ProjectMemberWithUser[]>>();

  return {
    listUserProjects: mockListUserProjects,
    createProject: mockCreateProject,
    findProjectById: mockFindProjectById,
    updateProject: mockUpdateProject,
    userHasProjectAccess: mockUserHasProjectAccess,
    getUserProjectRole: mockGetUserProjectRole,
    userExists: mockUserExists,
    isProjectMember: mockIsProjectMember,
    addProjectMember: mockAddProjectMember,
    removeProjectMember: mockRemoveProjectMember,
    getProjectCreatorId: mockGetProjectCreatorId,
    listProjectMembers: mockListProjectMembers,
  };
});

// Mock the auth middleware to allow testing without actual JWT
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

// Mock risk-aggregation service
jest.unstable_mockModule('../services/risk-aggregation.service.js', () => {
  mockGetProjectRiskDashboard = jest.fn<() => Promise<ProjectRiskDashboard | null>>();

  return {
    getProjectRiskDashboard: mockGetProjectRiskDashboard,
  };
});

// Import project routes after setting up mocks
const { default: projectRoutes } = await import('./projects.routes.js');

/**
 * Create a mock project for testing.
 */
function createMockProject(overrides?: Partial<ProjectWithCreator>): ProjectWithCreator {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Project',
    description: 'A test project description',
    status: 'planning' as ProjectStatus,
    createdById: '660e8400-e29b-41d4-a716-446655440001',
    organization: 'Acme Corp',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    createdByName: 'Test User',
    createdByEmail: 'test@example.com',
    ...overrides,
  };
}

/**
 * Create a mock project with membership info for testing.
 */
function createMockProjectWithMembership(
  overrides?: Partial<ProjectWithMembership>
): ProjectWithMembership {
  return {
    ...createMockProject(overrides),
    memberRole: 'owner' as ProjectMemberRole,
    ...overrides,
  };
}

/**
 * Create a mock project member for testing.
 */
function createMockMember(overrides?: Partial<ProjectMemberWithUser>): ProjectMemberWithUser {
  return {
    id: '770e8400-e29b-41d4-a716-446655440002',
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    userId: '880e8400-e29b-41d4-a716-446655440003',
    role: 'member' as ProjectMemberRole,
    joinedAt: new Date('2025-01-02T00:00:00Z'),
    userName: 'Member User',
    userEmail: 'member@example.com',
    ...overrides,
  };
}

/**
 * Create an authenticated user for testing.
 */
function createAuthenticatedUser(
  overrides?: Partial<{ id: string; email: string; role: UserRole; organization: string }>
): { id: string; email: string; role: UserRole; organization: string } {
  return {
    id: '660e8400-e29b-41d4-a716-446655440001',
    email: 'user@example.com',
    role: 'analyst',
    organization: 'Acme Corp',
    ...overrides,
  };
}

describe('Project Routes API Tests', () => {
  let app: Express;

  beforeAll(() => {
    // No JWT keys needed since we're mocking auth
  });

  afterAll(() => {
    // Clean up
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Default to authenticated user
    mockCurrentUser = createAuthenticatedUser();

    // Create fresh Express app
    app = express();
    app.use(express.json());
    app.use('/projects', projectRoutes);
  });

  describe('GET /projects', () => {
    describe('successful list', () => {
      it('should return paginated list of projects with status 200', async () => {
        const mockProjects = [
          createMockProjectWithMembership({ id: 'project-1', name: 'Project 1' }),
          createMockProjectWithMembership({ id: 'project-2', name: 'Project 2' }),
        ];

        mockListUserProjects.mockResolvedValue({
          projects: mockProjects,
          total: 2,
        });

        const response = await request(app).get('/projects');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.total).toBe(2);
        expect(response.body.meta.page).toBe(1);
        expect(response.body.meta.limit).toBe(20);
      });

      it('should pass query parameters to service', async () => {
        mockListUserProjects.mockResolvedValue({
          projects: [],
          total: 0,
        });

        await request(app).get('/projects').query({
          page: '2',
          limit: '10',
          sortBy: 'name',
          sortOrder: 'asc',
          search: 'test',
          status: 'active',
          organization: 'Acme',
        });

        expect(mockListUserProjects).toHaveBeenCalledWith(
          mockCurrentUser!.id,
          { search: 'test', status: 'active', organization: 'Acme' },
          { page: 2, limit: 10, sortBy: 'name', sortOrder: 'asc' }
        );
      });

      it('should calculate pagination metadata correctly', async () => {
        mockListUserProjects.mockResolvedValue({
          projects: [createMockProjectWithMembership()],
          total: 50,
        });

        const response = await request(app).get('/projects').query({ page: '2', limit: '10' });

        expect(response.status).toBe(200);
        expect(response.body.meta.page).toBe(2);
        expect(response.body.meta.limit).toBe(10);
        expect(response.body.meta.total).toBe(50);
        expect(response.body.meta.totalPages).toBe(5);
        expect(response.body.meta.hasNextPage).toBe(true);
        expect(response.body.meta.hasPrevPage).toBe(true);
      });

      it('should handle empty results', async () => {
        mockListUserProjects.mockResolvedValue({
          projects: [],
          total: 0,
        });

        const response = await request(app).get('/projects');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(0);
        expect(response.body.meta.total).toBe(0);
        expect(response.body.meta.totalPages).toBe(0);
      });
    });

    describe('validation errors', () => {
      it('should return 400 for invalid page parameter', async () => {
        const response = await request(app).get('/projects').query({ page: '0' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'page', code: 'INVALID_VALUE' })])
        );
      });

      it('should return 400 for invalid limit parameter', async () => {
        const response = await request(app).get('/projects').query({ limit: '200' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'limit', code: 'INVALID_VALUE' }),
          ])
        );
      });

      it('should return 400 for invalid sortBy parameter', async () => {
        const response = await request(app).get('/projects').query({ sortBy: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'sortBy', code: 'INVALID_VALUE' }),
          ])
        );
      });

      it('should return 400 for invalid sortOrder parameter', async () => {
        const response = await request(app).get('/projects').query({ sortOrder: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'sortOrder', code: 'INVALID_VALUE' }),
          ])
        );
      });

      it('should return 400 for invalid status filter', async () => {
        const response = await request(app).get('/projects').query({ status: 'invalid_status' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'status', code: 'INVALID_VALUE' }),
          ])
        );
      });
    });

    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockCurrentUser = null;

        const response = await request(app).get('/projects');

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('error handling', () => {
      it('should return 500 on database errors', async () => {
        mockListUserProjects.mockRejectedValue(new Error('Database connection failed'));

        const response = await request(app).get('/projects');

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
        expect(response.body.error.message).toBe('An unexpected error occurred');
      });
    });
  });

  describe('POST /projects', () => {
    const validProjectData = {
      name: 'New Project',
      description: 'A new project description',
    };

    describe('successful creation', () => {
      it('should create project and return with status 201', async () => {
        const mockProject = createMockProject({
          name: validProjectData.name,
          description: validProjectData.description,
        });

        mockCreateProject.mockResolvedValue(mockProject);

        const response = await request(app).post('/projects').send(validProjectData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.project).toBeDefined();
        expect(response.body.data.project.name).toBe(validProjectData.name);
        expect(response.body.data.project.description).toBe(validProjectData.description);
      });

      it('should call service with correct parameters', async () => {
        mockCreateProject.mockResolvedValue(createMockProject());

        await request(app).post('/projects').send(validProjectData);

        expect(mockCreateProject).toHaveBeenCalledWith(mockCurrentUser!.id, {
          name: validProjectData.name,
          description: validProjectData.description,
          organization: mockCurrentUser!.organization,
        });
      });

      it('should create project without description', async () => {
        const mockProject = createMockProject({ name: 'Minimal Project', description: '' });
        mockCreateProject.mockResolvedValue(mockProject);

        const response = await request(app).post('/projects').send({ name: 'Minimal Project' });

        expect(response.status).toBe(201);
        expect(response.body.data.project.name).toBe('Minimal Project');
      });
    });

    describe('validation errors', () => {
      it('should return 400 when name is missing', async () => {
        const response = await request(app).post('/projects').send({ description: 'No name' });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'name', code: 'REQUIRED' })])
        );
      });

      it('should return 400 when name is empty', async () => {
        const response = await request(app).post('/projects').send({ name: '   ' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'name', code: 'EMPTY' })])
        );
      });

      it('should return 400 when name is not a string', async () => {
        const response = await request(app).post('/projects').send({ name: 123 });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'name', code: 'INVALID_TYPE' })])
        );
      });

      it('should return 400 when name exceeds 255 characters', async () => {
        const response = await request(app)
          .post('/projects')
          .send({ name: 'a'.repeat(256) });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'name', code: 'MAX_LENGTH' })])
        );
      });

      it('should return 400 when description is not a string', async () => {
        const response = await request(app)
          .post('/projects')
          .send({ name: 'Valid Name', description: 123 });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'description', code: 'INVALID_TYPE' }),
          ])
        );
      });
    });

    describe('conflict handling', () => {
      it('should return 409 when project name already exists', async () => {
        const dbError = new Error('duplicate key') as Error & { code: string };
        dbError.code = '23505';
        mockCreateProject.mockRejectedValue(dbError);

        const response = await request(app).post('/projects').send(validProjectData);

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe('CONFLICT');
        expect(response.body.error.message).toContain('already exists');
      });
    });

    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockCurrentUser = null;

        const response = await request(app).post('/projects').send(validProjectData);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('error handling', () => {
      it('should return 500 on unexpected errors', async () => {
        mockCreateProject.mockRejectedValue(new Error('Unexpected error'));

        const response = await request(app).post('/projects').send(validProjectData);

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
      });
    });
  });

  describe('GET /projects/:id', () => {
    const validProjectId = '550e8400-e29b-41d4-a716-446655440000';

    describe('successful retrieval', () => {
      it('should return project details with status 200', async () => {
        const mockProject = createMockProject({ id: validProjectId });

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockFindProjectById.mockResolvedValue(mockProject);
        mockGetUserProjectRole.mockResolvedValue('owner');

        const response = await request(app).get(`/projects/${validProjectId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.project).toBeDefined();
        expect(response.body.data.project.id).toBe(validProjectId);
        expect(response.body.data.project.userRole).toBe('owner');
      });

      it('should include user role in response', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockFindProjectById.mockResolvedValue(createMockProject());
        mockGetUserProjectRole.mockResolvedValue('member');

        const response = await request(app).get(`/projects/${validProjectId}`);

        expect(response.status).toBe(200);
        expect(response.body.data.project.userRole).toBe('member');
      });
    });

    describe('validation errors', () => {
      it('should return 400 for invalid UUID format', async () => {
        const response = await request(app).get('/projects/invalid-uuid');

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toBe('Invalid project ID format');
      });
    });

    describe('authorization', () => {
      it('should return 404 when project does not exist', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(null);

        const response = await request(app).get(`/projects/${validProjectId}`);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });

      it('should return 403 when user does not have access', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(createMockProject());

        const response = await request(app).get(`/projects/${validProjectId}`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('FORBIDDEN');
        expect(response.body.error.message).toContain('do not have access');
      });
    });

    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockCurrentUser = null;

        const response = await request(app).get(`/projects/${validProjectId}`);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('error handling', () => {
      it('should return 500 on database errors', async () => {
        mockUserHasProjectAccess.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get(`/projects/${validProjectId}`);

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /projects/:id', () => {
    const validProjectId = '550e8400-e29b-41d4-a716-446655440000';
    const updateData = {
      name: 'Updated Project',
      description: 'Updated description',
      status: 'active',
    };

    describe('successful update', () => {
      it('should update project and return with status 200', async () => {
        const updatedProject = createMockProject({
          name: updateData.name,
          description: updateData.description,
          status: 'active' as ProjectStatus,
        });

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockUpdateProject.mockResolvedValue(updatedProject);

        const response = await request(app).put(`/projects/${validProjectId}`).send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.project.name).toBe(updateData.name);
        expect(response.body.data.project.status).toBe('active');
      });

      it('should allow lead to update project', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('lead');
        mockUpdateProject.mockResolvedValue(createMockProject({ name: 'Updated' }));

        const response = await request(app)
          .put(`/projects/${validProjectId}`)
          .send({ name: 'Updated' });

        expect(response.status).toBe(200);
      });

      it('should update only provided fields', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockUpdateProject.mockResolvedValue(createMockProject({ name: 'New Name Only' }));

        const response = await request(app)
          .put(`/projects/${validProjectId}`)
          .send({ name: 'New Name Only' });

        expect(response.status).toBe(200);
        expect(mockUpdateProject).toHaveBeenCalledWith(validProjectId, {
          name: 'New Name Only',
        });
      });
    });

    describe('validation errors', () => {
      it('should return 400 for invalid UUID format', async () => {
        const response = await request(app).put('/projects/invalid-uuid').send(updateData);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when name is empty', async () => {
        const response = await request(app)
          .put(`/projects/${validProjectId}`)
          .send({ name: '   ' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'name', code: 'EMPTY' })])
        );
      });

      it('should return 400 for invalid status', async () => {
        const response = await request(app)
          .put(`/projects/${validProjectId}`)
          .send({ status: 'invalid_status' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'status', code: 'INVALID_VALUE' }),
          ])
        );
      });
    });

    describe('authorization', () => {
      it('should return 403 when user is only a member', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('member');

        const response = await request(app).put(`/projects/${validProjectId}`).send(updateData);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('FORBIDDEN');
        expect(response.body.error.message).toContain('owners and leads');
      });

      it('should return 403 when user is a viewer', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('viewer');

        const response = await request(app).put(`/projects/${validProjectId}`).send(updateData);

        expect(response.status).toBe(403);
      });

      it('should return 404 when project not found', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(null);

        const response = await request(app).put(`/projects/${validProjectId}`).send(updateData);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });

      it('should return 403 when user has no access', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(createMockProject());

        const response = await request(app).put(`/projects/${validProjectId}`).send(updateData);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('FORBIDDEN');
      });
    });

    describe('conflict handling', () => {
      it('should return 409 when name conflicts', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');

        const dbError = new Error('duplicate key') as Error & { code: string };
        dbError.code = '23505';
        mockUpdateProject.mockRejectedValue(dbError);

        const response = await request(app)
          .put(`/projects/${validProjectId}`)
          .send({ name: 'Conflicting Name' });

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe('CONFLICT');
      });
    });

    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockCurrentUser = null;

        const response = await request(app).put(`/projects/${validProjectId}`).send(updateData);

        expect(response.status).toBe(401);
      });
    });

    describe('error handling', () => {
      it('should return 500 on unexpected errors', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockUpdateProject.mockRejectedValue(new Error('Database error'));

        const response = await request(app).put(`/projects/${validProjectId}`).send(updateData);

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
      });
    });
  });

  describe('DELETE /projects/:id', () => {
    const validProjectId = '550e8400-e29b-41d4-a716-446655440000';

    describe('successful archive', () => {
      it('should archive project and return with status 200', async () => {
        const archivedProject = createMockProject({ status: 'archived' as ProjectStatus });

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockUpdateProject.mockResolvedValue(archivedProject);

        const response = await request(app).delete(`/projects/${validProjectId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.project.status).toBe('archived');
      });

      it('should call updateProject with archived status', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockUpdateProject.mockResolvedValue(createMockProject({ status: 'archived' as ProjectStatus }));

        await request(app).delete(`/projects/${validProjectId}`);

        expect(mockUpdateProject).toHaveBeenCalledWith(validProjectId, { status: 'archived' });
      });

      it('should allow lead to archive project', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('lead');
        mockUpdateProject.mockResolvedValue(createMockProject({ status: 'archived' as ProjectStatus }));

        const response = await request(app).delete(`/projects/${validProjectId}`);

        expect(response.status).toBe(200);
      });
    });

    describe('validation errors', () => {
      it('should return 400 for invalid UUID format', async () => {
        const response = await request(app).delete('/projects/invalid-uuid');

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('authorization', () => {
      it('should return 403 when user is only a member', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('member');

        const response = await request(app).delete(`/projects/${validProjectId}`);

        expect(response.status).toBe(403);
        expect(response.body.error.message).toContain('owners and leads');
      });

      it('should return 404 when project not found', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(null);

        const response = await request(app).delete(`/projects/${validProjectId}`);

        expect(response.status).toBe(404);
      });
    });

    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockCurrentUser = null;

        const response = await request(app).delete(`/projects/${validProjectId}`);

        expect(response.status).toBe(401);
      });
    });
  });

  describe('GET /projects/:id/members', () => {
    const validProjectId = '550e8400-e29b-41d4-a716-446655440000';

    describe('successful listing', () => {
      it('should return members with status 200', async () => {
        const mockMembers = [
          createMockMember({ role: 'owner', userName: 'Owner' }),
          createMockMember({ role: 'member', userName: 'Member' }),
        ];

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockListProjectMembers.mockResolvedValue(mockMembers);

        const response = await request(app).get(`/projects/${validProjectId}/members`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.members).toHaveLength(2);
      });
    });

    describe('validation errors', () => {
      it('should return 400 for invalid UUID format', async () => {
        const response = await request(app).get('/projects/invalid-uuid/members');

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('authorization', () => {
      it('should return 404 when project not found', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(null);

        const response = await request(app).get(`/projects/${validProjectId}/members`);

        expect(response.status).toBe(404);
      });

      it('should return 403 when user has no access', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(createMockProject());

        const response = await request(app).get(`/projects/${validProjectId}/members`);

        expect(response.status).toBe(403);
      });
    });

    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockCurrentUser = null;

        const response = await request(app).get(`/projects/${validProjectId}/members`);

        expect(response.status).toBe(401);
      });
    });
  });

  describe('POST /projects/:id/members', () => {
    const validProjectId = '550e8400-e29b-41d4-a716-446655440000';
    const validMemberData = {
      userId: '880e8400-e29b-41d4-a716-446655440003',
      role: 'member',
    };

    describe('successful addition', () => {
      it('should add member and return with status 201', async () => {
        const mockMember = createMockMember({ userId: validMemberData.userId });

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockUserExists.mockResolvedValue(true);
        mockIsProjectMember.mockResolvedValue(false);
        mockAddProjectMember.mockResolvedValue(mockMember);

        const response = await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send(validMemberData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.member).toBeDefined();
      });

      it('should default role to member if not specified', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockUserExists.mockResolvedValue(true);
        mockIsProjectMember.mockResolvedValue(false);
        mockAddProjectMember.mockResolvedValue(createMockMember());

        await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send({ userId: validMemberData.userId });

        expect(mockAddProjectMember).toHaveBeenCalledWith(validProjectId, {
          userId: validMemberData.userId,
          role: 'member',
        });
      });

      it('should allow lead to add members', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('lead');
        mockUserExists.mockResolvedValue(true);
        mockIsProjectMember.mockResolvedValue(false);
        mockAddProjectMember.mockResolvedValue(createMockMember());

        const response = await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send(validMemberData);

        expect(response.status).toBe(201);
      });
    });

    describe('validation errors', () => {
      it('should return 400 for invalid project UUID', async () => {
        const response = await request(app)
          .post('/projects/invalid-uuid/members')
          .send(validMemberData);

        expect(response.status).toBe(400);
      });

      it('should return 400 when userId is missing', async () => {
        const response = await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send({ role: 'member' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'userId', code: 'REQUIRED' })])
        );
      });

      it('should return 400 for invalid userId format', async () => {
        const response = await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send({ userId: 'not-a-uuid' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'userId', code: 'INVALID_FORMAT' }),
          ])
        );
      });

      it('should return 400 for invalid role', async () => {
        const response = await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send({ userId: validMemberData.userId, role: 'superuser' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'role', code: 'INVALID_VALUE' })])
        );
      });

      it('should return 400 when trying to assign owner role', async () => {
        const response = await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send({ userId: validMemberData.userId, role: 'owner' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'role', code: 'INVALID_VALUE' })])
        );
      });
    });

    describe('authorization', () => {
      it('should return 403 when user is only a member', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('member');

        const response = await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send(validMemberData);

        expect(response.status).toBe(403);
      });
    });

    describe('not found errors', () => {
      it('should return 404 when project not found', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(null);

        const response = await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send(validMemberData);

        expect(response.status).toBe(404);
        expect(response.body.error.message).toBe('Project not found');
      });

      it('should return 404 when user to add not found', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockUserExists.mockResolvedValue(false);

        const response = await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send(validMemberData);

        expect(response.status).toBe(404);
        expect(response.body.error.message).toBe('User not found');
      });
    });

    describe('conflict handling', () => {
      it('should return 409 when user is already a member', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockUserExists.mockResolvedValue(true);
        mockIsProjectMember.mockResolvedValue(true);

        const response = await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send(validMemberData);

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe('CONFLICT');
        expect(response.body.error.message).toContain('already a member');
      });
    });

    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockCurrentUser = null;

        const response = await request(app)
          .post(`/projects/${validProjectId}/members`)
          .send(validMemberData);

        expect(response.status).toBe(401);
      });
    });
  });

  describe('DELETE /projects/:id/members/:userId', () => {
    const validProjectId = '550e8400-e29b-41d4-a716-446655440000';
    const validUserId = '880e8400-e29b-41d4-a716-446655440003';

    describe('successful removal', () => {
      it('should remove member and return with status 200', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockGetProjectCreatorId.mockResolvedValue('different-user-id');
        mockIsProjectMember.mockResolvedValue(true);
        mockRemoveProjectMember.mockResolvedValue(true);

        const response = await request(app).delete(
          `/projects/${validProjectId}/members/${validUserId}`
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Member removed successfully');
      });

      it('should allow lead to remove members', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('lead');
        mockGetProjectCreatorId.mockResolvedValue('different-user-id');
        mockIsProjectMember.mockResolvedValue(true);
        mockRemoveProjectMember.mockResolvedValue(true);

        const response = await request(app).delete(
          `/projects/${validProjectId}/members/${validUserId}`
        );

        expect(response.status).toBe(200);
      });
    });

    describe('validation errors', () => {
      it('should return 400 for invalid project UUID', async () => {
        const response = await request(app).delete(`/projects/invalid-uuid/members/${validUserId}`);

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'id', code: 'INVALID_FORMAT' })])
        );
      });

      it('should return 400 for invalid user UUID', async () => {
        const response = await request(app).delete(
          `/projects/${validProjectId}/members/invalid-uuid`
        );

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'userId', code: 'INVALID_FORMAT' }),
          ])
        );
      });
    });

    describe('authorization', () => {
      it('should return 403 when user is only a member', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('member');

        const response = await request(app).delete(
          `/projects/${validProjectId}/members/${validUserId}`
        );

        expect(response.status).toBe(403);
      });

      it('should return 403 when trying to remove project owner', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockGetProjectCreatorId.mockResolvedValue(validUserId);

        const response = await request(app).delete(
          `/projects/${validProjectId}/members/${validUserId}`
        );

        expect(response.status).toBe(403);
        expect(response.body.error.message).toContain('Cannot remove the project owner');
      });
    });

    describe('not found errors', () => {
      it('should return 404 when project not found', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(null);

        const response = await request(app).delete(
          `/projects/${validProjectId}/members/${validUserId}`
        );

        expect(response.status).toBe(404);
        expect(response.body.error.message).toBe('Project not found');
      });

      it('should return 404 when user is not a member', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockGetProjectCreatorId.mockResolvedValue('different-user-id');
        mockIsProjectMember.mockResolvedValue(false);

        const response = await request(app).delete(
          `/projects/${validProjectId}/members/${validUserId}`
        );

        expect(response.status).toBe(404);
        expect(response.body.error.message).toContain('not a member');
      });
    });

    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockCurrentUser = null;

        const response = await request(app).delete(
          `/projects/${validProjectId}/members/${validUserId}`
        );

        expect(response.status).toBe(401);
      });
    });

    describe('error handling', () => {
      it('should return 500 on unexpected errors', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetUserProjectRole.mockResolvedValue('owner');
        mockGetProjectCreatorId.mockResolvedValue('different-user-id');
        mockIsProjectMember.mockResolvedValue(true);
        mockRemoveProjectMember.mockRejectedValue(new Error('Database error'));

        const response = await request(app).delete(
          `/projects/${validProjectId}/members/${validUserId}`
        );

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
      });
    });
  });

  describe('GET /projects/:id/risk-dashboard', () => {
    const validProjectId = '550e8400-e29b-41d4-a716-446655440000';

    /**
     * Create a mock project risk dashboard for testing.
     */
    function createMockDashboard(overrides?: Partial<ProjectRiskDashboard>): ProjectRiskDashboard {
      return {
        projectId: validProjectId,
        projectName: 'Test Project',
        statistics: {
          totalAnalyses: 3,
          draftAnalyses: 1,
          inReviewAnalyses: 1,
          approvedAnalyses: 1,
          totalEntries: 25,
          assessedEntries: 20,
          unassessedEntries: 5,
          highRiskCount: 5,
          mediumRiskCount: 8,
          lowRiskCount: 7,
          averageRiskScore: 45.5,
          maxRiskScore: 100,
          minRiskScore: 5,
        },
        distribution: {
          low: 35,
          medium: 40,
          high: 25,
        },
        percentiles: {
          p25: 15,
          p50: 35,
          p75: 65,
          p90: 85,
          p95: 95,
        },
        analysisSummaries: [
          {
            analysisId: 'analysis-1',
            analysisName: 'Analysis 1',
            status: 'approved',
            leadAnalystId: 'analyst-1',
            leadAnalystName: 'John Analyst',
            entryCount: 10,
            assessedEntries: 8,
            highRiskCount: 2,
            mediumRiskCount: 3,
            lowRiskCount: 3,
            maxRiskScore: 100,
            overallRiskLevel: 'high',
            createdAt: new Date('2025-01-01T00:00:00Z'),
            updatedAt: new Date('2025-01-02T00:00:00Z'),
          },
        ],
        byNode: [
          {
            nodeId: 'node-1',
            nodeIdentifier: 'P-101',
            nodeDescription: 'Main pump',
            equipmentType: 'pump',
            entryCount: 5,
            assessedCount: 4,
            highRiskCount: 1,
            mediumRiskCount: 2,
            lowRiskCount: 1,
            averageRiskScore: 50,
            maxRiskScore: 100,
            overallRiskLevel: 'high',
          },
        ],
        byGuideWord: [
          {
            guideWord: 'no',
            entryCount: 8,
            assessedCount: 7,
            highRiskCount: 2,
            mediumRiskCount: 3,
            lowRiskCount: 2,
            averageRiskScore: 45,
            maxRiskScore: 100,
          },
        ],
        highestRiskEntries: [
          {
            entryId: 'entry-1',
            analysisId: 'analysis-1',
            analysisName: 'Analysis 1',
            nodeId: 'node-1',
            nodeIdentifier: 'P-101',
            guideWord: 'no',
            parameter: 'flow',
            riskRanking: {
              severity: 5,
              likelihood: 4,
              detectability: 5,
              riskScore: 100,
              riskLevel: 'high',
            },
          },
        ],
        thresholds: {
          lowMax: 20,
          mediumMax: 60,
        },
        ...overrides,
      };
    }

    describe('successful retrieval', () => {
      it('should return risk dashboard with status 200', async () => {
        const mockDashboard = createMockDashboard();

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectRiskDashboard.mockResolvedValue(mockDashboard);

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.projectId).toBe(validProjectId);
        expect(response.body.data.projectName).toBe('Test Project');
      });

      it('should return correct statistics', async () => {
        const mockDashboard = createMockDashboard();

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectRiskDashboard.mockResolvedValue(mockDashboard);

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(200);
        expect(response.body.data.statistics).toBeDefined();
        expect(response.body.data.statistics.totalAnalyses).toBe(3);
        expect(response.body.data.statistics.totalEntries).toBe(25);
        expect(response.body.data.statistics.assessedEntries).toBe(20);
        expect(response.body.data.statistics.highRiskCount).toBe(5);
        expect(response.body.data.statistics.mediumRiskCount).toBe(8);
        expect(response.body.data.statistics.lowRiskCount).toBe(7);
      });

      it('should return correct distribution percentages', async () => {
        const mockDashboard = createMockDashboard();

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectRiskDashboard.mockResolvedValue(mockDashboard);

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(200);
        expect(response.body.data.distribution).toBeDefined();
        expect(response.body.data.distribution.low).toBe(35);
        expect(response.body.data.distribution.medium).toBe(40);
        expect(response.body.data.distribution.high).toBe(25);
      });

      it('should return correct score percentiles', async () => {
        const mockDashboard = createMockDashboard();

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectRiskDashboard.mockResolvedValue(mockDashboard);

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(200);
        expect(response.body.data.percentiles).toBeDefined();
        expect(response.body.data.percentiles.p25).toBe(15);
        expect(response.body.data.percentiles.p50).toBe(35);
        expect(response.body.data.percentiles.p75).toBe(65);
        expect(response.body.data.percentiles.p90).toBe(85);
        expect(response.body.data.percentiles.p95).toBe(95);
      });

      it('should return per-analysis summaries', async () => {
        const mockDashboard = createMockDashboard();

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectRiskDashboard.mockResolvedValue(mockDashboard);

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(200);
        expect(response.body.data.analysisSummaries).toBeDefined();
        expect(response.body.data.analysisSummaries).toHaveLength(1);
        expect(response.body.data.analysisSummaries[0].analysisName).toBe('Analysis 1');
        expect(response.body.data.analysisSummaries[0].overallRiskLevel).toBe('high');
      });

      it('should return breakdown by node', async () => {
        const mockDashboard = createMockDashboard();

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectRiskDashboard.mockResolvedValue(mockDashboard);

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(200);
        expect(response.body.data.byNode).toBeDefined();
        expect(response.body.data.byNode).toHaveLength(1);
        expect(response.body.data.byNode[0].nodeIdentifier).toBe('P-101');
        expect(response.body.data.byNode[0].overallRiskLevel).toBe('high');
      });

      it('should return breakdown by guide word', async () => {
        const mockDashboard = createMockDashboard();

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectRiskDashboard.mockResolvedValue(mockDashboard);

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(200);
        expect(response.body.data.byGuideWord).toBeDefined();
        expect(response.body.data.byGuideWord).toHaveLength(1);
        expect(response.body.data.byGuideWord[0].guideWord).toBe('no');
      });

      it('should return highest risk entries across project', async () => {
        const mockDashboard = createMockDashboard();

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectRiskDashboard.mockResolvedValue(mockDashboard);

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(200);
        expect(response.body.data.highestRiskEntries).toBeDefined();
        expect(response.body.data.highestRiskEntries).toHaveLength(1);
        expect(response.body.data.highestRiskEntries[0].entryId).toBe('entry-1');
        expect(response.body.data.highestRiskEntries[0].analysisName).toBe('Analysis 1');
        expect(response.body.data.highestRiskEntries[0].riskRanking.riskScore).toBe(100);
      });

      it('should return threshold configuration', async () => {
        const mockDashboard = createMockDashboard();

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectRiskDashboard.mockResolvedValue(mockDashboard);

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(200);
        expect(response.body.data.thresholds).toBeDefined();
        expect(response.body.data.thresholds.lowMax).toBe(20);
        expect(response.body.data.thresholds.mediumMax).toBe(60);
      });

      it('should handle project with no entries (null distribution)', async () => {
        const mockDashboard = createMockDashboard({
          statistics: {
            totalAnalyses: 1,
            draftAnalyses: 1,
            inReviewAnalyses: 0,
            approvedAnalyses: 0,
            totalEntries: 0,
            assessedEntries: 0,
            unassessedEntries: 0,
            highRiskCount: 0,
            mediumRiskCount: 0,
            lowRiskCount: 0,
            averageRiskScore: null,
            maxRiskScore: null,
            minRiskScore: null,
          },
          distribution: null,
          percentiles: null,
          analysisSummaries: [],
          byNode: [],
          byGuideWord: [],
          highestRiskEntries: [],
        });

        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectRiskDashboard.mockResolvedValue(mockDashboard);

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(200);
        expect(response.body.data.statistics.totalEntries).toBe(0);
        expect(response.body.data.distribution).toBeNull();
        expect(response.body.data.percentiles).toBeNull();
        expect(response.body.data.highestRiskEntries).toHaveLength(0);
      });
    });

    describe('validation errors', () => {
      it('should return 400 for invalid UUID format', async () => {
        const response = await request(app).get('/projects/invalid-uuid/risk-dashboard');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'id', code: 'INVALID_FORMAT' }),
          ])
        );
      });
    });

    describe('authorization', () => {
      it('should return 404 when project does not exist', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockGetProjectRiskDashboard.mockResolvedValue(null);

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
        expect(response.body.error.message).toBe('Project not found');
      });

      it('should return 403 when user does not have project access', async () => {
        mockUserHasProjectAccess.mockResolvedValue(false);
        mockFindProjectById.mockResolvedValue(createMockProject());

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('FORBIDDEN');
      });
    });

    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockCurrentUser = null;

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('error handling', () => {
      it('should return 500 on database errors', async () => {
        mockUserHasProjectAccess.mockResolvedValue(true);
        mockGetProjectRiskDashboard.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get(`/projects/${validProjectId}/risk-dashboard`);

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
      });
    });
  });
});
