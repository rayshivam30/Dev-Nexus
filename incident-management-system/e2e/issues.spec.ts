import { test, expect } from '@playwright/test';

test.describe('Issues End-to-End', () => {
  test('Unauthenticated user cannot access issues page', async ({ page }) => {
    await page.goto('/dashboard/developer/issues');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });
});
