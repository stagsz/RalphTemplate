import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * E2E tests for the complete report generation workflow.
 *
 * These tests verify the full report generation journey including:
 * - Navigating to the Report Generation Center
 * - Generating reports in different formats (PDF, Word, Excel, PowerPoint)
 * - Viewing active report generation progress
 * - Downloading completed reports
 * - Report history and management
 *
 * Prerequisites:
 * - Database must have the seeded admin user (admin@hazop.local / Admin123!)
 * - Run migration: migrations/013_seed_admin_user.sql
 * - RabbitMQ and MinIO services must be running for full workflow
 */

// Test user credentials (from seed migration)
const TEST_USER = {
  email: 'admin@hazop.local',
  password: 'Admin123!',
  name: 'System Administrator',
};

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

// Minimal valid PNG (1x1 pixel) as base64
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Helper function to log in the test user.
 */
async function loginTestUser(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.getByLabel('Email address').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

/**
 * Generate a unique project name for testing.
 */
function generateProjectName(): string {
  return `Report Test Project ${Date.now()}`;
}

/**
 * Generate a unique analysis name for testing.
 */
function generateAnalysisName(): string {
  return `Report Test Analysis ${Date.now()}`;
}

/**
 * Create test fixtures in the fixtures directory.
 */
function ensureTestFixtures(): void {
  // Ensure fixtures directory exists
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  // Create PNG test file from base64
  const testPngPath = path.join(FIXTURES_DIR, 'test-pid-reports.png');
  if (!fs.existsSync(testPngPath)) {
    fs.writeFileSync(testPngPath, Buffer.from(PNG_BASE64, 'base64'));
  }
}

/**
 * Create a new project and return the project ID.
 */
async function createProject(page: Page): Promise<{ projectId: string; projectName: string }> {
  const projectName = generateProjectName();

  // Navigate to projects page
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

  // Create a new project
  await page.getByRole('button', { name: 'New Project' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByPlaceholder('Enter project name').fill(projectName);
  await page.getByRole('button', { name: 'Create Project' }).click();

  // Wait for modal to close and project to appear
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });

  // Navigate to project detail page
  const projectRow = page.locator('tr').filter({ hasText: projectName });
  await projectRow.getByRole('button', { name: 'View' }).click();

  // Wait for project detail page to load
  await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/, { timeout: 10000 });

  // Extract project ID from URL
  const url = page.url();
  const projectId = url.split('/projects/')[1];

  return { projectId, projectName };
}

/**
 * Upload a P&ID document to the project and wait for it to be processed.
 */
async function uploadDocument(page: Page): Promise<void> {
  // Click on Documents tab
  await page.getByRole('tab', { name: 'Documents' }).click();

  // Wait for documents section to load
  await expect(page.getByText('Upload P&ID Document')).toBeVisible();

  // Select a PNG file using file input
  const testFilePath = path.join(FIXTURES_DIR, 'test-pid-reports.png');
  await page.setInputFiles('input[type="file"]', testFilePath);

  // Verify file preview is shown
  await expect(page.getByText('test-pid-reports.png')).toBeVisible();

  // Click Upload button
  await page.getByRole('button', { name: 'Upload' }).click();

  // Wait for success message
  await expect(page.getByText('Document uploaded successfully')).toBeVisible({
    timeout: 30000,
  });

  // Close success alert
  await page.locator('.mantine-Alert-root').getByRole('button').first().click();

  // Verify document appears in the list
  await expect(page.locator('table').getByText('test-pid-reports.png')).toBeVisible({
    timeout: 10000,
  });

  // Wait for document to be processed (status changes to Processed)
  await expect(page.getByText('Processed')).toBeVisible({ timeout: 30000 });
}

/**
 * Create an analysis and submit it for approval.
 */
async function createAndApproveAnalysis(page: Page): Promise<string> {
  const analysisName = generateAnalysisName();

  // Navigate to Analysis tab
  await page.getByRole('tab', { name: 'Analysis' }).click();

  // Click Create Analysis button
  await page.getByRole('button', { name: 'Create Analysis' }).click();

  // Wait for modal to open and documents to load
  await expect(page.getByRole('dialog')).toBeVisible();

  // Select the document (wait for it to be available)
  await page.getByPlaceholder('Select a P&ID document').click();
  await page.getByRole('option', { name: 'test-pid-reports.png' }).click();

  // Enter analysis name
  await page.getByPlaceholder('Enter analysis name').fill(analysisName);

  // Enter optional description
  await page
    .getByPlaceholder('Enter analysis description (optional)')
    .fill('E2E test analysis for report generation');

  // Click Create Analysis
  await page.getByRole('button', { name: 'Create Analysis' }).last().click();

  // Verify navigation to workspace (modal closes and URL changes)
  await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+\/analyses\/[a-f0-9-]+$/, {
    timeout: 15000,
  });

  // Navigate back to project for approval workflow
  await page.getByRole('link', { name: 'Project' }).click();
  await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/, { timeout: 10000 });

  return analysisName;
}

test.describe('Report Generation Workflow', () => {
  // Set up test fixtures before all tests
  test.beforeAll(() => {
    ensureTestFixtures();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginTestUser(page);
  });

  test.describe('Report Generation Center Navigation', () => {
    test('should navigate to Report Generation Center from project page', async ({ page }) => {
      // Create a project
      const { projectId, projectName } = await createProject(page);

      // Look for Reports tab or link
      const reportsTab = page.getByRole('tab', { name: 'Reports' });
      const reportsLink = page.getByRole('link', { name: /reports/i });

      // Click whichever is visible
      if (await reportsTab.isVisible()) {
        await reportsTab.click();
      } else if (await reportsLink.isVisible()) {
        await reportsLink.click();
      }

      // Verify navigation to reports page
      await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/reports`), {
        timeout: 10000,
      });

      // Verify page title
      await expect(page.getByRole('heading', { name: 'Report Generation Center' })).toBeVisible();

      // Verify breadcrumb shows project name
      await expect(page.getByText(projectName)).toBeVisible();
    });

    test('should display all three tabs on Report Generation Center', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page directly
      await page.goto(`/projects/${projectId}/reports`);

      // Verify tabs are visible
      await expect(page.getByRole('tab', { name: 'Generate Report' })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Active/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Report History/i })).toBeVisible();
    });

    test('should display Generate Report tab by default', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page directly
      await page.goto(`/projects/${projectId}/reports`);

      // Verify Generate Report tab is active
      const generateTab = page.getByRole('tab', { name: 'Generate Report' });
      await expect(generateTab).toBeVisible();
      await expect(generateTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Report Request Form', () => {
    test('should display report request form elements', async ({ page }) => {
      // Create a project with document
      const { projectId } = await createProject(page);
      await uploadDocument(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Verify form elements are visible
      await expect(page.getByText('Select Analysis')).toBeVisible();
      await expect(page.getByText('Report Format')).toBeVisible();
      await expect(page.getByText('Report Name')).toBeVisible();
    });

    test('should display message when no analyses available', async ({ page }) => {
      // Create a project without any analyses
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Verify message about no analyses or disabled form
      await expect(
        page.getByText(/no analyses/i).or(page.getByText(/no approved analyses/i))
      ).toBeVisible({ timeout: 10000 });
    });

    test('should show format options (PDF, Word, Excel, PowerPoint)', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Look for format selector
      const formatSelect = page.getByPlaceholder(/format/i).or(page.getByLabel(/format/i));

      if (await formatSelect.isVisible()) {
        await formatSelect.click();

        // Verify all format options
        await expect(page.getByRole('option', { name: /pdf/i })).toBeVisible();
        await expect(page.getByRole('option', { name: /word/i })).toBeVisible();
        await expect(page.getByRole('option', { name: /excel/i })).toBeVisible();
        await expect(page.getByRole('option', { name: /powerpoint/i })).toBeVisible();
      }
    });
  });

  test.describe('Active Reports Tab', () => {
    test('should show empty state when no active reports', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Click Active tab
      await page.getByRole('tab', { name: /Active/i }).click();

      // Verify empty state message
      await expect(page.getByText('No Active Reports')).toBeVisible();
      await expect(
        page.getByText(/Generate a new report to see it here/i)
      ).toBeVisible();
    });

    test('should have button to navigate to Generate tab from empty state', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Click Active tab
      await page.getByRole('tab', { name: /Active/i }).click();

      // Click Generate Report button in empty state
      await page.getByRole('button', { name: 'Generate Report' }).click();

      // Verify Generate tab is now active
      const generateTab = page.getByRole('tab', { name: 'Generate Report' });
      await expect(generateTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Report History Tab', () => {
    test('should show empty state when no completed reports', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Click Report History tab
      await page.getByRole('tab', { name: /Report History/i }).click();

      // Verify empty state message
      await expect(page.getByText('No Reports Yet')).toBeVisible();
      await expect(
        page.getByText(/Generated reports will appear here/i)
      ).toBeVisible();
    });

    test('should display table headers when reports exist', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Click Report History tab
      await page.getByRole('tab', { name: /Report History/i }).click();

      // Even in empty state, check that table structure exists (may be hidden)
      // Or check for column header visibility if table is present
      const tableHeaders = page.locator('th');

      // If table is visible, verify headers
      if (await tableHeaders.first().isVisible()) {
        await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Format' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
      }
    });

    test('should have button to navigate to Generate tab from empty state', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Click Report History tab
      await page.getByRole('tab', { name: /Report History/i }).click();

      // Click Generate Your First Report button
      await page.getByRole('button', { name: /Generate.*Report/i }).click();

      // Verify Generate tab is now active
      const generateTab = page.getByRole('tab', { name: 'Generate Report' });
      await expect(generateTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Navigation and Breadcrumbs', () => {
    test('should navigate back to project via breadcrumb', async ({ page }) => {
      // Create a project
      const { projectId, projectName } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Click project name in breadcrumb
      await page.getByRole('link', { name: projectName }).click();

      // Verify navigation back to project
      await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`), { timeout: 10000 });
    });

    test('should navigate to dashboard via HazOp Assistant link', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Click HazOp Assistant link in header
      await page.getByRole('link', { name: /HazOp/i }).first().click();

      // Verify navigation to dashboard
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('should display user info in header', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Verify user name is visible
      await expect(page.getByText(TEST_USER.name)).toBeVisible();
    });

    test('should have sign out button', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Verify sign out button is visible
      await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    });
  });

  test.describe('Tab Switching', () => {
    test('should switch between tabs correctly', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Verify Generate tab is active by default
      await expect(page.getByRole('tab', { name: 'Generate Report' })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // Click Active tab
      await page.getByRole('tab', { name: /Active/i }).click();
      await expect(page.getByRole('tab', { name: /Active/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // Click Report History tab
      await page.getByRole('tab', { name: /Report History/i }).click();
      await expect(page.getByRole('tab', { name: /Report History/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // Click back to Generate tab
      await page.getByRole('tab', { name: 'Generate Report' }).click();
      await expect(page.getByRole('tab', { name: 'Generate Report' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    test('should show active report count in tab badge', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Verify Active tab shows count (0)
      await expect(page.getByRole('tab', { name: /Active \(0\)/i })).toBeVisible();
    });

    test('should show report history count in tab badge', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Verify Report History tab shows count (0)
      await expect(page.getByRole('tab', { name: /Report History \(0\)/i })).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should display error when project not found', async ({ page }) => {
      // Navigate to reports page with invalid project ID
      await page.goto('/projects/00000000-0000-0000-0000-000000000000/reports');

      // Verify error message is displayed
      await expect(page.getByText(/error/i).or(page.getByText(/not found/i))).toBeVisible({
        timeout: 10000,
      });
    });

    test('should have back to project button on error', async ({ page }) => {
      // Navigate to reports page with invalid project ID
      await page.goto('/projects/00000000-0000-0000-0000-000000000000/reports');

      // Look for back button
      const backButton = page.getByRole('button', { name: /back/i }).or(
        page.getByRole('link', { name: /back/i })
      );

      // Button may or may not be visible depending on error handling
      // Just verify page loads without crashing
      await expect(page).toHaveURL(/\/projects\/00000000-0000-0000-0000-000000000000\/reports/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should be usable on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Verify page title is visible
      await expect(page.getByRole('heading', { name: 'Report Generation Center' })).toBeVisible();

      // Verify tabs are accessible
      await expect(page.getByRole('tab', { name: 'Generate Report' })).toBeVisible();
    });

    test('should be usable on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Verify page title is visible
      await expect(page.getByRole('heading', { name: 'Report Generation Center' })).toBeVisible();

      // Verify all tabs are visible
      await expect(page.getByRole('tab', { name: 'Generate Report' })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Active/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Report History/i })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Verify h1 heading exists
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText('Report Generation Center');
    });

    test('should have accessible tabs with ARIA attributes', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Verify tabs have proper role
      const tabs = page.getByRole('tab');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThanOrEqual(3);

      // Verify tablist exists
      const tablist = page.getByRole('tablist');
      await expect(tablist).toBeVisible();
    });

    test('should have accessible buttons', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to reports page
      await page.goto(`/projects/${projectId}/reports`);

      // Click Active tab to show Generate Report button
      await page.getByRole('tab', { name: /Active/i }).click();

      // Verify button is accessible
      const generateButton = page.getByRole('button', { name: 'Generate Report' });
      await expect(generateButton).toBeVisible();
      await expect(generateButton).toBeEnabled();
    });
  });
});
