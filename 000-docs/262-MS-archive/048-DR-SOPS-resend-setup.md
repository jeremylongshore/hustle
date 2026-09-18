# Resend Email Setup Guide

**Document Type:** Standard Operating Procedure
**Status:** Active
**Last Updated:** 2025-10-07
**Version:** 1.0.0

---

## Overview

This guide walks you through setting up Resend for email delivery in the Hustle application. Resend is used for sending authentication emails (verification, password reset, etc.).

**Why Resend?**
- ✅ Generous free tier (3,000 emails/month, 100/day)
- ✅ No credit card required
- ✅ Simple API, great documentation
- ✅ Perfect for Next.js applications
- ✅ View all sent emails in dashboard

---

## Step 1: Create Resend Account

1. **Go to** https://resend.com
2. **Click** "Sign Up" or "Get Started"
3. **Sign up** with:
   - GitHub account (recommended), OR
   - Email address
4. **Complete** email verification if using email signup
5. **No credit card required** ✅

---

## Step 2: Generate API Key

1. **Log in** to your Resend dashboard
2. **Navigate** to "API Keys" in the sidebar
3. **Click** "Create API Key"
4. **Name** your key (e.g., "Hustle Development")
5. **Choose** permission level:
   - For development: "Full Access"
   - For production: "Sending Access" (more secure)
6. **Click** "Add"
7. **Copy** the API key immediately (shown only once)
   - It will look like: `re_123abc456def789ghi...`

---

## Step 3: Configure Environment Variables

1. **Open** `/home/jeremy/projects/hustle/.env.local`
2. **Update** the email configuration:

```bash
# Email Configuration (Resend)
RESEND_API_KEY="re_YOUR_ACTUAL_API_KEY_HERE"
EMAIL_FROM="Hustle <onboarding@resend.dev>"
```

3. **Save** the file

**Important Notes:**
- Replace `re_YOUR_ACTUAL_API_KEY_HERE` with your actual API key
- For development, use `onboarding@resend.dev` (Resend's test domain)
- For production, verify your own domain (see Step 5)

---

## Step 4: Test Email Sending

1. **Restart** the development server:
```bash
# Kill current server
# Then restart
npm run dev
```

2. **Test** registration:
   - Go to http://localhost:3001/register
   - Fill out registration form
   - Submit

3. **Check** Resend dashboard:
   - Go to https://resend.com/emails
   - You should see your test email listed
   - Click on it to view the full email

4. **Check** your inbox:
   - Email should arrive within seconds
   - If not in inbox, check spam folder
   - Check Resend dashboard for errors

---

## Step 5: Verify Domain (Production Only)

For production use, you should send from your own domain instead of `onboarding@resend.dev`.

### Prerequisites
- Own a domain name (e.g., hustle-app.com)
- Access to domain DNS settings

### Steps

1. **Navigate** to "Domains" in Resend dashboard
2. **Click** "Add Domain"
3. **Enter** your domain (e.g., `hustle-app.com`)
4. **Copy** the DNS records Resend provides:
   - TXT record for domain verification
   - MX records (optional, for receiving emails)
   - DKIM records (for email authentication)

5. **Add** DNS records to your domain provider:
   - Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
   - Navigate to DNS settings
   - Add each record exactly as shown in Resend

6. **Wait** for verification (5-10 minutes, sometimes up to 48 hours)

7. **Check** verification status in Resend dashboard

8. **Update** `.env.local` for production:
```bash
EMAIL_FROM="Hustle <noreply@hustle-app.com>"
```

---

## Common DNS Providers

### Cloudflare
1. Log in to Cloudflare
2. Select your domain
3. Go to DNS → Records
4. Click "Add record"
5. Add each record from Resend

### Namecheap
1. Log in to Namecheap
2. Domain List → Manage
3. Advanced DNS tab
4. Add new records

### GoDaddy
1. Log in to GoDaddy
2. My Products → DNS
3. Add records in DNS Management

---

## Free Tier Limits

**Current Limits (as of 2025):**
- 3,000 emails per month
- 100 emails per day
- Unlimited API requests

**What happens when limit reached:**
- Emails will fail to send
- Error returned in API response
- Can upgrade to paid plan if needed

**Monitoring Usage:**
- View in Resend dashboard → Usage
- Shows daily and monthly totals
- Alerts available for approaching limits

---

## Email Template Testing

Resend provides a visual preview of all sent emails.

1. **Go to** https://resend.com/emails
2. **Click** on any email to view:
   - Subject line
   - HTML version (rendered)
   - Plain text version
   - Headers
   - Delivery status

3. **Send test email** to yourself:
```bash
# Use your own email when testing
# Register with your email
# Check how it looks in your actual inbox
```

---

## Production Checklist

Before deploying to production:

- [ ] Domain verified in Resend
- [ ] DNS records configured correctly
- [ ] Production API key created (with "Sending Access" only)
- [ ] `EMAIL_FROM` updated to use your domain
- [ ] Environment variables set in production (Cloud Run, Vercel, etc.)
- [ ] Test email sending in production environment
- [ ] Set up usage alerts in Resend dashboard
- [ ] Consider upgrading plan if expecting >3,000 emails/month

---

## Troubleshooting

### Problem: "Email service not configured" error

**Solution:**
1. Check `.env.local` has `RESEND_API_KEY` set
2. Ensure no extra spaces around the key
3. Restart dev server after changing `.env.local`

### Problem: Emails not arriving

**Solutions:**
1. Check Resend dashboard for send status
2. Look for errors in server logs (console output)
3. Verify `EMAIL_FROM` format is correct: `"Name <email@domain.com>"`
4. Check spam folder
5. For custom domain, ensure domain is verified

### Problem: "Invalid API key" error

**Solutions:**
1. Verify API key is correct (starts with `re_`)
2. Check for typos or extra characters
3. Generate new API key if needed
4. Ensure key has correct permissions

### Problem: Domain verification stuck

**Solutions:**
1. Wait 24-48 hours for DNS propagation
2. Use DNS checker tool: https://dnschecker.org
3. Verify records exactly match what Resend provides
4. Check for conflicting DNS records
5. Contact Resend support if still failing after 48 hours

---

## Support Resources

- **Resend Documentation:** https://resend.com/docs
- **Resend Status Page:** https://status.resend.com
- **Resend Support:** support@resend.com
- **Community Discord:** https://resend.com/discord

---

## Environment Variable Reference

### Development (.env.local)
```bash
RESEND_API_KEY="re_dev_key_here"
EMAIL_FROM="Hustle <onboarding@resend.dev>"
```

### Production (Cloud Run, Vercel, etc.)
```bash
RESEND_API_KEY="re_prod_key_here"
EMAIL_FROM="Hustle <noreply@hustle-app.com>"
```

---

## Next Steps

After completing this setup:

1. ✅ Test registration flow
2. ✅ Test email verification
3. ✅ Test password reset
4. ✅ Check email appearance in various email clients
5. ✅ Set up monitoring for email delivery
6. ✅ Plan for scaling if needed

---

**Document Maintenance:**
- Review when Resend changes pricing
- Update if API changes
- Add troubleshooting items as discovered

**Last Review:** 2025-10-07
**Next Review:** 2026-01-07
