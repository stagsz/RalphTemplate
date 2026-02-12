import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Breadcrumb } from './Breadcrumb';

// Mock the services
vi.mock('../../services/projects.service', () => ({
  projectsService: {
    getProject: vi.fn(),
  },
}));

vi.mock('../../services/analyses.service', () => ({
  analysesService: {
    getAnalysis: vi.fn(),
  },
}));

import { projectsService } from '../../services/projects.service';
import { analysesService } from '../../services/analyses.service';

/**
 * Renders Breadcrumb at a specific route path.
 */
function renderBreadcrumbAtPath(path: string, initialPath: string = path) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={path} element={<Breadcrumb />} />
      </Routes>
    </MemoryRouter>
  );
}

/**
 * Renders Breadcrumb with multiple routes for testing navigation.
 */
function renderBreadcrumbWithRoutes(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<Breadcrumb />} />
        <Route path="/projects" element={<Breadcrumb />} />
        <Route path="/projects/:projectId" element={<Breadcrumb />} />
        <Route path="/projects/:projectId/analyses/:analysisId" element={<Breadcrumb />} />
        <Route path="/projects/:projectId/risk-dashboard" element={<Breadcrumb />} />
        <Route path="/projects/:projectId/compliance" element={<Breadcrumb />} />
        <Route path="/projects/:projectId/compliance-dashboard" element={<Breadcrumb />} />
        <Route path="/projects/:projectId/reports" element={<Breadcrumb />} />
        <Route path="/admin" element={<Breadcrumb />} />
        <Route path="/profile" element={<Breadcrumb />} />
        <Route path="/unauthorized" element={<Breadcrumb />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Breadcrumb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(projectsService.getProject).mockResolvedValue({
      success: true,
      data: {
        project: {
          id: 'proj-123',
          name: 'Test Project',
          description: 'A test project',
          status: 'active',
          createdById: 'user-1',
          organization: 'Test Org',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByName: 'John Doe',
          createdByEmail: 'john@example.com',
          memberRole: 'owner',
        },
      },
    });
    vi.mocked(analysesService.getAnalysis).mockResolvedValue({
      success: true,
      data: {
        analysis: {
          id: 'analysis-456',
          name: 'Test Analysis',
          description: 'A test analysis',
          projectId: 'proj-123',
          documentId: 'doc-1',
          leadAnalystId: 'user-1',
          status: 'in_progress',
          methodology: 'HAZOP',
          createdAt: new Date(),
          updatedAt: new Date(),
          documentName: 'Test Document',
          leadAnalystName: 'John Doe',
          leadAnalystEmail: 'john@example.com',
          nodesCompleted: 5,
          totalNodes: 10,
          entriesCount: 20,
        },
      },
    });
  });

  describe('visibility', () => {
    it('does not render on dashboard (root route)', () => {
      const { container } = renderBreadcrumbWithRoutes('/');
      expect(container.querySelector('nav')).toBeNull();
    });

    it('renders on non-root routes', () => {
      renderBreadcrumbWithRoutes('/projects');
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    });
  });

  describe('static routes', () => {
    it('renders correct breadcrumb for /projects', () => {
      renderBreadcrumbWithRoutes('/projects');
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('renders correct breadcrumb for /admin', () => {
      renderBreadcrumbWithRoutes('/admin');
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('renders correct breadcrumb for /profile', () => {
      renderBreadcrumbWithRoutes('/profile');
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('renders correct breadcrumb for /unauthorized', () => {
      renderBreadcrumbWithRoutes('/unauthorized');
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });

  describe('dynamic routes with project', () => {
    it('renders project name from API', async () => {
      renderBreadcrumbWithRoutes('/projects/proj-123');

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('renders fallback when project fetch fails', async () => {
      vi.mocked(projectsService.getProject).mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      renderBreadcrumbWithRoutes('/projects/proj-123');

      await waitFor(() => {
        expect(screen.getByText(/Project proj-123/)).toBeInTheDocument();
      });
    });

    it('renders project subpages correctly', async () => {
      renderBreadcrumbWithRoutes('/projects/proj-123/risk-dashboard');

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
      expect(screen.getByText('Risk Dashboard')).toBeInTheDocument();
    });

    it('renders compliance page correctly', async () => {
      renderBreadcrumbWithRoutes('/projects/proj-123/compliance');

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
      expect(screen.getByText('Compliance')).toBeInTheDocument();
    });

    it('renders compliance-dashboard page correctly', async () => {
      renderBreadcrumbWithRoutes('/projects/proj-123/compliance-dashboard');

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
      expect(screen.getByText('Compliance Dashboard')).toBeInTheDocument();
    });

    it('renders reports page correctly', async () => {
      renderBreadcrumbWithRoutes('/projects/proj-123/reports');

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });
  });

  describe('dynamic routes with analysis', () => {
    it('renders both project and analysis names', async () => {
      renderBreadcrumbWithRoutes('/projects/proj-123/analyses/analysis-456');

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('Test Analysis')).toBeInTheDocument();
      });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('renders fallback when analysis fetch fails', async () => {
      vi.mocked(analysesService.getAnalysis).mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      renderBreadcrumbWithRoutes('/projects/proj-123/analyses/analysis-456');

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText(/Analysis analysis-456/)).toBeInTheDocument();
      });
    });
  });

  describe('navigation links', () => {
    it('Dashboard link points to /', () => {
      renderBreadcrumbWithRoutes('/projects');
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/');
    });

    it('Projects link points to /projects from project detail', async () => {
      renderBreadcrumbWithRoutes('/projects/proj-123');

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      const projectsLink = screen.getByRole('link', { name: /projects/i });
      expect(projectsLink).toHaveAttribute('href', '/projects');
    });

    it('current page item is not a link', () => {
      renderBreadcrumbWithRoutes('/projects');
      const projectsText = screen.getByText('Projects');
      expect(projectsText.tagName).not.toBe('A');
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label on navigation', () => {
      renderBreadcrumbWithRoutes('/projects');
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    });

    it('has aria-current="page" on current item', () => {
      renderBreadcrumbWithRoutes('/projects');
      const currentItem = screen.getByText('Projects');
      expect(currentItem).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('styling', () => {
    it('has correct container classes', () => {
      renderBreadcrumbWithRoutes('/projects');
      const nav = screen.getByRole('navigation');
      expect(nav.className).toContain('bg-white');
      expect(nav.className).toContain('border-b');
      expect(nav.className).toContain('border-slate-200');
    });
  });
});
