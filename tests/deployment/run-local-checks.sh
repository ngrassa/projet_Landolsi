#!/usr/bin/env bash
# Exécute toutes les vérifications locales réalisables sans AWS.
#
# Usage : tests/deployment/run-local-checks.sh [ENV_FILE_TEST]
#   ENV_FILE_TEST : fichier DB_* d'une base PostgreSQL de TEST (facultatif).
#   Sans ce fichier, les tests nécessitant une base sont ignorés.
#   Ne jamais fournir le fichier de production : les tests écrivent dans la base.

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_TEST="${1:-}"
results=()
failed=0

run() {
    local name="$1"; shift
    echo "==> $name"
    if "$@"; then results+=("PASS  $name"); else results+=("FAIL  $name"); failed=1; fi
}
skip() { results+=("SKIP  $1 ($2)"); }

run "Casse des imports (compatibilité Linux)" \
    node "$ROOT/tests/deployment/check-import-case.cjs" "$ROOT/frontend/src" "$ROOT/backend"

run "Syntaxe des scripts shell" bash -c '
    for f in "$0"/scripts/*.sh "$0"/scripts/lib/*.sh "$0"/tests/deployment/*.sh; do bash -n "$f" || exit 1; done' "$ROOT"

if command -v shellcheck >/dev/null; then
    run "ShellCheck" shellcheck -x -P "$ROOT/scripts" -S warning "$ROOT"/scripts/*.sh "$ROOT"/scripts/lib/*.sh "$ROOT"/tests/deployment/*.sh
else
    skip "ShellCheck" "non installé"
fi

run "Build frontend (VITE_API_URL=/api)" bash -c 'cd "$0/frontend" && VITE_API_URL=/api npm run build >/dev/null'  "$ROOT"
run "Aucune URL localhost dans le build" bash -c '! grep -q "localhost:5001" "$0"/frontend/dist/assets/*.js' "$ROOT"

if [[ -n "$ENV_TEST" ]]; then
    run "Migrations (idempotentes)" bash -c 'cd "$0/backend" && ENV_FILE="$1" NODE_ENV=production npx sequelize-cli db:migrate >/dev/null && ENV_FILE="$1" NODE_ENV=production npx sequelize-cli db:migrate | grep -q "No migrations were executed"' "$ROOT" "$ENV_TEST"
    run "Tests backend (config + API)" bash -c 'cd "$0/backend" && ENV_FILE="$1" npm test' "$ROOT" "$ENV_TEST"
    run "Sauvegarde / restauration" "$ROOT/tests/deployment/backup-restore.test.sh" "$ENV_TEST"
else
    run "Tests backend (config uniquement)" bash -c 'cd "$0/backend" && ENV_FILE=/nonexistent DB_NAME= npm test' "$ROOT"
    skip "Migrations" "pas de base de test"
    skip "Sauvegarde / restauration" "pas de base de test"
fi

if command -v terraform >/dev/null; then
    run "Terraform fmt + validate" bash -c 'cd "$0/infra/aws" && terraform fmt -check -recursive && terraform init -backend=false -input=false >/dev/null && terraform validate' "$ROOT"
else
    skip "Terraform" "non installé"
fi

echo
printf '%s\n' "${results[@]}"
exit $failed
