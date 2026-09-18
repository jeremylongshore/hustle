'use client';

import { useState, useCallback } from 'react';
import type { JournalContext, JournalMoodTag, JournalEnergyTag } from '@/types/domain';

interface JournalQuickEntryProps {
  context?: JournalContext;
  linkedWorkoutId?: string;
  linkedGameId?: string;
  onSave: (data: {
    content: string;
    moodTag: JournalMoodTag | null;
    energyTag: JournalEnergyTag | null;
    context: JournalContext;
    linkedWorkoutId?: string;
    linkedGameId?: string;
  }) => void;
  onExpand?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const quickMoods: { value: JournalMoodTag; emoji: string }[] = [
  { value: 'great', emoji: '🔥' },
  { value: 'good', emoji: '😊' },
  { value: 'okay', emoji: '😐' },
  { value: 'struggling', emoji: '😔' },
];

/**
 * JournalQuickEntry - Compact journal entry form
 *
 * Minimal interface for quick notes with optional mood selection
 */
export function JournalQuickEntry({
  context = 'quick_entry',
  linkedWorkoutId,
  linkedGameId,
  onSave,
  onExpand,
  placeholder = 'Quick note...',
  disabled = false,
}: JournalQuickEntryProps) {
  const [content, setContent] = useState('');
  const [moodTag, setMoodTag] = useState<JournalMoodTag | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSave = useCallback(() => {
    if (!content.trim()) return;

    onSave({
      content: content.trim(),
      moodTag,
      energyTag: null,
      context,
      linkedWorkoutId,
      linkedGameId,
    });

    // Reset form
    setContent('');
    setMoodTag(null);
    setIsFocused(false);
  }, [content, moodTag, context, linkedWorkoutId, linkedGameId, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  const isValid = content.trim().length > 0;
  const showExpanded = isFocused || content.length > 0;

  return (
    <div className={`bg-white rounded-lg border transition-all ${
      showExpanded ? 'shadow-md' : 'shadow-sm'
    }`}>
      <div className="p-3">
        <div className="flex items-start gap-2">
          <span className="text-lg mt-1">✏️</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={showExpanded ? 3 : 1}
            className="flex-1 resize-none border-0 focus:ring-0 focus:outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm"
            aria-label="Quick journal entry"
          />
        </div>

        {/* Quick actions - visible when focused */}
        {showExpanded && (
          <div className="mt-3 flex items-center justify-between">
            {/* Quick mood selection */}
            <div className="flex items-center gap-1">
              {quickMoods.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setMoodTag(moodTag === mood.value ? null : mood.value)}
                  disabled={disabled}
                  className={`p-1.5 rounded-full transition-all ${
                    moodTag === mood.value
                      ? 'bg-blue-100 scale-110'
                      : 'hover:bg-gray-100'
                  }`}
                  title={mood.value}
                  aria-label={`Set mood to ${mood.value}`}
                >
                  <span className="text-lg">{mood.emoji}</span>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {onExpand && (
                <button
                  type="button"
                  onClick={onExpand}
                  disabled={disabled}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Expand
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={disabled || !isValid}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      {showExpanded && (
        <div className="px-3 py-1.5 border-t bg-gray-50 text-xs text-gray-400">
          Press ⌘+Enter to save
        </div>
      )}
    </div>
  );
}

export default JournalQuickEntry;
