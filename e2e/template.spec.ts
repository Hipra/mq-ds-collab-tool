import { test, expect } from '@playwright/test';

const TEMPLATE_ID = 'template-1';

test.describe('Template page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/template/${TEMPLATE_ID}`);
  });

  test('shows template name in toolbar', async ({ page }) => {
    await expect(page.getByText('Template 1', { exact: false })).toBeVisible();
  });

  test('shows only Components inspector — no Copy or Theme tabs', async ({ page }) => {
    // Tab bar is hidden when only one tab is shown
    await expect(page.getByRole('tab', { name: 'Copy' })).not.toBeVisible();
    await expect(page.getByRole('tab', { name: 'Theme' })).not.toBeVisible();
    // The component tree is still present (no tab header needed)
    await expect(page.locator('[role="tabpanel"]')).toBeVisible({ timeout: 10_000 });
  });

  test('preview iframe loads', async ({ page }) => {
    const iframe = page.locator('#preview-iframe');
    await expect(iframe).toBeVisible({ timeout: 15_000 });
  });

  test('component tree populates after preview loads', async ({ page }) => {
    await expect(page.getByText('<Stack', { exact: false })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('<Button', { exact: false })).toBeVisible({ timeout: 5_000 });
  });

  test('inspector toggle button works', async ({ page }) => {
    // Inspector starts open — component tree visible
    await expect(page.locator('[role="tabpanel"]')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /toggle inspector/i }).click();
    await expect(page.locator('[role="tabpanel"]')).not.toBeVisible();

    await page.getByRole('button', { name: /toggle inspector/i }).click();
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  test('"Add to prototype" button opens dialog', async ({ page }) => {
    await page.getByRole('button', { name: /add to prototype/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Template 1', { exact: false })).toBeVisible();
  });

  test('"Add to prototype" dialog lists existing prototypes', async ({ page }) => {
    await page.getByRole('button', { name: /add to prototype/i }).click();
    await expect(page.getByRole('dialog').getByText('Sample prototype', { exact: false })).toBeVisible({ timeout: 10_000 });
  });

  test('back button navigates to dashboard', async ({ page }) => {
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL('/');
  });
});
