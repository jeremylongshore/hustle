'use client';

import type { JournalEntry, JournalMoodTag, JournalEnergyTag, JournalContext } from '@/types/domain';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  compact?: boolean;
}

const moodEmojis: Record<JournalMoodTag, string> = {
  great: '🔥',
  good: '😊',
  okay: '😐',
  struggling: '😔',
  rough: '😞',
};

const energyEmojis: Record<JournalEnergyTag, string> = {
  energized: '⚡',
  normal: '🔋',
  tired: '😴',
  exhausted: '🥱',
};

const contextIcons: Record<JournalContext, string> = {
  workout_reflection: '💪',
  mental_checkin: '🧠',
  game_reflection: '⚽',
  daily_journal: '📓',
  quick_entry: '✏️',
};

const contextColors: Record<JournalContext, { bg: string; text: string }> = {
  workout_reflection: { bg: 'bg-red-50', text: 'text-red-600' },
  mental_checkin: { bg: 'bg-purple-50', text: 'text-purple-600' },
  game_reflection: { bg: 'bg-green-50', text: 'text-green-600' },
  daily_journal: { bg: 'bg-blue-50', text: 'text-blue-600' },
  quick_entry: { bg: 'bg-gray-50', text: 'text-gray-600' },
};

/**
 * JournalEntryCard - Display a single journal entry
 *
 * Shows entry content, mood/energy tags, and context indicator
 */
export function JournalEntryCard({
  entry,
  onEdit,
  onDelete,
  onView,
  compact = false,
}: JournalEntryCardProps) {
  const colors = contextColors[entry.context];
  const icon = contextIcons[entry.context];

  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = new Date(entry.date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Truncate content for preview
  const previewContent =
    entry.content.length > 150
      ? entry.content.slice(0, 150) + '...'
      : entry.content;

  if (compact) {
    return (
      <div
        className={`flex items-start gap-3 p-3 rounded-lg ${colors.bg} cursor-pointer hover:opacity-90 transition-opacity`}
        onClick={onView}
        role={onView ? 'button' : undefined}
        tabIndex={onView ? 0 : undefined}
        onKeyDown={onView ? (e) => e.key === 'Enter' && onView() : undefined}
      >
        <span className="text-lg mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">{formattedDate}</span>
            {entry.moodTag && (
              <span className="text-sm">{moodEmojis[entry.moodTag]}</span>
            )}
            {entry.energyTag && (
              <span className="text-sm">{energyEmojis[entry.energyTag]}</span>
            )}
          </div>
          <p className="text-sm text-gray-700 line-clamp-2">{entry.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${colors.bg}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <span className={`text-sm font-medium ${colors.text} capitalize`}>
              {entry.context.replace(/_/g, ' ')}
            </span>
            <div className="text-xs text-gray-500">
              {formattedDate} at {formattedTime}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {entry.moodTag && (
            <span
              className="text-lg"
              title={`Mood: ${entry.moodTag}`}
              aria-label={`Mood: ${entry.moodTag}`}
            >
              {moodEmojis[entry.moodTag]}
            </span>
          )}
          {entry.energyTag && (
            <span
              className="text-lg"
              title={`Energy: ${entry.energyTag}`}
              aria-label={`Energy: ${entry.energyTag}`}
            >
              {energyEmojis[entry.energyTag]}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-gray-700 whitespace-pre-wrap">{compact ? previewContent : entry.content}</p>
      </div>

      {/* Links */}
      {(entry.linkedWorkoutId || entry.linkedGameId) && (
        <div className="px-4 py-2 bg-gray-50 border-t text-sm">
          {entry.linkedWorkoutId && (
            <span className="text-gray-500 mr-3">
              🔗 Linked to workout
            </span>
          )}
          {entry.linkedGameId && (
            <span className="text-gray-500">
              🔗 Linked to game
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {(onEdit || onDelete || onView) && (
        <div className="px-4 py-2 border-t flex justify-end gap-3">
          {onView && (
            <button
              type="button"
              onClick={onView}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default JournalEntryCard;
