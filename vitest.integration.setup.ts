/**
 * Integration Test Setup
 *
 * Integration tests now use isolated SQLite fixtures. Clear external transport
 * credentials so a test cannot accidentally send mail or reach the retired
 * Firebase emulator path through a developer-shell environment.
 */

for (const key of [
  'FIRESTORE_EMULATOR_HOST',
  'FIREBASE_AUTH_EMULATOR_HOST',
  'RESEND_API_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
]) {
  process.env[key] = '';
}
