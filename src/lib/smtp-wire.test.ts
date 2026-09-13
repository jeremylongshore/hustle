import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type TLSSocket } from 'node:tls';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ ca: '', trust: true }));
vi.mock('smtp-mailer', async (load) => {
  const actual = await load<typeof import('smtp-mailer')>();
  return { default: { ...actual.default, createTransport: (options: Record<string, unknown>) =>
    actual.default.createTransport({
      ...options,
      tls: { ...(options.tls as object), ...(fixture.trust ? { ca: fixture.ca } : {}) },
    }) } };
});

import { sendEmail } from './email';
import { sendPasswordResetEmail, sendVerificationEmail } from './resend';
import { verifyEmailTransport } from './smtp';

let directory: string;
let server: ReturnType<typeof createServer>;
let port: number;
let authenticationCount = 0;
let rejectRecipient = false;
const messages: string[] = [];
const sockets = new Set<TLSSocket>();

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'hustle-smtp-wire-'));
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1',
    '-keyout', join(directory, 'fixture.key'), '-out', join(directory, 'fixture.crt')],
  { stdio: 'ignore' });
  fixture.ca = readFileSync(join(directory, 'fixture.crt'), 'utf8');
  server = createServer({ key: readFileSync(join(directory, 'fixture.key')), cert: fixture.ca }, (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => socket.destroy());
    socket.write('220 localhost fixture ESMTP\r\n');
    let pending = '';
    let body: string[] | null = null;
    socket.on('data', (data) => {
      pending += data.toString();
      while (pending.includes('\n')) {
        const end = pending.indexOf('\n');
        const line = pending.slice(0, end).replace(/\r$/, '');
        pending = pending.slice(end + 1);
        if (body !== null) {
          if (line === '.') {
            messages.push(body.join('\n'));
            body = null;
            socket.write('250 2.0.0 accepted fixture message\r\n');
          } else body.push(line);
        } else if (/^EHLO /.test(line)) {
          socket.write('250-localhost\r\n250 AUTH PLAIN\r\n');
        } else if (/^AUTH PLAIN /.test(line)) {
          const decoded = Buffer.from(line.slice('AUTH PLAIN '.length), 'base64').toString();
          if (decoded === '\0sender@example.invalid\0fixture-password') {
            authenticationCount++;
            socket.write('235 2.7.0 fixture authenticated\r\n');
          } else socket.write('535 5.7.8 invalid fixture credentials\r\n');
        } else if (/^MAIL FROM:/.test(line)) socket.write('250 2.1.0 sender accepted\r\n');
        else if (/^RCPT TO:/.test(line)) socket.write(rejectRecipient ? '550 5.1.1 fixture rejected\r\n' : '250 2.1.5 recipient accepted\r\n');
        else if (line === 'DATA') { body = []; socket.write('354 fixture content follows\r\n'); }
        else if (line === 'QUIT') socket.end('221 2.0.0 closing fixture\r\n');
        else socket.write('250 2.0.0 fixture ok\r\n');
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('fixture did not bind');
  port = address.port;
});

beforeEach(() => {
  authenticationCount = 0;
  messages.length = 0;
  rejectRecipient = false;
  fixture.trust = true;
  vi.stubEnv('SMTP_HOST', '127.0.0.1');
  vi.stubEnv('SMTP_PORT', String(port));
  vi.stubEnv('SMTP_SECURE', 'true');
  vi.stubEnv('SMTP_USER', 'sender@example.invalid');
  vi.stubEnv('SMTP_PASS', 'fixture-password');
  vi.stubEnv('EMAIL_FROM', 'Hustle <sender@example.invalid>');
});

afterEach(() => vi.unstubAllEnvs());
afterAll(async () => {
  for (const socket of sockets) socket.destroy();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  rmSync(directory, { recursive: true, force: true });
});

it('authenticates over verified TLS without entering SMTP DATA', async () => {
  await verifyEmailTransport();
  expect(authenticationCount).toBe(1);
  expect(messages).toHaveLength(0);
});

it('preserves notification result shape through the real SMTP SDK', async () => {
  const result = await sendEmail({ to: 'recipient@example.invalid', subject: 'Fixture subject', html: '<p>Fixture body</p>' });
  expect(result).toMatchObject({ success: true, data: { id: expect.any(String) } });
  expect(messages).toHaveLength(1);
  expect(messages[0]).toContain('From: Hustle <sender@example.invalid>');
  expect(messages[0]).toContain('To: recipient@example.invalid');
  expect(messages[0]).toContain('Fixture body');
});

it('delivers verification and reset templates into the isolated fixture', async () => {
  await sendVerificationEmail('recipient@example.invalid', 'Fixture', 'https://example.invalid/verify');
  await sendPasswordResetEmail('recipient@example.invalid', 'https://example.invalid/reset');
  expect(messages).toHaveLength(2);
  expect(messages[0]).toContain('Verify your Hustle email');
  expect(messages[1]).toContain('Reset your Hustle password');
});

it('surfaces recipient refusal without submitting message content', async () => {
  rejectRecipient = true;
  await expect(sendEmail({ to: 'rejected@example.invalid', subject: 'Fixture', html: 'Fixture' }))
    .resolves.toEqual({ success: false, error: 'Email delivery failed (rejected)' });
  expect(messages).toHaveLength(0);
});

it('refuses an untrusted certificate before authentication or message submission', async () => {
  fixture.trust = false;
  await expect(verifyEmailTransport()).rejects.toThrow('Email delivery failed');
  expect(authenticationCount).toBe(0);
  expect(messages).toHaveLength(0);
});
