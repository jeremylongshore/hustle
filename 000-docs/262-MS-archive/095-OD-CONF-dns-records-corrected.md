# Hustlestats.io - CORRECTED DNS Records

**Created:** 2025-10-16 01:09 CDT
**Status:** ⚠️ CORRECTION REQUIRED - Previous DNS records were incorrect

---

## ⚠️ IMPORTANT: Previous DNS Configuration Was Wrong

The previous document (081) provided incorrect IP addresses. Cloud Run domain mapping requires **specific Google Cloud IPs**, not the generic ghs.googlehosted.com IPs.

---

## ✅ CORRECT DNS Records (Use These!)

### For Apex Domain (hustlestats.io)

#### A Records (IPv4) - ADD ALL FOUR
```
Type: A
Name: @ (or hustlestats.io)
TTL: 600
Value: 216.239.32.21
```

```
Type: A
Name: @ (or hustlestats.io)
TTL: 600
Value: 216.239.34.21
```

```
Type: A
Name: @ (or hustlestats.io)
TTL: 600
Value: 216.239.36.21
```

```
Type: A
Name: @ (or hustlestats.io)
TTL: 600
Value: 216.239.38.21
```

#### AAAA Records (IPv6 - Fully Expanded) - ADD ALL FOUR
```
Type: AAAA
Name: @ (or hustlestats.io)
TTL: 600
Value: 2001:4860:4802:0032:0000:0000:0000:0015
```

```
Type: AAAA
Name: @ (or hustlestats.io)
TTL: 600
Value: 2001:4860:4802:0034:0000:0000:0000:0015
```

```
Type: AAAA
Name: @ (or hustlestats.io)
TTL: 600
Value: 2001:4860:4802:0036:0000:0000:0000:0015
```

```
Type: AAAA
Name: @ (or hustlestats.io)
TTL: 600
Value: 2001:4860:4802:0038:0000:0000:0000:0015
```

---

## What Needs to Change

### Current (Wrong) Configuration
- A Record: 142.250.191.115 ❌ DELETE THIS

### Correct Configuration
- A Records: 216.239.32.21, 216.239.34.21, 216.239.36.21, 216.239.38.21 ✅
- AAAA Records: (all four IPv6 addresses above) ✅

---

## Step-by-Step Fix

1. **Login to your domain registrar**

2. **Delete the wrong A record:**
   - Remove: 142.250.191.115

3. **Add FOUR new A records** (most registrars let you add multiple values for same hostname):
   - 216.239.32.21
   - 216.239.34.21
   - 216.239.36.21
   - 216.239.38.21

4. **Add FOUR new AAAA records:**
   - 2001:4860:4802:0032:0000:0000:0000:0015
   - 2001:4860:4802:0034:0000:0000:0000:0015
   - 2001:4860:4802:0036:0000:0000:0000:0015
   - 2001:4860:4802:0038:0000:0000:0000:0015

5. **Save changes**

6. **Wait 10 minutes** (your TTL is 600 seconds)

---

## Verification Commands

### Check if DNS is updated
```bash
# Should show all 4 A records
dig hustlestats.io A +short

# Expected output:
# 216.239.32.21
# 216.239.34.21
# 216.239.36.21
# 216.239.38.21

# Should show all 4 AAAA records
dig hustlestats.io AAAA +short

# Expected output (shortened):
# 2001:4860:4802:32::15
# 2001:4860:4802:34::15
# 2001:4860:4802:36::15
# 2001:4860:4802:38::15
```

### Test HTTPS access
```bash
# Should work after DNS propagates
curl -I https://hustlestats.io
```

---

## Why This Happened

Cloud Run domain mappings require direct IP addresses from Google's infrastructure, not the generic Google Hosted Service (ghs.googlehosted.com) IPs. The domain mapping resource itself tells us exactly which IPs to use via the `resourceRecords` field.

---

## Domain Mapping Confirmation

```yaml
Domain: hustlestats.io
Service: hustle-app
Region: us-central1
Status: Ready, CertificateProvisioned, DomainRoutable

Required DNS Records (from Google):
  A Records:
    - 216.239.32.21
    - 216.239.34.21
    - 216.239.36.21
    - 216.239.38.21
  AAAA Records:
    - 2001:4860:4802:32::15
    - 2001:4860:4802:34::15
    - 2001:4860:4802:36::15
    - 2001:4860:4802:38::15
```

---

**Next Steps:**
1. Update DNS records at registrar with correct IPs above
2. Wait 10 minutes for propagation (TTL=600)
3. Test https://hustlestats.io
4. SSL certificate should work immediately once DNS is correct

---

**Last Updated:** 2025-10-16 01:09 CDT
