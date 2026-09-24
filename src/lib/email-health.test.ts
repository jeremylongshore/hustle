import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const probe = vi.hoisted(() => vi.fn());
vi.mock('./smtp', async (importOriginal) => ({
  ...await importOriginal<typeof import('./smtp')>(), verifyEmailTransport: probe,
}));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-13T20:00:00Z'));
  probe.mockReset().mockResolvedValue(undefined);
  for (const name of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM']) vi.stubEnv(name, 'fixture');
  vi.stubEnv('SMTP_PORT', '465');
  vi.stubEnv('SMTP_SECURE', 'true');
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

it('returns a timestamped no-store functional result through the public route', async () => {
  const { GET } = await import('../app/api/health/email/route');
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(await response.json()).toEqual({ status: 'pass', transport: 'smtp', check: 'tls-authentication',
    checkedAt: '2026-09-13T20:00:00.000Z', validUntil: '2026-09-13T20:01:00.000Z' });
});

it('coalesces concurrent requests and bounds successful verification to one per minute', async () => {
  const { emailHealth } = await import('./email-health');
  await Promise.all(Array.from({ length: 20 }, () => emailHealth()));
  expect(probe).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(59_999);
  await emailHealth();
  expect(probe).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  await emailHealth();
  expect(probe).toHaveBeenCalledTimes(2);
});

it('makes authentication failure visible without provider diagnostics and recovers after the cache interval', async () => {
  const { EmailDeliveryError } = await import('./smtp');
  probe.mockRejectedValueOnce(new EmailDeliveryError('authentication'));
  const { GET } = await import('../app/api/health/email/route');
  const response = await GET();
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ status: 'fail', category: 'authentication' });
  await GET();
  expect(probe).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(60_000);
  expect((await GET()).status).toBe(200);
});

it('fails a configuration change immediately without opening a connection', async () => {
  const { emailHealth } = await import('./email-health');
  await emailHealth();
  vi.stubEnv('SMTP_PASS', '');
  const health = await emailHealth();
  expect(health).toMatchObject({ status: 'fail', category: 'configuration', missingCount: 1 });
  expect(JSON.stringify(health)).not.toContain('SMTP_PASS');
  expect(probe).toHaveBeenCalledTimes(1);
});

it('redacts unexpected SDK failures from public output', async () => {
  probe.mockRejectedValue(new Error('private provider diagnostics'));
  const { emailHealth } = await import('./email-health');
  const result = await emailHealth();
  expect(result.category).toBe('transport');
  expect(JSON.stringify(result)).not.toContain('private');
});
