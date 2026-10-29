#!/usr/bin/env bash
# Restaure une sauvegarde pg_dump (format custom) dans une base CIBLE.
# Ne supprime jamais de base. Par défaut, refuse de restaurer dans une base
# qui contient déjà des tables.
#
# Usage :
#   scripts/restore-db.sh --file SAUVEGARDE.dump --target-db NOM
#                         [--env-file FICHIER] [--create] [--allow-nonempty] [--dry-run]
#
#   --file           archive produite par backup-db.sh (vérifiée via .sha256 si présent)
#   --target-db      base de destination (connexion avec DB_USER/DB_HOST/DB_PORT du fichier env)
#   --env-file       fichier contenant DB_* (défaut : /etc/landolsi/backend.env ou backend/.env)
#   --create         crée la base cible si elle n'existe pas (droit CREATEDB requis)
#   --allow-nonempty OPÉRATION DESTRUCTIVE : autorise la restauration dans une base
#                    contenant déjà des tables (les objets présents dans l'archive sont
#                    supprimés puis recréés via --clean). Faire une sauvegarde avant.
#   --dry-run        vérifie l'archive et la connexion, liste le contenu, sans restaurer
#
# Codes de sortie : 0 succès, 1 erreur, 2 arguments invalides, 3 base cible non vide.

. "$(dirname "$(readlink -f "$0")")/lib/common.sh"

FILE=""
TARGET=""
ENV_FILE=""
CREATE=0
ALLOW_NONEMPTY=0
DRY_RUN=0

usage() { sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --file)           FILE="${2:-}"; shift 2 ;;
        --target-db)      TARGET="${2:-}"; shift 2 ;;
        --env-file)       ENV_FILE="${2:-}"; shift 2 ;;
        --create)         CREATE=1; shift ;;
        --allow-nonempty) ALLOW_NONEMPTY=1; shift ;;
        --dry-run)        DRY_RUN=1; shift ;;
        -h|--help)        usage ;;
        *) echo "Argument inconnu : $1" >&2; usage ;;
    esac
done

[[ -n "$FILE" && -n "$TARGET" ]] || usage
[[ -r "$FILE" ]] || die "archive illisible : $FILE" 2
[[ "$TARGET" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || die "nom de base cible invalide : $TARGET" 2

if [[ -z "$ENV_FILE" ]]; then
    if [[ -r "$APP_ENV_FILE" ]]; then
        ENV_FILE="$APP_ENV_FILE"
    else
        ENV_FILE="$(dirname "$(readlink -f "$0")")/../backend/.env"
    fi
fi

require_cmd pg_restore psql sha256sum
load_env_file "$ENV_FILE" '^DB_'
export_pg_env

# 1. Intégrité de l'archive
if [[ -r "$FILE.sha256" ]]; then
    expected="$(awk '{print $1}' "$FILE.sha256")"
    actual="$(sha256_file "$FILE")"
    [[ "$expected" == "$actual" ]] || die "somme SHA-256 invalide : archive corrompue ou modifiée"
    log "Somme SHA-256 vérifiée."
else
    warn "pas de fichier $FILE.sha256 : intégrité non vérifiée"
fi
pg_restore --list "$FILE" >/dev/null || die "archive illisible par pg_restore"
objects="$(pg_restore --list "$FILE" | grep -vc '^;')"
log "Archive valide : $objects objets."

# 2. Base cible
exists="$(psql -XAt -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$TARGET'" 2>/dev/null)" \
    || exists="$(psql -XAt -c "SELECT 1 FROM pg_database WHERE datname = '$TARGET'")" \
    || die "connexion impossible à ${PGHOST}:${PGPORT}"

if (( DRY_RUN )); then
    log "[dry-run] base cible '$TARGET' : $([[ "$exists" == 1 ]] && echo existe || echo absente)."
    pg_restore --list "$FILE" | grep -E ' TABLE ' | awk '{print "  -", $(NF-1)}' || true
    exit 0
fi

if [[ "$exists" != "1" ]]; then
    (( CREATE )) || die "la base '$TARGET' n'existe pas (ajoutez --create)"
    log "Création de la base '$TARGET'."
    psql -X -v ON_ERROR_STOP=1 -d postgres -c "CREATE DATABASE \"$TARGET\"" >/dev/null
fi

tables="$(psql -XAt -d "$TARGET" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")"
clean_args=()
if (( tables > 0 )); then
    if (( ! ALLOW_NONEMPTY )); then
        die "la base '$TARGET' contient déjà $tables table(s). Restaurez dans une base vide, ou utilisez --allow-nonempty après sauvegarde." 3
    fi
    warn "restauration destructive dans '$TARGET' ($tables tables existantes) : --clean --if-exists"
    clean_args=(--clean --if-exists)
fi

# 3. Restauration en une seule transaction : tout ou rien
log "Restauration dans '$TARGET'..."
pg_restore --no-password --dbname="$TARGET" --no-owner --no-privileges \
    --single-transaction --exit-on-error "${clean_args[@]}" "$FILE"

# 4. Contrôles post-restauration
restored="$(psql -XAt -d "$TARGET" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")"
log "Restauration terminée : $restored tables dans '$TARGET'."
psql -X -d "$TARGET" -c "
    SELECT relname AS table, n_live_tup AS lignes_estimees
    FROM pg_stat_user_tables ORDER BY relname" || true
log "Pensez à exécuter 'ANALYZE' puis à vérifier les comptages exacts sur les tables critiques."
