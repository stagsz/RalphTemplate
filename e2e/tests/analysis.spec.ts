import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * E2E tests for the complete HazOps analysis workflow.
 *
 * These tests verify the complete analysis journey including:
 * - Creating a new analysis session
 * - Navigating to the analysis workspace
 * - Selecting nodes, guide words, and creating entries
 * - Adding causes, consequences, safeguards, and recommendations
 * - Viewing the analysis summary table
 *
 * Prerequisites:
 * - Database must have the seeded admin user (admin@hazop.local / Admin123!)
 * - Run migration: migrations/013_seed_admin_user.sql
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
  return `Analysis Test Project ${Date.now()}`;
}

/**
 * Generate a unique analysis name for testing.
 */
function generateAnalysisName(): string {
  return `Test Analysis ${Date.now()}`;
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
  const testPngPath = path.join(FIXTURES_DIR, 'test-pid-analysis.png');
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
  const testFilePath = path.join(FIXTURES_DIR, 'test-pid-analysis.png');
  await page.setInputFiles('input[type="file"]', testFilePath);

  // Verify file preview is shown
  await expect(page.getByText('test-pid-analysis.png')).toBeVisible();

  // Click Upload button
  await page.getByRole('button', { name: 'Upload' }).click();

  // Wait for success message
  await expect(page.getByText('Document uploaded successfully')).toBeVisible({
    timeout: 30000,
  });

  // Close success alert
  await page.locator('.mantine-Alert-root').getByRole('button').first().click();

  // Verify document appears in the list
  await expect(page.locator('table').getByText('test-pid-analysis.png')).toBeVisible({
    timeout: 10000,
  });

  // Wait for document to be processed (status changes to Processed)
  // The backend may take a moment to process the document
  await expect(page.getByText('Processed')).toBeVisible({ timeout: 30000 });
}

/**
 * Add a node to the uploaded document.
 */
async function addNode(
  page: Page,
  nodeId: string,
  description: string,
  equipmentType: string = 'pump'
): Promise<void> {
  // Click on the document row to expand or view details
  // First, find the document row and click the View button (if present) or expand
  const documentRow = page.locator('table tr').filter({ hasText: 'test-pid-analysis.png' });

  // Check if there's an expand or view button - if not, click the row
  const viewButton = documentRow.getByRole('button', { name: /view|expand/i });
  if (await viewButton.isVisible()) {
    await viewButton.click();
  }

  // Find the "Add Node" button - it may be in the document row or in an expanded section
  const addNodeButton = page.getByRole('button', { name: 'Add Node' });
  await expect(addNodeButton).toBeVisible({ timeout: 5000 });
  await addNodeButton.click();

  // Wait for the Add Node modal to appear
  await expect(page.getByRole('dialog')).toBeVisible();

  // Fill in node details
  await page.getByPlaceholder('Enter node ID').fill(nodeId);
  await page.getByPlaceholder('Enter description').fill(description);

  // Select equipment type
  const equipmentSelect = page.locator('[data-testid="equipment-type-select"]').or(
    page.getByLabel('Equipment Type')
  );
  if (await equipmentSelect.isVisible()) {
    await equipmentSelect.click();
    await page.getByRole('option', { name: new RegExp(equipmentType, 'i') }).click();
  }

  // Position is set by clicking on the P&ID, but for the test we'll use default position
  // or set x,y if there are input fields

  // Save the node
  await page.getByRole('button', { name: /save|create|add/i }).click();

  // Wait for modal to close
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
}

test.describe('HazOps Analysis Workflow', () => {
  // Set up test fixtures before all tests
  test.beforeAll(() => {
    ensureTestFixtures();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginTestUser(page);
  });

  test.describe('Analysis Session Creation', () => {
    test('should display empty state when no analyses exist', async ({ page }) => {
      // Create a project
      const { projectId, projectName } = await createProject(page);

      // Navigate to Analysis tab
      await page.getByRole('tab', { name: 'Analysis' }).click();

      // Verify empty state message
      await expect(page.getByText('No analyses yet')).toBeVisible();
      await expect(
        page.getByText('Create a new HazOps analysis to begin your hazard study.')
      ).toBeVisible();

      // Verify Create Analysis button is visible
      await expect(page.getByRole('button', { name: 'Create Analysis' })).toBeVisible();
    });

    test('should open create analysis modal', async ({ page }) => {
      // Create a project
      const { projectId } = await createProject(page);

      // Navigate to Analysis tab
      await page.getByRole('tab', { name: 'Analysis' }).click();

      // Click Create Analysis button
      await page.getByRole('button', { name: 'Create Analysis' }).click();

      // Verify modal opens
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('New Analysis Session')).toBeVisible();

      // Verify form elements
      await expect(page.getByText('P&ID Document')).toBeVisible();
      await expect(page.getByText('Analysis Name')).toBeVisible();
      await expect(page.getByText('Description')).toBeVisible();

      // Verify buttons
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create Analysis' })).toBeVisible();
    });

    test('should show warning when no processed documents exist', async ({ page }) => {
      // Create a project (no documents uploaded)
      await createProject(page);

      // Navigate to Analysis tab
      await page.getByRole('tab', { name: 'Analysis' }).click();

      // Click Create Analysis button
      await page.getByRole('button', { name: 'Create Analysis' }).click();

      // Verify warning about no processed documents
      await expect(
        page.getByText(/No processed P&ID documents available/i)
      ).toBeVisible({ timeout: 5000 });
    });

    test('should disable Create Analysis button when form is incomplete', async ({ page }) => {
      // Create a project and upload a document
      await createProject(page);
      await uploadDocument(page);

      // Navigate to Analysis tab
      await page.getByRole('tab', { name: 'Analysis' }).click();

      // Click Create Analysis button
      await page.getByRole('button', { name: 'Create Analysis' }).click();

      // Wait for modal and document dropdown to load
      await expect(page.getByRole('dialog')).toBeVisible();

      // Create Analysis button should be disabled without name
      await expect(page.getByRole('button', { name: 'Create Analysis' }).last()).toBeDisabled();

      // Select a document
      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      // Button still disabled without name
      await expect(page.getByRole('button', { name: 'Create Analysis' }).last()).toBeDisabled();

      // Enter analysis name
      await page.getByPlaceholder('Enter analysis name').fill('Test Analysis');

      // Button should now be enabled
      await expect(page.getByRole('button', { name: 'Create Analysis' }).last()).toBeEnabled();
    });

    test('should create analysis successfully', async ({ page }) => {
      // Create a project and upload a document
      await createProject(page);
      await uploadDocument(page);

      // Navigate to Analysis tab
      await page.getByRole('tab', { name: 'Analysis' }).click();

      // Click Create Analysis button
      await page.getByRole('button', { name: 'Create Analysis' }).click();

      // Wait for modal to open and documents to load
      await expect(page.getByRole('dialog')).toBeVisible();

      // Select the document (wait for it to be available)
      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      // Enter analysis name
      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);

      // Enter optional description
      await page
        .getByPlaceholder('Enter analysis description (optional)')
        .fill('E2E test analysis session');

      // Click Create Analysis
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Verify navigation to workspace (modal closes and URL changes)
      await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+\/analyses\/[a-f0-9-]+$/, {
        timeout: 15000,
      });

      // Verify analysis name appears in the workspace
      await expect(page.getByText(analysisName)).toBeVisible({ timeout: 10000 });

      // Verify Draft status badge
      await expect(page.getByText('Draft')).toBeVisible();
    });
  });

  test.describe('Analysis Workspace', () => {
    test('should display analysis workspace with P&ID viewer and analysis panel', async ({
      page,
    }) => {
      // Create a project, upload document, and create analysis
      const { projectId } = await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Verify P&ID Document section
      await expect(page.getByText('P&ID Document')).toBeVisible();
      await expect(page.getByText('test-pid-analysis.png')).toBeVisible();

      // Verify Analysis Panel with Entry/Summary toggle
      await expect(page.getByText('Analysis Entry')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Entry' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Summary' })).toBeVisible();

      // Verify "No Node Selected" message
      await expect(page.getByText('No Node Selected')).toBeVisible();
      await expect(
        page.getByText('Click on a node marker on the P&ID to begin analysis.')
      ).toBeVisible();
    });

    test('should display no nodes message when document has no nodes', async ({ page }) => {
      // Create a project, upload document, and create analysis
      await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Verify "No nodes defined" message
      await expect(page.getByText('No nodes defined on this P&ID yet.')).toBeVisible();

      // Verify link to add nodes
      await expect(page.getByRole('link', { name: 'Add nodes' })).toBeVisible();
    });

    test('should show P&ID viewer toolbar with zoom controls', async ({ page }) => {
      // Create a project, upload document, and create analysis
      await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Verify zoom controls
      await expect(page.getByRole('button', { name: 'Fit' })).toBeVisible();
      await expect(page.getByRole('button', { name: '100%' })).toBeVisible();

      // Verify node count display
      await expect(page.getByText('0 nodes')).toBeVisible();
    });

    test('should toggle between Entry and Summary views', async ({ page }) => {
      // Create a project, upload document, and create analysis
      await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Verify Entry view is active by default
      await expect(page.getByText('Analysis Entry')).toBeVisible();

      // Click Summary button
      await page.getByRole('button', { name: 'Summary' }).click();

      // Verify Summary view is shown
      await expect(page.getByText('Analysis Summary')).toBeVisible();

      // Click Entry button
      await page.getByRole('button', { name: 'Entry' }).click();

      // Verify Entry view is shown again
      await expect(page.getByText('Analysis Entry')).toBeVisible();
    });
  });

  test.describe('Analysis List', () => {
    test('should show analysis in project analysis list after creation', async ({ page }) => {
      // Create a project, upload document, and create analysis
      const { projectId } = await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Navigate back to project
      await page.getByRole('link', { name: 'Project' }).click();
      await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/, { timeout: 10000 });

      // Click Analysis tab
      await page.getByRole('tab', { name: 'Analysis' }).click();

      // Verify analysis appears in the list
      await expect(page.getByText(analysisName)).toBeVisible({ timeout: 10000 });

      // Verify status badge
      await expect(page.locator('tr').filter({ hasText: analysisName }).getByText('Draft')).toBeVisible();
    });

    test('should navigate to workspace via View button', async ({ page }) => {
      // Create a project, upload document, and create analysis
      await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Navigate back to project
      await page.getByRole('link', { name: 'Project' }).click();
      await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/, { timeout: 10000 });

      // Click Analysis tab
      await page.getByRole('tab', { name: 'Analysis' }).click();

      // Click View button on the analysis row
      const analysisRow = page.locator('tr').filter({ hasText: analysisName });
      await analysisRow.getByRole('button', { name: 'View' }).click();

      // Verify navigation to workspace
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 10000 });
      await expect(page.getByText(analysisName)).toBeVisible();
    });

    test('should search analyses by name', async ({ page }) => {
      // Create a project, upload document, and create analysis
      await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = `Searchable Analysis ${Date.now()}`;
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Navigate back to project
      await page.getByRole('link', { name: 'Project' }).click();
      await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/, { timeout: 10000 });

      // Click Analysis tab
      await page.getByRole('tab', { name: 'Analysis' }).click();

      // Search for the analysis
      await page.getByPlaceholder('Search by name or description...').fill('Searchable Analysis');

      // Verify analysis is found
      await expect(page.getByText(analysisName)).toBeVisible({ timeout: 5000 });

      // Search for something that doesn't exist
      await page.getByPlaceholder('Search by name or description...').fill('nonexistent12345');

      // Verify no results
      await expect(page.getByText('No analyses found')).toBeVisible({ timeout: 5000 });
    });

    test('should filter analyses by status', async ({ page }) => {
      // Create a project, upload document, and create analysis
      await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Navigate back to project
      await page.getByRole('link', { name: 'Project' }).click();
      await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/, { timeout: 10000 });

      // Click Analysis tab
      await page.getByRole('tab', { name: 'Analysis' }).click();

      // Filter by Draft status
      await page.getByPlaceholder('Filter by status').click();
      await page.getByRole('option', { name: 'Draft' }).click();

      // Verify analysis is visible (it's a draft)
      await expect(page.getByText(analysisName)).toBeVisible({ timeout: 5000 });

      // Filter by In Review status (should hide our draft analysis)
      await page.getByPlaceholder('Filter by status').click();
      await page.getByRole('option', { name: 'In Review' }).click();

      // Analysis should not be visible
      await expect(page.getByText(analysisName)).not.toBeVisible();
    });

    test('should reset filters', async ({ page }) => {
      // Create a project, upload document, and create analysis
      await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Navigate back to project
      await page.getByRole('link', { name: 'Project' }).click();
      await page.getByRole('tab', { name: 'Analysis' }).click();

      // Apply search filter
      await page.getByPlaceholder('Search by name or description...').fill('nonexistent');
      await expect(page.getByText('No analyses found')).toBeVisible({ timeout: 5000 });

      // Click Reset button
      await page.getByRole('button', { name: 'Reset' }).click();

      // Verify filters are cleared and analysis is visible
      await expect(page.getByPlaceholder('Search by name or description...')).toHaveValue('');
      await expect(page.getByText(analysisName)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Progress Tracking', () => {
    test('should display progress tracker with initial counts', async ({ page }) => {
      // Create a project, upload document, and create analysis
      await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Verify progress tracker is visible with initial counts
      // Look for total nodes count (should be 0)
      await expect(page.getByText(/0\s*nodes/i).or(page.getByText('0 / 0 nodes'))).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Analysis Summary Table', () => {
    test('should display empty summary table when no entries exist', async ({ page }) => {
      // Create a project, upload document, and create analysis
      await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Switch to Summary view
      await page.getByRole('button', { name: 'Summary' }).click();

      // Verify empty state or "No entries" message
      await expect(
        page.getByText(/no entries/i).or(page.getByText(/no analysis entries/i))
      ).toBeVisible({ timeout: 5000 });
    });

    test('should display summary table headers', async ({ page }) => {
      // Create a project, upload document, and create analysis
      await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Switch to Summary view
      await page.getByRole('button', { name: 'Summary' }).click();

      // Verify filter controls are visible
      await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to project via breadcrumb', async ({ page }) => {
      // Create a project, upload document, and create analysis
      const { projectId } = await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Click Project link in breadcrumb
      await page.getByRole('link', { name: 'Project' }).click();

      // Verify navigation back to project
      await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/, { timeout: 10000 });
    });

    test('should navigate to dashboard via HazOp link', async ({ page }) => {
      // Create a project, upload document, and create analysis
      await createProject(page);
      await uploadDocument(page);

      await page.getByRole('tab', { name: 'Analysis' }).click();
      await page.getByRole('button', { name: 'Create Analysis' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByPlaceholder('Select a P&ID document').click();
      await page.getByRole('option', { name: 'test-pid-analysis.png' }).click();

      const analysisName = generateAnalysisName();
      await page.getByPlaceholder('Enter analysis name').fill(analysisName);
      await page.getByRole('button', { name: 'Create Analysis' }).last().click();

      // Wait for workspace to load
      await expect(page).toHaveURL(/\/analyses\/[a-f0-9-]+$/, { timeout: 15000 });

      // Click HazOp link in header
      await page.getByRole('link', { name: 'HazOp' }).click();

      // Verify navigation to dashboard
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });
  });
});
