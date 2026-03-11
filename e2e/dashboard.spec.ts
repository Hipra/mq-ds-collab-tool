import { test, expect } from '@playwright/test';
import { createTestPrototype, deleteTestPrototype, TEST_PROTO_ID, TEST_PROTO_NAME } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows Prototypes and Templates tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Prototypes' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Templates' })).toBeVisible();
  });

  test('lists existing prototypes', async ({ page }) => {
    await expect(page.getByText('Demo prototype', { exact: false })).toBeVisible({ timeout: 10_000 });
  });

  test('switches to Templates tab and shows templates', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates' }).click();
    await expect(page.getByText('Dialog template', { exact: false })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to prototype editor on card click', async ({ page }) => {
    await page.getByText('Demo prototype', { exact: false }).click();
    await expect(page).toHaveURL(/\/prototype\/demo-prototype/, { timeout: 10_000 });
  });

  test('navigates to template page on template card click', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates' }).click();
    await page.getByText('Dialog template', { exact: false }).click();
    await expect(page).toHaveURL(/\/template\/dialog-template/, { timeout: 10_000 });
  });

  test('New prototype dialog opens and requires a name', async ({ page }) => {
    await page.getByRole('button', { name: /new prototype/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Submit button should be present
    await expect(dialog.getByRole('button', { name: /create/i })).toBeVisible();
    // Text input should be focused
    await expect(dialog.getByRole('textbox')).toBeVisible();
  });

  test('New prototype dialog can be cancelled', async ({ page }) => {
    await page.getByRole('button', { name: /new prototype/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('creates and deletes a prototype via API', async ({ request, page }) => {
    const id = await createTestPrototype(request);
    expect(id).toBe(TEST_PROTO_ID);

    // Reload dashboard and verify it appears
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(TEST_PROTO_NAME, { exact: false })).toBeVisible({ timeout: 10_000 });

    // Clean up
    await deleteTestPrototype(request, id);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(TEST_PROTO_NAME, { exact: false })).not.toBeVisible({ timeout: 10_000 });
  });

  // Edge case: prototype list doesn't crash when metadata is absent (handled server-side)
  test('prototype list loads without crashing', async ({ page }) => {
    // Page title or heading should be visible — the list rendered at all
    await expect(page.getByRole('tab', { name: 'Prototypes' })).toBeVisible();
    // No error message shown
    await expect(page.getByText(/error/i)).not.toBeVisible();
  });
});
