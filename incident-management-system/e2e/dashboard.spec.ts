import { test, expect } from '@playwright/test';

test.describe('Dashboard End-to-End', () => {
  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if redirected to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });
});
