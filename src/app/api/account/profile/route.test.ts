/**
 * GET/PATCH /api/account/profile (bead hustle-4dc.10).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockSession } from '@/test-utils';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserProfileAdmin: vi.fn(),
  updateUserProfileAdmin: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/db/queries/users', () => ({
  getUserProfileAdmin: mocks.getUserProfileAdmin,
  updateUserProfileAdmin: mocks.updateUserProfileAdmin,
}));

import { GET, PATCH } from './route';

const USER = {
  id: 'user-123',
  email: 'parent@example.com',
  firstName: 'Dana',
  lastName: 'Reyes',
  phone: '+1 (555) 010-2030',
  emailVerified: new Date('2026-09-01'),
};

describe('GET /api/account/profile', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when signed out', async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await GET(createMockRequest({ method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it("returns the signed-in parent's own profile", async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getUserProfileAdmin.mockResolvedValue(USER);

    const res = await GET(createMockRequest({ method: 'GET' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profile).toEqual({
      firstName: 'Dana', lastName: 'Reyes', phone: '+1 (555) 010-2030',
      email: 'parent@example.com', emailVerified: true,
    });
    expect(mocks.getUserProfileAdmin).toHaveBeenCalledWith('user-123');
  });
});

describe('PATCH /api/account/profile', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 when signed out', async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await PATCH(createMockRequest({ method: 'PATCH', body: { firstName: 'A', lastName: 'B' } }));
    expect(res.status).toBe(401);
    expect(mocks.updateUserProfileAdmin).not.toHaveBeenCalled();
  });

  it('rejects an empty name and a bad phone without writing', async () => {
    mocks.auth.mockResolvedValue(createMockSession());

    const empty = await PATCH(createMockRequest({ method: 'PATCH', body: { firstName: '  ', lastName: 'Reyes' } }));
    expect(empty.status).toBe(400);

    const badPhone = await PATCH(
      createMockRequest({ method: 'PATCH', body: { firstName: 'Dana', lastName: 'Reyes', phone: 'call me <script>' } }),
    );
    expect(badPhone.status).toBe(400);
    expect(mocks.updateUserProfileAdmin).not.toHaveBeenCalled();
  });

  it('saves trimmed name and phone and never touches the email', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.updateUserProfileAdmin.mockResolvedValue({ ...USER, firstName: 'Danielle', phone: '' });

    const res = await PATCH(
      createMockRequest({
        method: 'PATCH',
        body: { firstName: '  Danielle ', lastName: ' Reyes ', phone: '', email: 'attacker@example.com' },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mocks.updateUserProfileAdmin).toHaveBeenCalledWith('user-123', {
      firstName: 'Danielle', lastName: 'Reyes', phone: '',
    });
    expect(body.profile.email).toBe('parent@example.com');
  });

  it('returns 500 with a generic message when the write fails', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.updateUserProfileAdmin.mockRejectedValue(new Error('disk on fire'));

    const res = await PATCH(createMockRequest({ method: 'PATCH', body: { firstName: 'Dana', lastName: 'Reyes' } }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain('disk on fire');
  });
});
