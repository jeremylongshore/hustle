'use client';

import { JournalEntryCard } from './JournalEntryCard';
import { JournalQuickEntry } from './JournalQuickEntry';
import type { JournalEntry, JournalMoodTag, JournalEnergyTag, JournalContext } from '@/types/domain';

interface JournalWidgetProps {
  recentEntries: JournalEntry[];
  onSaveQuickEntry: (data: {
    content: string;
    moodTag: JournalMoodTag | null;
    energyTag: JournalEnergyTag | null;
    context: JournalContext;
  }) => void;
  onViewAll?: () => void;
  onViewEntry?: (entryId: string) => void;
  loading?: boolean;
  maxEntries?: number;
}

/**
 * JournalWidget - Dashboard widget for journal access
 *
 * Shows quick entry form and recent journal entries
 */
export function JournalWidget({
  recentEntries,
  onSaveQuickEntry,
  onViewAll,
  onViewEntry,
  loading = false,
  maxEntries = 3,
}: JournalWidgetProps) {
  const displayedEntries = recentEntries.slice(0, maxEntries);
  const hasMore = recentEntries.length > maxEntries;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-blue-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📓</span>
          <h3 className="font-semibold text-gray-800">Journal</h3>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View All
          </button>
        )}
      </div>

      {/* Quick Entry */}
      <div className="p-4 border-b">
        <JournalQuickEntry
          onSave={onSaveQuickEntry}
          placeholder="How are you feeling today?"
        />
      </div>

      {/* Recent Entries */}
      <div className="p-4">
        {displayedEntries.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <span className="text-3xl block mb-2">✨</span>
            <p className="text-sm">Start journaling to track your progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600">Recent Entries</h4>
            {displayedEntries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                compact
                onView={onViewEntry ? () => onViewEntry(entry.id) : undefined}
              />
            ))}
            {hasMore && onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                View {recentEntries.length - maxEntries} more entries →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JournalWidget;
