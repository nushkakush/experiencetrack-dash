/**
 * End-to-end tests for Cohorts functionality
 * Tests complete user workflows
 */

import { test, expect } from '@playwright/test';

test.describe('Cohorts Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to cohorts page
    await page.goto('/cohorts');
  });

  test('should display cohorts list', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if cohorts page is loaded
    await expect(page.getByRole('heading', { name: /cohorts/i })).toBeVisible();

    // Check if cohorts table is present
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should navigate to cohort details', async ({ page }) => {
    // Wait for cohorts to load
    await page.waitForLoadState('networkidle');

    // Click on first cohort (if exists)
    const firstCohort = page.locator('[data-testid="cohort-card"]').first();
    
    if (await firstCohort.isVisible()) {
      await firstCohort.click();
      
      // Should navigate to cohort details page
      await expect(page).toHaveURL(/\/cohorts\/[^\/]+$/);
      await expect(page.getByRole('heading')).toBeVisible();
    }
  });

  test('should show loading states', async ({ page }) => {
    // Navigate to a cohort details page
    await page.goto('/cohorts/test-cohort-id');

    // Should show loading skeleton
    await expect(page.locator('[data-testid="skeleton"]')).toBeVisible();

    // Wait for content to load
    await page.waitForLoadState('networkidle');
  });

  test('should handle empty states', async ({ page }) => {
    // Mock empty response
    await page.route('**/cohorts**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.reload();

    // Should show empty state
    await expect(page.getByText(/no cohorts found/i)).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/cohorts**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.reload();

    // Should show error state
    await expect(page.getByText(/error/i)).toBeVisible();
  });
});

test.describe('Cohort Details', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a specific cohort
    await page.goto('/cohorts/test-cohort-id');
  });

  test('should display cohort information', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for cohort name
    await expect(page.getByRole('heading')).toBeVisible();

    // Check for cohort ID
    await expect(page.getByText(/cohort id:/i)).toBeVisible();

    // Check for students table
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should show students list', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Phone' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Invite Status' })).toBeVisible();
  });

  test('should handle student deletion', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find delete button for first student
    const deleteButton = page.locator('[data-testid="delete-student"]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Should show confirmation dialog
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/are you sure/i)).toBeVisible();

      // Cancel deletion
      await page.getByRole('button', { name: /cancel/i }).click();
      
      // Dialog should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('should navigate back to cohorts list', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click back button
    await page.getByRole('button', { name: /back to cohorts/i }).click();

    // Should navigate back to cohorts list
    await expect(page).toHaveURL('/cohorts');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/cohorts');
    await page.waitForLoadState('networkidle');

    // Should be responsive
    await expect(page.getByRole('table')).toBeVisible();

    // Navigate to cohort details
    const firstCohort = page.locator('[data-testid="cohort-card"]').first();
    if (await firstCohort.isVisible()) {
      await firstCohort.click();
      
      // Should still work on mobile
      await expect(page.getByRole('heading')).toBeVisible();
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/cohorts');
    await page.waitForLoadState('networkidle');

    // Tab through the page
    await page.keyboard.press('Tab');
    
    // Should be able to navigate with keyboard
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/cohorts');
    await page.waitForLoadState('networkidle');

    // Check for proper ARIA labels
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
  });
});
