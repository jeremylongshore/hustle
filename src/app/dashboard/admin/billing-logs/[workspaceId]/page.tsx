/**
 * Admin Billing Logs Page
 *
 * Phase 7 Task 8: Full Subscription Lifecycle Ledger
 *
 * Read-only view of billing ledger events for a specific workspace.
 * Admin-only access via isAdmin() from @/lib/admin (ADMIN_USER_IDS, fails closed).
 *
 * Shows last 50 ledger entries with:
 * - Event type
 * - Timestamp
 * - Source (webhook, replay, auditor, manual, enforcement)
 * - Before/after deltas (status, plan)
 * - Stripe event ID
 * - Notes
 *
 * NO editing, NO buttons, NO actions - pure observability.
 */

import { Metadata } from 'next';
import { authWithProfile } from '@/lib/auth';
import { getBillingLedger } from '@/lib/stripe/ledger';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';

export const metadata: Metadata = {
  title: 'Billing Logs - Admin',
  description: 'Workspace billing event ledger (admin-only)',
};

interface PageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function BillingLogsPage({ params }: PageProps) {
  // 1. Authenticate user
  const user = await authWithProfile();

  if (!user) {
    redirect('/login');
  }

  // 2. Check admin access
  if (!isAdmin(user.uid)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="mb-2 text-xl font-semibold text-red-900">Access Denied</h1>
          <p className="text-red-700">This page is restricted to administrators only.</p>
        </div>
      </div>
    );
  }

  // 3. Resolve params (Next.js 15 async params)
  const { workspaceId } = await params;

  // 4. Fetch billing ledger (last 50 events)
  let ledgerEvents;
  try {
    ledgerEvents = await getBillingLedger(workspaceId, 50);
  } catch (error: any) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="mb-2 text-xl font-semibold text-red-900">Error Loading Ledger</h1>
          <p className="text-red-700">{error.message || 'Failed to load billing ledger'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Billing Event Ledger</h1>
        <p className="text-gray-600">
          Workspace: <span className="font-mono text-sm">{workspaceId}</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Read-only audit trail of all billing events (last 50 entries)
        </p>
      </div>

      {/* Ledger Events Table */}
      {ledgerEvents.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-gray-600">No billing events recorded for this workspace.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Event Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status Change
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Plan Change
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stripe Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {ledgerEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  {/* Timestamp */}
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {new Date(event.timestamp).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>

                  {/* Event Type */}
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                      {event.type}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        event.source === 'webhook'
                          ? 'bg-green-100 text-green-800'
                          : event.source === 'replay'
                            ? 'bg-purple-100 text-purple-800'
                            : event.source === 'auditor'
                              ? 'bg-yellow-100 text-yellow-800'
                              : event.source === 'manual'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {event.source}
                    </span>
                  </td>

                  {/* Status Change */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {event.statusBefore || event.statusAfter ? (
                      <span className="font-mono text-xs">
                        {event.statusBefore || '—'} → {event.statusAfter || '—'}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Plan Change */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {event.planBefore || event.planAfter ? (
                      <span className="font-mono text-xs">
                        {event.planBefore || '—'} → {event.planAfter || '—'}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Stripe Event ID */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {event.stripeEventId ? (
                      <span className="font-mono text-xs">{event.stripeEventId}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Note */}
                  <td className="max-w-md px-4 py-3 text-sm text-gray-600">
                    {event.note || <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Source Legend</h2>
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
          <div>
            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
              webhook
            </span>
            <span className="ml-2 text-gray-600">Stripe webhook event</span>
          </div>
          <div>
            <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
              replay
            </span>
            <span className="ml-2 text-gray-600">Event replay (drift fix)</span>
          </div>
          <div>
            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
              auditor
            </span>
            <span className="ml-2 text-gray-600">Drift detected</span>
          </div>
          <div>
            <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800">
              manual
            </span>
            <span className="ml-2 text-gray-600">Manual admin action</span>
          </div>
          <div>
            <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
              enforcement
            </span>
            <span className="ml-2 text-gray-600">Automatic enforcement</span>
          </div>
        </div>
      </div>
    </div>
  );
}
