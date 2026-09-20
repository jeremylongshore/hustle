/**
 * POST /api/storage/upload-player-photo
 *
 * Phase 5 rewrite: writes to local disk under /data/uploads/{userId}/players/{playerId}/{uuid}.{ext}
 * and returns a relative /api/storage/serve/... URL. Quota math still hits
 * the workspaces query module's storageUsedMB delta helper.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateFile } from '@/lib/storage/upload-validation';
import {
  uploadPlayerPhotoLocal,
  deletePhotoLocal,
  extractLocalPath,
} from '@/lib/storage/local';
import { getPlayerAdmin, updatePlayerAdmin } from '@/lib/db/queries/players';
import {
  getWorkspaceByIdAdmin,
  updateWorkspaceStorageUsageAdmin,
} from '@/lib/db/queries/workspaces';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/storage/upload-player-photo');

export async function POST(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const playerId = formData.get('playerId') as string | null;

    if (!file || !playerId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, playerId' },
        { status: 400 }
      );
    }

    const player = await getPlayerAdmin(userId, playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    if (!player.workspaceId) {
      return NextResponse.json(
        { error: 'Player has no workspace assigned' },
        { status: 400 }
      );
    }
    const workspace = await getWorkspaceByIdAdmin(player.workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (!['active', 'trial'].includes(workspace.status)) {
      return NextResponse.json(
        {
          error: 'Workspace is not active',
          code: 'WORKSPACE_INACTIVE',
          status: workspace.status,
        },
        { status: 403 }
      );
    }

    const validation = validateFile(file, workspace.plan, workspace.usage.storageUsedMB);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 413 });
    }

    // Delete old photo if present, recovering its size for the net-delta calc.
    let oldPhotoSizeMB = 0;
    if (player.photoUrl) {
      const oldPath = extractLocalPath(player.photoUrl);
      if (oldPath) {
        try {
          oldPhotoSizeMB = await deletePhotoLocal(oldPath);
        } catch (error) {
          logger.warn('Failed to delete old player photo', {
            userId,
            playerId,
            oldPath,
            error,
          });
        }
      }
    }

    const uploadResult = await uploadPlayerPhotoLocal({ file, userId, playerId });

    await updatePlayerAdmin(userId, playerId, { photoUrl: uploadResult.url });

    const netStorageChange = uploadResult.size - oldPhotoSizeMB;
    await updateWorkspaceStorageUsageAdmin(workspace.id, netStorageChange);

    logger.info('Player photo uploaded', {
      userId,
      playerId,
      workspaceId: workspace.id,
      url: uploadResult.url,
      size: uploadResult.size,
    });

    return NextResponse.json({ url: uploadResult.url, size: uploadResult.size });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Upload player photo failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
