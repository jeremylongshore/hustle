/**
 * Storage upload validation helpers.
 *
 * Phase 4.5 migration: relocated from src/lib/firebase/storage-utils.ts.
 * No runtime dependency on firebase — this is pure validation logic for the
 * local-FS upload routes plus the React client components.
 */

import type { WorkspacePlan } from "@/types/domain";

/**
 * Storage limits by plan tier.
 */
export const STORAGE_LIMITS: Record<
  WorkspacePlan,
  { maxFileSize: number; totalStorage: number } // both in MB
> = {
  free: { maxFileSize: 2, totalStorage: 50 },
  starter: { maxFileSize: 5, totalStorage: 500 },
  plus: { maxFileSize: 10, totalStorage: 2000 },
  pro: { maxFileSize: 20, totalStorage: 10000 },
};

/**
 * Allowed image types for player + user photos.
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a File against plan limits.
 */
export function validateFile(
  file: File,
  plan: WorkspacePlan,
  currentStorageUsedMB: number
): ValidationResult {
  const limits = STORAGE_LIMITS[plan];

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > limits.maxFileSize) {
    return {
      valid: false,
      error: `File too large. Maximum size for ${plan} plan: ${limits.maxFileSize} MB`,
    };
  }

  const newTotalStorage = currentStorageUsedMB + fileSizeMB;
  if (newTotalStorage > limits.totalStorage) {
    const remainingMB = limits.totalStorage - currentStorageUsedMB;
    return {
      valid: false,
      error: `Storage quota exceeded. ${remainingMB.toFixed(2)} MB remaining of ${limits.totalStorage} MB total`,
    };
  }

  return { valid: true };
}

export function getRemainingStorage(plan: WorkspacePlan, currentStorageUsedMB: number): number {
  const limits = STORAGE_LIMITS[plan];
  return Math.max(0, limits.totalStorage - currentStorageUsedMB);
}

export function getStorageUsagePercentage(
  plan: WorkspacePlan,
  currentStorageUsedMB: number
): number {
  const limits = STORAGE_LIMITS[plan];
  return Math.min(100, (currentStorageUsedMB / limits.totalStorage) * 100);
}
