// Compatibility exports for existing auth routes; all delivery uses configured SMTP.
import { sendTransactionalEmail } from './smtp';

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  verificationLink: string,
): Promise<void> {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Hustle ⚽</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Hey ${firstName}! Welcome to the team 🎉</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
              You're almost in. Tap the button below to verify your email address and activate your Hustle account.
            </p>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${verificationLink}"
                style="display:inline-block;padding:14px 32px;background:#7c3aed;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:100px;">
                Verify my email
              </a>
            </td></tr></table>
            <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">
              This link expires in 24 hours. If you didn't create a Hustle account, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #f4f4f5;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
              © ${new Date().getFullYear()} Hustle. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendTransactionalEmail({
    to,
    subject: 'Verify your Hustle email',
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
): Promise<void> {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Hustle ⚽</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Reset your password</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
              We received a request to reset your Hustle password. Click the button below to choose a new one.
            </p>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${resetLink}"
                style="display:inline-block;padding:14px 32px;background:#7c3aed;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:100px;">
                Reset password
              </a>
            </td></tr></table>
            <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">
              This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #f4f4f5;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
              © ${new Date().getFullYear()} Hustle. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendTransactionalEmail({
    to,
    subject: 'Reset your Hustle password',
    html,
  });
}
