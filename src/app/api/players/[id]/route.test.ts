/**
 * Tests for GET/PUT/DELETE /api/players/[id]
 *
 * Covers: auth (401), validation (400), not-found (404), happy path (200),
 * workspace enforcement (403), and error handling (500)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockSession, createMockWorkspace } from '@/test-utils';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getPlayerAdmin: vi.fn(),
  updatePlayerAdmin: vi.fn(),
  deletePlayerAdmin: vi.fn(),
  getUserProfileAdmin: vi.fn(),
  getWorkspaceByIdAdmin: vi.fn(),
  assertWorkspaceActive: vi.fn(),
  deletePlayerUploadsLocal: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/db/queries/players', () => ({
  getPlayerAdmin: mocks.getPlayerAdmin,
  updatePlayerAdmin: mocks.updatePlayerAdmin,
  deletePlayerAdmin: mocks.deletePlayerAdmin,
}));

vi.mock('@/lib/db/queries/users', () => ({
  getUserProfileAdmin: mocks.getUserProfileAdmin,
}));

vi.mock('@/lib/db/queries/workspaces', () => ({
  getWorkspaceByIdAdmin: mocks.getWorkspaceByIdAdmin,
}));

vi.mock('@/lib/storage/local', () => ({
  deletePlayerUploadsLocal: mocks.deletePlayerUploadsLocal,
}));

vi.mock('@/lib/workspaces/enforce', () => ({
  assertWorkspaceActive: mocks.assertWorkspaceActive,
}));

vi.mock('@/lib/workspaces/errors', async () => {
  const { WorkspaceAccessError } = await import('@/lib/workspaces/errors');
  return { WorkspaceAccessError };
});

// ---------------------------------------------------------------------------
// Import under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { GET, PUT, DELETE } from './route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PLAYER = {
  id: 'player-123',
  name: 'Alex Smith',
  birthday: new Date('2012-03-10'),
  primaryPosition: 'CM',
  teamClub: 'City FC',
  photoUrl: null,
};

const PARAMS = Promise.resolve({ id: 'player-123' });

const validPutBody = {
  name: 'Alex Smith Updated',
  birthday: '2012-03-10',
  gender: 'male',
  primaryPosition: 'ST',
  secondaryPositions: ['LW'],
  positionNote: 'Can also play wing',
  leagueCode: 'local_travel',
  teamClub: 'New FC',
};

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

describe('GET /api/players/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({ method: 'GET' });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when player not found', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(null);

    const request = createMockRequest({ method: 'GET' });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('returns player on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(PLAYER);

    const request = createMockRequest({ method: 'GET' });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.player).toMatchObject({ id: 'player-123', name: 'Alex Smith' });
    expect(mocks.getPlayerAdmin).toHaveBeenCalledWith('user-123', 'player-123');
  });

  it('returns 500 when getPlayerAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockRejectedValue(new Error('Firestore error'));

    const request = createMockRequest({ method: 'GET' });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch player');
  });
});

// ---------------------------------------------------------------------------
// PUT
// ---------------------------------------------------------------------------

describe('PUT /api/players/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({ method: 'PUT', body: validPutBody });
    const response = await PUT(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when required fields are missing', async () => {
    mocks.auth.mockResolvedValue(createMockSession());

    const request = createMockRequest({
      method: 'PUT',
      body: { name: 'Alex' }, // missing required profile fields
    });
    const response = await PUT(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('VALIDATION_FAILED');
  });

  it('returns 500 when user has no workspace', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getUserProfileAdmin.mockResolvedValue({ defaultWorkspaceId: null });

    const request = createMockRequest({ method: 'PUT', body: validPutBody });
    const response = await PUT(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('No workspace found');
  });

  it('returns 500 when workspace is not found', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getUserProfileAdmin.mockResolvedValue({ defaultWorkspaceId: 'ws-123' });
    mocks.getWorkspaceByIdAdmin.mockResolvedValue(null);

    const request = createMockRequest({ method: 'PUT', body: validPutBody });
    const response = await PUT(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Workspace not found');
  });

  it('returns 403 when workspace is inactive', async () => {
    const { WorkspaceAccessError } = await import('@/lib/workspaces/errors');
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getUserProfileAdmin.mockResolvedValue({ defaultWorkspaceId: 'ws-123' });
    mocks.getWorkspaceByIdAdmin.mockResolvedValue(createMockWorkspace({ status: 'canceled' }));
    mocks.assertWorkspaceActive.mockImplementation(() => {
      throw new WorkspaceAccessError('SUBSCRIPTION_CANCELED', 'canceled');
    });

    const request = createMockRequest({ method: 'PUT', body: validPutBody });
    const response = await PUT(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('SUBSCRIPTION_CANCELED');
  });

  it('returns 404 when player does not exist', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getUserProfileAdmin.mockResolvedValue({ defaultWorkspaceId: 'ws-123' });
    mocks.getWorkspaceByIdAdmin.mockResolvedValue(createMockWorkspace());
    mocks.assertWorkspaceActive.mockReturnValue(undefined);
    mocks.getPlayerAdmin.mockResolvedValue(null);

    const request = createMockRequest({ method: 'PUT', body: validPutBody });
    const response = await PUT(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('updates player and returns updated data on success', async () => {
    const updatedPlayer = { ...PLAYER, name: 'Alex Smith Updated', primaryPosition: 'ST' };
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getUserProfileAdmin.mockResolvedValue({ defaultWorkspaceId: 'ws-123' });
    mocks.getWorkspaceByIdAdmin.mockResolvedValue(createMockWorkspace());
    mocks.assertWorkspaceActive.mockReturnValue(undefined);
    mocks.getPlayerAdmin
      .mockResolvedValueOnce(PLAYER) // existence check
      .mockResolvedValueOnce(updatedPlayer); // updated player fetch
    mocks.updatePlayerAdmin.mockResolvedValue(undefined);

    const request = createMockRequest({ method: 'PUT', body: validPutBody });
    const response = await PUT(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.player.name).toBe('Alex Smith Updated');
    expect(mocks.updatePlayerAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({
        name: 'Alex Smith Updated',
        birthday: expect.any(Date),
        gender: 'male',
        primaryPosition: 'ST',
        position: 'ST',
        secondaryPositions: ['LW'],
        positionNote: 'Can also play wing',
        leagueCode: 'local_travel',
        leagueOtherName: null,
        teamClub: 'New FC',
      })
    );
  });

  it('returns 500 when updatePlayerAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getUserProfileAdmin.mockResolvedValue({ defaultWorkspaceId: 'ws-123' });
    mocks.getWorkspaceByIdAdmin.mockResolvedValue(createMockWorkspace());
    mocks.assertWorkspaceActive.mockReturnValue(undefined);
    mocks.getPlayerAdmin.mockResolvedValue(PLAYER);
    mocks.updatePlayerAdmin.mockRejectedValue(new Error('Update failed'));

    const request = createMockRequest({ method: 'PUT', body: validPutBody });
    const response = await PUT(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to update player');
  });
});

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

describe('DELETE /api/players/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({ method: 'DELETE' });
    const response = await DELETE(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('deletes the athlete even when the workspace is suspended (deletion right)', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getUserProfileAdmin.mockResolvedValue({ defaultWorkspaceId: 'ws-123' });
    mocks.getWorkspaceByIdAdmin.mockResolvedValue(createMockWorkspace({ status: 'suspended' }));
    mocks.assertWorkspaceActive.mockImplementation(() => {
      throw new Error('assertWorkspaceActive must not gate athlete deletion');
    });
    mocks.getPlayerAdmin.mockResolvedValue(PLAYER);
    mocks.deletePlayerAdmin.mockResolvedValue(undefined);
    mocks.deletePlayerUploadsLocal.mockResolvedValue(undefined);

    const request = createMockRequest({ method: 'DELETE' });
    const response = await DELETE(request, { params: PARAMS });

    expect(response.status).toBe(200);
    expect(mocks.assertWorkspaceActive).not.toHaveBeenCalled();
    expect(mocks.deletePlayerAdmin).toHaveBeenCalledWith('user-123', 'player-123');
  });

  it('returns 404 when player does not exist', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getUserProfileAdmin.mockResolvedValue({ defaultWorkspaceId: 'ws-123' });
    mocks.getWorkspaceByIdAdmin.mockResolvedValue(createMockWorkspace());
    mocks.assertWorkspaceActive.mockReturnValue(undefined);
    mocks.getPlayerAdmin.mockResolvedValue(null);

    const request = createMockRequest({ method: 'DELETE' });
    const response = await DELETE(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('deletes player and returns success message', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getUserProfileAdmin.mockResolvedValue({ defaultWorkspaceId: 'ws-123' });
    mocks.getWorkspaceByIdAdmin.mockResolvedValue(createMockWorkspace());
    mocks.assertWorkspaceActive.mockReturnValue(undefined);
    mocks.getPlayerAdmin.mockResolvedValue(PLAYER);
    mocks.deletePlayerAdmin.mockResolvedValue(undefined);

    const request = createMockRequest({ method: 'DELETE' });
    const response = await DELETE(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Alex Smith');
    expect(mocks.deletePlayerAdmin).toHaveBeenCalledWith('user-123', 'player-123');
    expect(mocks.deletePlayerUploadsLocal).toHaveBeenCalledWith('user-123', 'player-123');
  });

  it('returns 500 when deletePlayerAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getUserProfileAdmin.mockResolvedValue({ defaultWorkspaceId: 'ws-123' });
    mocks.getWorkspaceByIdAdmin.mockResolvedValue(createMockWorkspace());
    mocks.assertWorkspaceActive.mockReturnValue(undefined);
    mocks.getPlayerAdmin.mockResolvedValue(PLAYER);
    mocks.deletePlayerAdmin.mockRejectedValue(new Error('Delete failed'));

    const request = createMockRequest({ method: 'DELETE' });
    const response = await DELETE(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to delete player');
  });
});
