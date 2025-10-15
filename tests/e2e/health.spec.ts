// File: tests/e2e/health.spec.ts
import { test, expect } from '@playwright/test';

test('GET /api/health returns ok + no-store', async ({ request, baseURL }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();

  // headers
  const cc = res.headers()['cache-control'] || '';
  expect(cc.toLowerCase()).toContain('no-store');

  // body
  const json = await res.json();
  expect(json).toMatchObject({
    ok: true,
    service: 'abraham-of-london',
  });
  expect(typeof json.timestamp).toBe('string');
  expect(typeof json.node).toBe('string');
});
