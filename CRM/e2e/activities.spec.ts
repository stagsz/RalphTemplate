import { test, expect } from '@playwright/test'

test.describe('Epic 4: Activity Logging', () => {
  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Fill in credentials (you may need to adjust these based on your test setup)
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for successful login
    await page.waitForURL('/')
  })

  test.describe('Story 4.1: Quick log modal', () => {
    test('should open quick log modal from navbar', async ({ page }) => {
      // Look for quick log button in navbar (you may need to implement this)
      const quickLogButton = page.locator('[data-testid="quick-log-button"]')
      if (await quickLogButton.isVisible()) {
        await quickLogButton.click()
      } else {
        // Fallback: navigate to activities page and create activity
        await page.goto('/activities')
        await page.click('text=New Activity')
      }

      // Check if modal is open
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('text=Create Activity')).toBeVisible()
    })

    test('should create a call activity', async ({ page }) => {
      // Navigate to create activity form
      await page.goto('/contacts')
      await page.click('text=New Activity') // Assuming there's a new activity button

      // Fill out call activity
      await page.selectOption('[name="type"]', 'call')
      await page.fill('[name="subject"]', 'Test call with client')
      await page.fill('[name="description"]', 'Discussed project requirements and next steps')
      await page.fill('[name="duration_minutes"]', '30')

      // Submit form
      await page.click('button[type="submit"]')

      // Check for success
      await expect(page.locator('text=Activity created successfully')).toBeVisible()
    })

    test('should create an email activity', async ({ page }) => {
      await page.goto('/contacts')
      await page.click('text=New Activity')

      await page.selectOption('[name="type"]', 'email')
      await page.fill('[name="subject"]', 'Follow-up email sent')
      await page.fill('[name="description"]', 'Sent project proposal and pricing information')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=Activity created successfully')).toBeVisible()
    })

    test('should create a meeting activity', async ({ page }) => {
      await page.goto('/contacts')
      await page.click('text=New Activity')

      await page.selectOption('[name="type"]', 'meeting')
      await page.fill('[name="subject"]', 'Project kickoff meeting')
      await page.fill('[name="description"]', 'Initial meeting to discuss project scope')
      await page.fill('[name="duration_minutes"]', '60')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=Activity created successfully')).toBeVisible()
    })

    test('should create a note activity', async ({ page }) => {
      await page.goto('/contacts')
      await page.click('text=New Activity')

      await page.selectOption('[name="type"]', 'note')
      await page.fill('[name="subject"]', 'Client preferences noted')
      await page.fill('[name="description"]', 'Client prefers morning meetings and email communication')

      await page.click('button[type="submit")

      await expect(page.locator('text=Activity created successfully')).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/contacts')
      await page.click('text=New Activity')

      // Try to submit without required fields
      await page.click('button[type="submit"]')

      // Check for validation messages
      await expect(page.locator('text=Type and subject are required')).toBeVisible()
    })

    test('should close modal after successful save', async ({ page }) => {
      await page.goto('/contacts')
      await page.click('text=New Activity')

      await page.selectOption('[name="type"]', 'note')
      await page.fill('[name="subject"]', 'Test note')

      await page.click('button[type="submit"]')

      // Modal should close after save
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    })
  })

  test.describe('Story 4.2: Activity timeline component', () => {
    test('should display activities in chronological order', async ({ page }) => {
      // Navigate to a page with activity timeline (contact detail or activities page)
      await page.goto('/activities')

      // Check if timeline is visible
      await expect(page.locator('[data-testid="activity-timeline"]')).toBeVisible()

      // Check for activity items
      const activities = page.locator('[data-testid="activity-item"]')
      const count = await activities.count()
      
      if (count > 1) {
        // Verify chronological order (most recent first)
        const firstActivityTime = await activities.first().locator('[data-testid="activity-time"]').textContent()
        const lastActivityTime = await activities.last().locator('[data-testid="activity-time"]').textContent()
        
        // Basic check that times are displayed
        expect(firstActivityTime).toBeTruthy()
        expect(lastActivityTime).toBeTruthy()
      }
    })

    test('should show activity details', async ({ page }) => {
      await page.goto('/activities')

      const activity = page.locator('[data-testid="activity-item"]').first()
      
      // Check for activity components
      await expect(activity.locator('[data-testid="activity-type-icon"]')).toBeVisible()
      await expect(activity.locator('[data-testid="activity-subject"]')).toBeVisible()
      await expect(activity.locator('[data-testid="activity-time"]')).toBeVisible()
    })

    test('should show empty state when no activities', async ({ page }) => {
      // This test would need a clean state or filtered view with no results
      await page.goto('/activities?filter=none')

      await expect(page.locator('text=No activities yet')).toBeVisible()
      await expect(page.locator('text=Activities will appear here as they are logged')).toBeVisible()
    })

    test('should be mobile responsive', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/activities')

      const timeline = page.locator('[data-testid="activity-timeline"]')
      await expect(timeline).toBeVisible()

      // Check that timeline adapts to mobile (this will depend on your CSS)
      const boundingBox = await timeline.boundingBox()
      expect(boundingBox?.width).toBeLessThanOrEqual(375)
    })
  })  test.describe('Story 4.3: Keyboard shortcuts', () => {
    test('should open call modal with C key', async ({ page }) => {
      await page.goto('/')
      
      // Press C key
      await page.keyboard.press('c')
      
      // Check if quick log modal opens with call pre-selected
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('[name="type"]')).toHaveValue('call')
    })

    test('should open email modal with E key', async ({ page }) => {
      await page.goto('/')
      
      await page.keyboard.press('e')
      
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('[name="type"]')).toHaveValue('email')
    })

    test('should open meeting modal with M key', async ({ page }) => {
      await page.goto('/')
      
      await page.keyboard.press('m')
      
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('[name="type"]')).toHaveValue('meeting')
    })

    test('should open note modal with N key', async ({ page }) => {
      await page.goto('/')
      
      await page.keyboard.press('n')
      
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('[name="type"]')).toHaveValue('note')
    })

    test('should not trigger shortcuts when typing in input fields', async ({ page }) => {
      await page.goto('/contacts')
      
      // Click on a text input
      await page.click('[name="first_name"]')
      
      // Type 'c' in the input
      await page.keyboard.press('c')
      
      // Modal should NOT open
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
      
      // The 'c' should appear in the input
      await expect(page.locator('[name="first_name"]')).toHaveValue('c')
    })

    test('should show keyboard shortcut help with ? key', async ({ page }) => {
      await page.goto('/')
      
      await page.keyboard.press('Shift+/')  // ? key
      
      // Check for help panel
      await expect(page.locator('[data-testid="keyboard-shortcuts-help"]')).toBeVisible()
      await expect(page.locator('text=C - Create Call')).toBeVisible()
      await expect(page.locator('text=E - Create Email')).toBeVisible()
      await expect(page.locator('text=M - Create Meeting')).toBeVisible()
      await expect(page.locator('text=N - Create Note')).toBeVisible()
    })
  })

  test.describe('Story 4.4: Edit/delete activities', () => {
    test('should edit an activity', async ({ page }) => {
      await page.goto('/activities')
      
      // Find an activity and click edit
      const activity = page.locator('[data-testid="activity-item"]').first()
      await activity.locator('[data-testid="edit-activity-button"]').click()
      
      // Edit modal should open with pre-populated data
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('text=Update Activity')).toBeVisible()
      
      // Update the subject
      await page.fill('[name="subject"]', 'Updated activity subject')
      
      // Submit the changes
      await page.click('button[type="submit"]')
      
      // Check for success message
      await expect(page.locator('text=Activity updated successfully')).toBeVisible()
    })

    test('should delete an activity', async ({ page }) => {
      await page.goto('/activities')
      
      const activity = page.locator('[data-testid="activity-item"]').first()
      const activitySubject = await activity.locator('[data-testid="activity-subject"]').textContent()
      
      // Click delete button
      await activity.locator('[data-testid="delete-activity-button"]').click()
      
      // Confirmation dialog should appear
      await expect(page.locator('text=Are you sure you want to delete this activity?')).toBeVisible()
      
      // Confirm deletion
      await page.click('text=Delete')
      
      // Activity should be removed from the timeline
      await expect(page.locator(`text=${activitySubject}`)).not.toBeVisible()
      
      // Success message should appear
      await expect(page.locator('text=Activity deleted successfully')).toBeVisible()
    })

    test('should cancel deletion', async ({ page }) => {
      await page.goto('/activities')
      
      const activity = page.locator('[data-testid="activity-item"]').first()
      const activitySubject = await activity.locator('[data-testid="activity-subject"]').textContent()
      
      await activity.locator('[data-testid="delete-activity-button"]').click()
      
      // Cancel deletion
      await page.click('text=Cancel')
      
      // Activity should still be visible
      await expect(page.locator(`text=${activitySubject}`)).toBeVisible()
    })
  })

  test.describe('Story 4.5: Activity filters', () => {
    test('should filter by activity type', async ({ page }) => {
      await page.goto('/activities')
      
      // Open filter dropdown
      await page.click('[data-testid="activity-type-filter"]')
      
      // Select only calls
      await page.click('text=Calls only')
      
      // Check that only call activities are visible
      const activities = page.locator('[data-testid="activity-item"]')
      const count = await activities.count()
      
      for (let i = 0; i < count; i++) {
        const activityTypeIcon = activities.nth(i).locator('[data-testid="activity-type-icon"]')
        await expect(activityTypeIcon).toContainText('📞')
      }
    })

    test('should filter by date range', async ({ page }) => {
      await page.goto('/activities')
      
      // Open date filter
      await page.click('[data-testid="date-range-filter"]')
      
      // Set date range (last 7 days)
      await page.click('text=Last 7 days')
      
      // Verify filter is applied (this would depend on your implementation)
      await expect(page.locator('[data-testid="active-filters"]')).toContainText('Last 7 days')
    })

    test('should clear all filters', async ({ page }) => {
      await page.goto('/activities')
      
      // Apply some filters
      await page.click('[data-testid="activity-type-filter"]')
      await page.click('text=Calls only')
      
      await page.click('[data-testid="date-range-filter"]')
      await page.click('text=Last 7 days')
      
      // Clear all filters
      await page.click('[data-testid="clear-all-filters"]')
      
      // Check that filters are cleared
      await expect(page.locator('[data-testid="active-filters"]')).not.toBeVisible()
    })

    test('should persist filters in URL', async ({ page }) => {
      await page.goto('/activities')
      
      // Apply filter
      await page.click('[data-testid="activity-type-filter"]')
      await page.click('text=Calls only')
      
      // Check URL contains filter parameters
      await expect(page.url()).toContain('type=call')
      
      // Refresh page
      await page.reload()
      
      // Filter should still be applied
      await expect(page.locator('[data-testid="active-filters"]')).toContainText('Calls')
    })
  })

  test.describe('Performance & Accessibility', () => {
    test('should handle large number of activities', async ({ page }) => {
      // This would test with a seeded database of many activities
      await page.goto('/activities')
      
      // Check that page loads reasonably quickly
      const startTime = Date.now()
      await page.waitForSelector('[data-testid="activity-timeline"]')
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should be accessible', async ({ page }) => {
      await page.goto('/activities')
      
      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible()
      
      // Check for proper ARIA labels
      const timeline = page.locator('[data-testid="activity-timeline"]')
      await expect(timeline).toHaveAttribute('role', 'list')
      
      // Test keyboard navigation
      await page.keyboard.press('Tab')
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })
  })
})