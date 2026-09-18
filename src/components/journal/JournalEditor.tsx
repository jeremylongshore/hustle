'use client';

import { useState, useCallback } from 'react';
import type {
  JournalContext,
  JournalMoodTag,
  JournalEnergyTag,
} from '@/types/domain';

interface JournalEditorProps {
  initialContent?: string;
  initialMood?: JournalMoodTag | null;
  initialEnergy?: JournalEnergyTag | null;
  context: JournalContext;
  onSave: (data: {
    content: string;
    moodTag: JournalMoodTag | null;
    energyTag: JournalEnergyTag | null;
  }) => void;
  onCancel?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showTags?: boolean;
}

const moodOptions: { value: JournalMoodTag; label: string; emoji: string }[] = [
  { value: 'great', label: 'Great', emoji: '🔥' },
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'struggling', label: 'Struggling', emoji: '😔' },
  { value: 'rough', label: 'Rough', emoji: '😞' },
];

const energyOptions: { value: JournalEnergyTag; label: string; emoji: string }[] = [
  { value: 'energized', label: 'Energized', emoji: '⚡' },
  { value: 'normal', label: 'Normal', emoji: '🔋' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'exhausted', label: 'Exhausted', emoji: '🥱' },
];

const contextLabels: Record<JournalContext, string> = {
  workout_reflection: 'Post-Workout Reflection',
  mental_checkin: 'Mental Check-in',
  game_reflection: 'Game Reflection',
  daily_journal: 'Daily Journal',
  quick_entry: 'Quick Note',
};

const contextPrompts: Record<JournalContext, string> = {
  workout_reflection: 'How did that workout feel? What went well? What could improve next time?',
  mental_checkin: 'How are you feeling today? What\'s on your mind?',
  game_reflection: 'Reflect on your performance. What did you learn? What will you work on?',
  daily_journal: 'Write about your day, training thoughts, or goals...',
  quick_entry: 'Quick note...',
};

/**
 * JournalEditor - Rich journal entry editor with mood and energy tags
 *
 * Used for creating and editing journal entries across the app
 */
export function JournalEditor({
  initialContent = '',
  initialMood = null,
  initialEnergy = null,
  context,
  onSave,
  onCancel,
  disabled = false,
  placeholder,
  showTags = true,
}: JournalEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [moodTag, setMoodTag] = useState<JournalMoodTag | null>(initialMood);
  const [energyTag, setEnergyTag] = useState<JournalEnergyTag | null>(initialEnergy);

  const handleSave = useCallback(() => {
    if (!content.trim()) return;
    onSave({ content: content.trim(), moodTag, energyTag });
  }, [content, moodTag, energyTag, onSave]);

  const charCount = content.length;
  const isValid = content.trim().length > 0;

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-medium text-gray-800">{contextLabels[context]}</h3>
      </div>

      {/* Editor */}
      <div className="p-4 space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={disabled}
          placeholder={placeholder || contextPrompts[context]}
          className="w-full min-h-[150px] p-3 border rounded-lg resize-y text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          aria-label="Journal entry content"
        />

        {/* Character count */}
        <div className="text-xs text-gray-400 text-right">
          {charCount} characters
        </div>

        {/* Mood and Energy Tags */}
        {showTags && (
          <div className="space-y-3">
            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How are you feeling?
              </label>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMoodTag(moodTag === option.value ? null : option.value)}
                    disabled={disabled}
                    className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all ${
                      moodTag === option.value
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    <span>{option.emoji}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy level?
              </label>
              <div className="flex flex-wrap gap-2">
                {energyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEnergyTag(energyTag === option.value ? null : option.value)}
                    disabled={disabled}
                    className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all ${
                      energyTag === option.value
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    <span>{option.emoji}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t bg-gray-50 flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || !isValid}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Save Entry
        </button>
      </div>
    </div>
  );
}

export default JournalEditor;
