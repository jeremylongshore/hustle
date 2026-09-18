# Conversational Agent Design for Hustle
**Personal Sports Data Statistician for College Athletics Journey**

Created: 2025-11-19
Status: Design Proposal

## Vision

Replace traditional forms with a **conversational agent** that acts as each player's personal sports statistician, tracking their journey from youth soccer to college athletics.

## User Experience Comparison

### Before (Form-Based)
```
Dashboard → Add Player → Fill Form (5 fields) → Submit
Dashboard → Log Game → Fill Form (10+ fields) → Submit
Dashboard → View Stats → Filter by player → Export PDF
```

### After (Conversational Agent)
```
User: "Emma just finished her game"
Agent: "How did she do?"
User: "2 goals, 1 assist, played 60 minutes"
Agent: "Great! League or tournament?"
User: "League against Riverside High"
Agent: "✅ Logged! Emma's season: 12 goals, 8 assists in 10 games. On track for D1 recruitment!"
```

## Agent Personas

### 1. **Scout** (Main Conversational Agent)
**Role**: Personal sports statistician and recruitment advisor

**Capabilities**:
- Natural language stat logging
- Contextual follow-up questions
- Player history awareness (Memory Bank)
- Recruitment milestone tracking
- Conversational insights ("You need 3 more shutouts for D1 goalkeepers")

**Example Conversations**:

```
📱 After a Game:
User: "Just finished the tournament final"
Scout: "Congrats! Which player and how did they do?"
User: "Emma - 1 goal, game winner in overtime"
Scout: "Epic! 🎉 Was this the State Cup final you mentioned last week?"
User: "Yes!"
Scout: "Logged! Emma now has 5 tournament goals this season. College scouts love clutch performers!"

📱 General Questions:
User: "How is Emma doing compared to last year?"
Scout: "Great question! Emma's averaging 2.1 goals/game vs 1.3 last year.
       Her assist rate is up 40%. She's on pace for D1 recruitment!"

📱 Recruitment Prep:
User: "What does Emma need for her recruiting video?"
Scout: "Based on her stats:
       ✅ 15+ goals (she has 18)
       ✅ Tournament MVP (State Cup)
       ⚠️  Need 2 more showcase events
       💡 Focus on her speed - she's top 10% in minutes played"
```

### 2. **Validator** (Background Agent)
**Role**: Data validation and COPPA compliance

**Capabilities**:
- Validates stat inputs (no negative goals!)
- Checks COPPA requirements
- Ensures parent/guardian permissions
- Flags suspicious patterns

### 3. **Analyst** (Background Agent)
**Role**: Statistical analysis and insights

**Capabilities**:
- Calculates percentiles
- Tracks trends
- Identifies strengths/weaknesses
- Compares to recruitment benchmarks

### 4. **Recruiter** (Background Agent)
**Role**: College recruitment tracking

**Capabilities**:
- Tracks college coach contacts
- Monitors showcase events
- Suggests target schools by division
- Generates highlight reels data

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│  (Chat UI instead of Forms)                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Firebase Cloud Functions
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Scout Agent (Main Orchestrator)                 │
│  - ADK Agent with Memory Bank                                │
│  - Remembers player history, parent preferences              │
│  - Natural language understanding                            │
│  - Conversational response generation                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ A2A Protocol
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Sub-Agent Network                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Validator │  │ Analyst  │  │Recruiter │  │Analytics │   │
│  │  Agent   │  │  Agent   │  │  Agent   │  │  Agent   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Firestore API
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firestore Database                        │
│  /users/{userId}/                                            │
│    /players/{playerId}/                                      │
│      /games/{gameId}/                                        │
│      /recruitment/{eventId}/                                 │
│      /insights/{insightId}/                                  │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Using ADK SDK

### Scout Agent Definition

```python
from google.adk import Agent
from google.adk.tools import FunctionTool
from google.adk.memory import MemoryBank

scout_agent = Agent(
    name="scout_personal_statistician",
    description="""
    Personal sports statistician and recruitment advisor for youth athletes.

    You help parents and players track their sports journey from youth leagues
    to college athletics. You remember every game, every stat, and provide
    insights on recruitment readiness.

    Your personality:
    - Encouraging and positive
    - Knowledgeable about college recruitment
    - Data-driven but conversational
    - Protective of youth (COPPA compliant)

    You can:
    - Log game statistics conversationally
    - Answer questions about player performance
    - Provide recruitment insights
    - Track progress toward college goals
    """,
    tools=[
        FunctionTool(log_game_stats),
        FunctionTool(get_player_stats),
        FunctionTool(get_recruitment_insights),
        FunctionTool(compare_to_benchmarks),
        FunctionTool(suggest_next_steps)
    ],
    model="gemini-2.0-flash-exp",
    enable_memory_bank=True,  # Remember all conversations!
    enable_code_execution=True  # Calculate stats on the fly
)
```

### Chat UI (Replace Forms)

```typescript
// app/chat/page.tsx
'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

export default function ScoutChat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/scout/chat',
  });

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Tell me about the game..."
          className="w-full p-3 border rounded-lg"
        />
      </form>
    </div>
  );
}
```

### Cloud Function Integration

```typescript
// app/api/scout/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
  const { messages, userId } = await req.json();

  // Call Scout Agent via Vertex AI Agent Engine
  const response = await fetch(
    `https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/us-central1/agents/scout-personal-statistician:run`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        messages,
        session_id: userId,  // Memory Bank persistence
        config: {
          enable_memory_bank: true,
          enable_code_execution: true
        }
      })
    }
  );

  const data = await response.json();

  return NextResponse.json({
    message: data.response,
    stats_updated: data.tools_called?.includes('log_game_stats')
  });
}
```

## Hybrid Approach (Best of Both Worlds)

You don't have to choose! Offer both:

1. **Quick Add Form** (for power users who want speed)
   - "Fast Stats Entry" button
   - Pre-filled with common values
   - One-click submit

2. **Conversational Chat** (default, more engaging)
   - Main interface
   - Guided conversation
   - Natural for first-time users

3. **Voice Input** (future enhancement)
   - "Just finished Emma's game" (speak into phone)
   - Agent processes via Speech-to-Text
   - Hands-free logging at the field!

## Benefits for Your Use Case

### 1. **Lower Friction**
- No intimidating forms
- Conversational feels natural
- Guided by agent (less chance of errors)

### 2. **Better Data Quality**
- Agent asks clarifying questions
- Validates as you go
- Catches inconsistencies ("Emma played 90 minutes in a 60-minute game?")

### 3. **Personalized Insights**
- Agent knows Emma's history
- Compares to her past performance
- Suggests recruitment next steps

### 4. **Scalable to Complex Queries**
```
User: "How do my players compare to D1 recruitment standards?"
Agent: "Great question! Let me analyze your roster:

Emma (Forward):
✅ Goals/game: 2.1 (D1 avg: 1.8)
✅ Tournament play: 12 games (D1 needs: 10+)
⚠️  Showcase events: 1 (D1 needs: 3+)

Jordan (Goalkeeper):
✅ Save %: 82% (D1 avg: 78%)
✅ Shutouts: 8 (D1 needs: 5+)
✅ Showcase events: 2

Recommendation: Emma needs 2 more showcases. Jordan is D1-ready!"
```

### 5. **Competitive Advantage**
- **No other youth sports app has this**
- Feels like having a personal recruiting consultant
- Parents will love the guidance
- Word-of-mouth marketing gold

## MVP Implementation Plan

### Week 1: Core Chat Agent
1. Deploy Scout agent to Vertex AI Agent Engine
2. Add basic tools: log_game_stats, get_player_stats
3. Simple chat UI in Next.js

### Week 2: Memory Bank Integration
1. Enable Memory Bank for session persistence
2. Agent remembers player names, positions
3. Contextual follow-up questions

### Week 3: Advanced Features
1. Add recruitment insights tool
2. Benchmark comparisons
3. Voice input (optional)

### Week 4: Hybrid UI
1. Keep forms as "Quick Entry" option
2. Chat as default
3. User preference toggle

## Example Prompts for Scout Agent

```markdown
# Scout Agent System Prompt

You are Scout, a personal sports statistician and recruitment advisor for youth soccer players.

## Your Role
- Help parents track their child's sports journey
- Log game statistics conversationally
- Provide insights on college recruitment readiness
- Be encouraging and data-driven

## Conversation Guidelines
1. Always confirm player name before logging stats
2. Ask clarifying questions for missing data
3. Celebrate achievements (goals, shutouts, wins)
4. Provide recruitment context when relevant
5. Be COPPA compliant - never ask for personal info beyond sports stats

## Example Interactions

User: "Emma scored 2 goals today"
You: "Awesome! Was this a league or tournament game?"

User: "League game"
You: "Got it! Against which team?"

User: "Riverside High"
You: "Perfect! ✅ Logged 2 goals for Emma vs Riverside High (league).
      She's averaging 2.1 goals/game this season - that's D1 level!"

## Tools Available
- log_game_stats(player_name, stats, opponent, game_type)
- get_player_stats(player_name, timeframe)
- get_recruitment_insights(player_name, target_division)
- compare_to_benchmarks(player_name, position)

Always use tools to access real data. Never make up statistics.
```

## Decision Time

Do you want to:

**Option A: Conversational Agent (Revolutionary)**
- Much more engaging
- Competitive advantage
- Better user experience
- Aligns with your Vertex AI stack

**Option B: Keep Forms (Traditional)**
- Faster to build initially
- Familiar to users
- Less complex

**Option C: Hybrid (Best of Both)**
- Conversational as default
- Forms as "Quick Entry"
- Gives users choice

My recommendation: **Option C (Hybrid)** with conversational as the main interface. This gives you:
1. Competitive differentiation
2. Better engagement
3. Fallback to forms for power users
4. Perfect use case for your ADK SDK investment

Want me to start building the Scout agent?
