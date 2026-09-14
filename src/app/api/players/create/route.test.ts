import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const fixtures = vi.hoisted(() => ({ create: vi.fn(), profile: vi.fn(), increment: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'fixture-user' } })) }));
vi.mock('@/lib/db/queries/players', () => ({ createPlayerAdmin: fixtures.create }));
vi.mock('@/lib/db/queries/users', () => ({ getUserProfileAdmin: fixtures.profile }));
vi.mock('@/lib/db/queries/workspaces', () => ({
  getWorkspaceByIdAdmin: vi.fn(async () => ({ id: 'fixture-workspace', plan: 'starter', status: 'active', usage: { playerCount: 0 } })),
  incrementWorkspacePlayerCountAdmin: fixtures.increment,
}));
vi.mock('@/lib/workspaces/enforce', () => ({ assertWorkspaceActive: vi.fn() }));
import { POST } from './route';

beforeEach(() => {
  vi.clearAllMocks();
  fixtures.profile.mockResolvedValue({ defaultWorkspaceId: 'fixture-workspace' });
  fixtures.create.mockResolvedValue({ id: 'fixture-player' });
});
afterEach(() => vi.useRealTimers());
function request(birthday: string) {
  return new NextRequest('http://localhost/api/players/create', { method: 'POST', body: JSON.stringify({
    name: 'Fixture Athlete', birthday, primaryPosition: 'GK', teamClub: 'Fixture FC', gender: 'male', leagueCode: 'Club League',
  }) });
}

it.each(['2999-01-01', '2026-02-30', 'not-a-date'])('rejects invalid or future birthday %s before persistence', async (birthday) => {
  const response = await POST(request(birthday));
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ error: 'INVALID_BIRTHDAY' });
  expect(fixtures.profile).not.toHaveBeenCalled();
  expect(fixtures.create).not.toHaveBeenCalled();
});

it('accepts a valid date-only birthday and preserves its exact UTC date', async () => {
  const response = await POST(request('2012-01-01'));
  expect(response.status).toBe(200);
  expect(fixtures.create).toHaveBeenCalledWith('fixture-user', expect.objectContaining({ birthday: new Date('2012-01-01T00:00:00Z') }));
  expect(fixtures.increment).toHaveBeenCalledOnce();
});
