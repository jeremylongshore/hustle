# 📧 Email Setup Guide - Thank You Emails with Personal Note

**Project:** Hustle Survey App
**Feature:** Automated thank you emails with personalized message
**Service:** Resend (https://resend.com)
**Status:** ✅ Ready to Configure

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Setup (5 minutes)](#quick-setup-5-minutes)
3. [Resend Account Setup](#resend-account-setup)
4. [Environment Configuration](#environment-configuration)
5. [Customizing Your Personal Note](#customizing-your-personal-note)
6. [Testing Email Sending](#testing-email-sending)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What This Does

After a user completes the 68-question survey:
1. ✅ Survey responses save to database
2. ✅ User sees thank you page in browser
3. ✅ **NEW:** User receives beautiful HTML email with:
   - Your personalized message
   - Beta tester reward information
   - Next steps and timeline
   - Contact information

### Email Preview

The email includes:
- **Header:** Purple gradient with "🎉 Thank You!" message
- **Personal Note Section:** Your custom message in a highlighted box
- **Beta Tester Rewards:** Step-by-step breakdown of what happens next
- **Contact Info:** Support email for questions
- **Mobile-Responsive:** Looks great on all devices

---

## Quick Setup (5 minutes)

### Step 1: Create Resend Account (2 minutes)

1. Go to https://resend.com
2. Click "Sign Up" (it's free!)
3. Verify your email address
4. Complete onboarding

**Free Tier Limits:**
- ✅ 100 emails/day
- ✅ 3,000 emails/month
- ✅ Perfect for beta testing!

### Step 2: Get API Key (1 minute)

1. In Resend dashboard, go to **API Keys**
2. Click **"Create API Key"**
3. Name it: `hustle-survey-production`
4. Click **Create**
5. **COPY THE KEY** (starts with `re_`) - you can only see it once!

### Step 3: Add to Environment Variables (2 minutes)

Add these lines to your `.env.local` file:

```bash
# Resend Email Service
RESEND_API_KEY="re_your_actual_key_here"
RESEND_FROM_EMAIL="Hustle Survey <onboarding@resend.dev>"
```

**For Testing:** Use `onboarding@resend.dev` (pre-verified by Resend)
**For Production:** Use your own domain (see [Domain Verification](#domain-verification) below)

### Step 4: Restart Dev Server

```bash
npm run dev
```

**Done!** Emails will now send automatically after survey submissions.

---

## Resend Account Setup

### Domain Verification (Optional but Recommended)

To send emails from your own domain (`noreply@hustlesurvey.com`):

1. **Add Domain in Resend:**
   - Go to **Domains** in Resend dashboard
   - Click **"Add Domain"**
   - Enter your domain: `hustlesurvey.intentsolutions.io`

2. **Configure DNS Records:**
   - Resend will show you DNS records to add
   - Add these records to your domain registrar
   - Common records:
     - **SPF:** TXT record for authentication
     - **DKIM:** TXT record for signatures
     - **MX:** Mail exchange record (optional)

3. **Verify Domain:**
   - Wait 5-10 minutes for DNS propagation
   - Click **"Verify"** in Resend dashboard
   - Once verified, update `.env.local`:

   ```bash
   RESEND_FROM_EMAIL="Hustle Survey <noreply@hustlesurvey.intentsolutions.io>"
   ```

**Why Verify?**
- ✅ Better email deliverability
- ✅ Looks more professional
- ✅ Avoids spam filters
- ✅ Builds domain reputation

---

## Environment Configuration

### Required Environment Variables

Add to `.env.local` (local development):

```bash
# Resend API Key (required)
RESEND_API_KEY="re_123456789abcdefg"

# From email address (required)
RESEND_FROM_EMAIL="Hustle Survey <onboarding@resend.dev>"
```

### Optional Environment Variables

```bash
# Custom personal note (optional)
# If not set, uses default message
THANK_YOU_PERSONAL_NOTE="Your custom message here"
```

### Production Environment Variables (Netlify)

1. Go to Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the same variables:
   - `RESEND_API_KEY`: Your Resend API key
   - `RESEND_FROM_EMAIL`: Your sender email
   - `THANK_YOU_PERSONAL_NOTE`: Your custom message (optional)

---

## Customizing Your Personal Note

### Option 1: Use Default Message

Don't set `THANK_YOU_PERSONAL_NOTE` environment variable. The app uses this default:

```
Thank you so much for taking the time to complete our survey!

Your feedback is incredibly valuable to us. As a parent managing youth sports,
you understand the challenges firsthand, and your insights will directly shape
how we build Hustle.

We're committed to creating a tool that truly helps families like yours track
games, celebrate progress, and stay organized—without adding more stress to
your already busy schedule.

I'm personally reviewing every survey response, and I'm excited about the
patterns and needs I'm seeing. This is going to be something special.

Stay tuned for beta testing invitations—we can't wait to get Hustle into your hands!

Thanks again,
Jeremy Longshore
Founder, Hustle
```

### Option 2: Write Custom Message

Add to `.env.local`:

```bash
THANK_YOU_PERSONAL_NOTE="Hey there!

I just wanted to say a massive thank you for taking the time to complete our survey.
Seriously, your input is gold.

As a dad who's spent way too much time tracking my kids' soccer stats on random
spreadsheets and napkins, I know the pain points you're dealing with. Every single
one of your responses is helping us build something that actually solves real problems.

I'm reading every survey personally (yes, really!), and I'm pumped about what we're
building together.

You'll hear from me soon about beta testing. Can't wait to get this in your hands!

Cheers,
Jeremy"
```

### Tips for Great Personal Notes

✅ **DO:**
- Keep it conversational and authentic
- Show genuine appreciation
- Reference the product vision
- Set clear expectations for next steps
- Sign with your name and role

❌ **DON'T:**
- Use corporate jargon
- Make it too long (200-300 words max)
- Over-promise on timelines
- Forget to proofread!

---

## Testing Email Sending

### Test Locally (Development)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Complete survey:**
   - Go to http://localhost:3000
   - Click "Start Survey"
   - Navigate to final section (Section 15)
   - **IMPORTANT:** Enter your real email address in the survey
   - Click "Submit Survey"

3. **Check console logs:**
   ```
   [API] Survey submitted successfully: 123
   [Email] Sending thank you email to: your@email.com
   [Email] Successfully sent to your@email.com, ID: abc123
   ```

4. **Check your inbox:**
   - Look for email from "Hustle Survey"
   - Check spam folder if not in inbox
   - Verify personal note appears correctly

### Test Email Sending Script

Create `test-email.js` in survey-app directory:

```javascript
// test-email.js
import { sendThankYouEmail } from './lib/email.js';

async function testEmail() {
  const result = await sendThankYouEmail({
    recipientEmail: 'your@email.com', // Change to your email
    recipientName: 'Test User',
    personalNote: 'This is a test of the thank you email system!',
  });

  console.log('Email send result:', result);
}

testEmail();
```

Run test:
```bash
node test-email.js
```

### Verify Email Content

Check that email includes:
- [ ] Your personal note in purple highlighted section
- [ ] "Thank You! 🎉" header
- [ ] Beta tester reward steps (1, 2, 3)
- [ ] "What Happens Next?" section
- [ ] Support email address
- [ ] Mobile-responsive layout
- [ ] No broken images or formatting issues

---

## Production Deployment

### 1. Add Environment Variables to Netlify

```bash
# Via Netlify Dashboard:
1. Go to Site settings → Environment variables
2. Add:
   - RESEND_API_KEY: [your-api-key]
   - RESEND_FROM_EMAIL: [your-sender-email]
   - THANK_YOU_PERSONAL_NOTE: [your-message] (optional)
```

### 2. Deploy Code

```bash
git add .
git commit -m "feat: add automated thank you emails with personal note"
git push origin main
```

Netlify will automatically deploy.

### 3. Verify Production

1. **Complete survey on live site**
2. **Check Resend dashboard** → Emails tab
3. **Verify email received** in your inbox
4. **Monitor for 24 hours** to ensure all submissions trigger emails

### 4. Monitor Email Deliverability

**Resend Dashboard Metrics:**
- ✅ **Sent:** Email successfully sent
- ⚠️ **Bounced:** Email address invalid
- ⚠️ **Complaint:** User marked as spam
- ✅ **Delivered:** Successfully delivered to inbox

**Best Practices:**
- Keep bounce rate < 2%
- Keep complaint rate < 0.1%
- Monitor daily for first week
- Clean invalid emails from list

---

## Troubleshooting

### Issue: Emails Not Sending

**Symptom:** Survey submits successfully but no email received

**Diagnosis:**
```bash
# Check console logs for errors
[Email] Failed to send: [error message]
```

**Solutions:**

1. **API Key Not Configured:**
   ```bash
   # Error: "Email service not configured"
   # Fix: Add RESEND_API_KEY to .env.local
   RESEND_API_KEY="re_your_key_here"
   ```

2. **Invalid API Key:**
   ```bash
   # Error: "Unauthorized" or "Invalid API key"
   # Fix: Get new API key from Resend dashboard
   ```

3. **Invalid From Email:**
   ```bash
   # Error: "Invalid from address"
   # Fix: Use verified domain or onboarding@resend.dev
   RESEND_FROM_EMAIL="Hustle Survey <onboarding@resend.dev>"
   ```

4. **No Email in Survey Response:**
   ```bash
   # Log: "No valid email provided, skipping thank you email"
   # Fix: Ensure survey collects email address
   # Check: data.email or data.betaEmail fields
   ```

### Issue: Emails Going to Spam

**Symptom:** Email sends successfully but lands in spam folder

**Solutions:**

1. **Verify Domain:**
   - Add SPF, DKIM, DMARC records
   - Verify domain in Resend dashboard

2. **Warm Up Domain:**
   - Start with small volume (10-20/day)
   - Gradually increase over 2-4 weeks
   - Avoid sudden spikes

3. **Improve Content:**
   - Remove spammy words ("FREE", "GUARANTEED", "CLICK NOW")
   - Balance text-to-image ratio
   - Include plain text version (already implemented)

4. **Test Spam Score:**
   - Use https://www.mail-tester.com
   - Send test email to their address
   - Fix issues flagged in report

### Issue: Rate Limit Exceeded

**Symptom:** Error "Rate limit exceeded"

**Cause:** Free tier limits (100/day, 3,000/month)

**Solutions:**

1. **Upgrade Resend Plan:**
   - Pro: $20/month → 50,000 emails/month
   - Business: $85/month → 100,000 emails/month

2. **Batch Email Sending:**
   - Queue emails instead of sending immediately
   - Process queue with rate limiting

3. **Alternative Services:**
   - SendGrid (12,000 free/month)
   - Mailgun (5,000 free/month)
   - AWS SES (62,000 free/month)

### Issue: Personal Note Not Appearing

**Symptom:** Email sends but personal note is missing or shows default

**Diagnosis:**
```bash
# Check if environment variable is set
echo $THANK_YOU_PERSONAL_NOTE
```

**Solutions:**

1. **Environment Variable Not Set:**
   ```bash
   # Add to .env.local
   THANK_YOU_PERSONAL_NOTE="Your message here"
   ```

2. **Restart Required:**
   ```bash
   # Restart dev server to load new env vars
   npm run dev
   ```

3. **Netlify Environment:**
   - Check Site settings → Environment variables
   - Redeploy after adding variable

---

## Email Analytics & Tracking

### Resend Dashboard

Monitor email performance:
- **Sent:** Total emails sent
- **Delivered:** Successfully delivered
- **Bounced:** Failed deliveries
- **Opened:** Recipients who opened email
- **Clicked:** Recipients who clicked links

### Custom Tracking (Optional)

Add UTM parameters to links in email:

```typescript
// In email-templates.ts
const surveyLink = `https://hustlesurvey.intentsolutions.io?utm_source=email&utm_medium=thank-you&utm_campaign=survey-response`;
```

Track in Google Analytics or your analytics tool.

---

## Cost Estimate

### Resend Pricing

**Free Tier:**
- 100 emails/day
- 3,000 emails/month
- ✅ **Perfect for beta testing** (100-500 survey responses)

**Pro Plan:** $20/month
- 50,000 emails/month
- ✅ **Good for launch** (1,000-5,000 survey responses)

**Business Plan:** $85/month
- 100,000 emails/month
- ✅ **Scale phase** (5,000+ survey responses)

### Comparison with Alternatives

| Service | Free Tier | Paid Tier | Notes |
|---------|-----------|-----------|-------|
| **Resend** | 3,000/mo | $20/mo (50k) | Modern, great DX |
| SendGrid | 100/day | $20/mo (50k) | Enterprise, complex setup |
| Mailgun | 5,000/mo | $35/mo (50k) | Developer-focused |
| AWS SES | 62,000/mo | $0.10/1k | Cheapest, requires AWS |

**Recommendation:** Start with Resend free tier, upgrade when needed.

---

## Support & Resources

### Documentation
- Resend Docs: https://resend.com/docs
- Resend API Reference: https://resend.com/docs/api-reference
- Next.js Email Guide: https://nextjs.org/docs/app/building-your-application/sending-email

### Get Help
- **Resend Support:** support@resend.com
- **Resend Discord:** https://resend.com/discord

---

## Summary Checklist

Setup complete when all boxes checked:

- [ ] Resend account created
- [ ] API key generated
- [ ] Environment variables configured
- [ ] Personal note customized
- [ ] Test email sent successfully
- [ ] Production deployment updated
- [ ] Email deliverability verified
- [ ] Monitoring set up in Resend dashboard

---

**Last Updated:** 2025-10-07
**Version:** 1.0.0
**Status:** ✅ Production Ready
