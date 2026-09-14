import { describe, expect, it } from 'vitest';
import { resolveAppOrigin } from './app-origin';

describe('resolveAppOrigin', () => {
  it('uses the explicit application origin first', () => {
    expect(resolveAppOrigin({
      APP_ORIGIN: 'https://app.example.test',
      NEXTAUTH_URL: 'https://auth.example.test',
      VERCEL_URL: 'preview.example.test',
    })).toBe('https://app.example.test');
  });

  it('preserves NEXTAUTH_URL when VERCEL_URL is absent', () => {
    expect(resolveAppOrigin({
      APP_ORIGIN: undefined,
      NEXTAUTH_URL: 'https://hustlestats.io',
      VERCEL_URL: undefined,
    })).toBe('https://hustlestats.io');
  });

  it('normalizes the Vercel host when it is the only configured origin', () => {
    expect(resolveAppOrigin({
      APP_ORIGIN: undefined,
      NEXTAUTH_URL: undefined,
      VERCEL_URL: 'preview.example.test',
    })).toBe('https://preview.example.test');
  });

  it('uses localhost only when no origin is configured', () => {
    expect(resolveAppOrigin({
      APP_ORIGIN: undefined,
      NEXTAUTH_URL: undefined,
      VERCEL_URL: undefined,
    })).toBe('http://localhost:3000');
  });
});
