import { expect, test } from '@playwright/test';

test('delete a habit via inline button (web)', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('add-habit-input').fill('Test habit');
  await page.getByTestId('add-habit-button').click();

  const row = page.getByTestId('habit-row-0');
  await expect(row).toBeVisible();
  await expect(row).toContainText('Test habit');

  const deleteButton = page.getByTestId('habit-row-0-delete-button');
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  await expect(page.getByText('Test habit')).toHaveCount(0);
  await expect(page.getByTestId('empty-state')).toBeVisible();
});
