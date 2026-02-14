import { expect, test } from '@playwright/test';

test('public catalog page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

test.skip('auction detail shows lots correctly', async () => {
  // TODO: implement with deterministic seeded auction and lots.
});

test.skip('unauthenticated users are redirected when trying to participate', async () => {
  // TODO: implement once protected participant flow is stabilized in test env.
});
