import { test, expect } from '@playwright/test';

const PROTOTYPE_ID = 'sample-prototype';

test.describe('Prototype page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/prototype/${PROTOTYPE_ID}`);
  });

  test('shows all three inspector tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Components' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Copy' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Theme' })).toBeVisible();
  });

  test('preview iframe loads', async ({ page }) => {
    const iframe = page.locator('#preview-iframe');
    await expect(iframe).toBeVisible({ timeout: 15_000 });
  });

  test('component tree populates after preview loads', async ({ page }) => {
    // The tree shows MUI component names from sample-prototype/index.jsx
    // Expected components: Box, Stack, Button, IconButton
    await expect(page.getByText('<Stack', { exact: false })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('<Button', { exact: false })).toBeVisible({ timeout: 5_000 });
  });

  test('clicking a component in the tree opens prop inspector', async ({ page }) => {
    await page.getByText('<Button', { exact: false }).first().click();
    // Prop inspector should appear below the tree (divider + props panel)
    await expect(page.getByText('variant', { exact: false })).toBeVisible({ timeout: 5_000 });
  });

  test('inspector panel can be toggled', async ({ page }) => {
    // Wait for panel to be visible first
    await expect(page.getByRole('tab', { name: 'Components' })).toBeVisible();

    // Click the ViewSidebar toggle button (aria-label changes with state)
    await page.getByRole('button', { name: /inspector panel/i }).click();
    await expect(page.getByRole('tab', { name: 'Components' })).not.toBeVisible();

    // Toggle back
    await page.getByRole('button', { name: /inspector panel/i }).click();
    await expect(page.getByRole('tab', { name: 'Components' })).toBeVisible();
  });

  test('theme mode cycles on button click', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /light mode|dark mode|system mode/i }).last();
    const initialLabel = await themeBtn.getAttribute('aria-label');
    await themeBtn.click();
    const newLabel = await themeBtn.getAttribute('aria-label');
    expect(newLabel).not.toBe(initialLabel);
  });
});
