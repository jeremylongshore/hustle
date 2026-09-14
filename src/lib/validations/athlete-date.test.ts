import { afterEach, expect, it, vi } from 'vitest';
import { isPastOrTodayDate } from './athlete-date';
import { athleteSchema } from '@/components/athletes/athlete-form';

afterEach(() => vi.useRealTimers());

it('compares valid date-only values through UTC midnight and rejects impossible dates', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-13T00:00:00Z'));
  expect(isPastOrTodayDate('2026-09-13')).toBe(true);
  for (const date of ['2026-09-14', '2026-02-30', 'not-a-date', '2026-9-1', '']) {
    expect(isPastOrTodayDate(date)).toBe(false);
  }
  expect(isPastOrTodayDate('1924-01-01')).toBe(true);
});

it('the actual athlete form schema rejects a future birthday', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-13T23:59:59Z'));
  const input = { firstName: 'Fixture', lastName: 'Athlete', dateOfBirth: '2027-01-01', gender: 'male', position: 'GK' };
  expect(athleteSchema.safeParse(input).success).toBe(false);
  expect(athleteSchema.safeParse({ ...input, dateOfBirth: '2012-01-01' }).success).toBe(true);
});
