# Blocked Logo Prompts - Imagen 3 Safety Filter

**Date**: 2025-11-19
**Issue**: Imagen 3 safety filter blocked 3 out of 4 logo prompts
**Safety Level**: `block_only_high` (most permissive)
**Error**: "The prompt could not be submitted. Your current safety filter threshold prohibited one or more words in this prompt."

---

## ❌ BLOCKED: Variant 1 - Infrastructure Architect Badge

**Prompt excerpt that likely triggered filter**:
- "multi-layer cloud infrastructure architecture"
- "distributed systems, microservices orchestration"
- "data flow through intelligent agent networks"
- "layered infrastructure"

**Hypothesis**: Technical infrastructure terms triggered false positive

---

## ❌ BLOCKED: Variant 2 - Agent Orchestration Network

**Prompt excerpt that likely triggered filter**:
- "AI agent orchestration and automation engineering"
- "A2A (Agent-to-Agent) protocol"
- "distributed intelligence, autonomous systems"
- "orchestrated workflows"
- "agent communication"

**Hypothesis**: AI agent + autonomy language triggered concerns

---

## ❌ BLOCKED: Variant 3 - Data Flow Architecture

**Prompt excerpt that likely triggered filter**:
- "data engineering and cloud infrastructure"
- "ETL pipelines, BigQuery analytics"
- "data flowing through intelligent infrastructure layers"
- "data ingestion, processing, application"

**Hypothesis**: Data engineering + intelligence terms flagged

---

## ✅ SUCCEEDED: Variant 4 - Category Creator Emblem

**Why this one worked**:
- Less technical jargon
- More visual/design-focused language
- Fewer "system" and "infrastructure" terms
- Emphasis on geometric shapes vs technical concepts

**Key difference**: Prompt focused on emblem design (shield, badge, geometric) rather than technical architecture concepts.

---

## Recommended Solutions

### Option 1: Simplify Technical Prompts (Recommended)
- Remove technical jargon: "infrastructure", "orchestration", "distributed systems"
- Use visual metaphors: "connected shapes" vs "agent networks"
- Focus on geometry: "layered hexagons" vs "cloud infrastructure layers"
- Avoid AI terms: "network diagram" vs "AI agent communication"

### Option 2: Try Different Model
- Switch to DALL-E 3 or Midjourney
- Use Stable Diffusion with custom settings
- Consider manual vectorization of successful logo 04

### Option 3: Manual Design
- Use Logo 04 as starting point
- Hire designer to create variants 1-3 manually
- Provide Logo 04 + detailed brief to Fiverr/Upwork

---

## Full Prompts

All 4 complete prompts (200+ words each) available in:
`000-docs/247-DC-DESN-intent-solutions-logo-imagen-prompts.md`

---

## Generated Logos

**Location**: `000-docs/logos/`

✅ **3 successful logos** (all Variant 4):
- `logo-04_category-creator-emblem_variant-1.png` - 3.7 MB
- `logo-04_category-creator-emblem_variant-2.png` - 4.1 MB
- `logo-04_category-creator-emblem_variant-3.png` - 3.6 MB

❌ **0 logos for Variants 1-3** (all blocked by safety filter)
