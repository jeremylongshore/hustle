// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import { proxy } from './proxy';

const secret = 'isolated-proxy-test-secret-at-least-32-bytes';
afterEach(() => vi.unstubAllEnvs());

async function requestWithSession(https = false, maxAge = 3600, chunked = false) {
  vi.stubEnv('AUTH_SECRET', secret);
  const name = `${https ? '__Secure-' : ''}authjs.session-token`;
  const token = await encode({ secret, salt: name, token: { sub: 'fixture-user', id: 'fixture-user' }, maxAge });
  const cookie = chunked
    ? `${name}.0=${token.slice(0, 100)}; ${name}.1=${token.slice(100)}`
    : `${name}=${token}`;
  return new NextRequest(`${https ? 'https' : 'http'}://localhost/dashboard`, { headers: { cookie } });
}

describe('Auth.js request guard regression', () => {
  it.each([false, true])('accepts a cryptographically valid session (secure=%s)', async (https) => {
    expect((await proxy(await requestWithSession(https))).headers.get('x-middleware-next')).toBe('1');
  });
  it('reassembles valid chunked session cookies', async () => {
    expect((await proxy(await requestWithSession(true, 3600, true))).headers.get('x-middleware-next')).toBe('1');
  });
  it('rejects expired sessions', async () => {
    expect((await proxy(await requestWithSession(false, -120))).status).toBe(307);
  });
  it.each(['__session=forged', 'authjs.session-token=forged', ''])('rejects unauthenticated cookies and preserves the return path: %s', async (cookie) => {
    vi.stubEnv('AUTH_SECRET', secret);
    const response = await proxy(new NextRequest('http://localhost/dashboard/games?season=2026', { headers: { cookie } }));
    expect(response.status).toBe(307);
    const target = new URL(response.headers.get('location')!);
    expect(target.pathname).toBe('/login');
    expect(target.searchParams.get('callbackUrl')).toBe('/dashboard/games?season=2026');
  });
  it.each(['/login', '/register', '/api/auth/session', '/api/healthz', '/api/internal/example'])('preserves public or independently authorized route %s', async (pathname) => {
    vi.stubEnv('AUTH_SECRET', '');
    expect((await proxy(new NextRequest(`http://localhost${pathname}`))).headers.get('x-middleware-next')).toBe('1');
  });
  it('fails closed when authentication is not configured', async () => {
    vi.stubEnv('AUTH_SECRET', '');
    vi.stubEnv('NEXTAUTH_SECRET', '');
    expect((await proxy(new NextRequest('http://localhost/dashboard'))).status).toBe(503);
  });
});
