'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Dumbbell,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
  Zap,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/athletes', label: 'Athletes', icon: Users },
  { href: '/dashboard/games', label: 'Games', icon: Trophy },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/dashboard/dream-gym', label: 'Dream Gym', icon: Dumbbell },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

const bottomNavItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
];

function NavLink({
  item,
  onClick,
}: {
  item: { href: string; label: string; icon: React.ElementType };
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href);

  return (
    <Link href={item.href} onClick={onClick}>
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm font-medium transition-colors',
          isActive
            ? 'bg-zinc-900 text-white'
            : 'text-zinc-600 hover:bg-amber-50 hover:text-amber-700'
        )}
      >
        <item.icon className="w-4.5 h-4.5 shrink-0" size={18} />
        {item.label}
        {item.label === 'Dream Gym' && (
          <span className="ml-auto px-1.5 py-0.5 text-xs font-display font-semibold bg-amber-500 text-white rounded-full">
            AI
          </span>
        )}
      </motion.div>
    </Link>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-6 mb-2">
        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <span className="font-display text-xl font-semibold text-zinc-900">
          Hustle
        </span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-3 space-y-1 border-t border-zinc-100 pt-3">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          Sign Out
        </motion.button>
      </div>

      {/* User info stub */}
      <div className="mx-3 mb-4 mt-2 p-3 bg-amber-50 rounded-xl">
        <p className="font-body text-xs font-medium text-amber-800">Free Trial</p>
        <p className="font-body text-xs text-amber-600 mt-0.5">
          Upgrade for more athletes and full Dream Gym
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 border-r border-zinc-200 flex-col h-full relative" style={{ backgroundColor: '#ffffff' }}>
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-zinc-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-zinc-700" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-zinc-200 z-50 md:hidden shadow-xl"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
              <SidebarContent onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
