'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Palette, Trash2, Check, AlertTriangle, Download } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────
interface NotifPref {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

// ─── Mock data ────────────────────────────────────────────────
const initialProfile = {
  name: 'Marcus Okonkwo',
  email: 'marcus@hustlefc.com',
  phone: '+1 (555) 012-3456',
};

const initialNotifs: NotifPref[] = [
  { id: 'game_reminders', label: 'Game Reminders', description: 'Notify me 24h before scheduled games', enabled: true },
  { id: 'workout_reminders', label: 'Workout Reminders', description: 'Daily training schedule alerts', enabled: true },
  { id: 'progress_updates', label: 'Progress Updates', description: 'Weekly summary of performance stats', enabled: false },
  { id: 'team_activity', label: 'Team Activity', description: 'Alerts when teammates log sessions', enabled: false },
];

// ─── Section wrapper ──────────────────────────────────────────
function Section({
  icon,
  title,
  color,
  children,
  delay = 0,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn('bg-white rounded-2xl shadow-sm overflow-hidden', className)}
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', color)}>
          {icon}
        </div>
        <h3 className="font-display text-base font-semibold text-zinc-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0',
        enabled ? 'bg-amber-500' : 'bg-zinc-200'
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function SettingsPage() {
  const [profile, setProfile] = useState(initialProfile);
  const [profileSaved, setProfileSaved] = useState(false);
  const [notifs, setNotifs] = useState(initialNotifs);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmText }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(body.message || 'Deletion failed. Nothing was removed.');
        return;
      }
      await signOut({ callbackUrl: '/?accountDeleted=1' });
    } catch {
      setDeleteError('Deletion failed. Nothing was removed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleProfileSave = () => {
    if (!profile.name.trim() || !profile.email.trim()) return;
    console.log('Save profile:', profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const toggleNotif = (id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-2xl font-semibold text-zinc-900">Settings</h2>
        <p className="font-body text-sm text-zinc-500">Manage your account and preferences</p>
      </motion.div>

      {/* Profile */}
      <Section
        icon={<User className="w-4 h-4 text-white" />}
        title="Profile"
        color="bg-amber-500"
        delay={0.04}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs font-medium text-zinc-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, name: e.target.value }));
                  setProfileSaved(false);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 placeholder:text-zinc-300 transition-colors"
              />
            </div>
            <div>
              <label className="block font-body text-xs font-medium text-zinc-600 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, phone: e.target.value }));
                  setProfileSaved(false);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 placeholder:text-zinc-300 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block font-body text-xs font-medium text-zinc-600 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => {
                setProfile((p) => ({ ...p, email: e.target.value }));
                setProfileSaved(false);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 placeholder:text-zinc-300 transition-colors"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleProfileSave}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-full font-display font-semibold text-sm transition-colors',
              profileSaved
                ? 'bg-green-500 text-white'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            )}
          >
            {profileSaved ? (
              <>
                <Check size={14} /> Saved
              </>
            ) : (
              'Save Changes'
            )}
          </motion.button>
        </div>
      </Section>

      {/* Notifications */}
      <Section
        icon={<Bell className="w-4 h-4 text-white" />}
        title="Notifications"
        color="bg-blue-500"
        delay={0.07}
      >
        <div className="space-y-4">
          {notifs.map((notif) => (
            <div key={notif.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-zinc-900">{notif.label}</p>
                <p className="font-body text-xs text-zinc-400 mt-0.5">{notif.description}</p>
              </div>
              <Toggle enabled={notif.enabled} onToggle={() => toggleNotif(notif.id)} />
            </div>
          ))}
        </div>
      </Section>

      {/* Theme */}
      <Section
        icon={<Palette className="w-4 h-4 text-white" />}
        title="Appearance"
        color="bg-purple-500"
        delay={0.1}
      >
        <div className="space-y-3">
          <p className="font-body text-xs text-zinc-400">Choose your preferred theme</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', preview: 'bg-white border-zinc-200', active: true },
              { id: 'dark', label: 'Dark', preview: 'bg-zinc-900 border-zinc-700', active: false },
              { id: 'system', label: 'System', preview: 'bg-gradient-to-br from-white to-zinc-800 border-zinc-300', active: false },
            ].map((theme) => (
              <button
                key={theme.id}
                disabled={!theme.active}
                className={cn(
                  'relative rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-all',
                  theme.active
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-zinc-100 bg-zinc-50 opacity-50 cursor-not-allowed'
                )}
              >
                <div className={cn('w-full h-10 rounded-lg border', theme.preview)} />
                <span className="font-body text-xs font-medium text-zinc-700">{theme.label}</span>
                {theme.active && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </span>
                )}
                {!theme.active && (
                  <span className="font-body text-[10px] text-zinc-400">Soon</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-zinc-900">Download my data</p>
              <p className="font-body text-xs text-zinc-400 mt-0.5">
                Everything Hustle holds about you and your athletes, as a JSON file.
              </p>
            </div>
          </div>
          <a
            href="/api/account/export"
            className="shrink-0 px-4 py-2 rounded-full font-display font-semibold text-sm bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            Download
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden border border-red-100"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-red-50">
          <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-display text-base font-semibold text-zinc-900">Danger Zone</h3>
        </div>
        <div className="p-5">
          <AnimatePresence mode="wait">
            {deleteStep === 'idle' ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-display text-sm font-semibold text-zinc-900">Delete Account</p>
                  <p className="font-body text-xs text-zinc-400 mt-0.5">
                    Permanently remove your account and all data. This cannot be undone.
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDeleteStep('confirm')}
                  className="shrink-0 px-4 py-2 rounded-full font-display font-semibold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  Delete
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-display text-sm font-semibold text-red-700">
                      Are you absolutely sure?
                    </p>
                    <p className="font-body text-xs text-red-500 mt-1">
                      This will permanently delete all your athletes, game logs, and training data.
                      There is no recovery.
                    </p>
                  </div>
                </div>
                <label className="block">
                  <span className="font-display text-xs font-semibold text-zinc-700">Your password</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="font-display text-xs font-semibold text-zinc-700">Type DELETE to confirm</span>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  />
                </label>
                {deleteError && (
                  <p role="alert" className="font-body text-xs text-red-600">{deleteError}</p>
                )}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setDeleteStep('idle'); setDeletePassword(''); setDeleteConfirmText(''); setDeleteError(null); }}
                    className="flex-1 py-2.5 rounded-full font-display font-semibold text-sm bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDeleteAccount}
                    disabled={deleting || !deletePassword || deleteConfirmText !== 'DELETE'}
                    className="flex-1 py-2.5 rounded-full font-display font-semibold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting…' : 'Yes, Delete Everything'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
