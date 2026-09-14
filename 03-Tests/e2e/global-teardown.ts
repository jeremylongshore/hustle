/** Remove the private E2E database after Playwright has stopped using it. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export default function globalTeardown(): void {
  const databaseDirectory = process.env.HUSTLE_E2E_DATABASE_DIR;
  if (!databaseDirectory) return;

  const resolved = path.resolve(databaseDirectory);
  if (
    path.dirname(resolved) !== path.resolve(os.tmpdir())
    || !path.basename(resolved).startsWith('hustle-e2e-db-')
  ) {
    throw new Error('Refusing to remove an E2E database directory outside the guarded OS temp path');
  }

  fs.rmSync(resolved, { recursive: true, force: true });
}
