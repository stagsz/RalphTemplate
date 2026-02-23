/**
 * API integration tests for sessions endpoints.
 *
 * Tests the full API flow through routes with mocked database services.
 * All session endpoints require authentication and project access.
 *
 * Endpoints tested:
 * - POST /sessions/:id/join - Join a collaboration session
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import type { UserRole, AnalysisStatus } from '@hazop/types';

// Types for mocking
interface CollaborationSessionWithDetails {
  id: string;
  analysisId: string;
  name: string | null;
  status: 'active' | 'paused' | 'ended';
  createdById: string;
  createdByName: string;
  createdByEmail: string;
  createdAt: Date;
  updatedAt: Date;
  endedAt: Date | null;
  notes: string | null;
}

interface SessionParticipantWithDetails {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  joinedAt: Date;
  leftAt: Date | null;
  isActive: boolean;
  cursorPosition: unknown | null;
  lastActivityAt: Date;
}

interface HazopAnalysis {
  id: string;
  projectId: string;
  documentId: string;
  name: string;
  description: string | null;
  status: AnalysisStatus;
  leadAnalystId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock implementations
let mockFindSessionById: jest.Mock<() => Promise<CollaborationSessionWithDetails | null>>;
let mockJoinSession: jest.Mock<() => Promise<SessionParticipantWithDetails>>;
let mockGetActiveParticipants: jest.Mock<() => Promise<SessionParticipantWithDetails[]>>;
let mockFindAnalysisById: jest.Mock<() => Promise<HazopAnalysis | null>>;
let mockUserHasProjectAccess: jest.Mock<() => Promise<boolean>>;

// Current authenticated user for tests
let mockCurrentUser: { id: string; email: string; role: UserRole; organization: string } | null =
  null;

// Set up mocks before importing modules
jest.unstable_mockModule('../services/collaboration.service.js', () => {
  mockFindSessionById = jest.fn<() => Promise<CollaborationSessionWithDetails | null>>();
  mockJoinSession = jest.fn<() => Promise<SessionParticipantWithDetails>>();
  mockGetActiveParticipants = jest.fn<() => Promise<SessionParticipantWithDetails[]>>();

  return {
    findSessionById: mockFindSessionById,
    joinSession: mockJoinSession,
    getActiveParticipants: mockGetActiveParticipants,
    getOrCreateActiveSession: jest.fn(),
    listSessionsForAnalysis: jest.fn(),
    findActiveSessionForAnalysis: jest.fn(),
  };
});

jest.unstable_mockModule('../services/hazop-analysis.service.js', () => {
  mockFindAnalysisById = jest.fn<() => Promise<HazopAnalysis | null>>();

  return {
    findAnalysisById: mockFindAnalysisById,
    documentBelongsToProject: jest.fn(),
    listProjectAnalyses: jest.fn(),
    findAnalysisByIdWithProgress: jest.fn(),
    updateAnalysis: jest.fn(),
    approveAnalysis: jest.fn(),
    nodeExistsInDocument: jest.fn(),
    createAnalysisEntry: jest.fn(),
    listAnalysisEntries: jest.fn(),
    createAnalysis: jest.fn(),
    findAnalysisEntryById: jest.fn(),
    updateAnalysisEntry: jest.fn(),
    deleteAnalysisEntry: jest.fn(),
    updateAnalysisEntryWithVersionCheck: jest.fn(),
    updateEntryRisk: jest.fn(),
    clearEntryRisk: jest.fn(),
  };
});

jest.unstable_mockModule('../services/project.service.js', () => {
  mockUserHasProjectAccess = jest.fn<() => Promise<boolean>>();

  return {
    userHasProjectAccess: mockUserHasProjectAccess,
    findProjectById: jest.fn(),
    getUserProjectRole: jest.fn(),
  };
});

jest.unstable_mockModule('../services/user.service.js', () => ({
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
}));

jest.unstable_mockModule('../services/risk-aggregation.service.js', () => ({
  getAnalysisRiskAggregation: jest.fn(),
}));

jest.unstable_mockModule('../services/risk-calculation.service.js', () => ({
  calculateRiskRanking: jest.fn(),
  validateRiskFactors: jest.fn(),
}));

jest.unstable_mockModule('../services/websocket.service.js', () => ({
  getWebSocketService: jest.fn().mockReturnValue({
    broadcastEntryUpdate: jest.fn(),
    broadcastEntryDelete: jest.fn(),
  }),
}));

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

// Import routes after setting up mocks
const { default: sessionsRoutes } = await import('./sessions.routes.js');

/**
 * Create a mock collaboration session for testing.
 */
function createMockSession(
  overrides?: Partial<CollaborationSessionWithDetails>
): CollaborationSessionWithDetails {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    analysisId: '660e8400-e29b-41d4-a716-446655440001',
    name: 'Test Session',
    status: 'active',
    createdById: '770e8400-e29b-41d4-a716-446655440002',
    createdByName: 'Test Creator',
    createdByEmail: 'creator@example.com',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    endedAt: null,
    notes: null,
    ...overrides,
  };
}

/**
 * Create a mock analysis for testing.
 */
function createMockAnalysis(overrides?: Partial<HazopAnalysis>): HazopAnalysis {
  return {
    id: '660e8400-e29b-41d4-a716-446655440001',
    projectId: '880e8400-e29b-41d4-a716-446655440003',
    documentId: '990e8400-e29b-41d4-a716-446655440004',
    name: 'Test Analysis',
    description: null,
    status: 'draft' as AnalysisStatus,
    leadAnalystId: '770e8400-e29b-41d4-a716-446655440002',
    createdById: '770e8400-e29b-41d4-a716-446655440002',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Create a mock participant for testing.
 */
function createMockParticipant(
  overrides?: Partial<SessionParticipantWithDetails>
): SessionParticipantWithDetails {
  return {
    id: 'aa0e8400-e29b-41d4-a716-446655440005',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'bb0e8400-e29b-41d4-a716-446655440006',
    userName: 'Test User',
    userEmail: 'user@example.com',
    joinedAt: new Date('2026-01-01T00:00:00Z'),
    leftAt: null,
    isActive: true,
    cursorPosition: null,
    lastActivityAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('Sessions Routes', () => {
  let app: Express;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset authenticated user
    mockCurrentUser = {
      id: 'bb0e8400-e29b-41d4-a716-446655440006',
      email: 'user@example.com',
      role: 'analyst' as UserRole,
      organization: 'Test Org',
    };

    // Set up Express app
    app = express();
    app.use(express.json());
    app.use('/sessions', sessionsRoutes);
  });

  describe('POST /sessions/:id/join', () => {
    const sessionId = '550e8400-e29b-41d4-a716-446655440000';
    const validUrl = `/sessions/${sessionId}/join`;

    it('should return 401 if not authenticated', async () => {
      mockCurrentUser = null;

      const response = await request(app).post(validUrl);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
      });
    });

    it('should return 400 for invalid session ID format', async () => {
      const response = await request(app).post('/sessions/invalid-uuid/join');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.errors[0].field).toBe('id');
    });

    it('should return 404 if session not found', async () => {
      mockFindSessionById.mockResolvedValue(null);

      const response = await request(app).post(validUrl);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found',
        },
      });
    });

    it('should return 409 if session is ended', async () => {
      const endedSession = createMockSession({ status: 'ended' });
      mockFindSessionById.mockResolvedValue(endedSession);

      const response = await request(app).post(validUrl);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toContain('ended');
    });

    it('should return 409 if session is paused', async () => {
      const pausedSession = createMockSession({ status: 'paused' });
      mockFindSessionById.mockResolvedValue(pausedSession);

      const response = await request(app).post(validUrl);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toContain('paused');
    });

    it('should return 404 if associated analysis not found', async () => {
      const session = createMockSession();
      mockFindSessionById.mockResolvedValue(session);
      mockFindAnalysisById.mockResolvedValue(null);

      const response = await request(app).post(validUrl);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('Analysis');
    });

    it('should return 403 if user does not have project access', async () => {
      const session = createMockSession();
      const analysis = createMockAnalysis();
      mockFindSessionById.mockResolvedValue(session);
      mockFindAnalysisById.mockResolvedValue(analysis);
      mockUserHasProjectAccess.mockResolvedValue(false);

      const response = await request(app).post(validUrl);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this session',
        },
      });
    });

    it('should successfully join an active session', async () => {
      const session = createMockSession();
      const analysis = createMockAnalysis();
      const participant = createMockParticipant({
        userId: mockCurrentUser!.id,
        userName: 'Test User',
        userEmail: mockCurrentUser!.email,
      });
      const allParticipants = [participant];

      mockFindSessionById.mockResolvedValue(session);
      mockFindAnalysisById.mockResolvedValue(analysis);
      mockUserHasProjectAccess.mockResolvedValue(true);
      mockJoinSession.mockResolvedValue(participant);
      mockGetActiveParticipants.mockResolvedValue(allParticipants);

      const response = await request(app).post(validUrl);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.session).toBeDefined();
      expect(response.body.data.session.id).toBe(session.id);
      expect(response.body.data.session.status).toBe('active');
      expect(response.body.data.participant).toBeDefined();
      expect(response.body.data.participant.userId).toBe(mockCurrentUser!.id);
      expect(response.body.data.participant.isActive).toBe(true);

      // Verify service calls
      expect(mockFindSessionById).toHaveBeenCalledWith(sessionId);
      expect(mockFindAnalysisById).toHaveBeenCalledWith(session.analysisId);
      expect(mockUserHasProjectAccess).toHaveBeenCalledWith(mockCurrentUser!.id, analysis.projectId);
      expect(mockJoinSession).toHaveBeenCalledWith(sessionId, mockCurrentUser!.id);
      expect(mockGetActiveParticipants).toHaveBeenCalledWith(sessionId);
    });

    it('should return session with all participants when joining', async () => {
      const session = createMockSession();
      const analysis = createMockAnalysis();
      const currentParticipant = createMockParticipant({
        userId: mockCurrentUser!.id,
        userName: 'Current User',
        userEmail: mockCurrentUser!.email,
      });
      const otherParticipant = createMockParticipant({
        id: 'cc0e8400-e29b-41d4-a716-446655440007',
        userId: '770e8400-e29b-41d4-a716-446655440002',
        userName: 'Other User',
        userEmail: 'other@example.com',
      });

      mockFindSessionById.mockResolvedValue(session);
      mockFindAnalysisById.mockResolvedValue(analysis);
      mockUserHasProjectAccess.mockResolvedValue(true);
      mockJoinSession.mockResolvedValue(currentParticipant);
      mockGetActiveParticipants.mockResolvedValue([currentParticipant, otherParticipant]);

      const response = await request(app).post(validUrl);

      expect(response.status).toBe(200);
      expect(response.body.data.session.participants).toHaveLength(2);
    });

    it('should allow re-joining if user is already a participant', async () => {
      const session = createMockSession();
      const analysis = createMockAnalysis();
      const participant = createMockParticipant({
        userId: mockCurrentUser!.id,
      });

      mockFindSessionById.mockResolvedValue(session);
      mockFindAnalysisById.mockResolvedValue(analysis);
      mockUserHasProjectAccess.mockResolvedValue(true);
      // joinSession handles re-join by updating last_activity_at
      mockJoinSession.mockResolvedValue(participant);
      mockGetActiveParticipants.mockResolvedValue([participant]);

      const response = await request(app).post(validUrl);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
