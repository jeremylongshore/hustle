# Claudes Docs - Session Logs & Documentation

This directory contains **ALL** chronological session logs and documentation for the Hustle MVP project, following a structured naming convention for easy tracking and reference.

## 🚨 CRITICAL POLICY: ONE CLAUDES-DOCS PER PROJECT

**There is ONLY ONE `claudes-docs/` directory per project, located in the project root.**

- ✅ **Correct:** `/home/jeremy/projects/hustle/claudes-docs/`
- ❌ **Wrong:** `/home/jeremy/projects/hustle/app/claudes-docs/`
- ❌ **Wrong:** `/home/jeremy/projects/hustle/terraform/claudes-docs/`

**All session logs, reports, and documentation must be saved to the root-level `claudes-docs/` directory.**

---

## Directory Structure

```
/home/jeremy/projects/hustle/claudes-docs/
├── 0001-DEBUG-INFRASTRUCTURE-SETUP.md
├── 0002-CHECKPOINT-INFRASTRUCTURE-COMPLETE.md
├── 0003-FIX-BILLING-QUOTA-RESOLUTION.md
├── 0004-ARCHIVE-INITIAL-SETUP-STATUS.md
├── 0005-ARCHIVE-PRE-DEPLOYMENT-STATUS.md
├── 0006-ENT-NEXTJS-INITIALIZATION.md
├── 0007-ENT-CLOUD-RUN-DEPLOYMENT.md
├── 0008-CHECKPOINT-GATE-A-MILESTONE.md
├── INDEX.md
└── README.md
```

## Naming Convention

Files follow this pattern: `NNNN-TYPE-DESCRIPTION.md` (no dates)

- **NNNN**: 4-digit sequential number (0001, 0002, 0003, etc.)
- **TYPE**: Document category (see types below)
- **DESCRIPTION**: Brief description using hyphens (e.g., INFRASTRUCTURE-SETUP)

## Document Types

### Development & Debugging
- **DEBUG** - Debugging sessions, troubleshooting, and diagnostic work
- **FIX** - Bug fixes and issue resolutions
- **CRITFIX** - Critical fixes requiring immediate attention
- **EMERGENCY** - Emergency response and incident resolution

### Implementation & Features
- **ENT** - Enterprise/entry level feature implementation
- **BUILD** - Build processes and compilation work
- **RELEASE** - Release documentation and deployment records
- **PHASE[N]** - Phase-based implementation tracking (PHASE1, PHASE2, etc.)

### System & Infrastructure
- **SYS** - System-level changes and infrastructure work
- **CLEAN** - Cleanup operations and refactoring
- **ARCHIVE** - Archived decisions and historical records

### Analysis & Planning
- **ANALYSIS** - Technical analysis and research
- **AAR** - After Action Reports (post-mortem analysis)
- **CHECKPOINT** - Important state checkpoints
- **SAVEPOINT** - Rollback points and safe states

### Status & Tracking
- **STATUS** - Status updates and health checks
- **COMPLETE** - Completion reports
- **SUCCESS** - Success milestones and achievements
- **INCIDENT** - Incident reports and investigations
- **CONTEXT** - Context preservation for handoffs

## Usage Guidelines

1. **Sequential Numbering**: Always use the next available number
2. **Descriptive Names**: Make descriptions clear and searchable
3. **Type Consistency**: Use existing types when applicable
4. **Hyphen Separation**: Use hyphens in descriptions (not underscores or spaces)

## Example Files

```
0001-DEBUG-INFRASTRUCTURE-SETUP.md
0002-CLEAN-CODEBASE-REFACTOR.md
0003-ENT-USER-AUTHENTICATION.md
0004-FIX-DATABASE-CONNECTION-ERROR.md
0005-CHECKPOINT-MVP-LAUNCH-READY.md
```

## Quick Reference

### When to Create a New Document
- Significant debugging session
- Major feature implementation
- Critical fixes or emergencies
- System checkpoints or savepoints
- Analysis or decision documentation
- Post-deployment reviews (AAR)

### Finding Documents
```bash
# List all debug sessions
ls claudes-docs/*DEBUG*

# Find specific feature
ls claudes-docs/*AUTHENTICATION*

# View latest entries
ls -lt claudes-docs/ | head -10
```

## Current Status

**Latest Entry**: 0005-ARCHIVE-PRE-DEPLOYMENT-STATUS.md
**Total Documents**: 5
**Last Updated**: October 4, 2025

---

*This structure is based on the DiagnosticPro platform's session logging system, adapted for the Hustle MVP project.*
