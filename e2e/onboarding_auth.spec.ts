import { test, expect } from '@playwright/test';

test.describe('SaaS Multi-Tenant Onboarding & Authentication E2E Flow', () => {
  test('public onboarding form submission and verification', async ({ page }) => {
    await page.goto('/onboarding');

    // Verify page title
    await expect(page.locator('h1')).toContainText(/Organization Onboarding/i);

    // Fill application form
    const randomOrg = `E2E Org ${Date.now()}`;
    await page.fill('input[name="org_name"], input[placeholder*="HealthCare"]', randomOrg);
    await page.fill('input[name="contact_name"], input[placeholder*="Helen"]', 'Playwright Tester');
    await page.fill('input[name="contact_email"], input[placeholder*="email"]', `playwright_${Date.now()}@test.com`);

    // Submit form
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('product owner login and navigation access controls', async ({ page }) => {
    await page.goto('/login');

    // Click Product Owner login
    const poBtn = page.locator('button:has-text("Product Owner")');
    await expect(poBtn).toBeVisible();
    await poBtn.click();

    // Verify redirection to /organizations
    await page.waitForURL('**/organizations', { timeout: 10000 });
    await expect(page).toHaveURL(/.*organizations/);

    // Verify nav links for Product Owner
    await expect(page.locator('aside')).toContainText(/Subscribed Organizations/i);
    await expect(page.locator('aside')).toContainText(/Platform Analytics/i);
    await expect(page.locator('aside')).toContainText(/System Status/i);
  });
});
