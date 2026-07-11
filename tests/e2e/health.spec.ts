// File: tests/e2e/health.spec.ts
import { test, expect } from '@playwright/test';

test('GET /api/system/health returns ok + service identity', async ({ request }) => {
  const res = await request.get('/api/system/health');
  expect(res.ok()).toBeTruthy();

  const json = await res.json();
  expect(json).toMatchObject({
    ok: true,
    service: 'abraham-of-london',
  });
  expect(typeof json.timestamp).toBe('string');
  expect(typeof json.env).toBe('string');
});
