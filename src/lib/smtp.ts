import nodemailer from 'smtp-mailer';

export interface TransactionalEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailDeliveryError extends Error {
  constructor(public readonly category: 'configuration' | 'authentication' | 'timeout' | 'rejected' | 'transport') {
    super(`Email delivery failed (${category})`);
    this.name = 'EmailDeliveryError';
  }
}

export function emailConfiguration() {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  const port = Number(process.env.SMTP_PORT || '465');
  const secure = process.env.SMTP_SECURE ?? (port === 465 ? 'true' : 'false');
  if (!Number.isInteger(port) || port < 1 || port > 65535) missing.push('SMTP_PORT');
  if (!['true', 'false'].includes(secure)) missing.push('SMTP_SECURE');
  return { configured: missing.length === 0, transport: 'smtp' as const, missing };
}

function transport() {
  if (!emailConfiguration().configured) throw new EmailDeliveryError('configuration');
  const port = Number(process.env.SMTP_PORT || '465');
  const secure = (process.env.SMTP_SECURE ?? (port === 465 ? 'true' : 'false')) === 'true';
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
}

function sanitizedError(error: unknown): EmailDeliveryError {
  if (error instanceof EmailDeliveryError) return error;
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
  if (code === 'EAUTH') return new EmailDeliveryError('authentication');
  if (code === 'ETIMEDOUT' || code === 'ESOCKET') return new EmailDeliveryError('timeout');
  if (code === 'EENVELOPE' || code === 'EMESSAGE') return new EmailDeliveryError('rejected');
  return new EmailDeliveryError('transport');
}

/** One attempt: an ambiguous SMTP acknowledgement must not trigger duplicate mail. */
export async function sendTransactionalEmail(message: TransactionalEmail): Promise<{ id: string }> {
  let client: ReturnType<typeof transport> | undefined;
  try {
    client = transport();
    const result = await client.sendMail({
      from: process.env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text ?? message.html.replace(/<[^>]*>/g, ''),
    });
    if (!result.accepted?.length || result.rejected?.length || !result.messageId) {
      throw new EmailDeliveryError('rejected');
    }
    return { id: result.messageId };
  } catch (error) {
    throw sanitizedError(error);
  } finally {
    client?.close();
  }
}

/** Verifies DNS, TLS and authentication; it never submits a message. */
export async function verifyEmailTransport(): Promise<void> {
  let client: ReturnType<typeof transport> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    client = transport();
    const verified = await Promise.race([
      client.verify(),
      new Promise<never>((_, reject) => {
        deadline = setTimeout(() => reject(new EmailDeliveryError('timeout')), 20_000);
      }),
    ]);
    if (!verified) throw new EmailDeliveryError('transport');
  } catch (error) {
    throw sanitizedError(error);
  } finally {
    if (deadline) clearTimeout(deadline);
    client?.close();
  }
}
