# 🤖 Hustle - Vertex AI Agent Engine Implementation

**Date:** 2025-10-29
**Architecture:** Vertex AI Agent Engine (Managed Agent Runtime)
**Status:** Design & Implementation Guide

---

## 🎯 Why Vertex AI Agent Engine?

**Benefits over Cloud Run containers:**
- ✅ **Managed Runtime** - No container management
- ✅ **Native Gemini Integration** - Built-in Gemini 2.0
- ✅ **Auto-scaling** - Google handles scaling
- ✅ **Built-in RAG** - Vertex AI Search integration
- ✅ **Function Calling** - Native tool support
- ✅ **Lower Latency** - Optimized infrastructure
- ✅ **Cost Effective** - Pay per request, no idle costs

---

## 📋 Architecture Overview

```
User → Next.js Frontend → Vertex AI Agent Builder API → Agents
                                    ↓
                          Vertex AI Search (RAG)
                                    ↓
                    Firestore / BigQuery / Cloud SQL
```

---

## 🚀 Implementation Steps

### Step 1: Enable APIs

```bash
# Enable required Google Cloud services
gcloud services enable \
  aiplatform.googleapis.com \
  discoveryengine.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  bigquery.googleapis.com \
  --project=hustleapp-production
```

### Step 2: Create Vertex AI Search Datastore

```bash
# Create datastore for knowledge base (training docs, rules, etc.)
gcloud alpha discovery-engine datastores create hustle-knowledge-base \
  --location=global \
  --project=hustleapp-production \
  --industry-vertical=GENERIC \
  --content-config=CONTENT_REQUIRED \
  --solution-types=SOLUTION_TYPE_SEARCH

# Create datastore for game stats (structured data)
gcloud alpha discovery-engine datastores create hustle-stats-datastore \
  --location=global \
  --project=hustleapp-production \
  --industry-vertical=GENERIC \
  --content-config=CONTENT_REQUIRED \
  --solution-types=SOLUTION_TYPE_SEARCH
```

### Step 3: Create Agent Builder Apps

Each agent is a managed Vertex AI Agent Builder app:

```bash
# Performance Coach Agent
gcloud alpha agent-builder apps create performance-coach \
  --location=global \
  --project=hustleapp-production \
  --display-name="Performance Coach Agent" \
  --agent-type=AGENT_TYPE_DIALOGFLOW \
  --data-store=hustle-knowledge-base

# Stats Analyst Agent
gcloud alpha agent-builder apps create stats-analyst \
  --location=global \
  --project=hustleapp-production \
  --display-name="Stats Analyst Agent" \
  --agent-type=AGENT_TYPE_DIALOGFLOW \
  --data-store=hustle-stats-datastore

# Game Logger Agent
gcloud alpha agent-builder apps create game-logger \
  --location=global \
  --project=hustleapp-production \
  --display-name="Game Logger Agent" \
  --agent-type=AGENT_TYPE_DIALOGFLOW

# Scout Report Agent
gcloud alpha agent-builder apps create scout-report \
  --location=global \
  --project=hustleapp-production \
  --display-name="Scout Report Agent" \
  --agent-type=AGENT_TYPE_DIALOGFLOW \
  --data-store=hustle-knowledge-base

# Verification Agent
gcloud alpha agent-builder apps create verification-agent \
  --location=global \
  --project=hustleapp-production \
  --display-name="Verification Agent" \
  --agent-type=AGENT_TYPE_DIALOGFLOW
```

---

## 🔧 Agent Configuration (Console or API)

### Performance Coach Agent Example

**Agent Configuration (JSON):**

```json
{
  "displayName": "Performance Coach Agent",
  "description": "Analyzes player performance and provides coaching recommendations",
  "languageCode": "en",
  "timeZone": "America/New_York",

  "generativeAiModel": {
    "model": "gemini-2.0-flash-001",
    "temperature": 0.7,
    "topP": 0.95,
    "topK": 40
  },

  "systemInstruction": "You are a Performance Coach AI for youth soccer players (ages 8-18). Analyze player statistics, identify strengths/weaknesses, suggest age-appropriate training drills, and provide actionable feedback to parents and players. Always be encouraging and cite specific stats when making recommendations.",

  "tools": [
    {
      "function": {
        "name": "analyze_player_trends",
        "description": "Analyze performance trends for a specific player over time",
        "parameters": {
          "type": "object",
          "properties": {
            "player_id": {
              "type": "string",
              "description": "The unique identifier for the player"
            },
            "metric": {
              "type": "string",
              "description": "The metric to analyze (goals, assists, tackles, etc.)",
              "enum": ["goals", "assists", "tackles", "saves", "minutes_played"]
            },
            "time_period": {
              "type": "string",
              "description": "Time period for analysis",
              "enum": ["last_5_games", "last_month", "season", "all_time"]
            }
          },
          "required": ["player_id", "metric"]
        }
      },
      "webhook": {
        "url": "https://hustleapp-production.appspot.com/api/tools/analyze-trends",
        "method": "POST"
      }
    },
    {
      "function": {
        "name": "suggest_training_drills",
        "description": "Suggest training drills based on identified weaknesses",
        "parameters": {
          "type": "object",
          "properties": {
            "skill_area": {
              "type": "string",
              "description": "The skill area to improve",
              "enum": ["shooting", "passing", "dribbling", "defending", "goalkeeping"]
            },
            "age_group": {
              "type": "string",
              "description": "Player age group",
              "enum": ["u10", "u12", "u14", "u16", "u18"]
            },
            "difficulty_level": {
              "type": "string",
              "description": "Drill difficulty",
              "enum": ["beginner", "intermediate", "advanced"]
            }
          },
          "required": ["skill_area", "age_group"]
        }
      },
      "webhook": {
        "url": "https://hustleapp-production.appspot.com/api/tools/suggest-drills",
        "method": "POST"
      }
    },
    {
      "function": {
        "name": "compare_to_average",
        "description": "Compare player stats to position and age group averages",
        "parameters": {
          "type": "object",
          "properties": {
            "player_id": {
              "type": "string",
              "description": "The unique identifier for the player"
            },
            "comparison_type": {
              "type": "string",
              "description": "Type of comparison to perform",
              "enum": ["position_average", "age_group_average", "team_average"]
            }
          },
          "required": ["player_id", "comparison_type"]
        }
      },
      "webhook": {
        "url": "https://hustleapp-production.appspot.com/api/tools/compare-stats",
        "method": "POST"
      }
    }
  ],

  "dataStores": ["hustle-knowledge-base"],

  "generativeAiSettings": {
    "groundingConfig": {
      "sources": [
        {
          "dataStore": "hustle-stats-datastore"
        }
      ]
    },
    "safetySettings": [
      {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  }
}
```

---

## 🛠️ Tool Implementation (Next.js API Routes)

Each tool is a Next.js API route that the agent calls via webhook:

**File:** `/src/app/api/tools/analyze-trends/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { player_id, metric, time_period = 'last_5_games' } = await req.json();

  // Calculate time range
  const timeRanges = {
    'last_5_games': 5,
    'last_month': 30,
    'season': 90,
    'all_time': null
  };

  const limit = timeRanges[time_period];

  // Query games
  const games = await prisma.game.findMany({
    where: { playerId: player_id },
    orderBy: { date: 'desc' },
    take: limit || undefined,
    select: {
      date: true,
      [metric]: true,
      opponent: true,
      result: true
    }
  });

  // Calculate trend
  const values = games.map(g => g[metric] || 0);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const recent5 = values.slice(0, 5);
  const recentAvg = recent5.reduce((a, b) => a + b, 0) / recent5.length;

  const trend = recentAvg > avg ? 'improving' :
                recentAvg < avg ? 'declining' : 'stable';

  return NextResponse.json({
    metric,
    time_period,
    total_games: games.length,
    average: avg.toFixed(2),
    recent_average: recentAvg.toFixed(2),
    trend,
    trend_percentage: ((recentAvg - avg) / avg * 100).toFixed(1),
    game_data: games.map(g => ({
      date: g.date,
      value: g[metric],
      opponent: g.opponent,
      result: g.result
    }))
  });
}
```

**File:** `/src/app/api/tools/suggest-drills/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/aiplatform';

const drillDatabase = {
  shooting: {
    u10: [
      { name: "Target Practice", difficulty: "beginner", description: "..." },
      { name: "Shooting Gates", difficulty: "intermediate", description: "..." }
    ],
    u12: [
      { name: "Finesse Shooting", difficulty: "intermediate", description: "..." },
      { name: "Power Shooting", difficulty: "advanced", description: "..." }
    ]
  },
  passing: {
    // ...
  }
};

export async function POST(req: Request) {
  const { skill_area, age_group, difficulty_level = 'intermediate' } = await req.json();

  // Get drills from database
  const drills = drillDatabase[skill_area]?.[age_group] || [];

  // Filter by difficulty
  const filtered = difficulty_level
    ? drills.filter(d => d.difficulty === difficulty_level)
    : drills;

  // Optionally: Use Vertex AI Search to find more drills from knowledge base
  const vertex = new VertexAI({
    project: 'hustleapp-production',
    location: 'us-central1'
  });

  // Search knowledge base for additional drills
  const searchResults = await vertex.search({
    dataStore: 'hustle-knowledge-base',
    query: `${skill_area} drills for ${age_group} ${difficulty_level}`,
    pageSize: 5
  });

  return NextResponse.json({
    drills: filtered,
    additional_resources: searchResults.results,
    skill_area,
    age_group,
    difficulty_level
  });
}
```

**File:** `/src/app/api/tools/compare-stats/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { player_id, comparison_type } = await req.json();

  // Get player stats
  const player = await prisma.player.findUnique({
    where: { id: player_id },
    include: {
      games: {
        where: { verified: true },
        select: { goals: true, assists: true, minutesPlayed: true }
      }
    }
  });

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  // Calculate player averages
  const totalGames = player.games.length;
  const playerStats = {
    goals_per_game: player.games.reduce((sum, g) => sum + g.goals, 0) / totalGames,
    assists_per_game: player.games.reduce((sum, g) => sum + g.assists, 0) / totalGames,
    minutes_per_game: player.games.reduce((sum, g) => sum + g.minutesPlayed, 0) / totalGames
  };

  // Get comparison averages (simplified - should use BigQuery for real averages)
  const comparisonAverages = {
    position_average: { goals_per_game: 0.8, assists_per_game: 0.6, minutes_per_game: 60 },
    age_group_average: { goals_per_game: 0.7, assists_per_game: 0.5, minutes_per_game: 55 },
    team_average: { goals_per_game: 0.9, assists_per_game: 0.7, minutes_per_game: 65 }
  };

  const comparison = comparisonAverages[comparison_type];

  return NextResponse.json({
    player_stats: playerStats,
    comparison_stats: comparison,
    comparison_type,
    differences: {
      goals: ((playerStats.goals_per_game - comparison.goals_per_game) / comparison.goals_per_game * 100).toFixed(1),
      assists: ((playerStats.assists_per_game - comparison.assists_per_game) / comparison.assists_per_game * 100).toFixed(1),
      minutes: ((playerStats.minutes_per_game - comparison.minutes_per_game) / comparison.minutes_per_game * 100).toFixed(1)
    }
  });
}
```

---

## 🔗 Frontend Integration

**File:** `/src/app/api/agents/chat/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DiscoveryEngineClient } from '@google-cloud/discoveryengine';

const client = new DiscoveryEngineClient({
  projectId: 'hustleapp-production'
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { agentType, playerId, message } = await req.json();

  // Map agent types to Agent Builder apps
  const agentApps = {
    'performance-coach': 'projects/hustleapp-production/locations/global/agents/performance-coach',
    'stats-analyst': 'projects/hustleapp-production/locations/global/agents/stats-analyst',
    'game-logger': 'projects/hustleapp-production/locations/global/agents/game-logger'
  };

  const agentPath = agentApps[agentType];

  // Call Vertex AI Agent
  const [response] = await client.converse({
    name: agentPath,
    query: {
      text: message
    },
    userLabels: {
      userId: session.user.id,
      playerId: playerId
    }
  });

  return NextResponse.json({
    response: response.reply.summary.summaryText,
    citations: response.reply.summary.summaryWithMetadata?.citations,
    agentType
  });
}
```

**File:** `/src/components/agent-chat.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function AgentChat({
  agentType,
  playerId
}: {
  agentType: 'performance-coach' | 'stats-analyst' | 'game-logger';
  playerId: string;
}) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType,
          playerId,
          message: input
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'agent',
        content: data.response
      }]);
    } catch (error) {
      console.error('Agent error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
              msg.role === 'user'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-900'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="inline-block p-3 rounded-lg bg-zinc-100">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about performance..."
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </Button>
      </div>
    </Card>
  );
}
```

---

## 📦 Required Dependencies

```bash
cd /home/jeremy/000-projects/hustle

npm install \
  @google-cloud/discoveryengine \
  @google-cloud/aiplatform \
  @google-cloud/firestore \
  @google-cloud/storage \
  @google-cloud/bigquery
```

**Update `package.json`:**

```json
{
  "dependencies": {
    "@google-cloud/discoveryengine": "^2.0.0",
    "@google-cloud/aiplatform": "^3.25.0",
    "@google-cloud/firestore": "^7.10.0",
    "@google-cloud/storage": "^7.15.0",
    "@google-cloud/bigquery": "^7.8.0"
  }
}
```

---

## 💰 Cost Estimate (Vertex AI Agent Engine)

**Monthly costs (1,000 active users, 10K agent queries):**

```
Vertex AI Agent Builder:
- Agent queries: 10K × $0.001 = $10
- Vertex AI Search: 10K queries = $15
- Gemini 2.0 Flash (included in Agent Builder)

Firestore:
- 100K reads: $0.36
- 10K writes: $0.18

Cloud Storage:
- 10GB: $0.20

BigQuery:
- 100GB queries: $0.50

Total: ~$26/month
```

**Much cheaper than Cloud Run!** No container costs, no idle charges.

---

## 🚀 Quick Start Commands

```bash
# 1. Enable APIs
gcloud services enable aiplatform.googleapis.com discoveryengine.googleapis.com --project=hustleapp-production

# 2. Create first datastore
gcloud alpha discovery-engine datastores create hustle-knowledge-base \
  --location=global --project=hustleapp-production \
  --industry-vertical=GENERIC --content-config=CONTENT_REQUIRED \
  --solution-types=SOLUTION_TYPE_SEARCH

# 3. Create first agent
gcloud alpha agent-builder apps create performance-coach \
  --location=global --project=hustleapp-production \
  --display-name="Performance Coach Agent" \
  --agent-type=AGENT_TYPE_DIALOGFLOW \
  --data-store=hustle-knowledge-base

# 4. Install dependencies
npm install @google-cloud/discoveryengine @google-cloud/aiplatform

# 5. Create API routes
mkdir -p src/app/api/agents/chat
mkdir -p src/app/api/tools/{analyze-trends,suggest-drills,compare-stats}
```

---

## 📊 Next Steps

1. ✅ Enable Vertex AI APIs
2. ✅ Create datastores for knowledge base
3. ✅ Create first agent (Performance Coach)
4. ✅ Implement tool webhooks (API routes)
5. ✅ Build chat interface
6. ✅ Test with real player data
7. ✅ Deploy remaining agents

**Ready to start implementing?** 🚀
