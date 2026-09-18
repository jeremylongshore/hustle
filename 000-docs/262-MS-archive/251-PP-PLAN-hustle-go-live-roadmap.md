# Hustle Go-Live Roadmap - Production Launch Plan

**Date**: 2025-11-19
**Status**: 🚀 Ready for Final Push
**Objective**: Launch Hustle with Scout Agent RAG-powered by ADK knowledge
**Timeline**: 2-4 days to production

---

## Executive Summary

Hustle is **95% production-ready**. The core app (Next.js + Firestore) is deployed and working. Scout Agent is deployed on Agent Engine and responding correctly. We just completed crawling 2,568 ADK documentation chunks. **Final step: Wire Scout to use these chunks for intelligent ADK guidance.**

**Current State:**
- ✅ Core web app (Next.js 15 + Firestore) deployed to Firebase Hosting
- ✅ 57/58 users migrated from PostgreSQL → Firebase Auth + Firestore
- ✅ Scout Agent deployed on Vertex AI Agent Engine
- ✅ 2,568 ADK documentation chunks in GCS (`gs://hustle-adk-docs/`)
- ⏳ Scout NOT yet connected to ADK knowledge (needs RAG wiring)

**What "Go-Live" Means:**
1. Scout can accurately answer ADK questions with code examples
2. Users can interact with Scout through Hustle web app
3. All critical user flows work end-to-end
4. Monitoring and error tracking in place

---

## Critical Path to Production (4 Tasks)

### Task 1: Wire Scout to ADK Chunks (4-6 hours)

**Objective**: Scout retrieves and uses ADK documentation to answer questions

**Implementation** (`vertex-agents/scout-team/scout_agent.py`):
```python
from google.cloud import storage
import json
from typing import List, Dict

class ScoutAgent(LlmAgent):
    """Scout Agent with ADK RAG grounding"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.storage_client = storage.Client()
        self.adk_chunks = self._load_adk_chunks()

    def _load_adk_chunks(self) -> List[Dict]:
        """Load ADK chunks from GCS into memory"""
        bucket = self.storage_client.bucket("hustle-adk-docs")
        blob = bucket.blob("adk-docs/chunks/chunks.jsonl")
        content = blob.download_as_text()
        chunks = [json.loads(line) for line in content.strip().split('\n')]
        print(f"✅ Loaded {len(chunks)} ADK chunks")
        return chunks

    def _search_adk_chunks(self, query: str, top_k: int = 5) -> List[Dict]:
        """Simple keyword search in ADK chunks"""
        query_lower = query.lower()
        scored_chunks = []

        for chunk in self.adk_chunks:
            # Score based on keyword matches
            text_lower = chunk['text'].lower()
            title_lower = chunk['title'].lower()

            score = 0
            for word in query_lower.split():
                if word in text_lower:
                    score += 2
                if word in title_lower:
                    score += 5

            if score > 0:
                scored_chunks.append((score, chunk))

        # Sort by score and return top-k
        scored_chunks.sort(reverse=True, key=lambda x: x[0])
        return [chunk for _, chunk in scored_chunks[:top_k]]

    async def async_stream_query(self, user_id: str, session_id: str, message: str):
        """Handle query with ADK RAG"""

        # 1. Search ADK chunks
        relevant_chunks = self._search_adk_chunks(message, top_k=5)

        # 2. Build context from chunks
        context = self._format_chunks_for_context(relevant_chunks)

        # 3. Augment prompt with ADK knowledge
        augmented_prompt = f"""
You are Scout, an expert AI agent specializing in the Agent Development Kit (ADK).

Use the following ADK documentation to answer the user's question accurately:

{context}

User question: {message}

Provide a clear, accurate answer based on the documentation above.
Include code examples when relevant.
Cite the source documentation URL when possible.
"""

        # 4. Stream response from LLM
        return await super().async_stream_query(user_id, session_id, augmented_prompt)

    def _format_chunks_for_context(self, chunks: List[Dict]) -> str:
        """Format retrieved chunks into context string"""
        if not chunks:
            return "(No relevant documentation found)"

        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            code_blocks = chunk.get('code_blocks', [])
            code_examples = '\n'.join([f"```{cb['language']}\n{cb['code']}\n```" for cb in code_blocks])

            context_parts.append(f"""
--- Source {i}: {chunk['title']} ---
URL: {chunk['url']}
Section: {' > '.join(chunk.get('heading_path', []))}

{chunk['text']}

{code_examples}
""")

        return '\n\n'.join(context_parts)
```

**Testing:**
```python
# Test queries
queries = [
    "How do I create an LlmAgent with tools?",
    "What's the difference between LlmAgent and WorkflowAgent?",
    "Show me code for deploying to Agent Engine",
    "How do I add memory to an agent?",
]

for query in queries:
    print(f"\n{'='*80}")
    print(f"Q: {query}")
    response = await scout.async_stream_query("test_user", session_id, query)
    print(f"A: {response}")
```

**Success Criteria:**
- ✅ Scout retrieves relevant chunks (5 per query)
- ✅ Scout includes code examples in responses
- ✅ Scout cites documentation URLs
- ✅ Responses are technically accurate
- ✅ Latency < 5 seconds

**Time Estimate:** 4-6 hours

---

### Task 2: Deploy Scout with RAG (1 hour)

**Steps:**
```bash
cd vertex-agents/scout-team

# Deploy updated agent
adk deploy agent_engine . \
  --project=hustleapp-production \
  --region=us-central1 \
  --display_name="scout-on-agent-engine" \
  --staging_bucket=gs://hustleapp-production-agent-staging

# Verify deployment
gcloud alpha agent-engine agents describe scout-on-agent-engine \
  --location=us-central1 \
  --project=hustleapp-production

# Test deployed agent
python test_scout_WORKING.py
```

**Success Criteria:**
- ✅ Agent deploys without errors
- ✅ Test queries return ADK-grounded responses
- ✅ Code examples appear in responses
- ✅ No performance degradation

**Time Estimate:** 1 hour

---

### Task 3: Wire Hustle Frontend → Scout (2-3 hours)

**Objective**: Users can chat with Scout from Hustle web app

**Architecture:**
```
Next.js Frontend (hustlestats.io)
    ↓
Firebase Cloud Functions (API Gateway)
    ↓
Scout Agent (Agent Engine)
    ↓ (RAG retrieval)
ADK Chunks (GCS)
```

**Implementation:**

**1. Cloud Function** (`functions/src/scout-api.ts`):
```typescript
import { onRequest } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';

export const chatWithScout = onRequest(async (req, res) => {
  try {
    // 1. Verify Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Extract message
    const { message, sessionId } = req.body;

    // 3. Call Scout Agent via REST API
    const scoutUrl = `https://us-central1-aiplatform.googleapis.com/v1beta1/projects/hustleapp-production/locations/us-central1/reasoningEngines/scout-on-agent-engine:query`;

    const payload = {
      class_method: 'async_stream_query',
      input: {
        user_id: userId,
        session_id: sessionId || await createSession(userId),
        message: message,
      },
    };

    const response = await fetch(scoutUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    res.json({ response: data.output });

  } catch (error) {
    console.error('Scout API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**2. Frontend Component** (`src/components/ScoutChat.tsx`):
```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function ScoutChat() {
  const { user, getIdToken } = useAuth();
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/scout/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Failed to chat with Scout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2>Chat with Scout</h2>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask Scout about ADK..."
        className="w-full p-2 border rounded"
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Thinking...' : 'Send'}
      </button>
      {response && (
        <div className="p-4 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap">{response}</pre>
        </div>
      )}
    </div>
  );
}
```

**3. Deploy:**
```bash
# Deploy Cloud Function
firebase deploy --only functions:chatWithScout

# Deploy Frontend
npm run build
firebase deploy --only hosting
```

**Success Criteria:**
- ✅ Users can send messages to Scout
- ✅ Scout responses appear in UI
- ✅ Code blocks render properly
- ✅ Authentication works end-to-end
- ✅ Error handling works

**Time Estimate:** 2-3 hours

---

### Task 4: Production Readiness (2-3 hours)

**Monitoring Setup:**
```bash
# Cloud Logging for Scout queries
# Cloud Error Reporting for failures
# Custom metrics for:
# - Query latency
# - Retrieval accuracy
# - User satisfaction
```

**Health Checks:**
1. Scout Agent responding ✓
2. ADK chunks accessible ✓
3. Frontend → Backend → Agent flow ✓
4. Authentication working ✓
5. Error tracking active ✓

**Load Testing:**
```bash
# Test 100 concurrent Scout queries
# Verify latency < 5s p95
# Verify no errors
```

**Documentation:**
- User guide: "How to use Scout"
- Admin guide: "Scout monitoring and maintenance"
- Runbook: "Scout incident response"

**Time Estimate:** 2-3 hours

---

## Production Launch Checklist

### Pre-Launch (Must Complete)
- [ ] Scout retrieves ADK chunks correctly
- [ ] Scout provides accurate answers with code examples
- [ ] Scout deployed to Agent Engine with RAG
- [ ] Frontend → Scout integration working
- [ ] Authentication end-to-end verified
- [ ] Error tracking active (Cloud Error Reporting)
- [ ] Monitoring dashboard created
- [ ] Load testing passed (100 concurrent queries)

### Launch Day
- [ ] Deploy Scout with RAG to production
- [ ] Deploy frontend with Scout chat UI
- [ ] Verify health checks pass
- [ ] Monitor logs for first 2 hours
- [ ] Test with real user accounts
- [ ] Announce to users

### Post-Launch (First Week)
- [ ] Monitor query latency daily
- [ ] Review retrieval accuracy metrics
- [ ] Collect user feedback
- [ ] Tune retrieval parameters if needed
- [ ] Set up automated weekly ADK crawls
- [ ] Document learnings and improvements

---

## Risk Assessment

### High Priority Risks

**Risk 1: Scout Retrieval Inaccurate**
- **Impact**: Users get wrong answers, lose trust
- **Probability**: Medium (30%)
- **Mitigation**:
  - Build comprehensive test suite (50+ queries)
  - Manual QA on critical queries
  - Fallback: "I don't have enough information" > wrong answer

**Risk 2: Latency Too High**
- **Impact**: Poor user experience, users abandon Scout
- **Probability**: Low (15%)
- **Mitigation**:
  - Optimize chunk loading (lazy load, caching)
  - Use smaller context (top-3 vs top-5 chunks)
  - Set timeout limits (fail fast)

**Risk 3: Cost Overrun**
- **Impact**: Vertex AI Agent Engine costs exceed budget
- **Probability**: Low (10%)
- **Mitigation**:
  - Set GCP budget alerts ($50/day)
  - Per-user rate limiting (10 queries/hour)
  - Monitor cost per query

### Medium Priority Risks

**Risk 4: Authentication Issues**
- **Impact**: Users can't access Scout
- **Probability**: Low (10%)
- **Mitigation**: Comprehensive auth testing before launch

**Risk 5: Agent Engine Downtime**
- **Impact**: Scout unavailable during GCP incidents
- **Probability**: Very Low (2%)
- **Mitigation**: Status page, graceful degradation

---

## Timeline

**Day 1 (Today):**
- ✅ ADK crawler complete (2,568 chunks)
- ⏳ Wire Scout to ADK chunks (4-6 hours)
- ⏳ Test Scout RAG accuracy

**Day 2:**
- Deploy Scout with RAG
- Wire frontend → Scout
- Integration testing

**Day 3:**
- Production readiness checks
- Load testing
- Documentation

**Day 4:**
- Final QA
- **🚀 LAUNCH**

---

## Success Metrics

### Week 1 (Post-Launch)
- Scout uptime: > 99%
- Query latency p95: < 5s
- Retrieval accuracy: > 85%
- User engagement: > 50 queries total

### Month 1
- Scout uptime: > 99.5%
- Query latency p95: < 3s
- Retrieval accuracy: > 90%
- User engagement: > 500 queries total
- User satisfaction: > 4.0/5.0

---

## Next Steps (Right Now)

1. **Implement Scout RAG** (`vertex-agents/scout-team/scout_agent.py`)
2. **Test locally** with ADK questions
3. **Deploy to Agent Engine**
4. **Build frontend integration**

**Expected Time to Launch:** 2-4 days

---

**Document Created**: 2025-11-19
**Last Updated**: 2025-11-19
**Status**: Ready for Execution
**Owner**: CTO
**Next Review**: After Task 1 completion (Scout RAG wiring)
