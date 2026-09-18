# Hustle Animation System

> **Use Framer Motion for all animations.** This file contains patterns and best practices.

---

## 📦 Setup

```bash
npm install framer-motion
```

```tsx
// Import what you need
import { motion, AnimatePresence } from 'framer-motion';
```

---

## ⏱ Animation Tokens

```typescript
// src/lib/animation.ts

export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  page: 0.6,
};

export const easing = {
  default: [0.25, 0.1, 0.25, 1],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  bounce: { type: 'spring', stiffness: 400, damping: 10 },
  smooth: [0.4, 0, 0.2, 1],
};
```

---

## 🎬 Common Animation Variants

### Fade In

```tsx
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

<motion.div {...fadeIn}>Content</motion.div>
```

### Fade In Up

```tsx
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3 }
};

<motion.div {...fadeInUp}>Content</motion.div>
```

### Fade In Scale

```tsx
const fadeInScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 }
};

<motion.div {...fadeInScale}>Modal content</motion.div>
```

### Slide In Right

```tsx
const slideInRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { type: 'spring', damping: 25, stiffness: 200 }
};

<motion.div {...slideInRight}>Sidebar</motion.div>
```

---

## 📋 Stagger Children

Animate list items sequentially.

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function AthleteList({ athletes }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-3 gap-4"
    >
      {athletes.map((athlete) => (
        <motion.div key={athlete.id} variants={item}>
          <AthleteCard athlete={athlete} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

---

## 🔄 Page Transitions

### Layout Component

```tsx
// src/components/layout/page-transition.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Usage in Layout

```tsx
// src/app/dashboard/layout.tsx
import { PageTransition } from '@/components/layout/page-transition';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
```

---

## 🖱 Hover & Tap Interactions

### Card Hover Lift

```tsx
<motion.div
  whileHover={{ y: -4, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2 }}
  className="bg-white rounded-2xl p-6 cursor-pointer"
>
  Card content
</motion.div>
```

### Button Press

```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="bg-zinc-900 text-white px-6 py-3 rounded-full"
>
  Click me
</motion.button>
```

### Icon Rotation

```tsx
const [isOpen, setIsOpen] = useState(false);

<motion.button
  onClick={() => setIsOpen(!isOpen)}
>
  <motion.span
    animate={{ rotate: isOpen ? 180 : 0 }}
    transition={{ duration: 0.3 }}
  >
    <ChevronDown className="w-5 h-5" />
  </motion.span>
</motion.button>
```

---

## 🎭 AnimatePresence

For animating elements entering/leaving the DOM.

### Modal

```tsx
function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 
                       md:inset-x-auto md:left-1/2 md:-translate-x-1/2
                       md:w-full md:max-w-lg z-50
                       bg-white rounded-2xl p-6 shadow-xl"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Toast Notification

```tsx
function Toast({ message, isVisible, onClose }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-6 left-1/2 bg-zinc-900 text-white 
                     px-6 py-3 rounded-full shadow-lg"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 📊 Number Animation

Animate counting numbers.

```tsx
import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { duration: 1000 });
  const display = useTransform(spring, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.on('change', (latest) => {
      setDisplayValue(latest);
    });
  }, [display]);

  return <span>{displayValue}</span>;
}

// Usage
<div className="text-4xl font-bold">
  <AnimatedNumber value={23} />
</div>
```

---

## 🔄 Loading States

### Spinner

```tsx
function Spinner({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={cn("w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full", className)}
    />
  );
}
```

### Skeleton Pulse

```tsx
function Skeleton({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={cn("bg-warm-200 rounded-lg", className)}
    />
  );
}

// Usage
<Skeleton className="h-4 w-32" />
<Skeleton className="h-20 w-full" />
```

### Loading Dots

```tsx
function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          className="w-2 h-2 bg-zinc-900 rounded-full"
        />
      ))}
    </div>
  );
}
```

---

## 🎬 Hero Section Animations

### Text Reveal

```tsx
function HeroTitle({ text }: { text: string }) {
  const words = text.split(' ');

  return (
    <h1 className="text-5xl md:text-7xl font-bold">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="inline-block mr-4"
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
}
```

### Scroll-Triggered Animation

```tsx
import { useInView } from 'framer-motion';
import { useRef } from 'react';

function FeatureCard({ feature }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl p-6"
    >
      {feature.title}
    </motion.div>
  );
}
```

---

## 🏃 Exercise Animation Component

For Dream Gym workout videos.

```tsx
interface ExerciseAnimationProps {
  src: string;
  isActive: boolean;
  isPaused: boolean;
}

function ExerciseAnimation({ src, isActive, isPaused }: ExerciseAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive && !isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, isPaused]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isActive ? 1 : 0.5, 
        scale: isActive ? 1 : 0.9 
      }}
      className="relative aspect-square rounded-2xl overflow-hidden"
    >
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      
      {isPaused && isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center"
        >
          <Pause className="w-16 h-16 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
}
```

---

## 📐 Layout Animations

### Accordion

```tsx
function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-warm-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4"
      >
        <span className="font-medium">{title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 🚫 Avoid

- Animating `width` or `height` directly (use `scale` instead when possible)
- Too many simultaneous animations (overwhelms users)
- Animations longer than 0.5s for micro-interactions
- Animations that block user interaction
- Using CSS animations when Framer Motion is available

---

## ✅ Do

- Use `AnimatePresence` for enter/exit animations
- Use `whileHover` and `whileTap` for interactive feedback
- Use stagger for lists
- Keep durations short (0.2-0.3s for micro, 0.5s for page)
- Test animations on low-end devices
- Respect user's `prefers-reduced-motion`

---

## ♿ Accessibility

```tsx
// Respect reduced motion preference
import { useReducedMotion } from 'framer-motion';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ y: prefersReducedMotion ? 0 : [0, -10, 0] }}
    >
      Content
    </motion.div>
  );
}
```

---

*Animate with purpose, delight with subtlety* ✨
