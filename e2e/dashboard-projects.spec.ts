import { test, expect } from '@playwright/test';

const API_BASE = '/api/projects';
const TEST_PROJECT = {
  name: 'Test Project',
  description: 'E2E test project',
  assignee: 'Tester',
  prototypeIds: [],
};

test.describe('Dashboard Projects', () => {
  // Create test project via API before all tests (not via UI — avoids order dependency)
  test.beforeAll(async ({ request }) => {
    // Clean up any leftover test project first
    const res = await request.get(API_BASE);
    const projects = await res.json();
    for (const p of projects) {
      if (p.name === TEST_PROJECT.name) {
        await request.delete(`${API_BASE}/${p.id}`);
      }
    }
    // Create fresh test project
    await request.post(API_BASE, { data: TEST_PROJECT });
  });

  test.afterAll(async ({ request }) => {
    const res = await request.get(API_BASE);
    const projects = await res.json();
    for (const p of projects) {
      if (p.name === TEST_PROJECT.name) {
        await request.delete(`${API_BASE}/${p.id}`);
      }
    }
  });

  test('shows New Project button on dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /new project/i })).toBeVisible();
  });

  test('project card shows status badges', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator('[class*="MuiCard"]', { hasText: TEST_PROJECT.name });
    await expect(card).toBeVisible();
    await expect(card.getByText(/design.*in progress/i)).toBeVisible();
    await expect(card.getByText(/dev.*not started/i)).toBeVisible();
    await expect(card.getByText(/ux.*not started/i)).toBeVisible();
  });

  test('edit project dialog pre-fills values', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator('[class*="MuiCard"]', { hasText: TEST_PROJECT.name });
    await card.getByRole('button', { name: /edit/i }).first().click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/project name/i)).toHaveValue(TEST_PROJECT.name);
    await expect(page.getByLabel(/description/i)).toHaveValue(TEST_PROJECT.description);

    await page.getByRole('button', { name: /cancel/i }).click();
  });

  test('search filters projects', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.getByPlaceholder(/search/i).fill('nonexistent-xyz');
    await expect(page.getByText(TEST_PROJECT.name)).not.toBeVisible({ timeout: 3000 });

    await page.getByPlaceholder(/search/i).clear();
    await expect(page.getByText(TEST_PROJECT.name)).toBeVisible();
  });

  test('creates a new project via dialog', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: /new project/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/project name/i).fill('Dialog Created Project');
    await page.getByLabel(/description/i).fill('Created via UI');
    await page.getByLabel(/assignee/i).fill('UI Tester');

    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Project card should appear
    await expect(page.getByText('Dialog Created Project')).toBeVisible();

    // Clean up the UI-created project
    const res = await page.request.get(API_BASE);
    const projects = await res.json();
    const uiProject = projects.find((p: { name: string }) => p.name === 'Dialog Created Project');
    if (uiProject) await page.request.delete(`${API_BASE}/${uiProject.id}`);
  });

  test('API: GET /api/projects returns project list', async ({ request }) => {
    const res = await request.get(API_BASE);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
    const project = data.find((p: { name: string }) => p.name === TEST_PROJECT.name);
    expect(project).toBeTruthy();
    expect(project.designStatus).toBe('in_progress');
  });

  test('API: DELETE /api/projects/:id removes and re-creates project', async ({ request }) => {
    const res = await request.get(API_BASE);
    const projects = await res.json();
    const project = projects.find((p: { name: string }) => p.name === TEST_PROJECT.name);
    expect(project).toBeTruthy();

    const delRes = await request.delete(`${API_BASE}/${project.id}`);
    expect(delRes.ok()).toBeTruthy();

    const res2 = await request.get(API_BASE);
    const projects2 = await res2.json();
    expect(projects2.find((p: { name: string }) => p.name === TEST_PROJECT.name)).toBeFalsy();

    // Re-create so afterAll cleanup is consistent
    await request.post(API_BASE, { data: TEST_PROJECT });
  });
});
