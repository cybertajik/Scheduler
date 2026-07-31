import { test, expect } from '@playwright/test';

test.describe('Security & Permission Boundaries E2E Flow', () => {
  test('invalid login displays error toast/message', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[placeholder*="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Error message displayed
    await expect(page.locator('form, [role="alert"]')).toContainText(/Invalid|Incorrect|failed|401/i);
  });

  test('Product Owner direct URL access to /workers redirects to /organizations', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Product Owner")');
    await page.waitForURL('**/organizations');

    // Attempt direct URL navigation to operational tenant page /workers
    await page.goto('/workers');

    // Redirected back to /organizations
    await page.waitForURL('**/organizations');
    await expect(page).toHaveURL(/.*organizations/);
  });

  test('session persists across page refresh', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Test Org 1")');
    await page.waitForURL('http://192.168.0.5/');

    // Refresh page
    await page.reload();

    // Session preserved
    await expect(page.locator('aside')).toContainText('Alex Vance');
  });
});
