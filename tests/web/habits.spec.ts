import { expect, test } from '@playwright/test';

test('add and complete a habit', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Daily Habits').first()).toBeVisible();

  const input = page.getByTestId('add-habit-input');
  await expect(input).toBeVisible();
  await input.fill('Drink water');

  await page.getByTestId('add-habit-button').click();

  const row = page.getByTestId('habit-row-0');
  await expect(row).toBeVisible();
  await expect(row).toContainText('Drink water');

  await row.click();

  await expect(page.getByTestId('habit-row-0-today-cell')).toBeVisible();
});
