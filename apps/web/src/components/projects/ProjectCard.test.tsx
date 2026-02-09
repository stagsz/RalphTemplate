import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { ProjectCard, StatusBadge, RoleBadge, STATUS_LABELS, STATUS_COLORS, ROLE_LABELS } from './ProjectCard';
import type { ProjectListItem } from '../../services/projects.service';
import type { ProjectStatus, ProjectMemberRole } from '@hazop/types';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Creates a mock project for testing.
 */
function createMockProject(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    id: 'proj-123',
    name: 'Test Project',
    description: 'A test project description',
    status: 'active' as ProjectStatus,
    createdById: 'user-456',
    organization: 'Test Org',
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-20T15:30:00Z'),
    createdByName: 'John Doe',
    createdByEmail: 'john@example.com',
    memberRole: 'member' as ProjectMemberRole,
    ...overrides,
  };
}

/**
 * Renders ProjectCard with all required providers.
 */
function renderProjectCard(props: {
  project: ProjectListItem;
  currentUserId?: string;
  onView?: (projectId: string) => void;
}) {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <ProjectCard {...props} />
      </MemoryRouter>
    </MantineProvider>
  );
}

/**
 * Renders StatusBadge with MantineProvider.
 */
function renderStatusBadge(props: { status: ProjectStatus; className?: string }) {
  return render(
    <MantineProvider>
      <StatusBadge {...props} />
    </MantineProvider>
  );
}

/**
 * Renders RoleBadge with MantineProvider.
 */
function renderRoleBadge(props: {
  role: ProjectMemberRole | null;
  fallbackRole?: ProjectMemberRole;
  className?: string;
}) {
  return render(
    <MantineProvider>
      <RoleBadge {...props} />
    </MantineProvider>
  );
}

describe('StatusBadge', () => {
  describe('rendering', () => {
    it.each([
      ['planning', 'Planning'],
      ['active', 'Active'],
      ['review', 'Review'],
      ['completed', 'Completed'],
      ['archived', 'Archived'],
    ] as const)('renders %s status with correct label', (status, expectedLabel) => {
      renderStatusBadge({ status });
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });

    it.each([
      ['planning', 'bg-blue-100', 'text-blue-800'],
      ['active', 'bg-green-100', 'text-green-800'],
      ['review', 'bg-amber-100', 'text-amber-800'],
      ['completed', 'bg-slate-100', 'text-slate-800'],
      ['archived', 'bg-red-100', 'text-red-800'],
    ] as const)('renders %s status with correct colors', (status, bgClass, textClass) => {
      renderStatusBadge({ status });
      const badge = screen.getByText(STATUS_LABELS[status]);
      expect(badge.className).toContain(bgClass);
      expect(badge.className).toContain(textClass);
    });

    it('applies additional className', () => {
      renderStatusBadge({ status: 'active', className: 'ml-2' });
      const badge = screen.getByText('Active');
      expect(badge.className).toContain('ml-2');
    });
  });
});

describe('RoleBadge', () => {
  describe('rendering', () => {
    it.each([
      ['owner', 'Owner'],
      ['lead', 'Lead'],
      ['member', 'Member'],
      ['viewer', 'Viewer'],
    ] as const)('renders %s role with correct label', (role, expectedLabel) => {
      renderRoleBadge({ role });
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });

    it('renders nothing when role is null and no fallback', () => {
      const { container } = renderRoleBadge({ role: null });
      expect(container.firstChild).toBeNull();
    });

    it('renders fallback role when role is null', () => {
      renderRoleBadge({ role: null, fallbackRole: 'owner' });
      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('uses slate colors for all roles', () => {
      renderRoleBadge({ role: 'member' });
      const badge = screen.getByText('Member');
      expect(badge.className).toContain('bg-slate-100');
      expect(badge.className).toContain('text-slate-800');
    });

    it('applies additional className', () => {
      renderRoleBadge({ role: 'member', className: 'mt-1' });
      const badge = screen.getByText('Member');
      expect(badge.className).toContain('mt-1');
    });
  });
});

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders project name', () => {
      const project = createMockProject({ name: 'My HazOp Study' });
      renderProjectCard({ project });
      expect(screen.getByText('My HazOp Study')).toBeInTheDocument();
    });

    it('renders project description', () => {
      const project = createMockProject({ description: 'Chemical reactor analysis' });
      renderProjectCard({ project });
      expect(screen.getByText('Chemical reactor analysis')).toBeInTheDocument();
    });

    it('does not render description when empty', () => {
      const project = createMockProject({ description: '' });
      renderProjectCard({ project });
      expect(screen.queryByText(/^$/)).not.toBeInTheDocument();
    });

    it('renders status badge', () => {
      const project = createMockProject({ status: 'review' });
      renderProjectCard({ project });
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('renders created by name', () => {
      const project = createMockProject({ createdByName: 'Jane Smith' });
      renderProjectCard({ project });
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('renders formatted created date', () => {
      const project = createMockProject({ createdAt: new Date('2025-03-15T10:00:00Z') });
      renderProjectCard({ project });
      expect(screen.getByText('Mar 15, 2025')).toBeInTheDocument();
    });

    it('renders formatted updated date', () => {
      const project = createMockProject({ updatedAt: new Date('2025-04-20T15:30:00Z') });
      renderProjectCard({ project });
      expect(screen.getByText('Apr 20, 2025')).toBeInTheDocument();
    });

    it('renders View Project button', () => {
      const project = createMockProject();
      renderProjectCard({ project });
      expect(screen.getByRole('button', { name: /view project/i })).toBeInTheDocument();
    });
  });

  describe('role display', () => {
    it('displays member role when set', () => {
      const project = createMockProject({ memberRole: 'lead' });
      renderProjectCard({ project });
      expect(screen.getByText('Lead')).toBeInTheDocument();
    });

    it('displays owner role for creator without explicit role', () => {
      const project = createMockProject({
        createdById: 'user-123',
        memberRole: null,
      });
      renderProjectCard({ project, currentUserId: 'user-123' });
      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('displays dash when no role and not creator', () => {
      const project = createMockProject({
        createdById: 'user-456',
        memberRole: null,
      });
      renderProjectCard({ project, currentUserId: 'user-123' });
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates to project page on View button click', async () => {
      const user = userEvent.setup();
      const project = createMockProject({ id: 'proj-abc' });
      renderProjectCard({ project });

      const viewButton = screen.getByRole('button', { name: /view project/i });
      await user.click(viewButton);

      expect(mockNavigate).toHaveBeenCalledWith('/projects/proj-abc');
    });

    it('calls custom onView handler when provided', async () => {
      const user = userEvent.setup();
      const onView = vi.fn();
      const project = createMockProject({ id: 'proj-xyz' });
      renderProjectCard({ project, onView });

      const viewButton = screen.getByRole('button', { name: /view project/i });
      await user.click(viewButton);

      expect(onView).toHaveBeenCalledWith('proj-xyz');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('applies correct container styles', () => {
      const project = createMockProject();
      const { container } = renderProjectCard({ project });
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('rounded');
      expect(card.className).toContain('border');
      expect(card.className).toContain('border-slate-200');
    });
  });
});

describe('exported constants', () => {
  describe('STATUS_LABELS', () => {
    it('has all project statuses', () => {
      const statuses: ProjectStatus[] = ['planning', 'active', 'review', 'completed', 'archived'];
      statuses.forEach((status) => {
        expect(STATUS_LABELS[status]).toBeDefined();
      });
    });
  });

  describe('STATUS_COLORS', () => {
    it('has all project statuses', () => {
      const statuses: ProjectStatus[] = ['planning', 'active', 'review', 'completed', 'archived'];
      statuses.forEach((status) => {
        expect(STATUS_COLORS[status]).toBeDefined();
      });
    });
  });

  describe('ROLE_LABELS', () => {
    it('has all member roles', () => {
      const roles: ProjectMemberRole[] = ['owner', 'lead', 'member', 'viewer'];
      roles.forEach((role) => {
        expect(ROLE_LABELS[role]).toBeDefined();
      });
    });
  });
});
