import { test, expect } from '@playwright/test';

test.describe('Projects End-to-End', () => {
  test('Unauthenticated user cannot access projects dashboard', async ({ page }) => {
    await page.goto('/dashboard/admin/projects');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });
});
