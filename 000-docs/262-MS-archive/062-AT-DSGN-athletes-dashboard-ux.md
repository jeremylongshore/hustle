# 053-des-athletes-list-dashboard-ux

**Created**: 2025-10-09
**Type**: Design Specification
**Status**: Ready for Implementation
**Related Tasks**: Task 38 (Athletes List), Task 43 (Dashboard Stats)

---

## Executive Summary

This document defines the UI/UX specifications for two critical user-facing features:
1. **Athletes List Page** - A dedicated page displaying all athletes with empty states and add functionality
2. **Dashboard Stats Cards** - Enhanced dashboard cards with real data integration and conditional logic

Both designs maintain Hustle's minimal, professional aesthetic (zinc color scheme, Kiranism dashboard layout, shadcn/ui components) while prioritizing parent user needs and scalability.

---

## Design Philosophy

**Core Principles**:
- **Stripe-like Minimalism**: Clean, professional, no unnecessary color
- **Parent-First UX**: Quick access to what matters (athletes, games, progress)
- **Progressive Disclosure**: Show data when available, clear paths when empty
- **Touch-Friendly**: Large tap targets for mobile parents on-the-go
- **Consistent Patterns**: Reuse existing components, spacing, and interactions

**Color Palette** (Zinc-Only):
```
Primary Actions:   zinc-900 (#18181b)
Hover States:      zinc-800 (#27272a)
Borders:           zinc-200 (#e4e4e7)
Muted Text:        zinc-500 (#71717a)
Body Text:         zinc-900 (#18181b)
Backgrounds:       white (#ffffff) / zinc-50 (#fafafa)
Destructive:       red-600 (logout only)
```

**Typography Scale**:
```
Page Title:        text-3xl font-bold (30px)
Section Title:     text-lg font-semibold (18px)
Card Title:        text-sm font-medium (14px)
Body Text:         text-sm (14px)
Muted Text:        text-xs text-zinc-500 (12px)
```

**Spacing System**:
```
Component Gap:     gap-4 (16px)
Card Padding:      p-6 (24px)
Grid Gap:          gap-6 (24px)
Section Margin:    mb-4 (16px)
```

**Responsive Breakpoints**:
```
Mobile:   < 768px   (1 column grid)
Tablet:   768-1024px (2 column grid)
Desktop:  > 1024px   (3 column grid)
```

---

## TASK 38: Athletes List Page Design

### User Story
> "As a parent managing multiple child athletes, I need to see all my athletes at a glance so I can quickly access their individual profiles and track their performance."

### Route
`/dashboard/athletes`

### Page Structure

```
┌─────────────────────────────────────────────────────┐
│ [Sidebar]  │  Athletes List Page                    │
│            │  ┌──────────────────────────────────┐  │
│            │  │ Header Section                    │  │
│            │  │  - Title: "Athletes"              │  │
│            │  │  - Subtitle                       │  │
│            │  │  - Add Athlete Button (right)    │  │
│            │  └──────────────────────────────────┘  │
│            │                                         │
│            │  ┌──────────────────────────────────┐  │
│            │  │ Content Area                      │  │
│            │  │                                   │  │
│            │  │  [Empty State] OR [Athlete Grid] │  │
│            │  │                                   │  │
│            │  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

### Component Hierarchy

```typescript
<div className="flex flex-col gap-4">
  <HeaderSection />
  <ContentArea>
    {athletes.length === 0 ? <EmptyState /> : <AthleteGrid athletes={athletes} />}
  </ContentArea>
</div>
```

---

### 1. Header Section

**Purpose**: Orient user, provide primary action

**Visual Spec**:
```tsx
<div className="flex items-start justify-between">
  <div>
    <h1 className="text-3xl font-bold text-zinc-900">Athletes</h1>
    <p className="text-zinc-600 mt-2">
      Manage your athletes and their performance
    </p>
  </div>

  <Button className="bg-zinc-900 hover:bg-zinc-800">
    <User className="h-4 w-4" />
    Add Athlete
  </Button>
</div>
```

**Measurements**:
- Title: 30px bold, zinc-900
- Subtitle: 14px regular, zinc-600, 8px top margin
- Button: 36px height, 12px padding, zinc-900 background
- Button Icon: 16x16px, 12px gap from text

**Responsive Behavior**:
- Mobile: Stack vertically (button below text, full width)
- Tablet+: Horizontal layout with space-between

**Accessibility**:
- h1 landmark for screen readers
- Button has aria-label="Add new athlete"

---

### 2. Empty State Component

**Trigger**: `athletes.length === 0`

**Purpose**: Onboard new users, clear next step

**Visual Spec**:
```tsx
<Card className="border-zinc-200 border-dashed">
  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
      <Users className="w-8 h-8 text-zinc-400" />
    </div>

    <h3 className="text-lg font-semibold text-zinc-900 mb-2">
      No athletes yet
    </h3>

    <p className="text-sm text-zinc-500 mb-6 max-w-sm">
      Get started by adding your first athlete profile to begin tracking their performance
    </p>

    <Button className="bg-zinc-900 hover:bg-zinc-800" asChild>
      <Link href="/dashboard/add-athlete">
        <User className="h-4 w-4" />
        Add Your First Athlete
      </Link>
    </Button>
  </CardContent>
</Card>
```

**Measurements**:
- Card: Dashed border (border-dashed), rounded-xl
- Icon Container: 64x64px circle, zinc-100 background
- Icon: 32x32px, zinc-400
- Vertical spacing: 16px between elements
- Max content width: 512px (max-w-sm)
- Padding: py-16 (64px vertical)

**Interaction**:
- Button click → Navigate to `/dashboard/add-athlete`
- Entire card has subtle hover effect (optional): `hover:bg-zinc-50 transition-colors`

---

### 3. Athlete Grid Component

**Trigger**: `athletes.length > 0`

**Purpose**: Display all athletes, provide quick access to profiles

**Visual Spec**:
```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {athletes.map(athlete => (
    <AthleteCard key={athlete.id} athlete={athlete} />
  ))}

  <AddAthleteCard />
</div>
```

**Grid Specifications**:
- Mobile (< 768px): 1 column
- Tablet (768-1024px): 2 columns
- Desktop (> 1024px): 3 columns
- Gap: 24px (gap-6)
- Cards: Equal height via implicit grid behavior

**Layout Algorithm**:
```
Row 1: [Athlete 1] [Athlete 2] [Athlete 3]
Row 2: [Athlete 4] [Athlete 5] [Add New Card]
```

---

### 4. Athlete Card Component

**Purpose**: Visual summary of athlete, navigation to detail page

**Visual Spec**:
```tsx
<Card
  className="border-zinc-200 hover:shadow-lg transition-all cursor-pointer"
  onClick={() => router.push(`/dashboard/athletes/${athlete.id}`)}
>
  <CardContent className="p-6 flex flex-col items-center text-center">
    {/* Avatar */}
    <Avatar className="w-20 h-20 mb-4">
      <AvatarImage src={athlete.photoUrl} alt={athlete.name} />
      <AvatarFallback className="bg-zinc-200 text-zinc-700 text-xl font-semibold">
        {getInitials(athlete.name)}
      </AvatarFallback>
    </Avatar>

    {/* Name */}
    <h3 className="text-lg font-semibold text-zinc-900 mb-1 truncate w-full">
      {athlete.name}
    </h3>

    {/* Position & Age */}
    <p className="text-sm text-zinc-600 mb-2">
      {athlete.position} • Age {calculateAge(athlete.birthday)}
    </p>

    {/* Team/Club */}
    <p className="text-xs text-zinc-500 truncate w-full">
      {athlete.teamClub}
    </p>
  </CardContent>
</Card>
```

**Measurements**:
- Card Padding: 24px all sides
- Avatar Size: 80x80px (w-20 h-20)
- Avatar Margin Bottom: 16px
- Name: 18px font-semibold, zinc-900, truncate if > card width
- Meta Text: 14px, zinc-600, bullet separator (•)
- Team: 12px, zinc-500, truncate if > card width

**Avatar Logic**:
```typescript
// If photoUrl exists → Show image
// If photoUrl null → Show initials (first letter of first + last name)

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Examples:
// "John Doe" → "JD"
// "Maria" → "M"
// "Sarah Jane Smith" → "SS"
```

**Avatar Colors** (Deterministic):
```typescript
// Generate consistent color based on athlete ID
const colors = [
  'bg-blue-200 text-blue-700',
  'bg-green-200 text-green-700',
  'bg-purple-200 text-purple-700',
  'bg-orange-200 text-orange-700',
  'bg-pink-200 text-pink-700',
];

function getAvatarColor(id: string): string {
  const index = parseInt(id.slice(-1), 16) % colors.length;
  return colors[index];
}
```

**Interaction States**:
```css
/* Default */
box-shadow: 0 1px 3px rgba(0,0,0,0.1);

/* Hover */
box-shadow: 0 10px 30px rgba(0,0,0,0.15);
transform: translateY(-2px);
transition: all 0.2s ease;
cursor: pointer;

/* Active/Click */
transform: translateY(0px);
box-shadow: 0 5px 15px rgba(0,0,0,0.1);
```

**Accessibility**:
- Card is button role: `role="button"`
- Keyboard accessible: `tabindex="0"`
- Enter/Space triggers navigation
- Screen reader: "Navigate to {athlete.name} profile"

---

### 5. Add Athlete Card Component

**Purpose**: Always-visible CTA to add more athletes

**Visual Spec**:
```tsx
<Card
  className="border-zinc-200 border-dashed hover:border-zinc-400 hover:bg-zinc-50 transition-all cursor-pointer"
  onClick={() => router.push('/dashboard/add-athlete')}
>
  <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
      <Plus className="w-6 h-6 text-zinc-600" />
    </div>

    <p className="text-sm font-medium text-zinc-600">
      Add New Athlete
    </p>
  </CardContent>
</Card>
```

**Measurements**:
- Card: Dashed border, matches athlete card height (min-h-[200px])
- Icon Container: 48x48px circle, zinc-100 background
- Icon: 24x24px, zinc-600
- Text: 14px font-medium, zinc-600
- Centered vertically and horizontally

**Interaction States**:
```css
/* Default */
border: 2px dashed #e4e4e7;

/* Hover */
border-color: #a1a1aa;
background: #fafafa;
transition: all 0.2s ease;

/* Active */
background: #f4f4f5;
```

---

### 6. Loading State

**Trigger**: `isLoading === true`

**Visual Spec**:
```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {[1, 2, 3].map(i => (
    <Card key={i} className="border-zinc-200">
      <CardContent className="p-6 flex flex-col items-center">
        <Skeleton className="w-20 h-20 rounded-full mb-4" />
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  ))}
</div>
```

**Skeleton Animation**:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f4f4f5 25%,
    #e4e4e7 50%,
    #f4f4f5 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

### 7. Error State

**Trigger**: `error !== null`

**Visual Spec**:
```tsx
<Card className="border-red-200 bg-red-50">
  <CardContent className="p-6 text-center">
    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
    <h3 className="text-lg font-semibold text-red-900 mb-2">
      Failed to load athletes
    </h3>
    <p className="text-sm text-red-600 mb-4">
      {error.message}
    </p>
    <Button
      variant="outline"
      onClick={() => refetch()}
      className="border-red-300 text-red-700 hover:bg-red-100"
    >
      Try Again
    </Button>
  </CardContent>
</Card>
```

---

### Complete Page Component Props

```typescript
interface AthletesPageProps {
  // No props - fetches data internally
}

interface Athlete {
  id: string;
  name: string;
  birthday: Date;
  position: 'Forward' | 'Midfielder' | 'Defender' | 'Goalkeeper';
  teamClub: string;
  photoUrl: string | null;
  parentId: string;
}

interface AthleteCardProps {
  athlete: Athlete;
  onClick: (athleteId: string) => void;
}

interface AddAthleteCardProps {
  onClick: () => void;
}

interface EmptyStateProps {
  onAddClick: () => void;
}
```

---

## TASK 43: Dashboard Stats Cards Design

### User Story
> "As a parent on the dashboard, I need accurate stats reflecting my athletes' data so I understand our progress at a glance and know what actions to take next."

### Component Location
`/dashboard` page (existing file)

### Design Changes

---

### 1. Stats Cards Grid (Enhanced)

**Current State**: Hardcoded "0" values
**New State**: Dynamic data from database

**Visual Spec** (Structure unchanged):
```tsx
<div className="grid gap-6 md:grid-cols-3">
  <TotalGamesCard />
  <ThisSeasonCard />
  <DevelopmentScoreCard />
</div>
```

---

### 2. Total Games Card (Enhanced)

**Purpose**: Show cumulative games across all athletes

**Data Logic**:
```typescript
// Fetch total game count
const totalGames = await prisma.game.count({
  where: {
    player: {
      parentId: session.user.id
    }
  }
});
```

**Visual Spec**:
```tsx
<Card className="border-zinc-200">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-zinc-600">
      Total Games
    </CardTitle>
    <Calendar className="h-4 w-4 text-zinc-500" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-zinc-900">
      {totalGames}
    </div>
    <p className="text-xs text-zinc-500 mt-1">
      {totalGames === 0
        ? 'No games logged yet'
        : totalGames === 1
        ? '1 game logged'
        : `${totalGames} games logged`}
    </p>
  </CardContent>
</Card>
```

**Subtitle Logic**:
```
0 games   → "No games logged yet"
1 game    → "1 game logged"
2+ games  → "X games logged"
```

---

### 3. This Season Card (Enhanced)

**Purpose**: Show games in current soccer season

**Data Logic**:
```typescript
// Determine current season
// Assumption: Season runs Aug 1 - July 31
function getCurrentSeasonDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  if (month >= 7) { // Aug-Dec (months 7-11)
    return {
      start: new Date(year, 7, 1), // Aug 1 this year
      end: new Date(year + 1, 6, 31) // July 31 next year
    };
  } else { // Jan-July (months 0-6)
    return {
      start: new Date(year - 1, 7, 1), // Aug 1 last year
      end: new Date(year, 6, 31) // July 31 this year
    };
  }
}

const { start, end } = getCurrentSeasonDates();

const seasonGames = await prisma.game.count({
  where: {
    player: { parentId: session.user.id },
    date: {
      gte: start,
      lte: end
    }
  }
});
```

**Visual Spec**:
```tsx
<Card className="border-zinc-200">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-zinc-600">
      This Season
    </CardTitle>
    <TrendingUp className="h-4 w-4 text-zinc-500" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-zinc-900">
      {seasonGames}
    </div>
    <p className="text-xs text-zinc-500 mt-1">
      {seasonGames === 0
        ? 'Start tracking games'
        : `${seasonGames} ${seasonGames === 1 ? 'game' : 'games'} this season`}
    </p>
  </CardContent>
</Card>
```

**Subtitle Logic**:
```
0 games   → "Start tracking games"
1 game    → "1 game this season"
2+ games  → "X games this season"
```

---

### 4. Development Score Card (Unchanged)

**Purpose**: Placeholder for future ML feature

**Visual Spec** (No changes):
```tsx
<Card className="border-zinc-200">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-zinc-600">
      Development Score
    </CardTitle>
    <Target className="h-4 w-4 text-zinc-500" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-zinc-900">--</div>
    <p className="text-xs text-zinc-500 mt-1">
      Complete profile to unlock
    </p>
  </CardContent>
</Card>
```

**Future Enhancement**:
```typescript
// When implemented:
// - Score calculated from: games played, goals/assists, consistency
// - Range: 0-100
// - Color-coded: < 40 (red), 40-70 (yellow), 70+ (green)
```

---

### 5. Quick Actions Card (Enhanced)

**Purpose**: Context-aware CTAs based on user state

**Current State**: Both buttons always enabled
**New State**: Conditional logic based on athlete count

**Data Logic**:
```typescript
const athleteCount = await prisma.player.count({
  where: { parentId: session.user.id }
});
```

**Visual Spec**:
```tsx
<Card className="border-zinc-200">
  <CardHeader>
    <CardTitle className="text-lg">Quick Actions</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* Add Athlete - Always enabled */}
    <Link href="/dashboard/add-athlete">
      <Button className="w-full justify-start gap-3 h-12 bg-zinc-900 hover:bg-zinc-800">
        <User className="h-5 w-5" />
        <span className="font-medium">Add Athlete</span>
      </Button>
    </Link>

    {/* Log a Game - Conditional */}
    <LogGameButton athleteCount={athleteCount} />
  </CardContent>
</Card>
```

**Log Game Button Component**:
```tsx
interface LogGameButtonProps {
  athleteCount: number;
}

function LogGameButton({ athleteCount }: LogGameButtonProps) {
  if (athleteCount === 0) {
    // Disabled state with tooltip
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="w-full justify-start gap-3 h-12 bg-zinc-700 hover:bg-zinc-600"
            disabled
          >
            <PlusCircle className="h-5 w-5" />
            <span className="font-medium">Log a Game</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add an athlete first</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (athleteCount === 1) {
    // Single athlete - direct navigation
    return (
      <Link href={`/dashboard/log-game?athleteId=${athlete.id}`}>
        <Button className="w-full justify-start gap-3 h-12 bg-zinc-700 hover:bg-zinc-600">
          <PlusCircle className="h-5 w-5" />
          <span className="font-medium">Log a Game</span>
        </Button>
      </Link>
    );
  }

  // Multiple athletes - dropdown selector
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full justify-start gap-3 h-12 bg-zinc-700 hover:bg-zinc-600">
          <PlusCircle className="h-5 w-5" />
          <span className="font-medium">Log a Game</span>
          <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        <DropdownMenuLabel>Select Athlete</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {athletes.map(athlete => (
          <DropdownMenuItem key={athlete.id} asChild>
            <Link href={`/dashboard/log-game?athleteId=${athlete.id}`}>
              <Avatar className="w-6 h-6 mr-2">
                <AvatarImage src={athlete.photoUrl} />
                <AvatarFallback>{getInitials(athlete.name)}</AvatarFallback>
              </Avatar>
              <span>{athlete.name}</span>
              <span className="ml-auto text-xs text-zinc-500">
                {athlete.position}
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Interaction Matrix**:

| Athletes | Button State | Behavior | Visual Indicator |
|----------|--------------|----------|------------------|
| 0 | Disabled | Show tooltip "Add athlete first" | Cursor not-allowed, opacity-50 |
| 1 | Enabled | Navigate to `/dashboard/log-game?athleteId={id}` | Normal hover |
| 2+ | Enabled | Show dropdown menu to select athlete | ChevronDown icon |

**Dropdown Menu Specs**:
- Width: 300px
- Max Height: 400px (scrollable if > 10 athletes)
- Item Height: 40px
- Avatar: 24x24px
- Hover: zinc-100 background
- Click: Navigate to log-game with athleteId

---

### Component Props

```typescript
interface DashboardStats {
  totalGames: number;
  seasonGames: number;
  developmentScore: number | null; // null = not yet calculated
}

interface QuickActionsProps {
  athleteCount: number;
  athletes: Array<{
    id: string;
    name: string;
    position: string;
    photoUrl: string | null;
  }>;
}

interface LogGameButtonProps {
  athleteCount: number;
  athletes?: Array<{
    id: string;
    name: string;
    position: string;
    photoUrl: string | null;
  }>;
}
```

---

## Implementation Checklist

### Athletes List Page (Task 38)
- [ ] Create `/dashboard/athletes/page.tsx`
- [ ] Implement header section with title + CTA
- [ ] Create `EmptyState` component with dashed border card
- [ ] Create `AthleteCard` component with avatar, name, position, team
- [ ] Create `AddAthleteCard` component with dashed border
- [ ] Implement athlete grid with responsive breakpoints
- [ ] Add avatar fallback logic (initials generator)
- [ ] Add deterministic avatar colors
- [ ] Implement hover effects on cards
- [ ] Add loading skeleton state
- [ ] Add error state with retry button
- [ ] Create utility function `calculateAge(birthday: Date): number`
- [ ] Create utility function `getInitials(name: string): string`
- [ ] Test with 0, 1, 3, 10, 50 athletes
- [ ] Verify mobile responsiveness
- [ ] Test keyboard navigation
- [ ] Add screen reader labels

### Dashboard Stats (Task 43)
- [ ] Update `/dashboard/page.tsx` to be server component
- [ ] Fetch real game count from database
- [ ] Implement `getCurrentSeasonDates()` utility
- [ ] Update Total Games card with dynamic count
- [ ] Update This Season card with season filter
- [ ] Update subtitle logic for plural/singular
- [ ] Create `LogGameButton` component
- [ ] Implement disabled state (0 athletes)
- [ ] Implement direct link (1 athlete)
- [ ] Implement dropdown menu (2+ athletes)
- [ ] Style dropdown with avatars
- [ ] Add tooltip to disabled button
- [ ] Test all 3 states (0, 1, 2+ athletes)
- [ ] Verify navigation URLs work
- [ ] Test dropdown scrolling (10+ athletes)

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance

**Keyboard Navigation**:
- All cards focusable with Tab key
- Enter/Space activates card click
- Dropdown menu navigable with arrow keys
- Escape closes dropdown

**Screen Reader Support**:
- `aria-label` on all interactive elements
- `role="button"` on clickable cards
- `aria-disabled="true"` on disabled buttons
- `aria-expanded` on dropdown triggers
- Alt text on all images/avatars

**Color Contrast**:
- Text on white: 4.5:1 minimum (zinc-900 passes)
- Icon gray: 3:1 minimum (zinc-500 passes)
- Disabled text: 3:1 minimum (zinc-400 passes)

**Focus Indicators**:
- Visible focus ring on all interactive elements
- `ring-2 ring-offset-2 ring-zinc-900`
- Focus visible in high contrast mode

---

## Performance Targets

### Athletes List Page
- First Contentful Paint: < 1.5s
- Time to Interactive: < 2.5s
- Largest Contentful Paint: < 2.5s
- Image loading: Lazy load below fold + blur placeholder

### Dashboard Stats
- Stats calculation: < 100ms (indexed DB queries)
- No visual layout shift (skeleton states)
- Smooth dropdown animation (< 300ms)

---

## Responsive Design Matrix

### Mobile (< 768px)
```
- Single column grid
- Full-width cards
- Stack header (title above button)
- 16px horizontal padding
- 48px minimum tap target
```

### Tablet (768-1024px)
```
- 2 column grid for athletes
- Horizontal header layout
- 24px horizontal padding
- Sidebar collapsible
```

### Desktop (> 1024px)
```
- 3 column grid for athletes
- Full sidebar visible
- 32px horizontal padding
- Hover effects enabled
```

---

## Animation Specifications

### Card Hover
```css
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover */
transform: translateY(-2px);
box-shadow: 0 10px 30px rgba(0,0,0,0.15);

/* Active */
transform: translateY(0);
box-shadow: 0 5px 15px rgba(0,0,0,0.1);
```

### Dropdown Menu
```css
/* Enter */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

animation: slideDown 200ms ease-out;
```

### Skeleton Loading
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

animation: shimmer 1.5s ease-in-out infinite;
```

---

## Testing Scenarios

### Athletes List Page
1. **Empty State**: User has 0 athletes → Show empty state with CTA
2. **Single Athlete**: 1 athlete → Grid with 1 card + add card
3. **Multiple Athletes**: 3 athletes → Responsive grid layout
4. **Large Dataset**: 50 athletes → Verify performance, scrolling
5. **Loading State**: API delay → Show skeleton cards
6. **Error State**: API failure → Show error with retry
7. **No Photo**: Athlete without photo → Show initials fallback
8. **Long Names**: "Christopher Alexander" → Truncate properly
9. **Long Team**: "Manchester United Academy" → Truncate
10. **Mobile View**: Resize to 375px → Single column, touch targets

### Dashboard Stats
1. **New User**: 0 athletes, 0 games → "No games yet", disabled button
2. **One Athlete**: 1 athlete, 0 games → Direct link enabled
3. **Multiple Athletes**: 3 athletes → Dropdown menu works
4. **Current Season**: Games logged Aug-Dec → Season count accurate
5. **Previous Season**: Games from last year → Not counted in "This Season"
6. **Edge Case**: Season boundary (July 31/Aug 1) → Dates correct
7. **Dropdown Scroll**: 15 athletes → Menu scrolls properly
8. **Tooltip**: Hover disabled button → Tooltip shows
9. **Navigation**: Click dropdown item → Correct URL with athleteId

---

## Design Rationale

### Why Zinc (Not Blue)?
- **Professional**: Matches Stripe, Linear, Vercel (trusted SaaS)
- **Focus**: Neutral palette keeps focus on data, not decoration
- **Scalability**: Easy to add accent colors later without clashing
- **Timeless**: Won't feel dated in 2-3 years

### Why Card-Based Layout?
- **Scannable**: Parents can quickly count/identify athletes
- **Mobile-Friendly**: Cards stack naturally on small screens
- **Touch-Optimized**: Large tap targets, no tiny buttons
- **Expandable**: Easy to add stats/badges to cards later

### Why Empty States?
- **Onboarding**: Guides new users to first action
- **Confidence**: Shows system is working (not broken)
- **Conversion**: Clear CTA increases first-athlete creation

### Why Conditional Logic?
- **Progressive Disclosure**: Only show options when relevant
- **Error Prevention**: Can't log game without athlete
- **Efficiency**: Single athlete skips unnecessary menu

---

## Future Enhancements (Out of Scope)

### Athletes List
- [ ] Sort options (name, age, position, recent activity)
- [ ] Filter by position or team
- [ ] Search bar for large rosters
- [ ] Bulk actions (select multiple, archive)
- [ ] Stats preview on card hover
- [ ] "Star" favorite athlete

### Dashboard Stats
- [ ] Goal trend chart (last 5 games)
- [ ] Comparison to season average
- [ ] Milestone badges (10 games, 50 goals, etc)
- [ ] Social sharing (proud parent posts)
- [ ] Coach insights (AI recommendations)

---

## Handoff Notes for Developer

### Implementation Order
1. Athletes List empty state (simplest)
2. Single athlete card (core component)
3. Athlete grid layout (responsive)
4. Dashboard stats data fetching (backend)
5. Log Game button logic (conditional rendering)
6. Dropdown menu (most complex)

### Key Files to Create
```
src/app/dashboard/athletes/page.tsx      # Main athletes page
src/components/athletes/athlete-card.tsx # Reusable athlete card
src/components/athletes/empty-state.tsx  # Empty state
src/components/dashboard/log-game-button.tsx # Conditional button
src/lib/utils/date.ts                    # Season calculation
src/lib/utils/avatar.ts                  # Initials, colors
```

### Database Queries
```typescript
// Athletes list
const athletes = await prisma.player.findMany({
  where: { parentId: session.user.id },
  orderBy: { name: 'asc' }
});

// Total games
const totalGames = await prisma.game.count({
  where: { player: { parentId: session.user.id } }
});

// Season games
const { start, end } = getCurrentSeasonDates();
const seasonGames = await prisma.game.count({
  where: {
    player: { parentId: session.user.id },
    date: { gte: start, lte: end }
  }
});
```

### Design Tokens to Use
```typescript
// Colors
const colors = {
  primary: 'zinc-900',
  primaryHover: 'zinc-800',
  border: 'zinc-200',
  muted: 'zinc-500',
  background: 'white',
  backgroundAlt: 'zinc-50'
};

// Spacing
const spacing = {
  cardPadding: 'p-6',
  gridGap: 'gap-6',
  sectionGap: 'gap-4'
};

// Typography
const text = {
  pageTitle: 'text-3xl font-bold',
  sectionTitle: 'text-lg font-semibold',
  cardTitle: 'text-sm font-medium',
  body: 'text-sm',
  muted: 'text-xs text-zinc-500'
};
```

---

## Sign-off

**Design Complete**: ✅
**Ready for Implementation**: ✅
**Accessibility Reviewed**: ✅
**Responsive Specs Defined**: ✅

**Next Steps**: Developer can begin implementation following this spec. For any design questions or edge cases not covered, escalate to design review.

---

**Document End**
**Last Updated**: 2025-10-09
**Design System Version**: Hustle v2.0 (Zinc + Kiranism)
