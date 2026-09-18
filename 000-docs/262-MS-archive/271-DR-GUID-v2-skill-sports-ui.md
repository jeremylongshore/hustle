# Hustle Sports UI Components

> **Use this skill when building sports-related UI components.**

---

## 📊 Stat Card

Display key statistics with optional trend indicators.

```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
}

function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <div className="text-amber-500">{icon}</div>}
      </div>
      <p className="text-4xl font-bold text-zinc-900">{value}</p>
      {trend && (
        <p className={cn(
          "text-sm mt-2 flex items-center gap-1",
          trend.direction === 'up' && "text-green-600",
          trend.direction === 'down' && "text-red-600",
          trend.direction === 'neutral' && "text-muted-foreground"
        )}>
          {trend.direction === 'up' && <ArrowUp className="w-4 h-4" />}
          {trend.direction === 'down' && <ArrowDown className="w-4 h-4" />}
          {trend.direction === 'neutral' && <Minus className="w-4 h-4" />}
          {trend.value > 0 && '+'}{trend.value} this month
        </p>
      )}
    </motion.div>
  );
}
```

### Usage

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatCard 
    label="Total Goals" 
    value={23} 
    trend={{ value: 5, direction: 'up' }}
    icon={<Target className="w-5 h-5" />}
  />
  <StatCard 
    label="Assists" 
    value={12} 
    trend={{ value: 2, direction: 'up' }}
  />
  <StatCard 
    label="Games Played" 
    value={18} 
  />
  <StatCard 
    label="Win Rate" 
    value="78%" 
    trend={{ value: 3, direction: 'up' }}
  />
</div>
```

---

## 🔵 Progress Ring

Circular progress indicator for completion percentages.

```tsx
interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'amber' | 'green' | 'red' | 'blue';
}

function ProgressRing({ 
  progress, 
  size = 80, 
  strokeWidth = 8,
  label,
  showPercentage = true,
  color = 'amber'
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress * circumference);

  const colorClasses = {
    amber: 'text-amber-500',
    green: 'text-green-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg 
        width={size} 
        height={size} 
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-warm-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
          className={colorClasses[color]}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        {showPercentage && (
          <span className="text-lg font-bold text-zinc-900">
            {Math.round(progress * 100)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  );
}
```

### Usage

```tsx
<ProgressRing progress={0.75} label="Goals" />
<ProgressRing progress={0.92} color="green" size={100} />
```

---

## 🏆 Result Badge

Display game results (Win/Loss/Draw).

```tsx
type GameResult = 'win' | 'loss' | 'draw';

interface ResultBadgeProps {
  result: GameResult;
  size?: 'sm' | 'md' | 'lg';
}

function ResultBadge({ result, size = 'md' }: ResultBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const resultClasses = {
    win: 'bg-green-100 text-green-700',
    loss: 'bg-red-100 text-red-700',
    draw: 'bg-zinc-100 text-zinc-700',
  };

  const labels = {
    win: 'W',
    loss: 'L',
    draw: 'D',
  };

  return (
    <span className={cn(
      "inline-flex items-center justify-center font-semibold rounded-full",
      sizeClasses[size],
      resultClasses[result]
    )}>
      {labels[result]}
    </span>
  );
}
```

---

## 👤 Athlete Card

Card for displaying athlete in list view.

```tsx
interface AthleteCardProps {
  athlete: {
    id: string;
    name: string;
    position: string;
    age: number;
    team: string;
    photoUrl?: string;
  };
  stats?: {
    games: number;
    goals: number;
    assists: number;
  };
  onClick?: () => void;
}

function AthleteCard({ athlete, stats, onClick }: AthleteCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md 
                 transition-shadow cursor-pointer"
    >
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="w-16 h-16">
          {athlete.photoUrl ? (
            <AvatarImage src={athlete.photoUrl} alt={athlete.name} />
          ) : (
            <AvatarFallback className={getAvatarColor(athlete.name)}>
              {getInitials(athlete.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h3 className="font-semibold text-lg text-zinc-900">
            {athlete.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {athlete.position} • Age {athlete.age}
          </p>
          <p className="text-sm text-muted-foreground">{athlete.team}</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-warm-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-900">{stats.games}</p>
            <p className="text-xs text-muted-foreground">Games</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-900">{stats.goals}</p>
            <p className="text-xs text-muted-foreground">Goals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-900">{stats.assists}</p>
            <p className="text-xs text-muted-foreground">Assists</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
```

---

## ⚽ Game Row

Display game in a list/table.

```tsx
interface GameRowProps {
  game: {
    id: string;
    date: Date;
    opponent: string;
    result: 'win' | 'loss' | 'draw';
    score: { home: number; away: number };
    goals: number;
    assists: number;
    verified: boolean;
  };
  athleteName?: string;
  onClick?: () => void;
}

function GameRow({ game, athleteName, onClick }: GameRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-white rounded-xl
                 hover:bg-warm-50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="text-center w-16">
          <p className="text-sm font-medium text-zinc-900">
            {format(game.date, 'MMM d')}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(game.date, 'yyyy')}
          </p>
        </div>

        <div>
          <p className="font-medium text-zinc-900">vs {game.opponent}</p>
          {athleteName && (
            <p className="text-sm text-muted-foreground">{athleteName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <ResultBadge result={game.result} />
        
        <p className="font-bold text-zinc-900 w-16 text-center">
          {game.score.home} - {game.score.away}
        </p>

        <div className="flex gap-4 text-sm">
          <span className="text-zinc-600">
            <strong>{game.goals}</strong> G
          </span>
          <span className="text-zinc-600">
            <strong>{game.assists}</strong> A
          </span>
        </div>

        {game.verified ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <Clock className="w-5 h-5 text-amber-500" />
        )}
      </div>
    </motion.div>
  );
}
```

---

## 📅 Week Selector

For Dream Gym schedule view.

```tsx
interface WeekSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

function WeekSelector({ selectedDate, onDateChange }: WeekSelectorProps) {
  const weekDays = getWeekDays(selectedDate); // Returns array of 7 dates

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onDateChange(subWeeks(selectedDate, 1))}
          className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold">
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </span>
        <button
          onClick={() => onDateChange(addWeeks(selectedDate, 1))}
          className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateChange(day)}
              className={cn(
                "flex flex-col items-center p-2 rounded-xl transition-colors",
                isSelected 
                  ? "bg-zinc-900 text-white" 
                  : "hover:bg-warm-100",
                isToday && !isSelected && "ring-2 ring-amber-500"
              )}
            >
              <span className="text-xs font-medium">
                {format(day, 'EEE')}
              </span>
              <span className="text-lg font-bold">
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 🎯 Position Badge

Display player position.

```tsx
const positionColors: Record<string, string> = {
  GK: 'bg-yellow-100 text-yellow-800',
  CB: 'bg-blue-100 text-blue-800',
  LB: 'bg-blue-100 text-blue-800',
  RB: 'bg-blue-100 text-blue-800',
  CDM: 'bg-green-100 text-green-800',
  CM: 'bg-green-100 text-green-800',
  CAM: 'bg-purple-100 text-purple-800',
  LW: 'bg-orange-100 text-orange-800',
  RW: 'bg-orange-100 text-orange-800',
  ST: 'bg-red-100 text-red-800',
  CF: 'bg-red-100 text-red-800',
};

function PositionBadge({ position }: { position: string }) {
  return (
    <span className={cn(
      "px-2 py-1 text-xs font-semibold rounded-full",
      positionColors[position] || 'bg-zinc-100 text-zinc-800'
    )}>
      {position}
    </span>
  );
}
```

---

## 📈 Usage Progress Bar

For plan limits display.

```tsx
interface UsageProgressProps {
  label: string;
  used: number;
  max: number;
  unit?: string;
}

function UsageProgress({ label, used, max, unit = '' }: UsageProgressProps) {
  const percentage = Math.min((used / max) * 100, 100);
  const status = percentage < 70 ? 'ok' : percentage < 100 ? 'warning' : 'critical';

  const statusColors = {
    ok: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-zinc-700">{label}</span>
        <span className="text-muted-foreground">
          {used}{unit} / {max}{unit}
        </span>
      </div>
      <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn("h-full rounded-full", statusColors[status])}
        />
      </div>
    </div>
  );
}
```

---

## 🏃 Exercise Video Player

For Dream Gym workout animations.

```tsx
interface ExerciseVideoProps {
  src: string;
  name: string;
  reps?: string;
  duration?: string;
}

function ExerciseVideo({ src, name, reps, duration }: ExerciseVideoProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="aspect-square relative">
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-zinc-900">{name}</h4>
        <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
          {reps && <span>{reps}</span>}
          {duration && <span>{duration}</span>}
        </div>
      </div>
    </div>
  );
}
```

### Usage

```tsx
<ExerciseVideo
  src="/animations/workout/squat.mp4"
  name="Goblet Squats"
  reps="3 × 10-12"
  duration="60s rest"
/>
```

---

## 🔧 Utility Functions

```typescript
// src/lib/player-utils.ts

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
  ];
  
  const hash = name.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
}

export function calculateAge(birthday: Date): number {
  const today = new Date();
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}
```

---

*Build components that inspire athletes* ⚽
