import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows Prototypes and Templates tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Prototypes' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Templates' })).toBeVisible();
  });

  test('lists existing prototypes', async ({ page }) => {
    // Prototypes tab is active by default
    await expect(page.getByText('Sample prototype', { exact: false })).toBeVisible({ timeout: 10_000 });
  });

  test('switches to Templates tab and lists templates', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates' }).click();
    await expect(page.getByText('Template 1', { exact: false })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to prototype page on row click', async ({ page }) => {
    await page.getByText('Sample prototype', { exact: false }).click();
    await expect(page).toHaveURL(/\/prototype\/sample-prototype/);
  });

  test('navigates to template page on row click', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates' }).click();
    await page.getByText('Template 1', { exact: false }).click();
    await expect(page).toHaveURL(/\/template\/template-1/);
  });

  test('create prototype dialog opens', async ({ page }) => {
    await page.getByRole('button', { name: /new prototype/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('textbox')).toBeVisible();
  });
});
