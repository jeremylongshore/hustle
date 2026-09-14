import { emailConfiguration, EmailDeliveryError, verifyEmailTransport } from './smtp';

interface EmailHealth {
  status: 'pass' | 'fail';
  transport: 'smtp';
  check: 'tls-authentication';
  checkedAt: string;
  validUntil: string;
  category?: EmailDeliveryError['category'];
  missing?: string[];
}

let cached: EmailHealth | undefined;
let inFlight: Promise<EmailHealth> | undefined;
const intervalMs = 60_000;

/** At most one no-send verification per process per minute, including failures. */
export async function emailHealth(): Promise<EmailHealth> {
  const config = emailConfiguration();
  const stamp = () => ({ checkedAt: new Date().toISOString(), validUntil: new Date(Date.now() + intervalMs).toISOString() });
  const base = { transport: 'smtp' as const, check: 'tls-authentication' as const };
  if (!config.configured) {
    cached = undefined;
    return { ...base, ...stamp(), status: 'fail', category: 'configuration', missing: config.missing };
  }
  if (cached && Date.parse(cached.validUntil) > Date.now()) return cached;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      await verifyEmailTransport();
      cached = { ...base, ...stamp(), status: 'pass' };
    } catch (error) {
      cached = { ...base, ...stamp(), status: 'fail', category: error instanceof EmailDeliveryError ? error.category : 'transport' };
    }
    return cached;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = undefined;
  }
}
