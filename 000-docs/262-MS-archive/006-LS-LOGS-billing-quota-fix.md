# Billing Quota Increase Request - Hustle MVP

**Date:** 2025-10-03
**Project:** hustle-dev-202510
**Billing Account:** 01B257-163362-FC016A

---

## Error Details

```
ERROR: (gcloud.billing.projects.link) FAILED_PRECONDITION: Precondition check failed.
- '@type': type.googleapis.com/google.rpc.QuotaFailure
  violations:
  - description: 'Cloud billing quota exceeded: https://support.google.com/code/contact/billing_quota_increase'
    subject: billingAccounts/01B257-163362-FC016A
```

**Quota Hit:** `Projects per Billing Account` (currently 3/3)

**Current Projects Linked:**
1. diagnostic-pro-prod
2. creatives-diag-pro  
3. diagnosticpro-relay-1758728286

---

## Fix Steps

### Step 1: Access Quotas Page

**Option A - Direct Link:**
```
https://console.cloud.google.com/iam-admin/quotas
```

**Option B - Manual Navigation:**
1. Open Google Cloud Console: https://console.cloud.google.com
2. Click hamburger menu (☰) → **IAM & Admin** → **Quotas**

### Step 2: Find the Billing Quota

1. In the Quotas page filter bar, search for: `billing`
2. Look for quota named: **"Projects per billing account"** or similar
3. Current limit should show: **3**
4. Usage should show: **3/3 (100%)**

### Step 3: Request Increase

1. **Select the quota** by clicking the checkbox next to "Projects per billing account"
2. Click **"EDIT QUOTAS"** button at the top of the page
3. A form will appear on the right side

### Step 4: Fill Out Request Form

**New Quota Limit:** `10` (or higher if you plan more projects)

**Justification (copy/paste this):**
```
I am developing multiple applications under the Hustle MVP initiative and need to create additional GCP projects to properly manage and isolate resources for:

1. Development environment (hustle-dev-202510)
2. Staging/testing environments  
3. Production deployment

This increase will allow proper infrastructure separation following GCP best practices for environment isolation.
```

### Step 5: Submit Request

1. Click **"SUBMIT REQUEST"** button
2. You'll receive an email confirmation
3. Approval typically takes **1-48 hours**

---

## Alternative: Request via Support Form

If you can't find the quota in the console, use this direct link:
```
https://support.google.com/code/contact/billing_quota_increase
```

Fill out:
- **Quota Type:** Billing Account
- **Specific Quota:** Projects per Billing Account  
- **Current Limit:** 3
- **Requested Limit:** 10
- **Justification:** (use text above)

---

## What to Do While Waiting

**Option 1:** Use Firebase (FREE tier, no billing needed)
- Run: `firebase init` in the project directory
- Set up Firestore, Hosting, Functions
- Perfect for MVP validation phase

**Option 2:** Unlink unused project temporarily
```bash
# If you don't need one of the existing projects:
gcloud billing projects unlink [PROJECT_ID]

# Then link hustle-dev
gcloud billing projects link hustle-dev-202510 --billing-account=01B257-163362-FC016A
```

---

**Status:** Waiting for quota increase approval

