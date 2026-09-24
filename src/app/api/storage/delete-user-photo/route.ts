/**
 * DELETE /api/storage/delete-user-photo
 *
 * Phase 5 rewrite: deletes user profile photo from local disk, clears
 * photoUrl in the user row, decrements workspace storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deletePhotoLocal, extractLocalPath } from '@/lib/storage/local';
import { getUserProfileAdmin, updateUserProfileAdmin } from '@/lib/db/queries/users';
import { updateWorkspaceStorageUsageAdmin } from '@/lib/db/queries/workspaces';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/storage/delete-user-photo');

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const user = await getUserProfileAdmin(userId);
    if (!user?.photoUrl) {
      return NextResponse.json({ error: 'No profile photo to delete' }, { status: 404 });
    }

    const storagePath = extractLocalPath(user.photoUrl);
    let sizeFreed = 0;
    if (storagePath) {
      sizeFreed = await deletePhotoLocal(storagePath);
    }

    await updateUserProfileAdmin(userId, { photoUrl: null });

    if (user.defaultWorkspaceId && sizeFreed > 0) {
      await updateWorkspaceStorageUsageAdmin(user.defaultWorkspaceId, -sizeFreed);
    }

    logger.info('User photo deleted', { userId, sizeFreed });

    return NextResponse.json({ success: true, sizeFreed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Delete user photo failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
