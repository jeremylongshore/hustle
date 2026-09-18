# Hustlestats.io Domain Settings - Cloud Run Mapping

**Created:** 2025-10-16
**Project:** hustleapp-production (335713777643)
**Service:** hustle-app
**Region:** us-central1
**Status:** Domain mapping created, DNS update required

---

## Domain Mapping Status

**Domain:** hustlestats.io
**Mapped to:** hustle-app (Cloud Run service)
**Mapping Status:** Ready (CertificateProvisioned, DomainRoutable)
**SSL Certificate:** Will provision automatically after DNS propagation

---

## Required DNS Records at Domain Registrar

### For Apex Domain (hustlestats.io)

#### A Records (IPv4)
```
Type: A
Name: @
TTL: 3600
Value: 142.250.191.115
```

#### AAAA Records (IPv6 - Fully Expanded)
```
Type: AAAA
Name: @
TTL: 3600
Value: 2607:f8b0:4009:0817:0000:0000:0000:2013
```

### For WWW Subdomain (www.hustlestats.io)

#### CNAME Record
```
Type: CNAME
Name: www
TTL: 3600
Value: ghs.googlehosted.com
```

---

## Current DNS Configuration (Before Update)

**Current A Record:**
- hustlestats.io → 34.49.73.55 (OLD - from deleted project)

**Current WWW Record:**
- www.hustlestats.io → 34.49.73.55 (OLD - from deleted project)

---

## Cloud Run Service Details

**Service URL:** https://hustle-app-d4f2hb75nq-uc.a.run.app
**Service Name:** hustle-app
**Project ID:** hustleapp-production
**Project Number:** 335713777643
**Region:** us-central1

**Cloud Run IP Addresses (for reference only - NOT used for DNS):**
- IPv4: 34.143.72.2, 34.143.73.2, 34.143.74.2, 34.143.75.2, 34.143.76.2, 34.143.77.2, 34.143.78.2, 34.143.79.2
- IPv6: 2600:1900:4240:0200:0000:0000:0000:0000, 2600:1900:4241:0200:0000:0000:0000:0000, 2600:1900:4242:0200:0000:0000:0000:0000, 2600:1900:4243:0200:0000:0000:0000:0000, 2600:1900:4244:0200:0000:0000:0000:0000, 2600:1900:4245:0200:0000:0000:0000:0000, 2600:1901:81d4:0200:0000:0000:0000:0000, 2600:1901:81d5:0200:0000:0000:0000:0000

---

## Step-by-Step DNS Update Instructions

### 1. Login to Domain Registrar
Access the DNS management panel for hustlestats.io at your domain registrar.

### 2. Update Apex Domain (hustlestats.io)

**Delete old A record:**
- Type: A
- Name: @ or hustlestats.io
- Value: 34.49.73.55 ❌ DELETE THIS

**Add new A record:**
- Type: A
- Name: @ or hustlestats.io
- Value: 142.250.191.115 ✅ ADD THIS
- TTL: 3600

**Add new AAAA record (IPv6):**
- Type: AAAA
- Name: @ or hustlestats.io
- Value: 2607:f8b0:4009:0817:0000:0000:0000:2013 ✅ ADD THIS
- TTL: 3600

### 3. Update WWW Subdomain (www.hustlestats.io)

**Delete old A record:**
- Type: A
- Name: www
- Value: 34.49.73.55 ❌ DELETE THIS

**Add new CNAME record:**
- Type: CNAME
- Name: www
- Value: ghs.googlehosted.com ✅ ADD THIS
- TTL: 3600

### 4. Save Changes
Save all DNS changes at the registrar.

### 5. Wait for DNS Propagation
- Minimum: 5 minutes
- Typical: 15-30 minutes
- Maximum: 48 hours (rare)

---

## Verification Commands

### Check DNS Propagation
```bash
# Check A record
dig hustlestats.io A +short

# Check AAAA record
dig hustlestats.io AAAA +short

# Check WWW CNAME
dig www.hustlestats.io CNAME +short

# Expected output after propagation:
# A: 142.250.191.115
# AAAA: 2607:f8b0:4009:817::2013
# CNAME: ghs.googlehosted.com
```

### Test HTTPS Access
```bash
# Should return 200 OK after SSL certificate provisions
curl -I https://hustlestats.io

# Should redirect to hustlestats.io
curl -I https://www.hustlestats.io
```

---

## SSL Certificate Provisioning

**Provider:** Google-managed SSL certificate
**Provisioning Time:** 15-30 minutes after DNS propagation
**Status Check:**
```bash
gcloud beta run domain-mappings list \
  --project=hustleapp-production \
  --region=us-central1
```

**Expected Status:**
- Ready: ✅
- CertificateProvisioned: ✅
- DomainRoutable: ✅

---

## Post-DNS Update Tasks

### 1. Update Environment Variables
```bash
gcloud run services update hustle-app \
  --project=hustleapp-production \
  --region=us-central1 \
  --set-env-vars="NEXTAUTH_URL=https://hustlestats.io"
```

### 2. Verify Service Health
```bash
curl https://hustlestats.io/api/healthcheck
```

### 3. Test User Authentication
- Navigate to https://hustlestats.io
- Test login flow
- Verify session cookies are set correctly

---

## Troubleshooting

### DNS Not Propagating
```bash
# Check DNS propagation globally
dig @8.8.8.8 hustlestats.io A +short
dig @1.1.1.1 hustlestats.io A +short

# Flush local DNS cache (Linux)
sudo systemd-resolve --flush-caches
```

### SSL Certificate Not Provisioning
- Verify DNS points to correct Google IPs
- Wait at least 30 minutes after DNS propagation
- Check domain mapping status for errors
- Ensure domain is verified in Google Search Console

### 403 Forbidden Error
- Check IAM policy allows allUsers
- Verify organization policies don't block public access

### Connection Refused
- Verify Cloud Run service is running
- Check VPC connector connectivity
- Verify database connection string is correct

---

## Reference Links

**GCP Console:**
- Cloud Run: https://console.cloud.google.com/run?project=hustleapp-production
- Domain Mappings: https://console.cloud.google.com/run/domains?project=hustleapp-production
- Certificate Manager: https://console.cloud.google.com/security/ccm/list/lbCertificates?project=hustleapp-production

**Documentation:**
- Cloud Run Custom Domains: https://cloud.google.com/run/docs/mapping-custom-domains
- DNS Configuration: https://cloud.google.com/dns/docs/zones
- SSL Certificates: https://cloud.google.com/load-balancing/docs/ssl-certificates/google-managed-certs

---

**Last Updated:** 2025-10-16
**Next Action:** Update DNS records at domain registrar with values above
