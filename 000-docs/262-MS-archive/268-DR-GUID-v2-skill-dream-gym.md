# Hustle Dream Gym Module

> **Dream Gym is the AI-powered training system.** This file covers all sub-modules and animation integration.

---

## 🏠 Module Overview

Dream Gym is the training hub for athletes. It includes:

| Module | Path | Purpose |
|--------|------|---------|
| Hub | `/dashboard/dream-gym` | Central navigation |
| Onboarding | `/dashboard/dream-gym/onboarding` | Initial athlete setup |
| Schedule | `/dashboard/dream-gym/schedule` | Weekly training calendar |
| Workout | `/dashboard/dream-gym/workout` | Strength & conditioning |
| Cardio | `/dashboard/dream-gym/cardio` | Endurance training |
| Mental | `/dashboard/dream-gym/mental` | Journal, mood, visualization |
| Strategy | `/dashboard/dream-gym/strategy` | Game tactics |
| Progress | `/dashboard/dream-gym/progress` | Track improvements |
| Biometrics | `/dashboard/dream-gym/biometrics` | Height, weight, fitness |
| Assessments | `/dashboard/dream-gym/assessments` | Skills evaluation |
| Practices | `/dashboard/dream-gym/practices` | Drill recommendations |

---

## 🎬 Animation Assets

### Workout Animations (MP4)

Located in `/public/animations/workout/`:

```
standing.mp4           # Default standing pose
box-step.mp4           # Box step-ups
glute-bridge.mp4       # Glute bridges
bicycle-crunch.mp4     # Bicycle crunches
plank.mp4              # Plank hold
mountain-climber.mp4   # Mountain climbers
leg-raise.mp4          # Lying leg raises
superman.mp4           # Superman exercise
seated-leg-lift.mp4    # Seated leg lifts
pushup.mp4             # Push-ups
plank-alt.mp4          # Plank variation
standing-stretch.mp4   # Standing stretches
lunge.mp4              # Lunges
high-plank.mp4         # High plank position
pushup-down.mp4        # Push-up (down position)
plank-side.mp4         # Side plank
rest.mp4               # Rest pose
donkey-kick.mp4        # Donkey kicks
side-lunge-left.mp4    # Side lunges (left)
side-lunge-right.mp4   # Side lunges (right)
lying-twist.mp4        # Lying twists
v-sit.mp4              # V-sit / boat pose
squat.mp4              # Squats
```

### Soccer Practice Images (PNG)

Located in `/public/animations/soccer/`:

```
heading.png            # Heading practice
dribbling.png          # Dribbling drills
first-touch.png        # First touch control
passing.png            # Passing practice
positioning.png        # Positioning drills
dribbling-alt.png      # Dribbling alternate
scrimmage.png          # Match simulation
standing.png           # Standing with ball
shooting.png           # Shooting practice
ball-control.png       # General ball control
chest-control.png      # Chest control
warmup.png             # Warmup routine
goalkeeper.png         # Goalkeeper training
```

### Recovery Animation (Lottie)

Located in `/public/animations/recovery/`:

```
breathing.json         # Breathing/meditation
```

---

## 🗺 Exercise Mapping

Map exercise names to animation files:

```typescript
// src/lib/dream-gym/exercise-animations.ts

export const workoutAnimations: Record<string, string> = {
  // Strength
  'Goblet Squats': '/animations/workout/squat.mp4',
  'Walking Lunges': '/animations/workout/lunge.mp4',
  'Romanian Deadlifts': '/animations/workout/standing.mp4',
  'Push-ups': '/animations/workout/pushup.mp4',
  'Plank Hold': '/animations/workout/plank.mp4',
  
  // Conditioning
  'Box Jumps': '/animations/workout/box-step.mp4',
  'Burpees': '/animations/workout/squat.mp4',
  'Mountain Climbers': '/animations/workout/mountain-climber.mp4',
  'Lateral Skaters': '/animations/workout/side-lunge-left.mp4',
  
  // Core
  'Bicycle Crunches': '/animations/workout/bicycle-crunch.mp4',
  'Side Plank': '/animations/workout/plank-side.mp4',
  'Leg Raises': '/animations/workout/leg-raise.mp4',
  'Russian Twists': '/animations/workout/lying-twist.mp4',
  'Hollow Hold': '/animations/workout/v-sit.mp4',
  
  // Recovery
  'Foam Rolling': '/animations/workout/rest.mp4',
  'Hip Flexor Stretch': '/animations/workout/standing-stretch.mp4',
  'Pigeon Pose': '/animations/workout/rest.mp4',
  
  // Default
  'default': '/animations/workout/standing.mp4',
};

export const practiceAnimations: Record<string, string> = {
  'passing': '/animations/soccer/passing.png',
  'shooting': '/animations/soccer/shooting.png',
  'dribbling': '/animations/soccer/dribbling.png',
  'defending': '/animations/soccer/positioning.png',
  'heading': '/animations/soccer/heading.png',
  'first_touch': '/animations/soccer/first-touch.png',
  'positioning': '/animations/soccer/positioning.png',
  'set_pieces': '/animations/soccer/shooting.png',
  'goalkeeping': '/animations/soccer/goalkeeper.png',
  'fitness': '/animations/soccer/warmup.png',
  'scrimmage': '/animations/soccer/scrimmage.png',
  'tactics': '/animations/soccer/positioning.png',
  'other': '/animations/soccer/ball-control.png',
  'default': '/animations/soccer/standing.png',
};

export function getWorkoutAnimation(exerciseName: string): string {
  return workoutAnimations[exerciseName] || workoutAnimations['default'];
}

export function getPracticeAnimation(focusArea: string): string {
  return practiceAnimations[focusArea] || practiceAnimations['default'];
}
```

---

## 🏋️ Workout Component

```tsx
// src/components/dream-gym/workout-exercise.tsx
'use client';

import { motion } from 'framer-motion';
import { getWorkoutAnimation } from '@/lib/dream-gym/exercise-animations';

interface WorkoutExerciseProps {
  exercise: {
    name: string;
    sets: number;
    reps: string;
    rest: string;
  };
  isActive: boolean;
  isCompleted: boolean;
  onComplete: () => void;
}

export function WorkoutExercise({ 
  exercise, 
  isActive, 
  isCompleted,
  onComplete 
}: WorkoutExerciseProps) {
  const animationSrc = getWorkoutAnimation(exercise.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-2xl overflow-hidden shadow-sm transition-all",
        isActive && "ring-2 ring-amber-500",
        isCompleted && "opacity-60"
      )}
    >
      {/* Animation */}
      <div className="aspect-video relative bg-warm-100">
        <video
          src={animationSrc}
          autoPlay={isActive}
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        {isCompleted && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h4 className="font-semibold text-lg text-zinc-900">
          {exercise.name}
        </h4>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>{exercise.sets} × {exercise.reps}</span>
          <span>•</span>
          <span>{exercise.rest} rest</span>
        </div>

        {isActive && !isCompleted && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onComplete}
            className="mt-4 w-full bg-amber-500 text-white py-3 rounded-full 
                       font-medium hover:bg-amber-600 transition-colors"
          >
            Complete Exercise
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
```

---

## ⚽ Practice Component

```tsx
// src/components/dream-gym/practice-drill.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { getPracticeAnimation } from '@/lib/dream-gym/exercise-animations';

interface PracticeDrillProps {
  drill: {
    name: string;
    focusArea: string;
    duration: string;
    description: string;
  };
}

export function PracticeDrill({ drill }: PracticeDrillProps) {
  const imageSrc = getPracticeAnimation(drill.focusArea);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Image with subtle animation */}
      <div className="aspect-square relative bg-warm-100">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full p-8"
        >
          <Image
            src={imageSrc}
            alt={drill.name}
            fill
            className="object-contain p-4"
          />
        </motion.div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            {drill.focusArea.replace('_', ' ')}
          </span>
          <span className="text-sm text-muted-foreground">
            {drill.duration}
          </span>
        </div>
        <h4 className="font-semibold text-zinc-900">{drill.name}</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {drill.description}
        </p>
      </div>
    </motion.div>
  );
}
```

---

## 🧘 Mental Wellness Component

```tsx
// src/components/dream-gym/breathing-exercise.tsx
'use client';

import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import breathingAnimation from '@/public/animations/recovery/breathing.json';

type Phase = 'inhale' | 'hold' | 'exhale';

const PHASES = {
  inhale: { duration: 4, label: 'Breathe In' },
  hold: { duration: 4, label: 'Hold' },
  exhale: { duration: 6, label: 'Breathe Out' },
};

export function BreathingExercise() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [seconds, setSeconds] = useState(PHASES.inhale.duration);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          // Move to next phase
          const nextPhase = phase === 'inhale' ? 'hold' 
            : phase === 'hold' ? 'exhale' : 'inhale';
          setPhase(nextPhase);
          return PHASES[nextPhase].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, phase]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      {/* Lottie Animation */}
      <div className="w-64 h-64 relative">
        <Lottie
          animationData={breathingAnimation}
          loop={isActive}
          autoplay={isActive}
        />
        
        {/* Breathing circle overlay */}
        <motion.div
          animate={{
            scale: phase === 'inhale' ? 1.2 : phase === 'exhale' ? 0.8 : 1,
          }}
          transition={{ duration: PHASES[phase].duration }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-32 h-32 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-medium text-amber-700"
              >
                {PHASES[phase].label}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Timer */}
      <motion.p 
        key={seconds}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="text-4xl font-bold text-zinc-900 mt-8"
      >
        {seconds}
      </motion.p>

      {/* Control */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setIsActive(!isActive);
          if (!isActive) {
            setPhase('inhale');
            setSeconds(PHASES.inhale.duration);
          }
        }}
        className={cn(
          "mt-8 px-8 py-3 rounded-full font-medium transition-colors",
          isActive 
            ? "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            : "bg-amber-500 text-white hover:bg-amber-600"
        )}
      >
        {isActive ? 'Stop' : 'Start Breathing'}
      </motion.button>
    </div>
  );
}
```

---

## 📊 Workout Templates

```typescript
// src/lib/dream-gym/workout-templates.ts

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  category: 'strength' | 'conditioning' | 'core' | 'recovery';
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  duration: string;
  warmup: string[];
  exercises: Exercise[];
  cooldown: string[];
}

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'strength-training',
    name: 'Strength Training',
    description: 'Build power and muscle endurance',
    duration: '45 min',
    warmup: ['Light jog 2 min', 'Dynamic stretches', 'Leg swings'],
    exercises: [
      { name: 'Goblet Squats', sets: 3, reps: '10-12', rest: '60s', category: 'strength' },
      { name: 'Walking Lunges', sets: 3, reps: '10 each leg', rest: '60s', category: 'strength' },
      { name: 'Romanian Deadlifts', sets: 3, reps: '10-12', rest: '60s', category: 'strength' },
      { name: 'Push-ups', sets: 3, reps: '12-15', rest: '45s', category: 'strength' },
      { name: 'Plank Hold', sets: 3, reps: '30-45s', rest: '30s', category: 'core' },
    ],
    cooldown: ['Static stretches 5 min', 'Foam rolling'],
  },
  {
    id: 'conditioning-circuit',
    name: 'Conditioning Circuit',
    description: 'High-intensity endurance builder',
    duration: '30 min',
    warmup: ['Jump rope 2 min', 'High knees', 'Butt kicks'],
    exercises: [
      { name: 'Box Jumps', sets: 4, reps: '8', rest: '45s', category: 'conditioning' },
      { name: 'Burpees', sets: 4, reps: '10', rest: '45s', category: 'conditioning' },
      { name: 'Mountain Climbers', sets: 4, reps: '20 each', rest: '30s', category: 'conditioning' },
      { name: 'Lateral Skaters', sets: 4, reps: '12 each', rest: '30s', category: 'conditioning' },
    ],
    cooldown: ['Walk 3 min', 'Deep breathing', 'Light stretches'],
  },
  {
    id: 'core-blast',
    name: 'Core Blast',
    description: 'Strengthen your center',
    duration: '20 min',
    warmup: ['Cat-cow stretches', 'Dead bugs', 'Hip circles'],
    exercises: [
      { name: 'Bicycle Crunches', sets: 3, reps: '20', rest: '30s', category: 'core' },
      { name: 'Side Plank', sets: 3, reps: '30s each', rest: '30s', category: 'core' },
      { name: 'Leg Raises', sets: 3, reps: '12-15', rest: '30s', category: 'core' },
      { name: 'Russian Twists', sets: 3, reps: '20', rest: '30s', category: 'core' },
      { name: 'Hollow Hold', sets: 3, reps: '30s', rest: '30s', category: 'core' },
    ],
    cooldown: ['Child pose 1 min', 'Spinal twists'],
  },
  {
    id: 'active-recovery',
    name: 'Active Recovery',
    description: 'Rest and restore',
    duration: '25 min',
    warmup: [],
    exercises: [
      { name: 'Foam Rolling', sets: 1, reps: '2 min each', rest: '-', category: 'recovery' },
      { name: 'Hip Flexor Stretch', sets: 1, reps: '1 min each', rest: '-', category: 'recovery' },
      { name: 'Pigeon Pose', sets: 1, reps: '1 min each', rest: '-', category: 'recovery' },
    ],
    cooldown: ['Meditation 5 min'],
  },
];
```

---

## 🎯 Hub Navigation

```tsx
// src/app/dashboard/dream-gym/page.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Dumbbell, Heart, Brain, Target, 
  BarChart3, Scale, ClipboardCheck, 
  Timer, CalendarDays, Footprints 
} from 'lucide-react';

const modules = [
  { name: 'Schedule', href: '/dashboard/dream-gym/schedule', icon: CalendarDays, color: 'bg-blue-500' },
  { name: 'Workout', href: '/dashboard/dream-gym/workout', icon: Dumbbell, color: 'bg-orange-500' },
  { name: 'Cardio', href: '/dashboard/dream-gym/cardio', icon: Timer, color: 'bg-red-500' },
  { name: 'Mental', href: '/dashboard/dream-gym/mental', icon: Brain, color: 'bg-purple-500' },
  { name: 'Strategy', href: '/dashboard/dream-gym/strategy', icon: Target, color: 'bg-green-500' },
  { name: 'Progress', href: '/dashboard/dream-gym/progress', icon: BarChart3, color: 'bg-cyan-500' },
  { name: 'Biometrics', href: '/dashboard/dream-gym/biometrics', icon: Scale, color: 'bg-pink-500' },
  { name: 'Assessments', href: '/dashboard/dream-gym/assessments', icon: ClipboardCheck, color: 'bg-indigo-500' },
  { name: 'Practices', href: '/dashboard/dream-gym/practices', icon: Footprints, color: 'bg-amber-500' },
];

export default function DreamGymHub() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Dream Gym</h1>
      
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } },
        }}
      >
        {modules.map((module) => (
          <motion.div
            key={module.name}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <Link href={module.href}>
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md 
                           transition-shadow cursor-pointer"
              >
                <div className={`w-12 h-12 ${module.color} rounded-xl 
                                 flex items-center justify-center mb-4`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-zinc-900">{module.name}</h3>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
```

---

## 🚫 Avoid

- Loading all animations on page load (lazy load instead)
- Auto-playing all videos simultaneously
- Missing fallback for unsupported formats
- Forgetting to handle empty/loading states

---

## ✅ Do

- Lazy load animation assets
- Use `playsInline` for mobile video
- Provide exercise descriptions alongside animations
- Allow users to pause/skip exercises
- Track workout completion in Firestore

---

*Train smart, perform better* 🏆
