#!/usr/bin/env bash
# Real Docker-context regression using synthetic, nonsecret files and scratch.
set -euo pipefail
task_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
task_tmp=$(mktemp -d)
trap 'rm -rf -- "$task_tmp"' EXIT
mkdir -p "$task_tmp/context/nested" "$task_tmp/context/data" "$task_tmp/context/03-Tests/e2e/.runtime/run-canary" "$task_tmp/context/03-Tests/e2e/.auth" "$task_tmp/output"
cp -f "$task_root/.dockerignore" "$task_tmp/context/.dockerignore"
cat > "$task_tmp/context/Dockerfile" <<'EOF'
FROM scratch
COPY . /fixture/
EOF
for task_file in .env .env.local nested/.env nested/.env.production data/hustle.db 03-Tests/e2e/.runtime/run-canary/hustle.db 03-Tests/e2e/.auth/user.json; do
  printf '%s\n' 'PRIVATE_FIXTURE=not-a-real-credential' > "$task_tmp/context/$task_file"
done
for task_file in .env.example nested/.env.example app.txt; do
  printf '%s\n' 'PUBLIC_FIXTURE=template-only' > "$task_tmp/context/$task_file"
done
timeout 120 docker buildx build --progress=quiet \
  --output "type=local,dest=$task_tmp/output" "$task_tmp/context"
for task_file in .env .env.local nested/.env nested/.env.production data/hustle.db 03-Tests/e2e/.runtime/run-canary/hustle.db 03-Tests/e2e/.auth/user.json; do
  if [[ -e "$task_tmp/output/fixture/$task_file" ]]; then
    printf 'FAIL: private environment file entered Docker context: %s\n' "$task_file" >&2
    exit 1
  fi
done
for task_file in .env.example nested/.env.example app.txt; do
  if [[ ! -f "$task_tmp/output/fixture/$task_file" ]]; then
    printf 'FAIL: expected public build input missing: %s\n' "$task_file" >&2
    exit 1
  fi
done
printf '%s\n' 'PASS: 7 private environment/state files excluded; 3 public inputs retained'
