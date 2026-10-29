#!/usr/bin/env bash
# Test de bout en bout : sauvegarde -> restauration dans une base neuve ->
# comparaison du schéma, des comptages exacts et des séquences.
# N'utilise QUE des bases de test; la base source n'est jamais modifiée.
#
# Usage : tests/deployment/backup-restore.test.sh ENV_FILE_SOURCE
#   ENV_FILE_SOURCE : fichier DB_* d'une base de TEST déjà peuplée.
#   L'utilisateur DB_USER doit avoir le droit CREATEDB.

set -Eeuo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
. "$ROOT/scripts/lib/common.sh"

ENV_SRC="${1:?usage: $0 ENV_FILE_SOURCE}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

load_env_file "$ENV_SRC" '^DB_'
export_pg_env
SRC_DB="$DB_NAME"
TARGET="restore_check_$(date +%s)"

fail() { echo "ÉCHEC : $*" >&2; exit 1; }
pass() { echo "OK : $*"; }

counts() {
    local db="$1" t
    for t in $(psql -XAt -d "$db" -c "SELECT quote_ident(table_name) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY 1"); do
        printf '%s=%s\n' "$t" "$(psql -XAt -d "$db" -c "SELECT count(*) FROM $t")"
    done
}
sequences() {
    psql -XAt -d "$1" -c "SELECT sequencename || '=' || coalesce(last_value::text,'null') FROM pg_sequences WHERE schemaname='public' ORDER BY 1"
}
schema() {
    pg_dump -s --no-owner --no-privileges -d "$1" | grep -vE '^(--|\\restrict|\\unrestrict|SET |SELECT pg_catalog)' | sed '/^$/d'
}

# 1. Sauvegarde
"$ROOT/scripts/backup-db.sh" --env-file "$ENV_SRC" --output-dir "$WORK" >/dev/null
DUMP="$(ls -1 "$WORK"/*.dump)"
[[ -s "$DUMP" && -s "$DUMP.sha256" ]] || fail "archive ou somme absente"
[[ "$(stat -c %a "$DUMP")" == "600" ]] || fail "permissions de l'archive != 600"
pass "sauvegarde créée avec permissions 600 et SHA-256"

# 2. Dry-run de restauration : ne crée rien
"$ROOT/scripts/restore-db.sh" --env-file "$ENV_SRC" --file "$DUMP" --target-db "$TARGET" --dry-run >/dev/null
[[ -z "$(psql -XAt -d postgres -c "SELECT 1 FROM pg_database WHERE datname='$TARGET'")" ]] || fail "dry-run a créé la base"
pass "dry-run sans effet"

# 3. Restauration dans une base neuve
"$ROOT/scripts/restore-db.sh" --env-file "$ENV_SRC" --file "$DUMP" --target-db "$TARGET" --create >/dev/null
pass "restauration dans $TARGET"

diff <(counts "$SRC_DB") <(counts "$TARGET") >/dev/null || fail "comptages différents"
pass "comptages exacts identiques ($(counts "$TARGET" | wc -l) tables)"

diff <(sequences "$SRC_DB") <(sequences "$TARGET") >/dev/null || fail "séquences différentes"
pass "séquences identiques"

diff <(schema "$SRC_DB") <(schema "$TARGET") >/dev/null || fail "schémas différents"
pass "schéma identique (tables, index, contraintes, types ENUM)"

# 4. Refus de restaurer dans une base non vide (code 3)
set +e
"$ROOT/scripts/restore-db.sh" --env-file "$ENV_SRC" --file "$DUMP" --target-db "$TARGET" >/dev/null 2>&1
rc=$?
set -e
[[ $rc -eq 3 ]] || fail "base non vide non protégée (code $rc)"
pass "restauration refusée dans une base non vide (code 3)"

# 5. Détection d'une archive altérée
cp "$DUMP" "$WORK/tampered.dump"
cp "$DUMP.sha256" "$WORK/tampered.dump.sha256"
printf 'x' >> "$WORK/tampered.dump"
if "$ROOT/scripts/restore-db.sh" --env-file "$ENV_SRC" --file "$WORK/tampered.dump" --target-db "${TARGET}_x" --create >/dev/null 2>&1; then
    fail "archive altérée acceptée"
fi
pass "archive altérée rejetée"

# 6. La source n'a pas été modifiée
psql -XAt -d "$SRC_DB" -c 'SELECT 1' >/dev/null || fail "base source inaccessible"
pass "base source intacte"

# Nettoyage : uniquement la base de test créée par ce script
psql -X -q -d postgres -c "DROP DATABASE \"$TARGET\"" >/dev/null
echo "Tous les contrôles de sauvegarde/restauration ont réussi."
