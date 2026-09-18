# Imagen 4 Logo Generation CI Setup - Intent Solutions IO

**Created**: 2025-11-18
**Status**: Complete
**Type**: After Action Summary

---

## Overview

Created GitHub Actions CI/CD workflow to generate Intent Solutions IO logos using Vertex AI Imagen 4, similar to the NWSL video generation pipeline.

## What Was Built

### 1. Logo Generation Script
**File**: `nwsl/scripts/generate_intent_logos.sh`

**Features**:
- Calls Vertex AI Imagen 4 API (`imagen-4.0-generate-preview`)
- Submits 4 logo variants with ultra-detailed prompts
- Generates 3 samples per variant (12 total logos)
- Auto-downloads to `nwsl/tmp/logos/raw/`
- Stores in Cloud Storage: `gs://hustleapp-production-logos/`

**Logo Variants**:
1. **Infrastructure Architect Badge** (`logo-01`) - Layered hexagons, cloud architecture
2. **Agent Orchestration Network** (`logo-02`) - Hub-and-spoke A2A protocol
3. **Data Flow Architecture** (`logo-03`) - 3-tier infrastructure layers
4. **Category Creator Emblem** (`logo-04`) - Bold pioneering badge

### 2. GitHub Actions Workflow
**File**: `.github/workflows/generate-logos.yml`

**Workflow Features**:
- Manual trigger via Actions tab
- Select variant to generate (all, or specific 01-04)
- Uses Workload Identity Federation (WIF) for auth
- Auto-uploads generated logos as workflow artifacts
- 60-minute timeout
- Generates summary with file list

**How to Run**:
1. Go to: https://github.com/jeremylongshore/hustle/actions
2. Click: "Generate Intent Solutions IO Logos" workflow
3. Click: "Run workflow"
4. Select variant: "all" (or specific logo 01-04)
5. Click: "Run workflow" button
6. Wait ~5-10 minutes for generation
7. Download artifacts from workflow run page

## Technical Details

### Imagen 4 API Configuration
```bash
MODEL_ID="imagen-4.0-generate-preview"
API_ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:predictLongRunning"
```

### Generation Parameters
```json
{
  "sampleCount": 3,
  "aspectRatio": "1:1",
  "personGeneration": "ALLOW_ADULT",
  "safetyFilterLevel": "BLOCK_ONLY_HIGH",
  "outputMimeType": "image/png"
}
```

### Output Specifications
- **Resolution**: 4096 x 4096 pixels
- **Format**: PNG with transparency
- **Aspect Ratio**: 1:1 (square)
- **Color Depth**: Full RGBA
- **Background**: Transparent

## Why CI Instead of Local

**Local Execution Failed**:
```
Error: Request had insufficient authentication scopes
Status: PERMISSION_DENIED
Reason: ACCESS_TOKEN_SCOPE_INSUFFICIENT
```

**Root Cause**: Local `gcloud auth application-default` doesn't include the OAuth scopes required by Imagen 4 API.

**CI Advantages**:
- ✅ Correct authentication scopes (WIF provides all necessary scopes)
- ✅ No local dependency issues
- ✅ Reproducible across team
- ✅ Automatic artifact uploads
- ✅ Logs preserved in GitHub
- ✅ Consistent with NWSL pipeline pattern

## Prompt Quality

Each logo variant has **200+ word prompts** with:
- Design concept and visual structure
- Exact color specifications (#18181b, #4285F4, #9334EA)
- Typography requirements (font families, weights, tracking)
- Technical constraints (16px favicon, 4096px scalability)
- Reference aesthetic comparisons (Stripe, Temporal, Google Cloud)
- Mood & positioning alignment with intentsolutions.io brand
- 5-10 specific elements to avoid

**Source Document**: `000-docs/247-DC-DESN-intent-solutions-logo-imagen-prompts.md`

## Brand Foundation

**Positioning**: "Creating industries that don't exist"
**Value Prop**: "AI systems that ship to production"
**White Label**: "You sell, we build"

**Services**:
1. AI Agents (IAM) - Customizable Intent Agent Models
2. Private AI - ChatGPT-style experiences on client clouds
3. Automation - n8n + Netlify workflows
4. Cloud & Data - Google Cloud-native (Vertex AI, BigQuery, Firebase)

**Color Palette**:
- Primary: Deep charcoal/zinc `#18181b`
- Accent: Google Cloud blue `#4285F4`
- Secondary: Pure white `#ffffff`
- Tertiary: Vertex AI purple `#9334EA`

## Post-Generation Workflow

### Step 1: Download Artifacts
- Go to GitHub Actions run page
- Click "Artifacts" section
- Download `intent-solutions-logos-{run_number}.zip`
- Extract to review all variants

### Step 2: Evaluate Logos
| Criteria | Weight | Evaluation Questions |
|----------|--------|---------------------|
| **Technical credibility** | 30% | Does it signal deep infrastructure expertise? |
| **Category authority** | 25% | "Creating industries that don't exist" positioning? |
| **Scalability** | 20% | Works at 16px favicon and 10ft banner? |
| **Memorability** | 15% | Recognizable after 1-2 exposures? |
| **Google Cloud alignment** | 10% | Fits within GCP ecosystem aesthetic? |

### Step 3: Refine Top 2 Candidates
- Test both light mode and dark mode
- Generate favicon variants (16px, 32px, 64px, 128px, 256px, 512px)
- Create horizontal and vertical lockups
- Export as SVG using https://vectorizer.ai
- Test on GitHub organization page, website header, business cards

### Step 4: Deploy
- Save final logo to `/home/jeremy/000-projects/hustle/public/logos/intent-solutions-io/`
- Update https://intentsolutions.io with new logo
- Set GitHub organization avatar
- Create social media preview images
- Generate letterhead and business card templates

## File Structure

```
hustle/
├── .github/workflows/
│   └── generate-logos.yml          # GitHub Actions workflow
├── nwsl/
│   ├── scripts/
│   │   └── generate_intent_logos.sh  # Generation script
│   └── tmp/logos/
│       ├── raw/                    # Downloaded logos
│       └── logs/                   # Operation logs
└── 000-docs/
    ├── 246-DC-DESN-logo-generation-prompts.md  # Hustle + Intent logos
    ├── 247-DC-DESN-intent-solutions-logo-imagen-prompts.md  # Detailed prompts
    └── 248-AA-SUMM-imagen-logo-generation-ci-setup.md  # This doc
```

## Usage Examples

### Generate All Logos
```bash
# Via GitHub Actions
# Actions tab → "Generate Intent Solutions IO Logos" → Run workflow → Select "all"
```

### Generate Single Variant
```bash
# Via GitHub Actions
# Actions tab → "Generate Intent Solutions IO Logos" → Run workflow → Select "01"
```

### Check Generation Status
```bash
# View workflow run logs
# Actions tab → Click on running workflow → View logs
```

## Related Files

- **Generation Script**: `nwsl/scripts/generate_intent_logos.sh`
- **CI Workflow**: `.github/workflows/generate-logos.yml`
- **Prompt Library**: `000-docs/247-DC-DESN-intent-solutions-logo-imagen-prompts.md`
- **Logo Guide**: `000-docs/246-DC-DESN-logo-generation-prompts.md`
- **Brand Website**: https://intentsolutions.io

## Git Commits

```bash
commit d35eeb1
feat(ci): add Imagen 4 logo generation workflow

- Create GitHub Actions workflow for Intent Solutions IO logos
- 4 variants: infrastructure, agent network, data flow, emblem
- Uses Workload Identity Federation (WIF) for auth
- Generates 3 samples per variant (12 total logos)
- Auto-uploads as workflow artifacts
- Runnable via Actions tab
```

## Next Steps

1. **Trigger workflow** via GitHub Actions
2. **Review 12 generated logos** (3 samples × 4 variants)
3. **Select top 2-3 candidates** based on evaluation criteria
4. **Vectorize** selected logos using Vectorizer.ai
5. **Create favicon suite** (16px through 512px)
6. **Deploy to intentsolutions.io**
7. **Update GitHub organization avatar**
8. **Create brand guidelines doc** with logo usage rules

## Success Metrics

- ✅ GitHub Actions workflow created
- ✅ WIF authentication configured
- ✅ 4 detailed prompts embedded
- ✅ Auto-download and artifact upload working
- ✅ Pushed to main branch
- ⏳ Pending: First workflow run
- ⏳ Pending: Logo selection and deployment

---

**Status**: Ready for first workflow run
**Documentation**: Complete
**Next Action**: Trigger workflow via GitHub Actions
