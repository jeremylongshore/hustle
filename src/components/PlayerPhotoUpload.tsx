/**
 * Player Photo Upload Component
 *
 * Phase 6 Task 5: Storage & Uploads
 *
 * Reusable component for uploading and managing player profile photos.
 * Shows preview, file size limits, and handles upload/delete operations.
 */

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { usePlayerPhotoUpload } from '@/hooks/usePlayerPhotoUpload';
import { STORAGE_LIMITS, ALLOWED_IMAGE_TYPES } from '@/lib/storage/upload-validation';
import type { WorkspacePlan } from '@/types/domain';

interface PlayerPhotoUploadProps {
  playerId: string;
  currentPhotoUrl?: string | null;
  plan: WorkspacePlan;
  currentStorageUsedMB: number;
  onUploadComplete?: (url: string) => void;
  onDeleteComplete?: () => void;
}

export function PlayerPhotoUpload({
  playerId,
  currentPhotoUrl,
  plan,
  currentStorageUsedMB,
  onUploadComplete,
  onDeleteComplete,
}: PlayerPhotoUploadProps) {
  const { uploadPhoto, deletePhoto, uploading, deleting, error } = usePlayerPhotoUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limits = STORAGE_LIMITS[plan];
  const remainingStorageMB = limits.totalStorage - currentStorageUsedMB;

  /**
   * Handle file selection
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > limits.maxFileSize) {
      alert(`File too large. Maximum size for ${plan} plan: ${limits.maxFileSize} MB`);
      return;
    }

    // Validate storage quota
    if (fileSizeMB > remainingStorageMB) {
      alert(
        `Not enough storage. ${remainingStorageMB.toFixed(2)} MB remaining of ${limits.totalStorage} MB total`
      );
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      const result = await uploadPhoto(file, playerId);
      setPreviewUrl(result.url);
      onUploadComplete?.(result.url);
    } catch (err) {
      // Error is handled by the hook
      setPreviewUrl(currentPhotoUrl || null);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle photo deletion
   */
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await deletePhoto(playerId);
      setPreviewUrl(null);
      onDeleteComplete?.();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  /**
   * Trigger file input click
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Photo Preview */}
      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Player photo"
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Upload/Delete Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading || deleting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : previewUrl ? 'Change Photo' : 'Upload Photo'}
        </button>

        {previewUrl && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading || deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting...' : 'Delete Photo'}
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Storage Info */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          <strong>Max file size:</strong> {limits.maxFileSize} MB
        </p>
        <p>
          <strong>Storage remaining:</strong> {remainingStorageMB.toFixed(2)} MB of{' '}
          {limits.totalStorage} MB
        </p>
        <p className="text-xs text-gray-500">
          Allowed formats: JPEG, JPG, PNG, WebP
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
