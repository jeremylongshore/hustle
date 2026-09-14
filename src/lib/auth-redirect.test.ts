import { expect, it } from 'vitest';
import { safeLoginRedirect } from './auth-redirect';

it.each(['https://external.invalid', '//external.invalid', '/\\external.invalid', '/\n/external.invalid', 'javascript:alert(1)'])('refuses an external or executable callback: %j', (value) => {
  expect(safeLoginRedirect(value)).toBe('/dashboard');
});
it('preserves a normalized in-app path, query and fragment', () => {
  expect(safeLoginRedirect('/dashboard/athletes?season=2026#stats')).toBe('/dashboard/athletes?season=2026#stats');
});
