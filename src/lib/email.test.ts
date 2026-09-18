/**
 * Email Service Tests
 *
 * Tests for sendEmail() in src/lib/email.ts.
 * Verifies configuration guards, SMTP integration, and error handling.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  emailsSend: vi.fn(),
}));

vi.mock('smtp-mailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mocks.emailsSend, close: vi.fn() })),
  },
}));

beforeEach(() => {
  vi.stubEnv('SMTP_HOST', 'smtp.example.invalid');
  vi.stubEnv('SMTP_USER', 'sender@example.invalid');
  vi.stubEnv('SMTP_PORT', '465');
  vi.stubEnv('SMTP_SECURE', 'true');
});
afterEach(() => vi.unstubAllEnvs());

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { sendEmail } from './email';
import type { EmailOptions } from './email';

// ---------------------------------------------------------------------------
// Helpers for environment variable management
// ---------------------------------------------------------------------------

function setEnv(vars: Record<string, string | undefined>) {
  const originals: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    originals[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return () => {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const validOptions: EmailOptions = {
  to: 'recipient@example.com',
  subject: 'Test Subject',
  html: '<p>Hello <strong>world</strong></p>',
  text: 'Hello world',
};

// ---------------------------------------------------------------------------
// Missing environment variables — early-exit paths
// ---------------------------------------------------------------------------

describe('sendEmail() — configuration guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns failure when SMTP_PASS is not set', async () => {
    const restore = setEnv({ SMTP_PASS: undefined, EMAIL_FROM: 'noreply@example.com' });

    const result = await sendEmail(validOptions);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/configuration/i);

    restore();
  });

  it('returns failure when EMAIL_FROM is not set', async () => {
    const restore = setEnv({ SMTP_PASS: 'fixture-password', EMAIL_FROM: undefined });

    const result = await sendEmail(validOptions);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/configuration/i);

    restore();
  });

  it('does not call SMTP when SMTP_PASS is missing', async () => {
    const restore = setEnv({ SMTP_PASS: undefined, EMAIL_FROM: 'noreply@example.com' });

    await sendEmail(validOptions);

    expect(mocks.emailsSend).not.toHaveBeenCalled();

    restore();
  });

  it('does not call SMTP when EMAIL_FROM is missing', async () => {
    const restore = setEnv({ SMTP_PASS: 'fixture-password', EMAIL_FROM: undefined });

    await sendEmail(validOptions);

    expect(mocks.emailsSend).not.toHaveBeenCalled();

    restore();
  });
});

// ---------------------------------------------------------------------------
// Successful send
// ---------------------------------------------------------------------------

describe('sendEmail() — successful delivery', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv({ SMTP_PASS: 'fixture-password', EMAIL_FROM: 'noreply@hustlestats.io' });
    mocks.emailsSend.mockResolvedValue({ accepted: ['recipient@example.com'], rejected: [], messageId: 'email-id-123' });
  });

  afterEach(() => {
    restore();
  });

  it('returns success with data when SMTP accepts the email', async () => {
    const result = await sendEmail(validOptions);

    expect(result.success).toBe(true);
    expect(result).toEqual({ success: true, data: { id: 'email-id-123' } });
  });

  it('passes the correct payload to SMTP sendMail()', async () => {
    await sendEmail(validOptions);

    expect(mocks.emailsSend).toHaveBeenCalledOnce();
    const callArg = mocks.emailsSend.mock.calls[0][0];
    expect(callArg.from).toBe('noreply@hustlestats.io');
    expect(callArg.to).toBe('recipient@example.com');
    expect(callArg.subject).toBe('Test Subject');
    expect(callArg.html).toBe('<p>Hello <strong>world</strong></p>');
    expect(callArg.text).toBe('Hello world');
  });

  it('strips HTML tags to generate plain text when text is not provided', async () => {
    await sendEmail({
      to: 'x@example.com',
      subject: 'No text',
      html: '<p>Hello <strong>world</strong></p>',
    });

    const callArg = mocks.emailsSend.mock.calls[0][0];
    expect(callArg.text).toBe('Hello world');
  });

  it('uses provided text over the HTML-stripped fallback', async () => {
    await sendEmail({
      ...validOptions,
      text: 'Explicit plain text',
    });

    const callArg = mocks.emailsSend.mock.calls[0][0];
    expect(callArg.text).toBe('Explicit plain text');
  });
});

// ---------------------------------------------------------------------------
// SMTP refuses a recipient
// ---------------------------------------------------------------------------

describe('sendEmail() — SMTP recipient rejection', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv({ SMTP_PASS: 'fixture-password', EMAIL_FROM: 'noreply@hustlestats.io' });
  });

  afterEach(() => {
    restore();
  });

  it('returns failure when SMTP rejects the recipient', async () => {
    mocks.emailsSend.mockResolvedValue({
      accepted: [],
      rejected: [validOptions.to],
      messageId: 'fixture-id',
    });

    const result = await sendEmail(validOptions);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email delivery failed (rejected)');
  });
});

// ---------------------------------------------------------------------------
// SMTP throws an exception
// ---------------------------------------------------------------------------

describe('sendEmail() — thrown exceptions', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv({ SMTP_PASS: 'fixture-password', EMAIL_FROM: 'noreply@hustlestats.io' });
  });

  afterEach(() => {
    restore();
  });

  it('returns failure when SMTP throws an Error instance', async () => {
    mocks.emailsSend.mockRejectedValue(new Error('network failure'));

    const result = await sendEmail(validOptions);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email delivery failed (transport)');
  });

  it('sanitizes a non-Error failure without echoing its content', async () => {
    mocks.emailsSend.mockRejectedValue('some string error');

    const result = await sendEmail(validOptions);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email delivery failed (transport)');
  });

  it('does not throw — always resolves', async () => {
    mocks.emailsSend.mockRejectedValue(new Error('fatal'));

    await expect(sendEmail(validOptions)).resolves.toBeDefined();
  });
});
