# Paywall Integration Examples

**Phase 7 - Task 3: Locked Feature UX**

Examples of integrating `PaywallNotice` component into dashboard pages.

---

## Example 1: Player Creation Page

**File**: `src/app/dashboard/players/create/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { PaywallNotice } from '@/components/PaywallNotice';
import { PlayerForm } from '@/components/PlayerForm';

export default function CreatePlayerPage() {
  const router = useRouter();
  const access = useWorkspaceAccess();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loading state
  if (access.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Paywall: No write access
  if (!access.canCreatePlayers) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PaywallNotice
          feature="Player Creation"
          currentPlan={access.plan || 'free'}
          requiredPlan={access.plan === 'free' ? 'starter' : 'plus'}
          benefits={[
            'Create up to 15 players',
            'Track unlimited games per month',
            'Advanced statistics and insights',
            'Export data to PDF/CSV',
          ]}
        />
      </div>
    );
  }

  // Handler for player creation
  const handleCreatePlayer = async (playerData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/players/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create player');
      }

      const { player } = await response.json();
      router.push('/dashboard/players');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show player creation form if access allowed
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Player</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <PlayerForm onSubmit={handleCreatePlayer} loading={loading} />
    </div>
  );
}
```

---

## Example 2: Game Creation (Inline Paywall)

**File**: `src/app/dashboard/games/create/page.tsx`

```typescript
'use client';

import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { PaywallNoticeInline } from '@/components/PaywallNotice';
import { GameForm } from '@/components/GameForm';

export default function CreateGamePage() {
  const access = useWorkspaceAccess();

  if (access.loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Log New Game</h1>

      {/* Inline paywall notice (doesn't block UI) */}
      {!access.canCreateGames && (
        <PaywallNoticeInline
          feature="Game Logging"
          currentPlan={access.plan || 'free'}
          requiredPlan="starter"
          className="mb-6"
        />
      )}

      {/* Form disabled if no access */}
      <GameForm disabled={!access.canCreateGames} />
    </div>
  );
}
```

---

## Example 3: Analytics Page (Full Paywall)

**File**: `src/app/dashboard/analytics/page.tsx`

```typescript
'use client';

import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { PaywallNotice } from '@/components/PaywallNotice';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

export default function AnalyticsPage() {
  const access = useWorkspaceAccess();

  if (access.loading) {
    return <LoadingSpinner />;
  }

  // Advanced analytics requires Plus plan or higher
  const hasAnalyticsAccess = access.plan === 'plus' || access.plan === 'pro';

  if (!hasAnalyticsAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PaywallNotice
          feature="Advanced Analytics"
          currentPlan={access.plan || 'free'}
          requiredPlan="plus"
          message="Advanced Analytics helps you track player development, identify trends, and make data-driven decisions."
          benefits={[
            'Performance trends over time',
            'Position-specific insights',
            'Comparison with league averages',
            'Predictive player development',
            'Export reports to PDF',
          ]}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      <AnalyticsDashboard />
    </div>
  );
}
```

---

## Example 4: File Upload (Future - Phase 8)

**File**: `src/app/dashboard/players/[id]/photos/page.tsx`

```typescript
'use client';

import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { PaywallNoticeInline } from '@/components/PaywallNotice';
import { FileUploader } from '@/components/FileUploader';

export default function PlayerPhotosPage({ params }: { params: { id: string } }) {
  const access = useWorkspaceAccess();

  if (access.loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Player Photos</h1>

      {/* File uploads require Pro plan */}
      {!access.canUpload && (
        <PaywallNoticeInline
          feature="File Uploads"
          currentPlan={access.plan || 'free'}
          requiredPlan="pro"
          className="mb-6"
        />
      )}

      <FileUploader
        playerId={params.id}
        disabled={!access.canUpload}
        maxSizeMB={access.plan === 'pro' ? 10 : 0}
      />
    </div>
  );
}
```

---

## Example 5: Conditional Button Disable

**File**: `src/components/PlayerList.tsx`

```typescript
'use client';

import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import Link from 'next/link';

export function PlayerList() {
  const access = useWorkspaceAccess();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Players</h1>

        {/* Disable "Add Player" button if no write access */}
        {access.canCreatePlayers ? (
          <Link
            href="/dashboard/players/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Add Player
          </Link>
        ) : (
          <button
            disabled
            className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed"
            title="Upgrade your plan to add more players"
          >
            Add Player (Locked)
          </button>
        )}
      </div>

      {/* Player table */}
      <PlayerTable />
    </div>
  );
}
```

---

## Best Practices

### 1. **Full Paywall vs Inline**

**Use Full Paywall (`PaywallNotice`):**
- Entire feature is locked
- User should not see any UI for the feature
- Example: Analytics page (no analytics on free plan)

**Use Inline Paywall (`PaywallNoticeInline`):**
- Feature partially accessible
- User can see UI but can't interact
- Example: Player creation button disabled at limit

### 2. **Placement**

**Early Return Pattern (Full Paywall):**
```typescript
if (!access.canCreatePlayers) {
  return <PaywallNotice ... />;
}

// Rest of component only renders if access allowed
return <PlayerForm />;
```

**Conditional Rendering (Inline Paywall):**
```typescript
return (
  <div>
    {!access.canUpload && <PaywallNoticeInline ... />}
    <FileUploader disabled={!access.canUpload} />
  </div>
);
```

### 3. **Required Plan Selection**

Choose required plan based on feature:
- **Starter**: Basic features (player creation beyond free limit)
- **Plus**: Advanced features (analytics, unlimited games)
- **Pro**: Premium features (file uploads, team management)

### 4. **Benefits List**

Always include benefits to show value:
```typescript
<PaywallNotice
  feature="Advanced Analytics"
  benefits={[
    'Performance trends over time',   // Specific, not vague
    'Position-specific insights',     // Clear value prop
    'Export reports to PDF',          // Tangible benefit
  ]}
/>
```

### 5. **Loading States**

Always handle loading:
```typescript
if (access.loading) {
  return <LoadingSpinner />;
}
```

### 6. **Error States**

Show paywall on error (fail-safe):
```typescript
if (access.error || !access.canWrite) {
  return <PaywallNotice ... />;
}
```

---

## Integration Checklist

When adding paywall to a new feature:

- [ ] Import `useWorkspaceAccess` hook
- [ ] Check appropriate permission (`canCreatePlayers`, `canCreateGames`, etc.)
- [ ] Choose Full or Inline paywall component
- [ ] Set correct `requiredPlan` (starter, plus, or pro)
- [ ] Add benefits list (3-5 items)
- [ ] Handle loading state
- [ ] Test with different plan tiers
- [ ] Verify server-side enforcement also exists (API routes)

---

**Timestamp**: 2025-11-16
