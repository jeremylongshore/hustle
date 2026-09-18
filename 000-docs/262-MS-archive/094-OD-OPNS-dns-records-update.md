# DNS Records Update for hustlestats.io

**Date**: 2025-10-16
**Status**: ✅ Domain mapping created successfully
**Action Required**: Update DNS records

---

## Current Status

✅ Domain verified in Google Search Console
✅ Cloud Run domain mapping created
⏳ **WAITING FOR DNS UPDATE** (you need to do this now)
⏳ SSL certificate will provision after DNS is updated

---

## DNS Records to Add

Google provided these IP addresses for hustlestats.io:

### **A Records (IPv4)** - ADD ALL FOUR:
```
Type: A
Name: @ (or leave blank for root domain)
Value: 216.239.32.21
TTL: Auto (or 3600)

Type: A
Name: @ (or leave blank for root domain)
Value: 216.239.34.21
TTL: Auto (or 3600)

Type: A
Name: @ (or leave blank for root domain)
Value: 216.239.36.21
TTL: Auto (or 3600)

Type: A
Name: @ (or leave blank for root domain)
Value: 216.239.38.21
TTL: Auto (or 3600)
```

### **AAAA Records (IPv6)** - ADD ALL FOUR:
```
Type: AAAA
Name: @ (or leave blank for root domain)
Value: 2001:4860:4802:32::15
TTL: Auto (or 3600)

Type: AAAA
Name: @ (or leave blank for root domain)
Value: 2001:4860:4802:34::15
TTL: Auto (or 3600)

Type: AAAA
Name: @ (or leave blank for root domain)
Value: 2001:4860:4802:36::15
TTL: Auto (or 3600)

Type: AAAA
Name: @ (or leave blank for root domain)
Value: 2001:4860:4802:38::15
TTL: Auto (or 3600)
```

---

## Step-by-Step Instructions

### **If using Cloudflare:**

1. Log in to Cloudflare dashboard
2. Select **hustlestats.io** domain
3. Go to **DNS** → **Records**
4. **DELETE existing A record** (if pointing to old IP 34.49.73.55)
5. **ADD 4 new A records**:
   - Click **Add record**
   - Type: `A`
   - Name: `@`
   - IPv4 address: `216.239.32.21`
   - Proxy status: **DNS only** (gray cloud icon)
   - TTL: Auto
   - Click **Save**
   - Repeat for the other 3 IPs
6. **ADD 4 AAAA records** (IPv6):
   - Same process, but Type: `AAAA`
   - Use the IPv6 addresses above
7. Click **Save** for each record

### **If using Google Domains:**

1. Log in to domains.google.com
2. Select **hustlestats.io**
3. Go to **DNS**
4. Scroll to **Custom resource records**
5. **DELETE old A record** (34.49.73.55)
6. **ADD 4 A records**:
   - Name: `@`
   - Type: `A`
   - TTL: `3600`
   - Data: `216.239.32.21`
   - Click **Add**
   - Repeat for other 3 IPs
7. **ADD 4 AAAA records**:
   - Name: `@`
   - Type: `AAAA`
   - Data: IPv6 addresses
   - Click **Add**

### **If using Namecheap:**

1. Log in to Namecheap
2. Go to **Domain List** → **Manage**
3. Click **Advanced DNS** tab
4. **DELETE old A record** (34.49.73.55)
5. **Add 4 new A records**:
   - Type: `A Record`
   - Host: `@`
   - Value: `216.239.32.21`
   - TTL: Automatic
   - Click **Add New Record**
   - Repeat for other 3 IPs
6. **Add 4 AAAA records**:
   - Type: `AAAA Record`
   - Host: `@`
   - Value: IPv6 addresses
   - Click **Add New Record**

---

## After DNS Update

**DNS Propagation Time**: 5-30 minutes (usually ~10 minutes)

**Check DNS propagation**:
```bash
# Check if A records are updated
dig hustlestats.io A +short

# Should show all 4 IPs:
# 216.239.32.21
# 216.239.34.21
# 216.239.36.21
# 216.239.38.21
```

Or use: https://dnschecker.org
- Enter: `hustlestats.io`
- Type: `A`
- Should see Google's IPs globally

---

## SSL Certificate Provisioning

Once DNS is updated, Google will automatically:
1. Detect the DNS records point to Cloud Run
2. Issue a free SSL certificate (Let's Encrypt)
3. Configure HTTPS for hustlestats.io

**Time**: 15-30 minutes after DNS propagates

**Check certificate status**:
```bash
gcloud beta run domain-mappings describe hustlestats.io \
  --region=us-central1 \
  --project=hustleapp-production
```

Look for: `certificateMode: AUTOMATIC`

---

## Testing

After SSL certificate is provisioned:

1. **Test HTTP** (should redirect to HTTPS):
   ```bash
   curl -I http://hustlestats.io
   ```

2. **Test HTTPS** (should load site):
   ```bash
   curl -I https://hustlestats.io
   ```

3. **Test in browser**: https://hustlestats.io
   - Should show your landing page
   - Green lock icon in address bar
   - Certificate issued by Google Trust Services

---

## Environment Variable Update

After hustlestats.io is working, update Cloud Run service:

```bash
gcloud run services update hustle-app \
  --region=us-central1 \
  --project=hustleapp-production \
  --set-env-vars="NEXTAUTH_URL=https://hustlestats.io"
```

This ensures NextAuth redirects work correctly.

---

## Troubleshooting

### "DNS not propagating"
- Wait 30 minutes (some ISPs cache longer)
- Flush your local DNS: `sudo systemd-resolve --flush-caches`
- Use different DNS checker: https://www.whatsmydns.net

### "Certificate not provisioning"
- Verify all 4 A records are correct
- Check domain mapping status: `gcloud beta run domain-mappings list`
- Wait up to 1 hour (Google's SLA)

### "Site not loading"
- Check DNS points to correct IPs: `dig hustlestats.io`
- Check Cloud Run service is running: `gcloud run services list`
- Check logs: `gcloud run services logs read hustle-app`

---

## Summary

**You need to:**
1. ✅ Log in to your DNS provider (Cloudflare/Google Domains/Namecheap)
2. ✅ DELETE old A record (34.49.73.55)
3. ✅ ADD 4 new A records (Google's IPs above)
4. ✅ ADD 4 new AAAA records (IPv6 addresses above)
5. ⏳ Wait 15-30 minutes for DNS + SSL
6. ✅ Test https://hustlestats.io in browser
7. ✅ Update NEXTAUTH_URL environment variable

**Expected total time**: 30-45 minutes from now

---

**Created**: 2025-10-16 18:52 UTC
**Status**: ⏳ Awaiting DNS update
