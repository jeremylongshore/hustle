// POST /api/ai/recommend
//
// Generates short coaching recommendations (strategy / analytics / tip)
// via Claude. Each prompt type splits its persona (system) from the
// per-request data (user) so the role description stays out of the
// data prompt.

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import { serverError, isStripeCardError } from '@/lib/api/errors';

// ─── System prompts (persona/role) ───────────────────────────

const SYSTEM_PROMPTS = {
  strategy:
    'You are an expert youth soccer coach. You give concise, actionable, ' +
    'motivating tactical advice written directly to the player.',
  analytics:
    'You are a soccer performance analyst reviewing a youth athlete\'s stats. ' +
    'You write data-driven yet encouraging insights, concise and specific.',
  tip:
    'You are a youth soccer coach delivering a single daily motivational tip. ' +
    'You address the player directly (use "you") and stay brief and practical.',
} as const;

// ─── User-prompt builders (per-request data) ─────────────────

function buildStrategyUserPrompt(ctx: Record<string, unknown>): string {
  const formation     = (ctx.formation     as string) ?? 'unknown';
  const position      = (ctx.position      as string | undefined);
  const opponentNotes = (ctx.opponentNotes as string | undefined);

  return [
    'A player is preparing for a match.',
    `Formation: ${formation}`,
    position      ? `Player position: ${position}`   : '',
    opponentNotes ? `Opponent notes: ${opponentNotes}` : '',
    '',
    'Give exactly 3 specific, actionable tactical recommendations tailored to this formation and position.',
    'Format as a numbered list (1. 2. 3.). Keep each point to 2 sentences max.',
  ].filter(Boolean).join('\n');
}

function buildAnalyticsUserPrompt(ctx: Record<string, unknown>): string {
  const goals   = ctx.goals   as number;
  const assists = ctx.assists as number;
  const games   = ctx.games   as number;
  const winRate = ctx.winRate as number;
  const range   = (ctx.range  as string) ?? 'the selected period';

  return [
    `Period: ${range}`,
    `Stats — Goals: ${goals}, Assists: ${assists}, Games: ${games}, Win Rate: ${winRate}%`,
    '',
    'Provide 2–3 key insights about their performance trends.',
    'Highlight one clear strength and one concrete area to improve.',
    '4 sentences maximum total.',
  ].join('\n');
}

function buildTipUserPrompt(ctx: Record<string, unknown>): string {
  const workoutsCompleted = ctx.workoutsCompleted as number;
  const workoutsGoal      = ctx.workoutsGoal      as number;
  const practicesLogged   = ctx.practicesLogged   as number;
  const recentResults     = ctx.recentResults     as string | undefined;

  return [
    `Workouts completed this week: ${workoutsCompleted}/${workoutsGoal}`,
    `Practices logged: ${practicesLogged}`,
    recentResults ? `Recent results: ${recentResults}` : '',
    '',
    'Give ONE specific, actionable tip for today to improve performance.',
    'Keep it to 2–3 sentences only.',
  ].filter(Boolean).join('\n');
}

// ─── Route handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      type: 'strategy' | 'analytics' | 'tip';
      context: Record<string, unknown>;
    };

    const { type, context } = body;

    if (!type || !context) {
      return NextResponse.json({ error: 'Missing type or context' }, { status: 400 });
    }

    let userPrompt: string;
    if (type === 'strategy') {
      userPrompt = buildStrategyUserPrompt(context);
    } else if (type === 'analytics') {
      userPrompt = buildAnalyticsUserPrompt(context);
    } else if (type === 'tip') {
      userPrompt = buildTipUserPrompt(context);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    console.log(`[/api/ai/recommend] type=${type}`);

    const result = await generateText({
      system: SYSTEM_PROMPTS[type],
      user: userPrompt,
      // Coaching tips are short — 512 tokens is plenty and keeps cost down.
      maxTokens: 512,
      temperature: 0.7,
    });

    return NextResponse.json({ result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[/api/ai/recommend] ERROR:', msg);
    // Return the raw error in the response body so it's visible in browser DevTools
    return NextResponse.json(
      { error: 'AI_REQUEST_FAILED', message: 'The coach could not generate a suggestion right now.' },
      { status: 500 },
    );
  }
}
