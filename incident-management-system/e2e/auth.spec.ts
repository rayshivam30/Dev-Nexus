import { test, expect } from '@playwright/test';

test.describe('Authentication End-to-End', () => {
  test('Login page loads and has required fields', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
    
    // Check if the title is correct
    await expect(page).toHaveTitle(/DevNexus - Incident Management/i);
    
    // Check for email and password fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for the login button
    await expect(page.getByRole('button', { name: /AUTHORIZE_SESSION/i })).toBeVisible();
  });

  test('Register page navigation works', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click on the register link
    await page.getByText(/CREATE_ACCOUNT/i).click();
    
    // Should be on register page
    await expect(page).toHaveURL(/.*\/auth\/register/);
    
    // Check for register form
    await expect(page.locator('input[name="orgName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /CREATE_ORGANIZATION/i })).toBeVisible();
  });
});
