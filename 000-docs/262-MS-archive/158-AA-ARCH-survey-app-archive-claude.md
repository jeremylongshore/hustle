# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Survey App** is a Next.js 15 application for collecting structured research data from parents of high school athletes. The app presents a 68-question survey across 15 sections, stores responses in PostgreSQL, and sends personalized thank you emails.

### Tech Stack
- **Framework**: Next.js 15.5.4 with App Router and Turbopack
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Resend API for transactional emails
- **AI**: Groq SDK (for future beta candidate analysis)
- **UI**: Tailwind CSS 4.0, React Hook Form, Zod validation

### Key Features
- Multi-section survey with progress persistence
- Demographic extraction for easy querying
- All 68 responses stored as structured JSON
- Automated thank you emails with personalized content
- AI analysis placeholders (beta fit scoring, segmentation)

## Common Commands

### Development

```bash
# Start dev server with Turbopack (port 3000)
npm run dev

# Build for production (uses Turbopack)
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Database Operations

```bash
# Generate Prisma client (run after schema changes)
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Create and apply migrations (production)
npx prisma migrate dev --name description_here
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Testing & Validation

```bash
# Test Resend email integration
node test-resend.js

# Test thank you email template
node test-thank-you-email.js

# Test Groq AI integration
node test-groq.js

# Full smoke test (requires running server)
./smoke-test.sh
```

## Architecture

### Database Schema (Prisma)

**SurveyResponse**
- Core fields: id (cuid), email (unique), phone
- Demographics: numAthletes, grades[], sports[], hoursPerWeek, recruitmentStatus, location
- Survey data: responses (JSON blob with all 68 answers)
- Progress: currentSection, completed
- AI analysis: aiScore, aiSummary, aiSegment, betaPriority, aiStrengths, aiConcerns, aiRecommendations
- Timestamps: submittedAt, analyzedAt, createdAt, updatedAt

**Design Pattern**: Demographics are extracted from the JSON responses and stored as top-level fields for efficient querying. All raw survey data is preserved in the `responses` JSON field.

### Directory Structure

```
survey-app/
├── app/
│   ├── api/
│   │   └── survey/
│   │       └── submit/route.ts    # POST handler for survey submission
│   ├── survey/
│   │   ├── [section]/page.tsx     # Dynamic survey section pages (1-15)
│   │   └── complete/page.tsx      # Thank you/completion page
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
├── lib/
│   ├── prisma.ts                  # Prisma client singleton
│   ├── survey-data.ts             # Survey questions (15 sections)
│   ├── survey-data-complete.ts    # Full 68-question dataset
│   ├── email.ts                   # Resend email utilities
│   └── email-templates.ts         # HTML/text email templates
├── prisma/
│   └── schema.prisma              # Database schema
├── public/                        # Static assets
└── test-*.js                      # Standalone test scripts
```

### Survey Data Structure

Survey is divided into 15 sections with 68 total questions:
1. Quick Start (consent)
2. Your Sports Family (athletes, grades, sports)
3. Current Tools (spreadsheets, apps, paper tracking)
4. Pain Points (current frustrations)
5. Features (desired functionality)
6. College Recruitment (interest, timeline, needs)
7. Time & Money (hours spent, budget)
8. Communication (coach/team interaction)
9. Data Priorities (statistics, highlights, trends)
10. Tech Comfort (smartphone usage, app preferences)
11. Sharing & Privacy (data sharing, privacy concerns)
12. Beta Testing (commitment level, feedback willingness)
13. The Big Picture (vision, frustrations, success criteria)
14. Wrap Up (location, final thoughts)
15. Stay Connected (email, phone for beta access)

Each section is defined in `lib/survey-data.ts` with:
- Section id, title, description
- Questions with id, text, type (radio/checkbox/text/email/phone/select/textarea/rating/ranking), required status, options

### Email Integration

**Resend Configuration**:
- Requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL` environment variables
- Gracefully degrades if not configured (logs warning, skips email)
- Uses lazy initialization to avoid build-time errors

**Thank You Email**:
- Sent after successful survey submission
- Personalized with recipient name (if provided)
- Includes HUSTLE vision, beta program details, next steps
- Gray monochrome design with professional formatting
- Tracks via Resend tags: `campaign: survey-thank-you`, `type: transactional`

### API Endpoints

**POST /api/survey/submit**
- Accepts full survey data (68 questions as JSON)
- Extracts demographics for indexed fields
- Stores all responses in `responses` JSON field
- Sends thank you email if email provided and configured
- Returns: `{ success, submissionId, message, emailSent, emailError }`
- Error handling: 409 for duplicate emails, 500 for server errors

**GET /api/survey/submit**
- Health check endpoint
- Tests database connection
- Returns: `{ status, endpoint, database, timestamp }`

## Environment Variables

Required variables (create `.env.local`):

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/survey_db"

# Email (optional, but recommended)
RESEND_API_KEY="re_xxxxxxxxxx"
RESEND_FROM_EMAIL="Survey <onboarding@yourdomain.com>"

# Groq AI (for future beta analysis)
GROQ_API_KEY="gsk_xxxxxxxxxx"
```

See `.env.example` for reference.

## Key Implementation Details

### Survey Progress Persistence

Currently, the survey does NOT persist progress between sessions. Users must complete all sections in one session. The `currentSection` field in the database is set to 15 upon completion.

**Future Enhancement**: Implement session-based progress saving using cookies or localStorage + backend synchronization.

### Duplicate Prevention

Email uniqueness is enforced at the database level (`@unique` constraint on `email` field). Attempting to submit with a duplicate email returns a 409 Conflict error.

**Edge Case**: If no email provided, uses fallback `anonymous-{timestamp}@survey.local` to ensure unique constraint is satisfied.

### Form Validation

Client-side validation uses React Hook Form + Zod schemas. Server-side validation extracts and validates required fields before database insertion.

### AI Analysis (Placeholder)

Database includes fields for AI-powered beta candidate analysis:
- `aiScore`: 0-100 beta fit score
- `aiSummary`: 2-3 sentence profile
- `aiSegment`: "Power Parent", "Casual User", "Recruiter-Focused", "Multi-Sport Manager"
- `betaPriority`: "HIGH", "MEDIUM", "LOW"
- `aiStrengths`, `aiConcerns`, `aiRecommendations`: JSON arrays

**Current Status**: Fields are defined but not populated. Requires separate analysis script using Groq API (see `test-groq.js` for example).

## Common Development Tasks

### Add New Survey Question

1. Edit `lib/survey-data.ts`
2. Add question to appropriate section
3. Update `survey-data-complete.ts` if maintaining parallel dataset
4. No database migration needed (JSON storage)
5. Update TypeScript interfaces if needed

### Modify Email Template

1. Edit `lib/email-templates.ts`
2. Update `generateThankYouEmail()` function
3. Modify both `html` and `text` versions
4. Test with `node test-thank-you-email.js`
5. Preview in Resend dashboard

### Add Database Field

1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` (dev) or create migration (prod)
3. Run `npx prisma generate` to update Prisma client
4. Update TypeScript types if needed
5. Restart dev server

### Query Survey Responses

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all completed surveys
const completed = await prisma.surveyResponse.findMany({
  where: { completed: true }
});

// Filter by demographics
const powerParents = await prisma.surveyResponse.findMany({
  where: {
    numAthletes: { gte: 3 },
    hoursPerWeek: { contains: '10+' }
  }
});

// Access full survey responses
const response = await prisma.surveyResponse.findUnique({
  where: { email: 'user@example.com' }
});
console.log(response.responses); // JSON object with all 68 answers
```

## Testing

Before deployment, verify:
- [ ] Survey loads and displays all 15 sections
- [ ] Form validation works (required fields, email format, phone format)
- [ ] Progress navigation (Next/Previous buttons)
- [ ] Submission saves to database
- [ ] Demographics are correctly extracted
- [ ] Thank you email sends (if configured)
- [ ] Duplicate email returns 409 error
- [ ] Database connection health check works

Run smoke test:
```bash
./smoke-test.sh
```

## Important Notes

- **Turbopack**: Build and dev use `--turbopack` flag for faster builds
- **Email Graceful Degradation**: App works without Resend configured (logs warnings)
- **JSON Storage**: All 68 responses stored as JSON for flexibility
- **Prisma Client**: Always regenerate after schema changes (`npx prisma generate`)
- **No Progress Persistence**: Users must complete survey in one session
- **TypeScript Strict Mode**: All code must pass strict type checking
- **Duplicate Prevention**: Email uniqueness enforced at database level

## Git Status Notes

Current uncommitted changes:
- `lib/email.ts` - Email utility implementation
- `test-thank-you-email.js` - Email testing script

Recent commits focus on:
- Converting email design to gray monochrome (Option 7)
- Implementing HUSTLE vision in email template
- Adding personalized thank you emails with Resend
- Bulletproofing thank you page redirect logic

---

**Last Updated**: 2025-10-08
**Version**: 1.0.0
**Status**: Active Development
