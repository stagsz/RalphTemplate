import { Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import type { ProjectStatus, ProjectMemberRole } from '@hazop/types';
import type { ProjectListItem } from '../../services/projects.service';

/**
 * Project status display labels.
 */
export const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  review: 'Review',
  completed: 'Completed',
  archived: 'Archived',
};

/**
 * Project status badge colors.
 * Semantic color scheme for regulatory document aesthetic.
 */
export const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  review: 'bg-amber-100 text-amber-800',
  completed: 'bg-slate-100 text-slate-800',
  archived: 'bg-red-100 text-red-800',
};

/**
 * Project member role display labels.
 */
export const ROLE_LABELS: Record<ProjectMemberRole, string> = {
  owner: 'Owner',
  lead: 'Lead',
  member: 'Member',
  viewer: 'Viewer',
};

/**
 * Props for the StatusBadge component.
 */
interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

/**
 * Status badge component for displaying project status.
 * Uses semantic colors optimized for regulatory document aesthetic.
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/**
 * Props for the RoleBadge component.
 */
interface RoleBadgeProps {
  role: ProjectMemberRole | null;
  fallbackRole?: ProjectMemberRole;
  className?: string;
}

/**
 * Role badge component for displaying user's role in a project.
 */
export function RoleBadge({ role, fallbackRole, className = '' }: RoleBadgeProps) {
  const displayRole = role || fallbackRole;
  if (!displayRole) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 ${className}`}
    >
      {ROLE_LABELS[displayRole]}
    </span>
  );
}

/**
 * Format date for display.
 */
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Props for the ProjectCard component.
 */
interface ProjectCardProps {
  /** The project data to display. */
  project: ProjectListItem;
  /** The current user's ID, used to determine ownership. */
  currentUserId?: string;
  /** Optional callback when the View button is clicked. */
  onView?: (projectId: string) => void;
}

/**
 * Project card component for displaying project summary.
 *
 * Displays:
 * - Project name and description
 * - Status badge with semantic colors
 * - User's role in the project
 * - Creator information
 * - Created and updated dates
 *
 * Design follows regulatory document aesthetic:
 * - Clean white background with subtle border
 * - Minimal border radius (4px)
 * - Clear typographic hierarchy
 * - No decorative elements
 */
export function ProjectCard({ project, currentUserId, onView }: ProjectCardProps) {
  const navigate = useNavigate();

  /**
   * Get the user's role in the project.
   */
  const getUserRole = (): ProjectMemberRole | null => {
    if (project.memberRole) {
      return project.memberRole;
    }
    // If user is creator but has no explicit role, they're the owner
    if (project.createdById === currentUserId) {
      return 'owner';
    }
    return null;
  };

  /**
   * Handle view button click.
   */
  const handleView = () => {
    if (onView) {
      onView(project.id);
    } else {
      navigate(`/projects/${project.id}`);
    }
  };

  const userRole = getUserRole();

  return (
    <div className="bg-white rounded border border-slate-200 hover:border-slate-300 transition-colors">
      {/* Card header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900 truncate">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{project.description}</p>
            )}
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 py-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {/* Your Role */}
          <div>
            <dt className="text-slate-400 text-xs uppercase tracking-wide">Your Role</dt>
            <dd className="mt-0.5">
              {userRole ? (
                <RoleBadge role={userRole} />
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </dd>
          </div>

          {/* Created By */}
          <div>
            <dt className="text-slate-400 text-xs uppercase tracking-wide">Created By</dt>
            <dd className="mt-0.5 text-slate-700 truncate" title={project.createdByEmail}>
              {project.createdByName}
            </dd>
          </div>

          {/* Created Date */}
          <div>
            <dt className="text-slate-400 text-xs uppercase tracking-wide">Created</dt>
            <dd className="mt-0.5 text-slate-600">{formatDate(project.createdAt)}</dd>
          </div>

          {/* Updated Date */}
          <div>
            <dt className="text-slate-400 text-xs uppercase tracking-wide">Updated</dt>
            <dd className="mt-0.5 text-slate-600">{formatDate(project.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Card footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
        <Button
          variant="subtle"
          size="xs"
          color="blue"
          onClick={handleView}
          fullWidth
          styles={{
            root: {
              borderRadius: '4px',
            },
          }}
        >
          View Project
        </Button>
      </div>
    </div>
  );
}
