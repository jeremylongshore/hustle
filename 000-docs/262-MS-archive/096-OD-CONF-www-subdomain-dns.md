# WWW Subdomain Configuration for Hustlestats.io

**Created:** 2025-10-16 01:18 CDT
**Status:** Domain mapping created, DNS update required

---

## WWW Subdomain DNS Record

### CNAME Record for www.hustlestats.io

```
Type: CNAME
Name: www
TTL: 600
Value: ghs.googlehosted.com.
```

**Note:** Make sure to include the trailing dot (.) after `googlehosted.com.` if your DNS provider requires it. Some providers add it automatically.

---

## What to Add at Your Domain Registrar

1. **Login to your domain registrar**

2. **Add CNAME record:**
   - Type: CNAME
   - Name: www
   - Value: ghs.googlehosted.com
   - TTL: 600

3. **Save changes**

4. **Wait 10 minutes** (your TTL is 600 seconds)

---

## Verification

### Check DNS propagation
```bash
# Should return: ghs.googlehosted.com
dig www.hustlestats.io CNAME +short
```

### Test HTTPS access
```bash
# Should work after DNS propagates (10-15 min)
curl -I https://www.hustlestats.io
```

---

## Expected Behavior

Once DNS propagates:
- https://www.hustlestats.io will work with SSL
- Both hustlestats.io and www.hustlestats.io will serve the same content
- Google manages the certificate automatically

---

## Domain Mapping Status

```yaml
Domain: www.hustlestats.io
Service: hustle-app
Region: us-central1
Status: Waiting for DNS configuration

Required DNS:
  CNAME: www -> ghs.googlehosted.com
```

---

## Complete DNS Configuration Summary

### Apex Domain (hustlestats.io)
- ✅ A Records: 216.239.32.21, 216.239.34.21, 216.239.36.21, 216.239.38.21
- ✅ Status: Working

### WWW Subdomain (www.hustlestats.io)
- ⏳ CNAME Record: www -> ghs.googlehosted.com
- ⏳ Status: Needs DNS update

---

**Last Updated:** 2025-10-16 01:18 CDT
**Next Action:** Add CNAME record for www subdomain at domain registrar
