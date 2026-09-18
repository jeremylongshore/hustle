# Contributing to Hustle

Thanks for your interest in making Hustle better! This guide will help you contribute effectively.

---

## 🎯 Philosophy

We're building something real for parents and young athletes. Every contribution should:
- Solve a real problem
- Be well-tested
- Follow our coding standards
- Include clear documentation

**Quality over speed. Always.**

---

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR-USERNAME/hustle.git
cd hustle
```

### 2. Install Dependencies

```bash
# Install Node packages
npm install

# Generate Prisma client
npx prisma generate
```

### 3. Set Up Environment

```bash
# Copy environment template
cp .env.example .env.local

# Update with your local database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/hustle_mvp"
# NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### 4. Run Locally

```bash
# Start development server (port 4000)
npm run dev -- -p 4000

# Visit http://localhost:4000
```

---

## 📋 Development Workflow

### Create a Feature Branch

**Never commit directly to `main`**

```bash
# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Examples:
# feature/game-logging-ui
# fix/auth-session-bug
# docs/deployment-guide
```

### Make Your Changes

- Write clean, readable code
- Follow TypeScript strict mode
- Add comments for complex logic
- Update relevant documentation

### Test Your Changes

```bash
# Run linter
npm run lint

# Run build
npm run build

# Test manually
npm run dev -- -p 4000

# Check database migrations
npx prisma migrate dev
```

### Commit Your Changes

**Use conventional commits format:**

```bash
# Format: type(scope): description

git commit -m "feat(games): add game logging form UI"
git commit -m "fix(auth): resolve session timeout issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(api): simplify player creation logic"
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

### Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Use the PR template (auto-filled)
```

---

## 🎨 Code Standards

### TypeScript

```typescript
// ✅ Good: Explicit types, clear names
interface PlayerFormData {
  name: string;
  birthday: Date;
  position: string;
  teamClub: string;
}

function createPlayer(data: PlayerFormData): Promise<Player> {
  return prisma.player.create({ data });
}

// ❌ Bad: Implicit any, unclear names
function create(d) {
  return prisma.player.create({ data: d });
}
```

### React Components

```tsx
// ✅ Good: TypeScript, clear props, extracted logic
interface PlayerCardProps {
  player: Player;
  onEdit: (id: string) => void;
}

export function PlayerCard({ player, onEdit }: PlayerCardProps) {
  const age = calculateAge(player.birthday);

  return (
    <Card>
      <CardHeader>{player.name}</CardHeader>
      <CardContent>Age: {age}</CardContent>
      <Button onClick={() => onEdit(player.id)}>Edit</Button>
    </Card>
  );
}

// ❌ Bad: No types, inline calculations, unclear
export function Card({ p }) {
  return <div>{p.name} - {new Date().getFullYear() - p.birthday.getFullYear()}</div>
}
```

### API Routes

```typescript
// ✅ Good: Auth check, error handling, typed
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const players = await prisma.player.findMany({
      where: { parentId: session.user.id }
    });

    return NextResponse.json({ players });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

// ❌ Bad: No auth, no error handling, returns everything
export async function GET() {
  const players = await prisma.player.findMany();
  return NextResponse.json(players);
}
```

### File Naming

```
✅ Good:
- player-card.tsx
- game-logging-form.tsx
- use-mobile.tsx
- api/players/route.ts

❌ Bad:
- PlayerCard.tsx (use kebab-case for files)
- gameLoggingForm.tsx
- useMobile.tsx
- api/GetPlayers.ts (routes are always route.ts)
```

---

## 🔒 Security Guidelines

### Never Commit Secrets

```bash
# ❌ Never commit these files
.env
.env.local
.env.production

# ✅ Use environment variables
DATABASE_URL=...
NEXTAUTH_SECRET=...
```

### Always Validate Input

```typescript
// ✅ Good: Validate all input
const { email, password } = body;

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
}

if (!password || password.length < 8) {
  return NextResponse.json({ error: 'Password must be 8+ characters' }, { status: 400 });
}
```

### Use Session-Based Authorization

```typescript
// ✅ Good: Get user ID from session
const session = await auth();
const players = await prisma.player.findMany({
  where: { parentId: session.user.id }
});

// ❌ Bad: Trust user ID from request body
const { userId } = await request.json();
const players = await prisma.player.findMany({
  where: { parentId: userId }
});
```

---

## 📝 Documentation Standards

### Update Docs When You:

- Add a new feature
- Change existing behavior
- Fix a significant bug
- Modify the database schema
- Update infrastructure

### Required Documentation

```
01-Docs/
├── NNN-abv-feature-name.md  # Chronological numbering
│
# Example:
├── 029-feat-game-logging-ui.md
├── 030-fix-session-timeout.md
├── 031-ref-api-endpoints.md
```

### Documentation Format

```markdown
# [Type] - [Feature Name]

**Date:** YYYY-MM-DD
**Author:** Your Name
**Status:** Complete/In Progress/Planned

## Overview
Brief description of what this is about.

## Details
Technical implementation details.

## Related Files
- src/app/api/games/route.ts
- src/components/game-form.tsx

## Testing
How to test this feature.
```

---

## 🧪 Testing Requirements

### Before Submitting PR

- [ ] Code runs without errors
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing complete
- [ ] Database migrations work
- [ ] No console errors or warnings
- [ ] TypeScript compiles cleanly

### Manual Testing Checklist

For any UI changes:
- [ ] Test on desktop browser
- [ ] Test on mobile viewport
- [ ] Test with keyboard navigation
- [ ] Test all interactive elements

For any API changes:
- [ ] Test authenticated requests
- [ ] Test unauthenticated requests (should fail)
- [ ] Test invalid input (should error gracefully)
- [ ] Test edge cases

---

## 📬 Pull Request Process

### 1. Create PR

Use the pull request template (auto-filled):
- Clear title following conventional commits
- Detailed description of changes
- List of what was tested
- Screenshots for UI changes

### 2. Code Review

- Address all review comments
- Make requested changes
- Re-request review when ready
- Be open to feedback

### 3. Merge Requirements

PR must:
- [ ] Pass all checks
- [ ] Have at least 1 approval
- [ ] Be up to date with `main`
- [ ] Have no merge conflicts
- [ ] Include documentation updates

### 4. After Merge

- Delete your feature branch
- Pull latest `main` for next feature
- Update your local environment

---

## 🔄 Versioning & Releases

### Version System

**We use sequential versioning: `v00.00.00` → `v00.00.01` → `v00.00.02`**

See `VERSION.md` for complete details.

### Release Process

**Only maintainers create releases.**

Contributors:
- Focus on features and fixes
- Document changes in CHANGELOG.md
- Maintainers handle version tagging

See `RELEASES.md` for the full release process.

---

## 🐛 Bug Reports

### Before Reporting

- Check existing issues
- Verify it's reproducible
- Test on latest version
- Gather error details

### Report Template

```markdown
**Bug Description**
Clear description of the issue.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- Browser: Chrome 120
- OS: macOS 14
- Version: v00.00.05

**Screenshots**
If applicable.

**Error Logs**
Console errors or stack traces.
```

---

## 💡 Feature Requests

### Before Requesting

- Check ROADMAP.md
- Search existing discussions
- Consider if it fits the vision

### Request Template

```markdown
**Feature Description**
Clear description of the feature.

**Problem it Solves**
What problem does this address?

**Proposed Solution**
How would this work?

**Alternatives Considered**
Other ways to solve this.

**Additional Context**
Any other relevant info.
```

---

## 🤝 Code of Conduct

### Be Respectful

- Treat everyone with respect
- Welcome newcomers
- Give constructive feedback
- Assume good intentions

### Be Collaborative

- Share knowledge
- Help others learn
- Review PRs thoughtfully
- Document your decisions

### Be Professional

- Keep discussions on-topic
- Avoid inflammatory language
- Focus on the code, not the person
- Resolve conflicts privately

---

## 📞 Getting Help

### Questions?

- **Documentation:** Check README.md, CLAUDE.md, and `01-Docs/`
- **Discussions:** Open a GitHub Discussion
- **Issues:** Search existing issues first
- **Chat:** [Slack/Discord link if available]

### Stuck?

Don't stay stuck! Ask for help:
1. Describe what you're trying to do
2. Share what you've tried
3. Include error messages
4. Mention your environment

**We want you to succeed!**

---

## 🎓 Learning Resources

### New to Next.js?
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn Course](https://nextjs.org/learn)

### New to NextAuth?
- [NextAuth.js v5 Docs](https://authjs.dev)
- [NextAuth.js Examples](https://next-auth.js.org/getting-started/example)

### New to Prisma?
- [Prisma Quickstart](https://www.prisma.io/docs/getting-started/quickstart)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### New to TypeScript?
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app)

---

**Thank you for contributing to Hustle! Together we're building something meaningful.**

---

**Last Updated:** 2025-10-05
