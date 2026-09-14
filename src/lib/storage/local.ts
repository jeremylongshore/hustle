/**
 * Local filesystem storage layer.
 *
 * Replaces src/lib/firebase/admin-storage.ts. Files land under
 * /data/uploads/{userId}/... (configurable via STORAGE_ROOT for tests).
 * URLs returned are RELATIVE — e.g. /api/storage/serve/{userId}/players/...
 * — and resolved through the auth-gated serve route, NOT exposed directly.
 *
 * Quota math + storage usage tracking stays in the workspace queries layer;
 * this module only does fs reads/writes/deletes + URL minting.
 */

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface LocalUploadResult {
  /** Relative URL the client can fetch back: /api/storage/serve/{userId}/... */
  url: string;
  /** Disk-relative path under STORAGE_ROOT: {userId}/players/.../file.jpg */
  path: string;
  /** File size in MB (matches admin-storage's contract) */
  size: number;
}

export function getStorageRoot(): string {
  return process.env.STORAGE_ROOT || "/data/uploads";
}

function relativeUrlFor(relativePath: string): string {
  // Encode each segment individually so slashes survive.
  const encoded = relativePath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `/api/storage/serve/${encoded}`;
}

function deriveExtension(filename: string, contentType: string): string {
  const ext = filename.split(".").pop();
  if (ext && /^[a-zA-Z0-9]{1,5}$/.test(ext)) return ext.toLowerCase();
  if (contentType === "image/jpeg" || contentType === "image/jpg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "bin";
}

async function writeBuffer(
  relativePath: string,
  buffer: Buffer
): Promise<void> {
  const absolute = path.join(/*turbopackIgnore: true*/ getStorageRoot(), relativePath);
  await fs.mkdir(/*turbopackIgnore: true*/ path.dirname(absolute), { recursive: true });
  await fs.writeFile(/*turbopackIgnore: true*/ absolute, buffer, { mode: 0o600 });
}

export async function uploadPlayerPhotoLocal(params: {
  file: File;
  userId: string;
  playerId: string;
}): Promise<LocalUploadResult> {
  const { file, userId, playerId } = params;
  const ext = deriveExtension(file.name, file.type);
  const filename = `${randomUUID()}.${ext}`;
  const relPath = path.posix.join(userId, "players", playerId, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeBuffer(relPath, buffer);

  return {
    url: relativeUrlFor(relPath),
    path: relPath,
    size: file.size / (1024 * 1024),
  };
}

export async function uploadUserPhotoLocal(params: {
  file: File;
  userId: string;
}): Promise<LocalUploadResult> {
  const { file, userId } = params;
  const ext = deriveExtension(file.name, file.type);
  const filename = `${randomUUID()}.${ext}`;
  const relPath = path.posix.join(userId, "profile", filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeBuffer(relPath, buffer);

  return {
    url: relativeUrlFor(relPath),
    path: relPath,
    size: file.size / (1024 * 1024),
  };
}

/**
 * Delete a previously-uploaded file. Returns the size freed in MB (matches
 * the admin-storage contract so quota math doesn't need per-call edits).
 * If the file is already gone, returns 0 without raising.
 */
export async function deletePhotoLocal(relativePath: string): Promise<number> {
  const absolute = path.join(/*turbopackIgnore: true*/ getStorageRoot(), relativePath);
  try {
    const stat = await fs.stat(/*turbopackIgnore: true*/ absolute);
    await fs.unlink(/*turbopackIgnore: true*/ absolute);
    return stat.size / (1024 * 1024);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return 0;
    throw err;
  }
}

/**
 * Translate a URL stored on a `photoUrl` field back to a disk-relative path.
 * Accepts both the new `/api/storage/serve/{userId}/...` URLs and any path
 * that already looks like a `{userId}/...` storage-relative path.
 *
 * Returns null for URLs we don't recognise (e.g. legacy firebasestorage
 * download URLs that linger in the DB until a manual sweep). Callers should
 * treat null as "old/foreign URL — skip local delete".
 */
export function extractLocalPath(url: string): string | null {
  if (!url) return null;
  const servePrefix = "/api/storage/serve/";
  if (url.startsWith(servePrefix)) {
    return decodeURIComponent(url.slice(servePrefix.length));
  }
  // Legacy Firebase Storage URL — out of scope for the local FS layer.
  if (url.startsWith("https://firebasestorage.")) return null;
  // Already path-shaped
  if (!url.includes("://") && !url.startsWith("/")) return url;
  return null;
}

/**
 * Open a file for the serve route. Returns the absolute path + size and lets
 * the route stream it. Errors out if the requested path tries to escape
 * STORAGE_ROOT via .. or absolute prefixes.
 */
export async function resolveServePath(relativePath: string): Promise<{
  absolute: string;
  size: number;
} | null> {
  if (!relativePath || relativePath.includes("..")) return null;
  const root = getStorageRoot();
  const absolute = path.resolve(/*turbopackIgnore: true*/ root, relativePath);
  const resolvedRoot = path.resolve(/*turbopackIgnore: true*/ root);
  if (!absolute.startsWith(resolvedRoot + path.sep) && absolute !== resolvedRoot) {
    return null;
  }
  try {
    const stat = await fs.stat(/*turbopackIgnore: true*/ absolute);
    if (!stat.isFile()) return null;
    return { absolute, size: stat.size };
  } catch {
    return null;
  }
}
