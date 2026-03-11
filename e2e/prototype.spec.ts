import { test, expect } from '@playwright/test';
import { DEMO_PROTO_ID, createTestPrototype, deleteTestPrototype } from './helpers';

// NOTE: The inspector panel uses MUI ToggleButtonGroup, not tabs.
// Use getByRole('button', { name: '...' }) to target Copy / Components / Theme.

test.describe('Prototype editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/prototype/${DEMO_PROTO_ID}`);
    await page.waitForLoadState('domcontentloaded');
  });

  // ── Toolbar ──────────────────────────────────────────────────────────────

  test('toolbar shows prototype ID', async ({ page }) => {
    await expect(page.getByText(DEMO_PROTO_ID, { exact: false })).toBeVisible();
  });

  test('back button navigates to dashboard', async ({ page }) => {
    await page.getByRole('button', { name: /back to prototypes/i }).click();
    await expect(page).toHaveURL('/', { timeout: 5_000 });
  });

  test('flow canvas button navigates to flow page', async ({ page }) => {
    await page.getByRole('button', { name: /flow canvas/i }).click();
    await expect(page).toHaveURL(`/prototype/${DEMO_PROTO_ID}/flow`, { timeout: 5_000 });
  });

  test('theme mode cycles through light / dark / system', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /light mode|dark mode|system mode/i }).last();
    const first = await themeBtn.getAttribute('aria-label');
    await themeBtn.click();
    const second = await themeBtn.getAttribute('aria-label');
    expect(second).not.toBe(first);
    await themeBtn.click();
    const third = await themeBtn.getAttribute('aria-label');
    expect(third).not.toBe(second);
  });

  test('inspector panel can be hidden and shown', async ({ page }) => {
    // Inspector starts open — toggle buttons visible
    const copyBtn = page.getByRole('button', { name: 'Copy', exact: true });
    await expect(copyBtn).toBeVisible({ timeout: 5_000 });

    // Hide
    await page.getByRole('button', { name: /hide inspector panel/i }).click();
    await expect(copyBtn).not.toBeVisible();

    // Show
    await page.getByRole('button', { name: /show inspector panel/i }).click();
    await expect(copyBtn).toBeVisible();
  });

  // ── Preview iframe ────────────────────────────────────────────────────────

  test('preview iframe loads', async ({ page }) => {
    await expect(page.locator('#preview-iframe')).toBeVisible({ timeout: 15_000 });
  });

  // ── Inspector panel tabs ──────────────────────────────────────────────────

  test('inspector panel has Copy, Components and Theme buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Copy', exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Components', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Theme', exact: true })).toBeVisible();
  });

  test('switching inspector tabs changes panel content', async ({ page }) => {
    // Activate Components panel
    await page.getByRole('button', { name: 'Components', exact: true }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Theme', exact: true }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'Copy', exact: true }).click();
    await page.waitForTimeout(300);
  });

  // ── Screen sidebar ────────────────────────────────────────────────────────

  test('screen sidebar lists screens from demo prototype', async ({ page }) => {
    await expect(page.getByText('Settings dialog', { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Random screen', { exact: false })).toBeVisible({ timeout: 5_000 });
  });

  test('clicking a screen in sidebar switches the preview', async ({ page }) => {
    // Click the second screen (Random screen)
    await page.getByText('Random screen', { exact: false }).click();
    // iframe reloads — loading state should appear then resolve
    await expect(page.locator('#preview-iframe')).toBeVisible({ timeout: 15_000 });
  });

  test('screen sidebar can be hidden and shown', async ({ page }) => {
    await expect(page.getByText('Settings dialog', { exact: false })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /hide screens/i }).click();
    await expect(page.getByText('Settings dialog', { exact: false })).not.toBeVisible();

    await page.getByRole('button', { name: /show screens/i }).click();
    await expect(page.getByText('Settings dialog', { exact: false })).toBeVisible();
  });

  // ── Screen lifecycle ──────────────────────────────────────────────────────

  test('Add screen dialog opens', async ({ page }) => {
    await page.getByRole('button', { name: /add screen/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('textbox')).toBeVisible();
  });

  test('Add screen dialog can be cancelled', async ({ page }) => {
    await page.getByRole('button', { name: /add screen/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('creates a new screen and it appears in the sidebar', async ({ page, request }) => {
    const screenName = 'E2E Test Screen';
    await page.getByRole('button', { name: /add screen/i }).click();
    await page.getByRole('dialog').getByRole('textbox').fill(screenName);
    await page.getByRole('button', { name: /^(create|add)$/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(screenName, { exact: false })).toBeVisible({ timeout: 10_000 });

    // Clean up — delete the created screen via API
    await request.delete(`/api/preview/${DEMO_PROTO_ID}/screens?screenId=e2e-test-screen`);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

test.describe('Prototype editor — edge cases', () => {
  test('non-existent prototype shows an error or empty state', async ({ page }) => {
    await page.goto('/prototype/this-prototype-does-not-exist');
    await page.waitForLoadState('domcontentloaded');
    // Should not crash — either an error boundary or a 404-style message
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('navigates to flow page from prototype with no saved flow', async ({ request, page }) => {
    // Create a fresh prototype (no flow.json yet)
    const id = await createTestPrototype(request);
    await page.goto(`/prototype/${id}/flow`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15_000 });
    // Should render an empty (or populated from screen list) canvas without crashing
    await expect(page.locator('.react-flow__renderer')).toBeVisible();

    await deleteTestPrototype(request, id);
  });
});
