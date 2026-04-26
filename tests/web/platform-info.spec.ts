import { expect, test } from '@playwright/test';

test('platform info card shows web variant', async ({ page }) => {
  await page.goto('/');

  const card = page.getByTestId('platform-info-card');
  await expect(card).toBeVisible();

  const osField = page.getByTestId('platform-os');
  await expect(osField).toBeVisible();
  await expect(osField).toHaveText('web');

  await expect(page.getByTestId('platform-storage-warning')).toBeVisible();
});
