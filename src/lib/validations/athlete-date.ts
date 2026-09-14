/** Date-only inputs are compared as UTC calendar dates, never browser-local instants. */
export function isPastOrTodayDate(value: unknown, now = new Date()): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value &&
    value <= now.toISOString().slice(0, 10);
}
