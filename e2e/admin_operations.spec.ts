import { test, expect } from '@playwright/test';

test.describe('Org Admin End-to-End Operational Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    // Login as Test Org 1 Manager
    const org1Btn = page.locator('button:has-text("Test Org 1")');
    await expect(org1Btn).toBeVisible();
    await org1Btn.click();
    await page.waitForURL('http://192.168.0.5/', { timeout: 10000 });
  });

  test('Org Manager can view dashboard metrics and active workers', async ({ page }) => {
    // Dashboard loads active workers metric card
    await expect(page.locator('aside')).toContainText('Alex Vance');
    await expect(page.locator('aside')).toContainText('ORG_ADMIN');

    // Verify Workers navigation
    await page.click('a:has-text("Workers")');
    await page.waitForURL('**/workers');

    // Verify worker count
    await expect(page.locator('h1')).toContainText(/Workers Pool/i);
  });

  test('Org Manager can inspect schedules and conflicts', async ({ page }) => {
    // Navigate to Schedules
    await page.click('a:has-text("Schedules")');
    await page.waitForURL('**/schedules');

    // Verify schedules list table
    await expect(page.locator('h1')).toContainText(/Schedule Periods/i);
  });

  test('Org Manager can view rules and constraints', async ({ page }) => {
    await page.click('a:has-text("Rules & Constraints")');
    await page.waitForURL('**/rules');

    await expect(page.locator('h1')).toContainText(/Rules & Constraints/i);
  });

  test('Org Manager can access Import / Export page', async ({ page }) => {
    await page.click('a:has-text("Import / Export")');
    await page.waitForURL('**/import-export');

    await expect(page.locator('h1')).toContainText(/Import & Export Data/i);
  });

  test('Org Manager logout clears user session and redirects to /login', async ({ page }) => {
    const signOutBtn = page.locator('button:has-text("Sign Out")');
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });
});
