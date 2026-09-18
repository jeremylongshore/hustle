# Exercise Animation Mapping — Complete Reference

Use this file to map exercises to their animation files.

## Workout Animations (MP4)

Location: `/public/animations/workout/`

### Complete Mapping

```typescript
// src/lib/dream-gym/exercise-animations.ts

export const workoutAnimations: Record<string, string> = {
  // === SQUATS & LEGS ===
  'Goblet Squats': '/animations/workout/squat.mp4',
  'Squats': '/animations/workout/squat.mp4',
  'Bodyweight Squats': '/animations/workout/squat.mp4',
  'Air Squats': '/animations/workout/squat.mp4',
  
  // === LUNGES ===
  'Walking Lunges': '/animations/workout/lunge.mp4',
  'Lunges': '/animations/workout/lunge.mp4',
  'Forward Lunges': '/animations/workout/lunge.mp4',
  'Reverse Lunges': '/animations/workout/lunge.mp4',
  'Side Lunges Left': '/animations/workout/side-lunge-left.mp4',
  'Side Lunges Right': '/animations/workout/side-lunge-right.mp4',
  'Lateral Lunges': '/animations/workout/side-lunge-left.mp4',
  'Lateral Skaters': '/animations/workout/side-lunge-left.mp4',
  
  // === PUSH-UPS ===
  'Push-ups': '/animations/workout/pushup.mp4',
  'Push Ups': '/animations/workout/pushup.mp4',
  'Pushups': '/animations/workout/pushup.mp4',
  'Wide Push-ups': '/animations/workout/pushup.mp4',
  'Diamond Push-ups': '/animations/workout/pushup.mp4',
  'Incline Push-ups': '/animations/workout/pushup.mp4',
  'Decline Push-ups': '/animations/workout/pushup-down.mp4',
  
  // === PLANKS ===
  'Plank': '/animations/workout/plank.mp4',
  'Plank Hold': '/animations/workout/plank.mp4',
  'Forearm Plank': '/animations/workout/plank.mp4',
  'High Plank': '/animations/workout/high-plank.mp4',
  'Side Plank': '/animations/workout/plank-side.mp4',
  'Side Plank Left': '/animations/workout/plank-side.mp4',
  'Side Plank Right': '/animations/workout/plank-side.mp4',
  'Plank Shoulder Taps': '/animations/workout/plank-alt.mp4',
  'Plank Variation': '/animations/workout/plank-alt.mp4',
  
  // === CORE ===
  'Bicycle Crunches': '/animations/workout/bicycle-crunch.mp4',
  'Crunches': '/animations/workout/bicycle-crunch.mp4',
  'Leg Raises': '/animations/workout/leg-raise.mp4',
  'Lying Leg Raises': '/animations/workout/leg-raise.mp4',
  'Hanging Leg Raises': '/animations/workout/leg-raise.mp4',
  'Russian Twists': '/animations/workout/lying-twist.mp4',
  'Lying Twists': '/animations/workout/lying-twist.mp4',
  'Spinal Twists': '/animations/workout/lying-twist.mp4',
  'V-Sit': '/animations/workout/v-sit.mp4',
  'V-Ups': '/animations/workout/v-sit.mp4',
  'Hollow Hold': '/animations/workout/v-sit.mp4',
  'Boat Pose': '/animations/workout/v-sit.mp4',
  'Seated Leg Lifts': '/animations/workout/seated-leg-lift.mp4',
  'Seated Leg Raises': '/animations/workout/seated-leg-lift.mp4',
  
  // === GLUTES & HIPS ===
  'Glute Bridges': '/animations/workout/glute-bridge.mp4',
  'Glute Bridge': '/animations/workout/glute-bridge.mp4',
  'Hip Bridges': '/animations/workout/glute-bridge.mp4',
  'Donkey Kicks': '/animations/workout/donkey-kick.mp4',
  'Donkey Kick': '/animations/workout/donkey-kick.mp4',
  'Fire Hydrants': '/animations/workout/donkey-kick.mp4',
  
  // === BACK ===
  'Superman': '/animations/workout/superman.mp4',
  'Supermans': '/animations/workout/superman.mp4',
  'Superman Hold': '/animations/workout/superman.mp4',
  'Back Extensions': '/animations/workout/superman.mp4',
  
  // === CARDIO / CONDITIONING ===
  'Mountain Climbers': '/animations/workout/mountain-climber.mp4',
  'Box Jumps': '/animations/workout/box-step.mp4',
  'Box Steps': '/animations/workout/box-step.mp4',
  'Step Ups': '/animations/workout/box-step.mp4',
  'Burpees': '/animations/workout/squat.mp4',
  'Jumping Jacks': '/animations/workout/standing.mp4',
  'High Knees': '/animations/workout/standing.mp4',
  'Butt Kicks': '/animations/workout/standing.mp4',
  
  // === STRETCHING / RECOVERY ===
  'Standing Stretch': '/animations/workout/standing-stretch.mp4',
  'Standing Stretches': '/animations/workout/standing-stretch.mp4',
  'Hamstring Stretch': '/animations/workout/standing-stretch.mp4',
  'Quad Stretch': '/animations/workout/standing-stretch.mp4',
  'Hip Flexor Stretch': '/animations/workout/standing-stretch.mp4',
  'Arm Circles': '/animations/workout/standing-stretch.mp4',
  'Foam Rolling': '/animations/workout/rest.mp4',
  'Pigeon Pose': '/animations/workout/rest.mp4',
  'Child Pose': '/animations/workout/rest.mp4',
  'Rest': '/animations/workout/rest.mp4',
  'Meditation': '/animations/workout/rest.mp4',
  
  // === STANDING / DEFAULT ===
  'Romanian Deadlifts': '/animations/workout/standing.mp4',
  'Deadlifts': '/animations/workout/standing.mp4',
  'Calf Raises': '/animations/workout/standing.mp4',
  'Standing': '/animations/workout/standing.mp4',
  
  // === FALLBACK ===
  'default': '/animations/workout/standing.mp4',
};
```

## Soccer Practice Images (PNG)

Location: `/public/animations/soccer/`

### Complete Mapping

```typescript
export const practiceAnimations: Record<string, string> = {
  // === BALL SKILLS ===
  'passing': '/animations/soccer/passing.png',
  'Passing': '/animations/soccer/passing.png',
  'Passing Drills': '/animations/soccer/passing.png',
  'Short Passing': '/animations/soccer/passing.png',
  'Long Passing': '/animations/soccer/passing.png',
  
  'shooting': '/animations/soccer/shooting.png',
  'Shooting': '/animations/soccer/shooting.png',
  'Shooting Practice': '/animations/soccer/shooting.png',
  'Finishing': '/animations/soccer/shooting.png',
  'Set Pieces': '/animations/soccer/shooting.png',
  'Free Kicks': '/animations/soccer/shooting.png',
  'Penalties': '/animations/soccer/shooting.png',
  
  'dribbling': '/animations/soccer/dribbling.png',
  'Dribbling': '/animations/soccer/dribbling.png',
  'Dribbling Drills': '/animations/soccer/dribbling.png',
  'Ball Control': '/animations/soccer/ball-control.png',
  'Close Control': '/animations/soccer/ball-control.png',
  'Skill Moves': '/animations/soccer/dribbling-alt.png',
  '1v1': '/animations/soccer/dribbling-alt.png',
  
  'first_touch': '/animations/soccer/first-touch.png',
  'First Touch': '/animations/soccer/first-touch.png',
  'Receiving': '/animations/soccer/first-touch.png',
  'Trapping': '/animations/soccer/first-touch.png',
  'Chest Control': '/animations/soccer/chest-control.png',
  
  'heading': '/animations/soccer/heading.png',
  'Heading': '/animations/soccer/heading.png',
  'Aerial Duels': '/animations/soccer/heading.png',
  
  // === TACTICAL ===
  'positioning': '/animations/soccer/positioning.png',
  'Positioning': '/animations/soccer/positioning.png',
  'Movement': '/animations/soccer/positioning.png',
  'Off The Ball': '/animations/soccer/positioning.png',
  'Defending': '/animations/soccer/positioning.png',
  'Marking': '/animations/soccer/positioning.png',
  'Tactics': '/animations/soccer/positioning.png',
  
  // === MATCH / FITNESS ===
  'scrimmage': '/animations/soccer/scrimmage.png',
  'Scrimmage': '/animations/soccer/scrimmage.png',
  'Small Sided Game': '/animations/soccer/scrimmage.png',
  'Match Play': '/animations/soccer/scrimmage.png',
  'Game Simulation': '/animations/soccer/scrimmage.png',
  
  'warmup': '/animations/soccer/warmup.png',
  'Warmup': '/animations/soccer/warmup.png',
  'Warm Up': '/animations/soccer/warmup.png',
  'Fitness': '/animations/soccer/warmup.png',
  'Conditioning': '/animations/soccer/warmup.png',
  'Cooldown': '/animations/soccer/warmup.png',
  
  // === GOALKEEPER ===
  'goalkeeping': '/animations/soccer/goalkeeper.png',
  'Goalkeeping': '/animations/soccer/goalkeeper.png',
  'Goalkeeper': '/animations/soccer/goalkeeper.png',
  'GK Training': '/animations/soccer/goalkeeper.png',
  'Diving': '/animations/soccer/goalkeeper.png',
  'Shot Stopping': '/animations/soccer/goalkeeper.png',
  
  // === DEFAULT ===
  'standing': '/animations/soccer/standing.png',
  'default': '/animations/soccer/standing.png',
};
```

## Helper Functions

```typescript
export function getWorkoutAnimation(exerciseName: string): string {
  // Try exact match first
  if (workoutAnimations[exerciseName]) {
    return workoutAnimations[exerciseName];
  }
  
  // Try case-insensitive match
  const lowerName = exerciseName.toLowerCase();
  for (const [key, value] of Object.entries(workoutAnimations)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(workoutAnimations)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value;
    }
  }
  
  return workoutAnimations['default'];
}

export function getPracticeAnimation(focusArea: string): string {
  // Try exact match first
  if (practiceAnimations[focusArea]) {
    return practiceAnimations[focusArea];
  }
  
  // Try case-insensitive match
  const lowerName = focusArea.toLowerCase();
  for (const [key, value] of Object.entries(practiceAnimations)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  return practiceAnimations['default'];
}
```

## Animation File Inventory

### Workout MP4s (23 files)
| File | Best Used For |
|------|---------------|
| standing.mp4 | Default, deadlifts, standing exercises |
| squat.mp4 | Squats, burpees |
| lunge.mp4 | Forward/reverse lunges |
| side-lunge-left.mp4 | Lateral movements left |
| side-lunge-right.mp4 | Lateral movements right |
| pushup.mp4 | Push-ups |
| pushup-down.mp4 | Push-up variations |
| plank.mp4 | Forearm plank |
| high-plank.mp4 | High plank |
| plank-side.mp4 | Side plank |
| plank-alt.mp4 | Plank variations |
| bicycle-crunch.mp4 | Crunches, bicycle |
| leg-raise.mp4 | Leg raises |
| lying-twist.mp4 | Russian twists, spinal |
| v-sit.mp4 | V-ups, hollow hold |
| seated-leg-lift.mp4 | Seated leg work |
| glute-bridge.mp4 | Bridges, hip thrusts |
| donkey-kick.mp4 | Donkey kicks, fire hydrants |
| superman.mp4 | Back extensions |
| mountain-climber.mp4 | Mountain climbers |
| box-step.mp4 | Step ups, box jumps |
| standing-stretch.mp4 | Stretching |
| rest.mp4 | Rest, recovery poses |

### Soccer PNGs (13 files)
| File | Best Used For |
|------|---------------|
| passing.png | Passing drills |
| shooting.png | Shooting, finishing |
| dribbling.png | Dribbling basics |
| dribbling-alt.png | Advanced dribbling |
| first-touch.png | Receiving |
| ball-control.png | Close control |
| chest-control.png | Chest control |
| heading.png | Heading |
| positioning.png | Tactics, defending |
| scrimmage.png | Match simulation |
| warmup.png | Fitness, warmup |
| goalkeeper.png | GK training |
| standing.png | Default |
