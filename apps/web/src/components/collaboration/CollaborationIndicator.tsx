/**
 * Collaboration status indicator component.
 *
 * Displays active collaborators in the analysis workspace, showing user avatars
 * with an indicator of who is currently connected and viewing the analysis.
 *
 * @module components/collaboration/CollaborationIndicator
 */

import { useState } from 'react';
import { Tooltip, Modal, Table } from '@mantine/core';
import type { UserPresence } from '../../hooks/useWebSocket';

// ============================================================================
// Types
// ============================================================================

/**
 * Size variants for the collaboration indicator.
 */
type IndicatorSize = 'xs' | 'sm' | 'md';

/**
 * Props for the CollaborationIndicator component.
 */
interface CollaborationIndicatorProps {
  /** List of users currently in the collaboration room */
  users: UserPresence[];
  /** Current user's ID (to identify self in the list) */
  currentUserId?: string;
  /** Maximum number of avatars to show before "+N more" */
  maxAvatarsShown?: number;
  /** Size variant */
  size?: IndicatorSize;
  /** Whether the WebSocket is connected */
  isConnected?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Avatar size classes by variant.
 */
const AVATAR_SIZES: Record<IndicatorSize, string> = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-6 h-6 text-xs',
  md: 'w-7 h-7 text-sm',
};

/**
 * Avatar overlap (negative margin) by size.
 */
const AVATAR_OVERLAP: Record<IndicatorSize, string> = {
  xs: '-ml-1.5',
  sm: '-ml-2',
  md: '-ml-2.5',
};

/**
 * Status indicator dot sizes.
 */
const DOT_SIZES: Record<IndicatorSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
};

/**
 * Colors for user avatars (cycling through for variety).
 */
const AVATAR_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  { bg: 'bg-violet-100', text: 'text-violet-800' },
  { bg: 'bg-amber-100', text: 'text-amber-800' },
  { bg: 'bg-rose-100', text: 'text-rose-800' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get initials from an email address.
 * Uses first letter of local part + first letter after a dot or hyphen.
 */
function getInitials(email: string): string {
  const localPart = email.split('@')[0] || '';
  const parts = localPart.split(/[.\-_]/);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Single name - take first two letters
  return localPart.slice(0, 2).toUpperCase();
}

/**
 * Get a consistent color for a user based on their ID.
 */
function getAvatarColor(userId: string): { bg: string; text: string } {
  // Simple hash based on user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Format relative time for last activity.
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return 'Just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.floor(diffHours / 24)}d ago`;
}

/**
 * Determine if a user is "active" based on last activity.
 * Active = activity within last 5 minutes.
 */
function isUserActive(lastActivity: string): boolean {
  const activityTime = new Date(lastActivity).getTime();
  const now = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;
  return now - activityTime < fiveMinutesMs;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Single user avatar with optional status indicator.
 */
function UserAvatar({
  user,
  size,
  isCurrentUser,
  showStatusDot,
  className,
}: {
  user: UserPresence;
  size: IndicatorSize;
  isCurrentUser: boolean;
  showStatusDot?: boolean;
  className?: string;
}) {
  const initials = getInitials(user.email);
  const color = getAvatarColor(user.userId);
  const isActive = isUserActive(user.lastActivity);

  return (
    <div className={`relative ${className || ''}`}>
      <div
        className={`
          ${AVATAR_SIZES[size]}
          ${color.bg}
          ${color.text}
          rounded-full flex items-center justify-center font-medium
          border-2 border-white shadow-sm
          ${isCurrentUser ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
        `}
        title={user.email}
      >
        {initials}
      </div>
      {showStatusDot && (
        <span
          className={`
            absolute -bottom-0.5 -right-0.5
            ${DOT_SIZES[size]}
            rounded-full border border-white
            ${isActive ? 'bg-green-500' : 'bg-slate-400'}
          `}
        />
      )}
    </div>
  );
}

/**
 * Overflow indicator showing count of additional users.
 */
function OverflowIndicator({
  count,
  size,
  onClick,
}: {
  count: number;
  size: IndicatorSize;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${AVATAR_SIZES[size]}
        ${AVATAR_OVERLAP[size]}
        bg-slate-100 text-slate-600
        rounded-full flex items-center justify-center font-medium
        border-2 border-white shadow-sm
        hover:bg-slate-200 transition-colors
        cursor-pointer
      `}
    >
      +{count}
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Displays collaboration status with user avatars.
 *
 * Shows connected collaborators as overlapping avatar icons with:
 * - Status indicator dots (green = active, gray = idle)
 * - Overflow indicator for additional users
 * - Tooltip with user list on hover
 * - Modal with full user details on click
 *
 * @example
 * ```tsx
 * <CollaborationIndicator
 *   users={roomUsers}
 *   currentUserId={user?.id}
 *   isConnected={state.isConnected}
 *   maxAvatarsShown={3}
 * />
 * ```
 */
export function CollaborationIndicator({
  users,
  currentUserId,
  maxAvatarsShown = 3,
  size = 'sm',
  isConnected = false,
  className,
}: CollaborationIndicatorProps) {
  const [showModal, setShowModal] = useState(false);

  // Don't render if not connected or no users
  if (!isConnected || users.length === 0) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2 py-1 rounded border border-slate-200 bg-white ${className || ''}`}
      >
        <span
          className={`${DOT_SIZES[size]} rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-400'}`}
        />
        <span className="text-xs text-slate-500">
          {isConnected ? 'Connected' : 'Offline'}
        </span>
      </div>
    );
  }

  // Sort users: current user first, then others sorted by activity
  const sortedUsers = [...users].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    // Sort by most recent activity
    return (
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  });

  const visibleUsers = sortedUsers.slice(0, maxAvatarsShown);
  const overflowCount = sortedUsers.length - maxAvatarsShown;
  const activeCount = users.filter((u) => isUserActive(u.lastActivity)).length;

  // Tooltip content with user list
  const tooltipContent = (
    <div className="text-xs">
      <div className="font-medium mb-1">
        {users.length} collaborator{users.length !== 1 ? 's' : ''}
      </div>
      <ul className="space-y-0.5">
        {sortedUsers.slice(0, 5).map((user) => (
          <li key={user.userId} className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isUserActive(user.lastActivity) ? 'bg-green-400' : 'bg-slate-400'}`}
            />
            <span>
              {user.email}
              {user.userId === currentUserId && ' (you)'}
            </span>
          </li>
        ))}
        {users.length > 5 && (
          <li className="text-slate-400">+{users.length - 5} more</li>
        )}
      </ul>
    </div>
  );

  return (
    <>
      <Tooltip
        label={tooltipContent}
        position="bottom"
        withArrow
        multiline
        w={200}
      >
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`
            inline-flex items-center gap-2 px-2 py-1 rounded
            border border-slate-200 bg-white
            hover:bg-slate-50 hover:border-slate-300 transition-colors
            cursor-pointer
            ${className || ''}
          `}
        >
          {/* Connected status dot */}
          <span className={`${DOT_SIZES[size]} rounded-full bg-green-500`} />

          {/* Avatar stack */}
          <div className="flex items-center">
            {visibleUsers.map((user, index) => (
              <UserAvatar
                key={user.userId}
                user={user}
                size={size}
                isCurrentUser={user.userId === currentUserId}
                showStatusDot={size !== 'xs'}
                className={index > 0 ? AVATAR_OVERLAP[size] : ''}
              />
            ))}
            {overflowCount > 0 && (
              <OverflowIndicator count={overflowCount} size={size} />
            )}
          </div>

          {/* Count label */}
          <span className="text-xs text-slate-600 font-medium">
            {activeCount} active
          </span>
        </button>
      </Tooltip>

      {/* Modal with full user list */}
      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title="Active Collaborators"
        centered
        size="md"
      >
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{activeCount}</span>{' '}
              of {users.length} collaborator{users.length !== 1 ? 's' : ''}{' '}
              active
            </span>
          </div>

          {/* User table */}
          <Table
            striped
            highlightOnHover
            withTableBorder={false}
            styles={{
              table: { fontSize: '14px' },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Last Active</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedUsers.map((user) => {
                const isActive = isUserActive(user.lastActivity);
                return (
                  <Table.Tr key={user.userId}>
                    <Table.Td>
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          user={user}
                          size="sm"
                          isCurrentUser={user.userId === currentUserId}
                          showStatusDot={false}
                        />
                        <div>
                          <div className="font-medium text-slate-900">
                            {user.email}
                            {user.userId === currentUserId && (
                              <span className="ml-1.5 text-xs font-normal text-slate-400">
                                (you)
                              </span>
                            )}
                          </div>
                          {user.cursor?.nodeId && (
                            <div className="text-xs text-slate-500">
                              Viewing node {user.cursor.nodeId}
                            </div>
                          )}
                        </div>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <span
                        className={`
                          inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium
                          ${isActive ? 'bg-green-50 text-green-800' : 'bg-slate-50 text-slate-600'}
                        `}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-400'}`}
                        />
                        {isActive ? 'Active' : 'Idle'}
                      </span>
                    </Table.Td>
                    <Table.Td>
                      <span className="text-slate-500">
                        {formatRelativeTime(user.lastActivity)}
                      </span>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>

          {/* Legend */}
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
            Users are considered active if they have interacted within the last
            5 minutes.
          </div>
        </div>
      </Modal>
    </>
  );
}

/**
 * Compact version showing just the count badge.
 */
export function CollaborationIndicatorCompact({
  userCount,
  isConnected,
  className,
}: {
  userCount: number;
  isConnected: boolean;
  className?: string;
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium
        border
        ${isConnected ? 'bg-green-50 text-green-800 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}
        ${className || ''}
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-400'}`}
      />
      {userCount} {userCount === 1 ? 'user' : 'users'}
    </span>
  );
}

export default CollaborationIndicator;
