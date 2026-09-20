/**
 * POST /api/storage/upload-user-photo
 *
 * Phase 5 rewrite: writes to /data/uploads/{userId}/profile/{uuid}.{ext},
 * updates the user's photoUrl. Workspace storage quota is decremented for
 * the old photo and incremented for the new one.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateFile } from '@/lib/storage/upload-validation';
import {
  uploadUserPhotoLocal,
  deletePhotoLocal,
  extractLocalPath,
} from '@/lib/storage/local';
import { getUserProfileAdmin, updateUserProfileAdmin } from '@/lib/db/queries/users';
import {
  getWorkspaceByIdAdmin,
  updateWorkspaceStorageUsageAdmin,
} from '@/lib/db/queries/workspaces';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/storage/upload-user-photo');

export async function POST(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Missing required field: file' }, { status: 400 });
    }

    const user = await getUserProfileAdmin(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const workspace = user.defaultWorkspaceId
      ? await getWorkspaceByIdAdmin(user.defaultWorkspaceId)
      : null;

    if (workspace && !['active', 'trial'].includes(workspace.status)) {
      return NextResponse.json(
        { error: 'Workspace is not active', code: 'WORKSPACE_INACTIVE' },
        { status: 403 }
      );
    }

    const plan = workspace?.plan ?? 'free';
    const storageUsed = workspace?.usage?.storageUsedMB ?? 0;
    const validation = validateFile(file, plan, storageUsed);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 413 });
    }

    let oldPhotoSizeMB = 0;
    if (user.photoUrl) {
      const oldPath = extractLocalPath(user.photoUrl);
      if (oldPath) {
        try {
          oldPhotoSizeMB = await deletePhotoLocal(oldPath);
        } catch (error) {
          logger.warn('Failed to delete old user photo', { userId, error });
        }
      }
    }

    const uploadResult = await uploadUserPhotoLocal({ file, userId });

    await updateUserProfileAdmin(userId, { photoUrl: uploadResult.url });

    if (workspace) {
      const netStorageChange = uploadResult.size - oldPhotoSizeMB;
      await updateWorkspaceStorageUsageAdmin(workspace.id, netStorageChange);
    }

    logger.info('User photo uploaded', { userId, size: uploadResult.size });

    return NextResponse.json({ url: uploadResult.url, size: uploadResult.size });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Upload user photo failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
