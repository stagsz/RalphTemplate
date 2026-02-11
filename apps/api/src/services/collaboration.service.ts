/**
 * Collaboration service for managing real-time collaboration sessions.
 *
 * Provides database-backed room management for collaborative HazOps analysis.
 * Works in conjunction with WebSocket service for real-time updates.
 */

import { getPool } from '../config/database.config.js';
import type { CursorPosition } from '../types/socket.types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Collaboration session status enum matching database type.
 */
export type CollaborationSessionStatus = 'active' | 'paused' | 'ended';

/**
 * Database row for collaboration session.
 */
interface CollaborationSessionRow {
  id: string;
  analysis_id: string;
  name: string | null;
  status: CollaborationSessionStatus;
  created_by_id: string;
  created_at: Date;
  updated_at: Date;
  ended_at: Date | null;
  notes: string | null;
}

/**
 * Database row for collaboration session with creator details.
 */
interface CollaborationSessionRowWithDetails extends CollaborationSessionRow {
  created_by_name: string;
  created_by_email: string;
}

/**
 * Database row for session participant.
 */
interface SessionParticipantRow {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: Date;
  left_at: Date | null;
  is_active: boolean;
  cursor_position: CursorPosition | null;
  last_activity_at: Date;
}

/**
 * Database row for session participant with user details.
 */
interface SessionParticipantRowWithDetails extends SessionParticipantRow {
  user_name: string;
  user_email: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Collaboration session object (API response format).
 */
export interface CollaborationSession {
  id: string;
  analysisId: string;
  name: string | null;
  status: CollaborationSessionStatus;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  endedAt: Date | null;
  notes: string | null;
}

/**
 * Collaboration session with creator details.
 */
export interface CollaborationSessionWithDetails extends CollaborationSession {
  createdByName: string;
  createdByEmail: string;
}

/**
 * Session participant object (API response format).
 */
export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: Date;
  leftAt: Date | null;
  isActive: boolean;
  cursorPosition: CursorPosition | null;
  lastActivityAt: Date;
}

/**
 * Session participant with user details.
 */
export interface SessionParticipantWithDetails extends SessionParticipant {
  userName: string;
  userEmail: string;
}

// ============================================================================
// Row Converters
// ============================================================================

/**
 * Convert database row to CollaborationSession object.
 */
function rowToSession(row: CollaborationSessionRow): CollaborationSession {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    name: row.name,
    status: row.status,
    createdById: row.created_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    endedAt: row.ended_at,
    notes: row.notes,
  };
}

/**
 * Convert database row to CollaborationSessionWithDetails object.
 */
function rowToSessionWithDetails(
  row: CollaborationSessionRowWithDetails
): CollaborationSessionWithDetails {
  return {
    ...rowToSession(row),
    createdByName: row.created_by_name,
    createdByEmail: row.created_by_email,
  };
}

/**
 * Convert database row to SessionParticipant object.
 */
function rowToParticipant(row: SessionParticipantRow): SessionParticipant {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    joinedAt: row.joined_at,
    leftAt: row.left_at,
    isActive: row.is_active,
    cursorPosition: row.cursor_position,
    lastActivityAt: row.last_activity_at,
  };
}

/**
 * Convert database row to SessionParticipantWithDetails object.
 */
function rowToParticipantWithDetails(
  row: SessionParticipantRowWithDetails
): SessionParticipantWithDetails {
  return {
    ...rowToParticipant(row),
    userName: row.user_name,
    userEmail: row.user_email,
  };
}

// ============================================================================
// Create/Update Payloads
// ============================================================================

/**
 * Payload for creating a new collaboration session.
 */
export interface CreateSessionData {
  analysisId: string;
  name?: string;
  notes?: string;
}

/**
 * Payload for updating a collaboration session.
 */
export interface UpdateSessionData {
  name?: string | null;
  notes?: string | null;
  status?: CollaborationSessionStatus;
}

// ============================================================================
// Service Functions - Session Management
// ============================================================================

/**
 * Create a new collaboration session for an analysis.
 *
 * @param userId - The ID of the user creating the session
 * @param data - Session creation data
 * @returns The created session with details
 * @throws Error with code '23503' if analysis doesn't exist (FK violation)
 */
export async function createSession(
  userId: string,
  data: CreateSessionData
): Promise<CollaborationSessionWithDetails> {
  const pool = getPool();

  const result = await pool.query<CollaborationSessionRow>(
    `INSERT INTO hazop.collaboration_sessions
       (analysis_id, name, notes, created_by_id, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING *`,
    [data.analysisId, data.name ?? null, data.notes ?? null, userId]
  );

  const row = result.rows[0];

  // Fetch the session with creator details
  const sessionWithDetails = await findSessionById(row.id);
  if (!sessionWithDetails) {
    throw new Error('Failed to fetch created session');
  }

  return sessionWithDetails;
}

/**
 * Find a collaboration session by ID.
 *
 * @param sessionId - The session ID to find
 * @returns The session with details, or null if not found
 */
export async function findSessionById(
  sessionId: string
): Promise<CollaborationSessionWithDetails | null> {
  const pool = getPool();

  const result = await pool.query<CollaborationSessionRowWithDetails>(
    `SELECT
       cs.*,
       u.name AS created_by_name,
       u.email AS created_by_email
     FROM hazop.collaboration_sessions cs
     INNER JOIN hazop.users u ON cs.created_by_id = u.id
     WHERE cs.id = $1`,
    [sessionId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return rowToSessionWithDetails(result.rows[0]);
}

/**
 * Find the active collaboration session for an analysis.
 * Returns the most recently created active session.
 *
 * @param analysisId - The analysis ID
 * @returns The active session with details, or null if none found
 */
export async function findActiveSessionForAnalysis(
  analysisId: string
): Promise<CollaborationSessionWithDetails | null> {
  const pool = getPool();

  const result = await pool.query<CollaborationSessionRowWithDetails>(
    `SELECT
       cs.*,
       u.name AS created_by_name,
       u.email AS created_by_email
     FROM hazop.collaboration_sessions cs
     INNER JOIN hazop.users u ON cs.created_by_id = u.id
     WHERE cs.analysis_id = $1 AND cs.status = 'active'
     ORDER BY cs.created_at DESC
     LIMIT 1`,
    [analysisId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return rowToSessionWithDetails(result.rows[0]);
}

/**
 * List collaboration sessions for an analysis.
 *
 * @param analysisId - The analysis ID
 * @param status - Optional status filter
 * @returns List of sessions with details
 */
export async function listSessionsForAnalysis(
  analysisId: string,
  status?: CollaborationSessionStatus
): Promise<CollaborationSessionWithDetails[]> {
  const pool = getPool();

  let query = `
    SELECT
      cs.*,
      u.name AS created_by_name,
      u.email AS created_by_email
    FROM hazop.collaboration_sessions cs
    INNER JOIN hazop.users u ON cs.created_by_id = u.id
    WHERE cs.analysis_id = $1`;

  const values: unknown[] = [analysisId];

  if (status) {
    query += ` AND cs.status = $2`;
    values.push(status);
  }

  query += ` ORDER BY cs.created_at DESC`;

  const result = await pool.query<CollaborationSessionRowWithDetails>(query, values);

  return result.rows.map(rowToSessionWithDetails);
}

/**
 * Update a collaboration session.
 *
 * @param sessionId - The session ID to update
 * @param data - Update data
 * @returns The updated session, or null if not found
 */
export async function updateSession(
  sessionId: string,
  data: UpdateSessionData
): Promise<CollaborationSessionWithDetails | null> {
  const pool = getPool();

  // Build dynamic SET clause
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    setClauses.push(`name = $${paramIndex}`);
    values.push(data.name);
    paramIndex++;
  }

  if (data.notes !== undefined) {
    setClauses.push(`notes = $${paramIndex}`);
    values.push(data.notes);
    paramIndex++;
  }

  if (data.status !== undefined) {
    setClauses.push(`status = $${paramIndex}`);
    values.push(data.status);
    paramIndex++;

    // If ending the session, set ended_at timestamp
    if (data.status === 'ended') {
      setClauses.push(`ended_at = NOW()`);
    }
  }

  // If no fields to update, just return the existing session
  if (setClauses.length === 0) {
    return findSessionById(sessionId);
  }

  // Add session ID as the last parameter
  values.push(sessionId);

  const result = await pool.query<CollaborationSessionRow>(
    `UPDATE hazop.collaboration_sessions
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  if (!result.rows[0]) {
    return null;
  }

  return findSessionById(result.rows[0].id);
}

/**
 * End a collaboration session.
 * This marks the session as ended and sets the ended_at timestamp.
 *
 * @param sessionId - The session ID to end
 * @returns The ended session, or null if not found
 */
export async function endSession(
  sessionId: string
): Promise<CollaborationSessionWithDetails | null> {
  return updateSession(sessionId, { status: 'ended' });
}

/**
 * Pause a collaboration session.
 *
 * @param sessionId - The session ID to pause
 * @returns The paused session, or null if not found
 */
export async function pauseSession(
  sessionId: string
): Promise<CollaborationSessionWithDetails | null> {
  return updateSession(sessionId, { status: 'paused' });
}

/**
 * Resume a paused collaboration session.
 *
 * @param sessionId - The session ID to resume
 * @returns The resumed session, or null if not found
 */
export async function resumeSession(
  sessionId: string
): Promise<CollaborationSessionWithDetails | null> {
  return updateSession(sessionId, { status: 'active' });
}

// ============================================================================
// Service Functions - Participant Management
// ============================================================================

/**
 * Add a participant to a collaboration session (join room).
 * If the user already has an inactive record, creates a new one.
 *
 * @param sessionId - The session ID to join
 * @param userId - The user ID joining
 * @returns The participant record with details
 */
export async function joinSession(
  sessionId: string,
  userId: string
): Promise<SessionParticipantWithDetails> {
  const pool = getPool();

  // Check if user already has an active participation
  const existingResult = await pool.query<SessionParticipantRow>(
    `SELECT * FROM hazop.session_participants
     WHERE session_id = $1 AND user_id = $2 AND is_active = TRUE`,
    [sessionId, userId]
  );

  if (existingResult.rows[0]) {
    // User is already active in this session, update last activity
    await pool.query(
      `UPDATE hazop.session_participants
       SET last_activity_at = NOW()
       WHERE id = $1`,
      [existingResult.rows[0].id]
    );
    return findParticipantById(existingResult.rows[0].id) as Promise<SessionParticipantWithDetails>;
  }

  // Create new participation record
  const result = await pool.query<SessionParticipantRow>(
    `INSERT INTO hazop.session_participants
       (session_id, user_id, is_active)
     VALUES ($1, $2, TRUE)
     RETURNING *`,
    [sessionId, userId]
  );

  const participantWithDetails = await findParticipantById(result.rows[0].id);
  if (!participantWithDetails) {
    throw new Error('Failed to fetch created participant');
  }

  return participantWithDetails;
}

/**
 * Remove a participant from a collaboration session (leave room).
 * Marks the participant as inactive and sets left_at timestamp.
 *
 * @param sessionId - The session ID to leave
 * @param userId - The user ID leaving
 * @returns The updated participant record, or null if not found
 */
export async function leaveSession(
  sessionId: string,
  userId: string
): Promise<SessionParticipantWithDetails | null> {
  const pool = getPool();

  const result = await pool.query<SessionParticipantRow>(
    `UPDATE hazop.session_participants
     SET is_active = FALSE, left_at = NOW()
     WHERE session_id = $1 AND user_id = $2 AND is_active = TRUE
     RETURNING *`,
    [sessionId, userId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return findParticipantById(result.rows[0].id);
}

/**
 * Mark all active participants of a session as inactive.
 * Used when ending a session.
 *
 * @param sessionId - The session ID
 * @returns Number of participants marked as inactive
 */
export async function markAllParticipantsInactive(sessionId: string): Promise<number> {
  const pool = getPool();

  const result = await pool.query(
    `UPDATE hazop.session_participants
     SET is_active = FALSE, left_at = NOW()
     WHERE session_id = $1 AND is_active = TRUE`,
    [sessionId]
  );

  return result.rowCount ?? 0;
}

/**
 * Find a participant by ID.
 *
 * @param participantId - The participant record ID
 * @returns The participant with details, or null if not found
 */
export async function findParticipantById(
  participantId: string
): Promise<SessionParticipantWithDetails | null> {
  const pool = getPool();

  const result = await pool.query<SessionParticipantRowWithDetails>(
    `SELECT
       sp.*,
       u.name AS user_name,
       u.email AS user_email
     FROM hazop.session_participants sp
     INNER JOIN hazop.users u ON sp.user_id = u.id
     WHERE sp.id = $1`,
    [participantId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return rowToParticipantWithDetails(result.rows[0]);
}

/**
 * Get active participants for a session.
 *
 * @param sessionId - The session ID
 * @returns List of active participants with details
 */
export async function getActiveParticipants(
  sessionId: string
): Promise<SessionParticipantWithDetails[]> {
  const pool = getPool();

  const result = await pool.query<SessionParticipantRowWithDetails>(
    `SELECT
       sp.*,
       u.name AS user_name,
       u.email AS user_email
     FROM hazop.session_participants sp
     INNER JOIN hazop.users u ON sp.user_id = u.id
     WHERE sp.session_id = $1 AND sp.is_active = TRUE
     ORDER BY sp.joined_at ASC`,
    [sessionId]
  );

  return result.rows.map(rowToParticipantWithDetails);
}

/**
 * Get all participants for a session (including inactive).
 *
 * @param sessionId - The session ID
 * @returns List of all participants with details
 */
export async function getAllParticipants(
  sessionId: string
): Promise<SessionParticipantWithDetails[]> {
  const pool = getPool();

  const result = await pool.query<SessionParticipantRowWithDetails>(
    `SELECT
       sp.*,
       u.name AS user_name,
       u.email AS user_email
     FROM hazop.session_participants sp
     INNER JOIN hazop.users u ON sp.user_id = u.id
     WHERE sp.session_id = $1
     ORDER BY sp.joined_at ASC`,
    [sessionId]
  );

  return result.rows.map(rowToParticipantWithDetails);
}

/**
 * Update a participant's cursor position.
 *
 * @param sessionId - The session ID
 * @param userId - The user ID
 * @param cursorPosition - The new cursor position
 * @returns The updated participant, or null if not found
 */
export async function updateParticipantCursor(
  sessionId: string,
  userId: string,
  cursorPosition: CursorPosition | null
): Promise<SessionParticipantWithDetails | null> {
  const pool = getPool();

  const result = await pool.query<SessionParticipantRow>(
    `UPDATE hazop.session_participants
     SET cursor_position = $3, last_activity_at = NOW()
     WHERE session_id = $1 AND user_id = $2 AND is_active = TRUE
     RETURNING *`,
    [sessionId, userId, cursorPosition ? JSON.stringify(cursorPosition) : null]
  );

  if (!result.rows[0]) {
    return null;
  }

  return findParticipantById(result.rows[0].id);
}

/**
 * Update a participant's last activity timestamp.
 *
 * @param sessionId - The session ID
 * @param userId - The user ID
 * @returns True if participant was updated, false if not found
 */
export async function updateParticipantActivity(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const pool = getPool();

  const result = await pool.query(
    `UPDATE hazop.session_participants
     SET last_activity_at = NOW()
     WHERE session_id = $1 AND user_id = $2 AND is_active = TRUE`,
    [sessionId, userId]
  );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Check if a user is an active participant in a session.
 *
 * @param sessionId - The session ID
 * @param userId - The user ID
 * @returns True if user is an active participant
 */
export async function isParticipantActive(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const pool = getPool();

  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM hazop.session_participants
       WHERE session_id = $1 AND user_id = $2 AND is_active = TRUE
     ) AS exists`,
    [sessionId, userId]
  );

  return result.rows[0]?.exists ?? false;
}

/**
 * Get the count of active participants in a session.
 *
 * @param sessionId - The session ID
 * @returns Number of active participants
 */
export async function getActiveParticipantCount(sessionId: string): Promise<number> {
  const pool = getPool();

  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM hazop.session_participants
     WHERE session_id = $1 AND is_active = TRUE`,
    [sessionId]
  );

  return parseInt(result.rows[0]?.count ?? '0', 10);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an analysis exists.
 *
 * @param analysisId - The analysis ID to check
 * @returns True if the analysis exists
 */
export async function analysisExists(analysisId: string): Promise<boolean> {
  const pool = getPool();

  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM hazop.hazop_analyses WHERE id = $1
     ) AS exists`,
    [analysisId]
  );

  return result.rows[0]?.exists ?? false;
}

/**
 * Check if a session belongs to a specific analysis.
 *
 * @param sessionId - The session ID
 * @param analysisId - The analysis ID
 * @returns True if the session belongs to the analysis
 */
export async function sessionBelongsToAnalysis(
  sessionId: string,
  analysisId: string
): Promise<boolean> {
  const pool = getPool();

  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM hazop.collaboration_sessions
       WHERE id = $1 AND analysis_id = $2
     ) AS exists`,
    [sessionId, analysisId]
  );

  return result.rows[0]?.exists ?? false;
}

/**
 * Get or create an active session for an analysis.
 * If no active session exists, creates one.
 *
 * @param analysisId - The analysis ID
 * @param userId - The user ID creating the session if needed
 * @param sessionName - Optional session name for new sessions
 * @returns The active session with details
 */
export async function getOrCreateActiveSession(
  analysisId: string,
  userId: string,
  sessionName?: string
): Promise<CollaborationSessionWithDetails> {
  // Try to find an existing active session
  const existingSession = await findActiveSessionForAnalysis(analysisId);
  if (existingSession) {
    return existingSession;
  }

  // Create a new session
  return createSession(userId, {
    analysisId,
    name: sessionName,
  });
}
