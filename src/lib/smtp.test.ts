import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ create: vi.fn(), send: vi.fn(), verify: vi.fn(), close: vi.fn() }));
vi.mock('smtp-mailer', () => ({ default: { createTransport: mock.create } }));

import { emailConfiguration, sendTransactionalEmail, verifyEmailTransport } from './smtp';
import { sendPasswordResetEmail, sendVerificationEmail } from './resend';

const message = { to: 'recipient@example.invalid', subject: 'Fixture', html: '<p>Fixture body</p>' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('SMTP_HOST', 'smtp.example.invalid');
  vi.stubEnv('SMTP_USER', 'sender@example.invalid');
  vi.stubEnv('SMTP_PASS', 'fixture-password');
  vi.stubEnv('EMAIL_FROM', 'Hustle <sender@example.invalid>');
  vi.stubEnv('SMTP_PORT', '465');
  vi.stubEnv('SMTP_SECURE', undefined);
  mock.create.mockReturnValue({ sendMail: mock.send, verify: mock.verify, close: mock.close });
  mock.send.mockResolvedValue({ accepted: [message.to], rejected: [], messageId: 'fixture-message-id' });
  mock.verify.mockResolvedValue(true);
});

afterEach(() => vi.unstubAllEnvs());

describe('SMTP configuration and transport', () => {
  it.each(['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'])('refuses missing %s before any connection', async (key) => {
    vi.stubEnv(key, '');
    expect(emailConfiguration()).toMatchObject({ configured: false, missing: [key] });
    await expect(sendTransactionalEmail(message)).rejects.toThrow('(configuration)');
    expect(mock.create).not.toHaveBeenCalled();
  });

  it.each(['0', '65536', 'bad', '2.5'])('rejects invalid port %s', async (port) => {
    vi.stubEnv('SMTP_PORT', port);
    await expect(sendTransactionalEmail(message)).rejects.toThrow('(configuration)');
  });

  it('refuses ambiguous TLS configuration', () => {
    vi.stubEnv('SMTP_SECURE', 'sometimes');
    expect(emailConfiguration().configured).toBe(false);
  });

  it('requires authenticated TLS with bounded timeouts and no file or URL content access', async () => {
    await sendTransactionalEmail(message);
    expect(mock.create).toHaveBeenCalledWith(expect.objectContaining({
      port: 465, secure: true,
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
      auth: { user: 'sender@example.invalid', pass: 'fixture-password' },
      connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
      disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false,
    }));
    expect(mock.close).toHaveBeenCalledOnce();
  });

  it('requires STARTTLS on the submission port', async () => {
    vi.stubEnv('SMTP_PORT', '587');
    await sendTransactionalEmail(message);
    expect(mock.create).toHaveBeenCalledWith(expect.objectContaining({ secure: false, requireTLS: true }));
  });

  it('returns the existing message identifier shape only after acceptance', async () => {
    await expect(sendTransactionalEmail(message)).resolves.toEqual({ id: 'fixture-message-id' });
    expect(mock.send).toHaveBeenCalledWith(expect.objectContaining({
      from: 'Hustle <sender@example.invalid>', to: message.to, text: 'Fixture body',
    }));
  });

  it.each([
    { accepted: [], rejected: [message.to], messageId: 'fixture-id' },
    { accepted: [message.to], rejected: [message.to], messageId: 'fixture-id' },
    { accepted: [message.to], rejected: [] },
  ])('refuses incomplete or rejected SMTP acceptance', async (result) => {
    mock.send.mockResolvedValue(result);
    await expect(sendTransactionalEmail(message)).rejects.toThrow('(rejected)');
  });

  it.each([['EAUTH', 'authentication'], ['ETIMEDOUT', 'timeout'], ['EENVELOPE', 'rejected'], ['unknown', 'transport']])(
    'sanitizes %s without retrying an ambiguous submission', async (code, category) => {
      mock.send.mockRejectedValue(Object.assign(new Error('private server transcript'), { code }));
      await expect(sendTransactionalEmail(message)).rejects.toThrow(`Email delivery failed (${category})`);
      expect(mock.send).toHaveBeenCalledOnce();
      expect(mock.close).toHaveBeenCalledOnce();
    });

  it('sanitizes transport-construction failures', async () => {
    mock.create.mockImplementation(() => { throw new Error('private credential detail'); });
    await expect(sendTransactionalEmail(message)).rejects.toThrow('Email delivery failed (transport)');
  });

  it('verifies authentication without submitting a message', async () => {
    await verifyEmailTransport();
    expect(mock.verify).toHaveBeenCalledOnce();
    expect(mock.send).not.toHaveBeenCalled();
    expect(mock.close).toHaveBeenCalledOnce();
  });

  it('caps a stalled verification at 20 seconds and closes its transport', async () => {
    vi.useFakeTimers();
    try {
      mock.verify.mockReturnValue(new Promise(() => {}));
      const pending = expect(verifyEmailTransport()).rejects.toThrow('(timeout)');
      await vi.advanceTimersByTimeAsync(20_000);
      await pending;
      expect(mock.close).toHaveBeenCalledOnce();
      expect(mock.send).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports authentication failure during a no-send probe', async () => {
    mock.verify.mockRejectedValue({ code: 'EAUTH', message: 'private detail' });
    await expect(verifyEmailTransport()).rejects.toThrow('(authentication)');
    expect(mock.send).not.toHaveBeenCalled();
  });
});

describe('existing authentication mail helpers', () => {
  it('verification uses the configured sender and preserves recipient, subject and link', async () => {
    await expect(sendVerificationEmail(message.to, 'Fixture', 'https://example.invalid/verify')).resolves.toBeUndefined();
    expect(mock.send).toHaveBeenCalledWith(expect.objectContaining({
      from: 'Hustle <sender@example.invalid>', to: message.to,
      subject: 'Verify your Hustle email', html: expect.stringContaining('https://example.invalid/verify'),
    }));
  });

  it('password reset preserves its void contract and throws sanitized delivery failures', async () => {
    await expect(sendPasswordResetEmail(message.to, 'https://example.invalid/reset')).resolves.toBeUndefined();
    expect(mock.send).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Reset your Hustle password', html: expect.stringContaining('https://example.invalid/reset'),
    }));
    mock.send.mockRejectedValue({ code: 'EAUTH', message: 'private detail' });
    await expect(sendPasswordResetEmail(message.to, 'https://example.invalid/reset')).rejects.toThrow('(authentication)');
  });
});
