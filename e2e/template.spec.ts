import { test, expect } from '@playwright/test';
import { TEMPLATE_ID, DEMO_PROTO_ID } from './helpers';

test.describe('Template page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/template/${TEMPLATE_ID}`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows template name in toolbar', async ({ page }) => {
    await expect(page.getByText('Dialog template', { exact: false })).toBeVisible();
  });

  test('shows no Copy or Theme toggle buttons (Components only)', async ({ page }) => {
    // Template inspector only shows component tree — no Copy or Theme buttons
    await expect(page.getByRole('button', { name: 'Copy' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Theme' })).not.toBeVisible();
  });

  test('preview iframe loads', async ({ page }) => {
    await expect(page.locator('#preview-iframe')).toBeVisible({ timeout: 15_000 });
  });

  test('component tree area is visible', async ({ page }) => {
    // The inspector panel with component tree should render
    await expect(page.locator('[role="tabpanel"]')).toBeVisible({ timeout: 10_000 });
  });

  test('inspector toggle button works', async ({ page }) => {
    await expect(page.locator('[role="tabpanel"]')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /toggle inspector/i }).click();
    await expect(page.locator('[role="tabpanel"]')).not.toBeVisible();

    await page.getByRole('button', { name: /toggle inspector/i }).click();
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  test('"Add to prototype" button opens dialog', async ({ page }) => {
    await page.getByRole('button', { name: /add to prototype/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Dialog template', { exact: false })).toBeVisible();
  });

  test('"Add to prototype" dialog lists existing prototypes', async ({ page }) => {
    await page.getByRole('button', { name: /add to prototype/i }).click();
    await expect(
      page.getByRole('dialog').getByText('Demo prototype', { exact: false })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('"Add to prototype" dialog can be cancelled', async ({ page }) => {
    await page.getByRole('button', { name: /add to prototype/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('back button navigates to dashboard', async ({ page }) => {
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL('/', { timeout: 5_000 });
  });

  // ── Edge case ─────────────────────────────────────────────────────────────

  test('non-existent template shows an error or empty state', async ({ page }) => {
    await page.goto('/template/this-template-does-not-exist');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
