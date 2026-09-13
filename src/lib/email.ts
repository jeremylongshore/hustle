import { EmailDeliveryError, sendTransactionalEmail } from './smtp';
import type { TransactionalEmail } from './smtp';

export type EmailOptions = TransactionalEmail;

/** Preserve notification callers' result contract while using the estate SMTP sender. */
export async function sendEmail(options: EmailOptions) {
  try {
    const data = await sendTransactionalEmail(options);
    console.info('[Email] SMTP message accepted');
    return { success: true as const, data };
  } catch (error) {
    // The transport deliberately exposes only an allowlisted failure category.
    const message = error instanceof EmailDeliveryError ? error.message : 'Email delivery failed (transport)';
    console.error('[Email]', message);
    return { success: false as const, error: message };
  }
}
