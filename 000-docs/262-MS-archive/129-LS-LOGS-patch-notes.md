# Vertex→PDF Pipeline Patch Notes

## Deployment Steps
1. Sync updated schema and prompt assets to Vertex runtime bundle.
2. Roll out `tests/scripts/run_vertex_once.js` automation to CI to produce baseline outputs for mocks A–H.
3. Add guard scripts (`validate_schema.sh`, `length_guard.sh`, `page_estimator.py`, `confidence_guard.sh`, `readiness_guard.sh`) to pipeline stage preceding PDF rendering.
4. Publish `docs/RENDER.MAP.md` so design and QA align on the new layout bindings.

## Configuration Knobs
- `confidence_threshold_pct`: default 85; raise or lower via user prompt variable when specific engagements require alternate risk tolerance.
- `CONFIDENCE_THRESHOLD_DEFAULT` environment variable for `confidence_guard.sh` when downstream workflows set a custom floor.

## Rollback Steps
1. Revert prompt/schema bundle to prior tagged release in Vertex storage.
2. Disable new guard scripts in CI to allow legacy outputs (note: pagination risks return).
3. Restore previous PDF layout map documentation to keep historical reference for support.
