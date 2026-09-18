/**
 * API Route for AI Workout Feedback
 *
 * This route receives workout data, sends it to an AI model,
 * and returns the generated feedback.
 */
import { NextResponse } from 'next/server';
import type { WorkoutLog } from '@/types/domain';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/ai/feedback');

// This is a mock AI feedback function.
// In a real application, this would make a call to an AI service
// like OpenAI's GPT or Google's Gemini.
async function getAIFeedback(workout: WorkoutLog): Promise<string> {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  const feedbackPoints = [
    `Great job on the ${workout.title}! Consistency is key.`,
    `You spent ${workout.duration} minutes working out. Fantastic dedication!`,
    `You completed ${workout.exercises.length} different exercises. Good variety!`,
    "Remember to stay hydrated and focus on recovery.",
    "Consider adding some stretching or mobility work to your cool-down.",
    "Your hard work is paying off. Keep it up!"
  ];

  return feedbackPoints[Math.floor(Math.random() * feedbackPoints.length)];
}

export async function POST(request: Request) {
  try {
    const { workout } = (await request.json()) as { workout: WorkoutLog };

    if (!workout) {
      return NextResponse.json(
        { success: false, error: 'Workout data is required' },
        { status: 400 }
      );
    }

    const feedback = await getAIFeedback(workout);

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    logger.error('Error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to get AI feedback' },
      { status: 500 }
    );
  }
}
