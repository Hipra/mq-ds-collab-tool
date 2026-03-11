import type { APIRequestContext, Page } from '@playwright/test';

export const DEMO_PROTO_ID = 'demo-prototype';
export const TEMPLATE_ID = 'dialog-template';
export const TEST_PROTO_NAME = 'E2E Test Prototype';
export const TEST_PROTO_ID = 'e2e-test-prototype';

/** Creates a fresh test prototype via API. Deletes any existing one first. */
export async function createTestPrototype(request: APIRequestContext): Promise<string> {
  await request.delete(`/api/prototypes/${TEST_PROTO_ID}`);
  const res = await request.post('/api/prototypes', { data: { name: TEST_PROTO_NAME } });
  if (!res.ok()) throw new Error(`Failed to create test prototype: ${await res.text()}`);
  const body = await res.json() as { id: string };
  return body.id;
}

/** Deletes the test prototype via API. */
export async function deleteTestPrototype(request: APIRequestContext, id: string): Promise<void> {
  await request.delete(`/api/prototypes/${id}`);
}

/** Waits for the ReactFlow canvas renderer to be present and settled. */
export async function waitForFlowReady(page: Page): Promise<void> {
  await page.waitForSelector('.react-flow__renderer', { timeout: 15_000 });
  // Give xyflow time to initialize node positions
  await page.waitForTimeout(500);
}
