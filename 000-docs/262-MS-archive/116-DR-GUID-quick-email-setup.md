# ⚡ Quick Email Setup - 5 Minutes

**Goal:** Send personalized thank you emails after survey submission

---

## Step 1: Get Resend API Key (2 min)

1. Go to https://resend.com → Sign up (free!)
2. Dashboard → **API Keys** → **Create API Key**
3. Copy the key (starts with `re_`)

---

## Step 2: Add Environment Variables (1 min)

Add to `/08-Survey/survey-app/.env.local`:

```bash
# Resend Email Service
RESEND_API_KEY="re_paste_your_key_here"
RESEND_FROM_EMAIL="Hustle Survey <onboarding@resend.dev>"
```

**For Production (Netlify):**
- Go to Netlify dashboard → Site settings → Environment variables
- Add same two variables

---

## Step 3: Customize Your Personal Note (2 min)

**Option A:** Use default message (no action needed)

**Option B:** Add custom message to `.env.local`:

```bash
THANK_YOU_PERSONAL_NOTE="Hey! Thanks so much for completing the survey. Your feedback is incredibly valuable and will directly shape how we build Hustle. I'm personally reviewing every response and I'm excited about what we're building together! - Jeremy"
```

---

## Step 4: Test It (30 sec)

```bash
# Restart dev server
npm run dev

# Complete survey with YOUR email
# Check inbox for thank you email
```

---

## ✅ Done!

Emails will now send automatically after every survey submission.

**Free Tier:** 3,000 emails/month (plenty for beta testing)

---

## Need Help?

See full guide: `/08-Survey/EMAIL-SETUP-GUIDE.md`

**Common Issues:**
- No email received? Check console for `[Email]` logs
- Going to spam? Verify your domain in Resend
- Rate limit? Upgrade Resend plan or switch to SendGrid

---

**Status:** ✅ Ready to use
**Time to setup:** 5 minutes
**Cost:** Free (3,000 emails/month)
