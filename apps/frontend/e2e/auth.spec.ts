import { expect, test } from '@playwright/test';

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /martillo/i })).toBeVisible();
});

test.skip('user can register successfully', async () => {
  // TODO: implement when stable test seed data and captcha/email constraints are defined.
});

test.skip('user login with invalid credentials shows error', async () => {
  // TODO: implement when test credentials lifecycle is fully automated.
});

test.skip('refresh token flow works after access token expires', async () => {
  // TODO: implement with controllable token TTL in test environment.
});
