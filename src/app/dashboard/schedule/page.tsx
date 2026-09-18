'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  CalendarDays,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Swords,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  scheduleEventTypes,
  getScheduleEventTypeLabel,
} from '@/lib/validations/schedule-event-schema';
import type { ScheduleEvent, ScheduleEventType } from '@/types/domain';

// ─── helpers ─────────────────────────────────────────────────────────────────

function eventTypeColor(type: ScheduleEventType): string {
  const colors: Record<ScheduleEventType, string> = {
    game: 'bg-amber-500',
    practice: 'bg-blue-500',
    tournament: 'bg-purple-500',
    tryout: 'bg-green-500',
    camp: 'bg-teal-500',
    training: 'bg-orange-500',
    other: 'bg-zinc-400',
  };
  return colors[type] ?? 'bg-zinc-400';
}

function eventTypeBadge(type: ScheduleEventType): string {
  const colors: Record<ScheduleEventType, string> = {
    game: 'bg-amber-100 text-amber-800',
    practice: 'bg-blue-100 text-blue-800',
    tournament: 'bg-purple-100 text-purple-800',
    tryout: 'bg-green-100 text-green-800',
    camp: 'bg-teal-100 text-teal-800',
    training: 'bg-orange-100 text-orange-800',
    other: 'bg-zinc-100 text-zinc-700',
  };
  return colors[type] ?? 'bg-zinc-100 text-zinc-700';
}

// ─── Add/Edit event form ─────────────────────────────────────────────────────

interface EventFormState {
  title: string;
  type: ScheduleEventType;
  date: string;
  endDate: string;
  location: string;
  opponent: string;
  notes: string;
}

const emptyForm = (): EventFormState => ({
  title: '',
  type: 'game',
  date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  endDate: '',
  location: '',
  opponent: '',
  notes: '',
});

interface PlayerOption {
  id: string;
  name: string;
}

interface EventFormProps {
  players: PlayerOption[];
  initial?: ScheduleEvent | null;
  onSave: (data: EventFormState, playerIds: string[]) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function EventForm({ players, initial, onSave, onClose, saving }: EventFormProps) {
  const [form, setForm] = useState<EventFormState>(() => {
    if (initial) {
      return {
        title: initial.title,
        type: initial.type,
        date: format(new Date(initial.date), "yyyy-MM-dd'T'HH:mm"),
        endDate: initial.endDate ? format(new Date(initial.endDate), "yyyy-MM-dd'T'HH:mm") : '',
        location: initial.location ?? '',
        opponent: initial.opponent ?? '',
        notes: initial.notes ?? '',
      };
    }
    return emptyForm();
  });
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
    initial?.playerIds ?? (players.length === 1 ? [players[0].id] : [])
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayerIds.length === 0) return;
    await onSave(form, selectedPlayerIds);
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100">
          <h2 className="font-display text-lg font-semibold text-zinc-900">
            {initial ? 'Edit Event' : 'Add Event'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block font-body text-sm font-medium text-zinc-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
              placeholder="e.g. Fall Classic Tournament"
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Type + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ScheduleEventType }))}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {scheduleEventTypes.map((t) => (
                  <option key={t} value={t}>{getScheduleEventTypeLabel(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-1">
                Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* End date (optional) */}
          <div>
            <label className="block font-body text-sm font-medium text-zinc-700 mb-1">
              End Date <span className="font-normal text-zinc-400">(optional, for multi-day events)</span>
            </label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block font-body text-sm font-medium text-zinc-700 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Riverside Sports Complex"
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Opponent (only for game/tournament) */}
          {(form.type === 'game' || form.type === 'tournament') && (
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-1">Opponent</label>
              <input
                type="text"
                value={form.opponent}
                onChange={(e) => setForm((p) => ({ ...p, opponent: e.target.value }))}
                placeholder="e.g. Riverside FC"
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          )}

          {/* Athletes */}
          {players.length > 0 && (
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-2">
                Athletes <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlayer(p.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full font-body text-sm transition-colors',
                      selectedPlayerIds.includes(p.id)
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-body text-sm font-medium text-zinc-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="Any additional details…"
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-zinc-200 font-display font-semibold text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (players.length > 0 && selectedPlayerIds.length === 0)}
              className="flex-1 py-2.5 rounded-full bg-zinc-900 text-white font-display font-semibold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Saving…
                </span>
              ) : (
                initial ? 'Save Changes' : 'Add Event'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Mini calendar ────────────────────────────────────────────────────────────

function MiniCalendar({
  month,
  events,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: {
  month: Date;
  events: ScheduleEvent[];
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start, end });

  // Build a set of dates that have events
  const eventDates = new Set(events.map((e) => format(new Date(e.date), 'yyyy-MM-dd')));

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrevMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
          <ChevronLeft size={16} className="text-zinc-500" />
        </button>
        <span className="font-display text-sm font-semibold text-zinc-900">
          {format(month, 'MMMM yyyy')}
        </span>
        <button onClick={onNextMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
          <ChevronRight size={16} className="text-zinc-500" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center font-body text-xs text-zinc-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const hasEvent = eventDates.has(key);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);

          return (
            <button
              key={key}
              onClick={() => onSelectDate(day)}
              className={cn(
                'relative flex items-center justify-center w-full aspect-square rounded-full font-body text-xs transition-colors',
                !inMonth && 'opacity-30',
                isSelected && 'bg-zinc-900 text-white',
                !isSelected && today && 'bg-amber-100 text-amber-800 font-semibold',
                !isSelected && !today && inMonth && 'hover:bg-zinc-100 text-zinc-700'
              )}
            >
              {format(day, 'd')}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: ScheduleEvent;
  onEdit: (e: ScheduleEvent) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-3 group"
    >
      {/* Color dot */}
      <div className={cn('w-2.5 h-2.5 rounded-full mt-1 shrink-0', eventTypeColor(event.type))} />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-zinc-900 truncate">{event.title}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={cn('px-2 py-0.5 rounded-full font-body text-xs font-medium', eventTypeBadge(event.type))}>
                {getScheduleEventTypeLabel(event.type)}
              </span>
              <span className="font-body text-xs text-zinc-500">
                {format(new Date(event.date), 'EEE, MMM d · h:mm a')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(event)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <Pencil size={14} className="text-zinc-400" />
            </button>
            <button
              onClick={() => onDelete(event.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {event.opponent && (
            <div className="flex items-center gap-1 font-body text-xs text-zinc-500">
              <Swords size={12} />
              vs {event.opponent}
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1 font-body text-xs text-zinc-500">
              <MapPin size={12} />
              {event.location}
            </div>
          )}
          {event.notes && (
            <p className="font-body text-xs text-zinc-400 truncate max-w-xs">{event.notes}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Load events and players
  const loadData = useCallback(async () => {
    try {
      const [evRes, pRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/players'),
      ]);
      const evData = evRes.ok ? await evRes.json() : { events: [] };
      const pData = pRes.ok ? await pRes.json() : { players: [] };
      setEvents(evData.events ?? []);
      setPlayers(pData.players ?? []);
    } catch (err) {
      console.error('Failed to load schedule data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter events shown in the list
  const displayedEvents = selectedDate
    ? events.filter((e) => isSameDay(new Date(e.date), selectedDate))
    : events.filter((e) => isSameMonth(new Date(e.date), currentMonth));

  const sortedEvents = [...displayedEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handleSave = async (formData: EventFormState, playerIds: string[]) => {
    setSaving(true);
    try {
      const payload = {
        playerIds,
        type: formData.type,
        title: formData.title,
        date: new Date(formData.date).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        location: formData.location || null,
        opponent: formData.opponent || null,
        notes: formData.notes || null,
      };

      if (editingEvent) {
        const res = await fetch(`/api/schedule/${editingEvent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update event');
      } else {
        const res = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create event');
      }

      setShowForm(false);
      setEditingEvent(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await fetch(`/api/schedule/${eventId}`, { method: 'DELETE' });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleEdit = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4"
        >
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-900">Schedule</h2>
            <p className="font-body text-sm text-zinc-500 mt-0.5">
              {events.length} event{events.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 bg-zinc-900 text-white font-display font-semibold text-sm px-4 py-2.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <Plus size={16} />
            Add Event
          </motion.button>
        </motion.div>

        {/* Two-column layout: Calendar + Event list */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="space-y-3"
          >
            <MiniCalendar
              month={currentMonth}
              events={events}
              selectedDate={selectedDate}
              onSelectDate={(d) =>
                setSelectedDate((prev) => (prev && isSameDay(prev, d) ? null : d))
              }
              onPrevMonth={() => setCurrentMonth((m) => subMonths(m, 1))}
              onNextMonth={() => setCurrentMonth((m) => addMonths(m, 1))}
            />

            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="w-full py-2 rounded-xl font-body text-sm text-zinc-500 hover:bg-white hover:text-zinc-700 transition-colors"
              >
                Show all {format(currentMonth, 'MMMM')} events
              </button>
            )}

            {/* Quick type legend */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
              <p className="font-display text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Event Types
              </p>
              {scheduleEventTypes.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', eventTypeColor(t))} />
                  <span className="font-body text-xs text-zinc-600">{getScheduleEventTypeLabel(t)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Event list */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-2"
          >
            {/* List header */}
            <div className="flex items-center justify-between mb-1">
              <p className="font-display text-sm font-semibold text-zinc-700">
                {selectedDate
                  ? format(selectedDate, 'EEEE, MMMM d')
                  : format(currentMonth, 'MMMM yyyy')}
              </p>
              <span className="font-body text-xs text-zinc-400">
                {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}
              </span>
            </div>

            <AnimatePresence mode="popLayout">
              {sortedEvents.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl shadow-sm py-16 text-center"
                >
                  <CalendarDays className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                  <p className="font-display text-base font-semibold text-zinc-800 mb-1">
                    No events {selectedDate ? 'on this day' : 'this month'}
                  </p>
                  <p className="font-body text-sm text-zinc-400">
                    Add games, practices, and tournaments to your season schedule.
                  </p>
                </motion.div>
              ) : (
                sortedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Add / Edit form modal */}
      <AnimatePresence>
        {showForm && (
          <EventForm
            players={players}
            initial={editingEvent}
            onSave={handleSave}
            onClose={handleCloseForm}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </>
  );
}
