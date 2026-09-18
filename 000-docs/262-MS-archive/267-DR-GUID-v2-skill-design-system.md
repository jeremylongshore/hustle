# Hustle Design System

> **Read this before building any UI component.**

---

## 🎨 Color Palette — Warm Amber

The design uses a warm, energetic amber/gold palette. Light mode primary.

### CSS Variables (globals.css)

```css
:root {
  /* Backgrounds */
  --background: 40 28% 88%;           /* #E8DCC8 - warm beige page bg */
  --background-gradient-start: 43 50% 91%;  /* #F5EEDD */
  --background-gradient-end: 38 60% 85%;    /* #EADBB8 */
  
  /* Surfaces */
  --card: 0 0% 100%;                  /* #FFFFFF - cards */
  --card-foreground: 240 10% 3.9%;    /* near-black text */
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  
  /* Primary - Dark charcoal for contrast */
  --primary: 240 5.9% 10%;            /* #19191B - buttons, headings */
  --primary-foreground: 0 0% 98%;     /* white text on primary */
  
  /* Secondary - Light gray */
  --secondary: 40 20% 96%;            /* #F7F5F0 */
  --secondary-foreground: 240 5.9% 10%;
  
  /* Accent - Amber/Orange */
  --accent: 36 100% 50%;              /* #FF9500 - main accent */
  --accent-light: 40 100% 70%;        /* #FFB84D - hover, highlights */
  --accent-dark: 30 100% 45%;         /* #E67300 - pressed states */
  --accent-foreground: 0 0% 100%;     /* white on accent */
  
  /* Muted */
  --muted: 40 20% 96%;
  --muted-foreground: 240 3.8% 46.1%; /* #737380 - supporting text */
  
  /* Destructive - Red */
  --destructive: 0 84.2% 60.2%;       /* #EF4444 */
  --destructive-foreground: 0 0% 98%;
  
  /* Success - Green */
  --success: 142 76% 36%;             /* #22C55E */
  --success-foreground: 0 0% 100%;
  
  /* Warning - Yellow */
  --warning: 45 93% 47%;              /* #EAB308 */
  --warning-foreground: 0 0% 0%;
  
  /* Borders & Inputs */
  --border: 40 20% 88%;               /* #E5DFD3 */
  --input: 40 20% 88%;
  --ring: 36 100% 50%;                /* accent color for focus */
  
  /* Sidebar */
  --sidebar: 0 0% 98%;
  --sidebar-foreground: 240 5.9% 10%;
  --sidebar-accent: 40 30% 95%;
  
  /* Radius */
  --radius: 0.5rem;                   /* 8px base */
}
```

### Tailwind Color Classes

```javascript
// tailwind.config.js extend colors
colors: {
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',  // Primary amber
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  warm: {
    50: '#FEFDFB',
    100: '#F7F5F0',
    200: '#E8DCC8',  // Main background
    300: '#D4C4A8',
    400: '#C0AC88',
    500: '#AC9468',
  }
}
```

---

## 📝 Typography

### Fonts

```css
/* Import in layout.tsx */
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
```

### Scale

| Element | Class | Size | Weight |
|---------|-------|------|--------|
| H1 (Hero) | `text-5xl md:text-7xl font-bold` | 48px / 72px | 700 |
| H1 | `text-4xl font-bold` | 36px | 700 |
| H2 | `text-3xl font-bold` | 30px | 700 |
| H3 | `text-2xl font-semibold` | 24px | 600 |
| H4 | `text-xl font-semibold` | 20px | 600 |
| Body | `text-base` | 16px | 400 |
| Body Small | `text-sm` | 14px | 400 |
| Caption | `text-xs` | 12px | 400 |
| Label | `text-sm font-medium` | 14px | 500 |

### Text Colors

| Use | Class |
|-----|-------|
| Primary text | `text-foreground` or `text-zinc-900` |
| Secondary text | `text-muted-foreground` or `text-zinc-600` |
| Accent text | `text-amber-600` |
| On dark bg | `text-white` |
| Links | `text-amber-600 hover:text-amber-700` |

---

## 📐 Spacing

Use Tailwind's spacing scale based on 4px grid:

| Token | Value | Use |
|-------|-------|-----|
| `1` | 4px | Tight spacing |
| `2` | 8px | Icon gaps |
| `3` | 12px | Small gaps |
| `4` | 16px | Standard spacing |
| `6` | 24px | Section gaps |
| `8` | 32px | Card padding |
| `12` | 48px | Section padding |
| `16` | 64px | Page sections |
| `20` | 80px | Hero spacing |

---

## 🔲 Border Radius

| Element | Class | Value |
|---------|-------|-------|
| Buttons (pill) | `rounded-full` | 9999px |
| Cards | `rounded-2xl` | 16px |
| Inputs | `rounded-lg` | 8px |
| Small elements | `rounded-md` | 6px |
| Avatars | `rounded-full` | 50% |

---

## 🌫 Shadows

```css
/* Subtle shadows for light mode */
.shadow-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 
              0 1px 2px rgba(0, 0, 0, 0.03);
}

.shadow-card-hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 
              0 2px 4px rgba(0, 0, 0, 0.04);
}

.shadow-button {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

Tailwind classes:
- Cards: `shadow-sm hover:shadow-md`
- Elevated: `shadow-md`
- Modals: `shadow-xl`

---

## 🧩 Component Patterns

### Cards

```tsx
<div className="bg-white rounded-2xl p-6 shadow-sm border border-warm-200">
  {/* Card content */}
</div>
```

### Buttons

```tsx
// Primary (dark)
<button className="bg-zinc-900 text-white px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors">
  Get Started
</button>

// Accent (amber)
<button className="bg-amber-500 text-white px-6 py-3 rounded-full font-medium hover:bg-amber-600 transition-colors">
  Subscribe
</button>

// Secondary (outline)
<button className="border-2 border-zinc-900 text-zinc-900 px-6 py-3 rounded-full font-medium hover:bg-zinc-900 hover:text-white transition-colors">
  Learn More
</button>

// Ghost
<button className="text-zinc-600 px-4 py-2 rounded-lg hover:bg-warm-100 transition-colors">
  Cancel
</button>
```

### Inputs

```tsx
<input 
  className="w-full px-4 py-3 rounded-lg border border-warm-200 bg-white 
             focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500
             placeholder:text-muted-foreground"
  placeholder="Enter your email"
/>
```

### Stat Cards

```tsx
<div className="bg-white rounded-2xl p-6 shadow-sm">
  <p className="text-sm text-muted-foreground mb-1">Total Goals</p>
  <p className="text-4xl font-bold text-zinc-900">23</p>
  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
    <ArrowUp className="w-4 h-4" /> +5 this month
  </p>
</div>
```

### Progress Ring

```tsx
<svg className="w-20 h-20 -rotate-90">
  <circle
    cx="40"
    cy="40"
    r="36"
    stroke="currentColor"
    strokeWidth="8"
    fill="none"
    className="text-warm-200"
  />
  <circle
    cx="40"
    cy="40"
    r="36"
    stroke="currentColor"
    strokeWidth="8"
    fill="none"
    strokeDasharray={226}
    strokeDashoffset={226 * (1 - progress)}
    className="text-amber-500 transition-all duration-500"
    strokeLinecap="round"
  />
</svg>
```

---

## 📊 Status Colors

### Usage Indicators

| State | Threshold | Background | Text |
|-------|-----------|------------|------|
| OK | < 70% | `bg-green-50` | `text-green-600` |
| Warning | 70-99% | `bg-yellow-50` | `text-yellow-600` |
| Critical | >= 100% | `bg-red-50` | `text-red-600` |

### Result Badges

| Result | Background | Text |
|--------|------------|------|
| Win | `bg-green-100` | `text-green-700` |
| Loss | `bg-red-100` | `text-red-700` |
| Draw | `bg-zinc-100` | `text-zinc-700` |

---

## 📱 Responsive Breakpoints

```javascript
// Tailwind defaults
screens: {
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
}
```

### Mobile-First Patterns

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">

// Hide on mobile, show on desktop
<div className="hidden md:block">

// Full width on mobile, fixed on desktop  
<div className="w-full md:w-96">

// Smaller padding on mobile
<div className="p-4 md:p-8">
```

---

## 🖼 Background Patterns

### Gradient Background

```tsx
<div className="min-h-screen bg-gradient-to-br from-[#F5EEDD] to-[#EADBB8]">
```

### Hero with Video

```tsx
<section className="relative h-screen overflow-hidden">
  <video
    autoPlay
    loop
    muted
    playsInline
    className="absolute inset-0 w-full h-full object-cover"
  >
    <source src="/videos/GOAL.mp4" type="video/mp4" />
  </video>
  <div className="absolute inset-0 bg-black/40" /> {/* Overlay */}
  <div className="relative z-10 flex items-center justify-center h-full">
    {/* Content */}
  </div>
</section>
```

### Auth Pages

```tsx
<div 
  className="min-h-screen bg-cover bg-center"
  style={{ backgroundImage: "url('/images/sport-path.jpg')" }}
>
  <div className="min-h-screen bg-black/50 backdrop-blur-sm">
    {/* Auth form */}
  </div>
</div>
```

---

## ✨ Micro-interactions

Always use `transition-colors` or `transition-all` for hover states:

```tsx
// Button hover
className="... transition-colors duration-200"

// Card hover lift
className="... hover:shadow-md hover:-translate-y-1 transition-all duration-200"

// Link underline
className="... hover:underline underline-offset-4"
```

---

## 🚫 Avoid

- Pure black (`#000`) — use `zinc-900` instead
- Pure white backgrounds on page level — use warm tones
- Sharp corners on cards — always use rounded
- Missing hover states
- Inconsistent spacing
- Mixing different amber shades randomly

---

## ✅ Do

- Use the warm amber palette consistently
- Apply subtle shadows to cards
- Use `rounded-full` for primary CTAs
- Include hover/focus states on all interactive elements
- Test colors for accessibility (contrast ratios)
- Use progress rings for visual interest

---

*Design with warmth, build with precision* 🎨
