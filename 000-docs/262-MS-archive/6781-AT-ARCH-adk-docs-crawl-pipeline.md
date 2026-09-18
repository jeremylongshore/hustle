# ADK Docs Crawl Pipeline - Production RAG Grounding for Hustle

**Date**: 2025-11-19
**Status**: ✅ PRODUCTION-READY
**Component**: ADK Documentation Crawler & RAG Pipeline
**Purpose**: Automated knowledge base for Scout Agent ADK grounding

---

## Summary

Production-grade pipeline that crawls, extracts, chunks, and uploads ALL content from https://google.github.io/adk-docs/ to Google Cloud Storage for use as grounding data in Hustle's Scout multi-agent system.

**Key Features:**
- Respects robots.txt and rate limits
- Extracts code blocks verbatim
- Creates RAG-ready chunks with metadata
- Idempotent and reproducible
- Automated via GitHub Actions
- Structured GCS storage for Vertex AI consumption

---

## Architecture

### High-Level Flow

```
┌─────────────────┐
│  ADK Docs Site  │
│ (google.github  │
│ .io/adk-docs/)  │
└────────┬────────┘
         │
         │ 1. Crawl (respects robots.txt)
         │
         ▼
┌─────────────────┐
│    Crawler      │──► Manifest (URLs, metadata)
│  (crawler.py)   │──► Raw HTML pages
└────────┬────────┘
         │
         │ 2. Extract (HTML → structured)
         │
         ▼
┌─────────────────┐
│   Extractor     │──► docs.jsonl (sections + code)
│ (extractor.py)  │
└────────┬────────┘
         │
         │ 3. Chunk (RAG optimization)
         │
         ▼
┌─────────────────┐
│    Chunker      │──► chunks.jsonl (1500 tokens max)
│  (chunker.py)   │
└────────┬────────┘
         │
         │ 4. Upload (GCS)
         │
         ▼
┌─────────────────────────────────────────────┐
│     Google Cloud Storage                    │
│  gs://hustle-adk-docs/                      │
│  ├── adk-docs/raw/docs.jsonl               │
│  ├── adk-docs/chunks/chunks.jsonl          │
│  └── adk-docs/manifests/crawl-*.json       │
└─────────────────┬───────────────────────────┘
                  │
                  │ 5. Consume (Vertex AI / Agent Engine)
                  │
                  ▼
        ┌──────────────────────┐
        │   Scout Agent        │
        │  (Agent Engine)      │
        │  - Uses chunks for   │
        │    ADK grounding     │
        │  - RAG retrieval     │
        │  - Code examples     │
        └──────────────────────┘
```

### Component Details

#### 1. Crawler (`tools/adk_docs_crawler/crawler.py`)
- **Input**: Base URL (`https://google.github.io/adk-docs/`)
- **Output**: List of page objects with HTML, links, metadata
- **Features**:
  - robots.txt compliance
  - Rate limiting (500ms between requests)
  - URL normalization and deduplication
  - Scope limiting (only crawl allowed domains/paths)
  - Connection pooling for efficiency
  - Timeout handling and error recovery

#### 2. Extractor (`tools/adk_docs_crawler/extractor.py`)
- **Input**: Raw HTML pages
- **Output**: `docs.jsonl` with structured content
- **Features**:
  - Removes navigation, footer, scripts
  - Extracts heading hierarchy (H1-H6)
  - Preserves code blocks with language detection
  - Groups content by sections
  - Maintains document structure

#### 3. Chunker (`tools/adk_docs_crawler/chunker.py`)
- **Input**: Extracted documents
- **Output**: `chunks.jsonl` with RAG-optimized segments
- **Features**:
  - Max 1500 tokens per chunk (~6000 characters)
  - 150 token overlap between chunks
  - Splits long sections intelligently (word boundaries)
  - Preserves code blocks intact
  - Full metadata (doc_id, url, title, heading_path)

#### 4. Uploader (`tools/adk_docs_crawler/uploader.py`)
- **Input**: Local JSONL files
- **Output**: GCS artifacts at structured paths
- **Features**:
  - Uses Application Default Credentials
  - Overwrites primary artifacts on each run
  - Creates timestamped manifests for audit trail
  - Validates GCP configuration

---

## GCS Storage Layout

```
gs://hustle-adk-docs/
├── adk-docs/
│   ├── raw/
│   │   └── docs.jsonl                     # Full extracted documents
│   ├── chunks/
│   │   └── chunks.jsonl                   # RAG-ready chunks (1500 tokens max)
│   ├── manifests/
│   │   ├── crawl-manifest-20251119_120000.json
│   │   ├── crawl-manifest-20251126_120000.json
│   │   └── ...                            # Timestamped crawl history
│   └── logs/
│       └── (future: crawl logs)
```

### File Formats

**`docs.jsonl`** - One document per line:
```json
{
  "doc_id": "sha256-hash-of-url",
  "url": "https://google.github.io/adk-docs/...",
  "title": "Page title",
  "sections": [
    {
      "heading_path": ["Build Agents", "Multi-tool Agent"],
      "text": "Section content...",
      "code_blocks": [
        {
          "language": "python",
          "code": "from google.adk.agents import LlmAgent\n..."
        }
      ]
    }
  ],
  "last_crawled_at": "2025-11-19T12:00:00Z",
  "source_type": "adk-docs"
}
```

**`chunks.jsonl`** - One chunk per line:
```json
{
  "chunk_id": "sha256-hash",
  "doc_id": "parent-doc-hash",
  "url": "https://google.github.io/adk-docs/...",
  "title": "Page title",
  "heading_path": ["Build Agents", "Multi-tool Agent"],
  "text": "Chunk content (max 1500 tokens)...",
  "code_blocks": [...],
  "source_type": "adk-docs",
  "last_crawled_at": "2025-11-19T12:00:00Z"
}
```

---

## Usage

### Local Development

**1. Install dependencies:**
```bash
make setup-crawler
# Or manually:
pip install -r tools/adk_docs_crawler/requirements.txt
```

**2. Configure environment:**
```bash
# Generate template
make gen-crawler-env

# Set required variables
export GCP_PROJECT_ID=hustleapp-production
export HUSTLE_DOCS_BUCKET=gs://hustle-adk-docs
export CRAWLER_SA_EMAIL=adk-crawler@hustleapp-production.iam.gserviceaccount.com

# Authenticate
gcloud auth application-default login
```

**3. Test configuration:**
```bash
make test-crawler-config
```

**4. Run full pipeline:**
```bash
# With GCS upload
make crawl-adk-docs

# Local only (no upload)
make crawl-adk-docs-local
```

### CI/CD (GitHub Actions)

**Trigger:** Manual dispatch or weekly schedule (Sundays at midnight UTC)

**Workflow:** `.github/workflows/crawl-adk-docs.yml`

**Prerequisites:**
1. Workload Identity Federation configured
2. Service account `adk-crawler@hustleapp-production.iam.gserviceaccount.com` exists
3. Service account has `roles/storage.objectAdmin` on bucket
4. GCS bucket `gs://hustle-adk-docs` exists

**To Run:**
1. Go to Actions tab in GitHub
2. Select "Crawl ADK Documentation"
3. Click "Run workflow"
4. Wait ~10-15 minutes for completion
5. Check summary for results

---

## Configuration

All settings in `tools/adk_docs_crawler/config.yaml`:

**Crawler Settings:**
- `base_url`: Starting URL
- `rate_limit_seconds`: Delay between requests (default: 0.5s)
- `max_pages`: Safety limit (default: 1000)
- `user_agent`: Identification string

**Extraction Settings:**
- `preserve_code_blocks`: Always true
- `min_content_length`: Minimum characters (default: 100)

**Chunking Settings:**
- `max_chunk_tokens`: Maximum tokens per chunk (default: 1500)
- `overlap_tokens`: Overlap between chunks (default: 150)
- `strategy`: "heading_based" or "token_based"

**GCS Paths:**
- `raw_docs`: `adk-docs/raw/docs.jsonl`
- `chunks`: `adk-docs/chunks/chunks.jsonl`
- `manifests`: `adk-docs/manifests/`

---

## Vertex AI Integration

### How Scout Agent Uses This Data

1. **RAG Retrieval**: Vertex AI Search indexes `chunks.jsonl` for semantic search
2. **Grounding**: Scout agent queries chunks for ADK-specific information
3. **Code Examples**: Preserved code blocks provide exact API usage patterns
4. **Context**: Heading paths provide hierarchical context

### Setting Up Vertex AI Search (Future)

```bash
# Create Vertex AI Search datastore (one-time setup)
gcloud alpha vertex-ai search datastores create \
  --display-name="ADK Documentation" \
  --data-store-id="adk-docs" \
  --location=global \
  --content-config=CONTENT_REQUIRED \
  --solution-type=SOLUTION_TYPE_SEARCH

# Import chunks
gcloud alpha vertex-ai search import documents \
  --datastore=adk-docs \
  --location=global \
  --gcs-uri=gs://hustle-adk-docs/adk-docs/chunks/chunks.jsonl
```

---

## Maintenance

### Re-crawling

**When to re-crawl:**
- Weekly automatic (GitHub Actions schedule)
- After major ADK releases
- When Scout agent provides outdated information

**How to re-crawl:**
```bash
# Manual trigger via GitHub Actions
# OR
make crawl-adk-docs
```

### Monitoring

**Check GCS artifacts:**
```bash
gsutil ls -lh gs://hustle-adk-docs/adk-docs/
```

**Validate manifest:**
```bash
gsutil cat gs://hustle-adk-docs/adk-docs/manifests/crawl-manifest-latest.json | jq '.total_pages'
```

**View logs:**
```bash
# GitHub Actions logs
# OR
cat tmp/adk_docs_crawler.log
```

### Troubleshooting

**Error: "Missing environment variable"**
```bash
# Ensure all required vars are set
export GCP_PROJECT_ID=hustleapp-production
export HUSTLE_DOCS_BUCKET=gs://hustle-adk-docs
```

**Error: "403 Forbidden" on GCS**
```bash
# Check credentials
gcloud auth application-default login

# Verify service account permissions
gcloud storage buckets describe gs://hustle-adk-docs
```

**Error: "Rate limit exceeded"**
- Increase `rate_limit_seconds` in config.yaml
- Check robots.txt hasn't changed

**Crawl incomplete (< 50 pages)**
- Check `allowed_domains` and `allowed_paths` in config
- Verify site structure hasn't changed
- Review crawler logs

---

## Future Enhancements

1. **Incremental Crawling**: Only re-crawl changed pages
2. **Vertex AI Search Integration**: Automatic datastore updates
3. **Multi-source Support**: Crawl additional Google Cloud docs
4. **Embedding Generation**: Pre-compute embeddings for faster retrieval
5. **Change Detection**: Alert when documentation updates
6. **A/B Testing**: Compare different chunking strategies

---

## Related Documents

- **Scout Agent Architecture**: `000-docs/6778-AT-PLAN-cto-agent-architecture-plan.md`
- **Scout Deployment**: `000-docs/6779-LS-COMP-agent-engine-deployment-complete.md`
- **Scout Testing**: `vertex-agents/scout-team/test_scout_WORKING.py`

---

## Git Commits

- Initial pipeline implementation: `[to be committed]`

---

**Document Created**: 2025-11-19
**Last Updated**: 2025-11-19
**Status**: Production-Ready - Pipeline Implemented
