# Domain Verification Steps for hustlestats.io

**Date**: 2025-10-16
**Purpose**: Verify hustlestats.io ownership in Google Search Console for Cloud Run domain mapping
**Project**: hustleapp-production

---

## Prerequisites

- Access to domain registrar (where hustlestats.io is registered)
- Google account with permissions to hustleapp-production project

---

## Step 1: Open Google Search Console

1. Go to: https://search.google.com/search-console
2. Sign in with your Google account (same account that has access to GCP project)

---

## Step 2: Add Property

1. Click **"Add Property"** (or select dropdown at top left)
2. Choose **"Domain"** verification method (NOT "URL Prefix")
3. Enter: `hustlestats.io` (without www or https://)
4. Click **Continue**

---

## Step 3: Verify Ownership via DNS

Google will provide a **TXT record** that looks like:

```
google-site-verification=abcdefg123456789hijklmnop
```

### Add TXT Record to DNS:

**If using Cloudflare:**
1. Log in to Cloudflare dashboard
2. Select hustlestats.io domain
3. Go to DNS → Records
4. Click **Add record**
   - Type: `TXT`
   - Name: `@` (or leave blank for root domain)
   - Content: `google-site-verification=YOUR_CODE_HERE`
   - TTL: Auto
   - Proxy status: DNS only (gray cloud)
5. Click **Save**

**If using Google Domains:**
1. Log in to domains.google.com
2. Select hustlestats.io
3. Go to DNS
4. Scroll to **Custom resource records**
5. Add TXT record:
   - Name: `@`
   - Type: `TXT`
   - Data: `google-site-verification=YOUR_CODE_HERE`
6. Click **Add**

**If using Namecheap:**
1. Log in to Namecheap
2. Go to Domain List → Manage
3. Advanced DNS tab
4. Add new record:
   - Type: `TXT Record`
   - Host: `@`
   - Value: `google-site-verification=YOUR_CODE_HERE`
   - TTL: Automatic
5. Save changes

---

## Step 4: Wait for DNS Propagation

- **Time**: 5-30 minutes (usually ~10 minutes)
- **Check status**: Use https://dnschecker.org
  - Enter: `hustlestats.io`
  - Type: `TXT`
  - Should see your verification code globally

---

## Step 5: Verify in Search Console

1. Return to Google Search Console
2. Click **"Verify"** button
3. If successful: ✅ "Ownership verified"
4. If failed: Wait longer for DNS propagation, then retry

---

## Step 6: Notify Me

Once you see **"Ownership verified"**, let me know and I'll immediately run:

```bash
gcloud beta run domain-mappings create hustlestats.io \
  --service=hustle-app \
  --region=us-central1 \
  --project=hustleapp-production
```

This will:
- Create the domain mapping
- Provision Google-managed SSL certificate
- Give you DNS records to update

---

## Troubleshooting

### "Verification failed"
- Wait 30 more minutes for DNS propagation
- Check TXT record is correct (no typos)
- Ensure TXT record is at root domain (`@`), not subdomain

### "Domain already verified for another account"
- If Codex verified it previously, you may need to remove/re-add
- Or use that Google account to grant access

### "Cannot access domain registrar"
- Send me registrar name + account access info
- I can provide specific instructions

---

## After Verification

Once domain is verified, I'll:
1. Create Cloud Run domain mapping
2. Update DNS CNAME record (I'll provide exact value)
3. Wait for SSL certificate provisioning (~15-30 min)
4. Test hustlestats.io → production site

**Expected total time**: 30-60 minutes from start to finish

---

**Status**: ⏳ Awaiting domain verification
**Next**: Add TXT record to DNS, verify in Search Console, notify Claude

---

**Created**: 2025-10-16 18:45 UTC
**Updated**: 2025-10-16 18:45 UTC
