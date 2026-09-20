/**
 * DELETE /api/storage/delete-player-photo
 *
 * Phase 5 rewrite: deletes from local disk, decrements workspace storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deletePhotoLocal, extractLocalPath } from '@/lib/storage/local';
import { getPlayerAdmin, updatePlayerAdmin } from '@/lib/db/queries/players';
import { updateWorkspaceStorageUsageAdmin } from '@/lib/db/queries/workspaces';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/storage/delete-player-photo');

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json({ error: 'Missing required field: playerId' }, { status: 400 });
    }

    const player = await getPlayerAdmin(userId, playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    if (!player.photoUrl) {
      return NextResponse.json({ error: 'Player has no photo' }, { status: 404 });
    }

    const storagePath = extractLocalPath(player.photoUrl);
    if (!storagePath) {
      // Legacy/foreign URL (e.g. an old firebasestorage download URL still in
      // the DB) — clear the field but skip the local delete.
      await updatePlayerAdmin(userId, playerId, { photoUrl: null });
      return NextResponse.json({ success: true, sizeFreed: 0 });
    }

    const sizeFreed = await deletePhotoLocal(storagePath);

    await updatePlayerAdmin(userId, playerId, { photoUrl: null });

    if (player.workspaceId) {
      await updateWorkspaceStorageUsageAdmin(player.workspaceId, -sizeFreed);
    }

    logger.info('Player photo deleted', {
      userId,
      playerId,
      workspaceId: player.workspaceId,
      storagePath,
      sizeFreed,
    });

    return NextResponse.json({ success: true, sizeFreed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Delete player photo failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
