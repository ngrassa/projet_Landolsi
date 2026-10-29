#!/usr/bin/env bash
# Sauvegarde PostgreSQL cohérente (pg_dump, format custom) + somme SHA-256
# + métadonnées. Ne modifie jamais la base source.
#
# Usage :
#   scripts/backup-db.sh [--env-file FICHIER] [--output-dir DIR] [--keep N] [--dry-run]
#
#   --env-file   fichier contenant DB_* (défaut : /etc/landolsi/backend.env,
#                ou backend/.env si le premier n'existe pas)
#   --output-dir répertoire de destination (défaut : /var/backups/landolsi)
#   --keep N     conserver les N sauvegardes les plus récentes de ce
#                répertoire et supprimer les plus anciennes (désactivé par défaut)
#   --dry-run    affiche ce qui serait fait et teste la connexion, sans sauvegarder
#
# Codes de sortie : 0 succès, 1 erreur, 2 arguments invalides.

. "$(dirname "$(readlink -f "$0")")/lib/common.sh"

ENV_FILE=""
OUT_DIR="$BACKUP_DIR"
KEEP=0
DRY_RUN=0

usage() { sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --env-file)   ENV_FILE="${2:-}"; shift 2 ;;
        --output-dir) OUT_DIR="${2:-}"; shift 2 ;;
        --keep)       KEEP="${2:-}"; shift 2 ;;
        --dry-run)    DRY_RUN=1; shift ;;
        -h|--help)    usage ;;
        *) echo "Argument inconnu : $1" >&2; usage ;;
    esac
done

[[ "$KEEP" =~ ^[0-9]+$ ]] || die "--keep doit être un entier" 2
[[ -n "$OUT_DIR" ]] || die "--output-dir vide" 2

if [[ -z "$ENV_FILE" ]]; then
    if [[ -r "$APP_ENV_FILE" ]]; then
        ENV_FILE="$APP_ENV_FILE"
    else
        ENV_FILE="$(dirname "$(readlink -f "$0")")/../backend/.env"
    fi
fi

require_cmd pg_dump pg_restore psql sha256sum
load_env_file "$ENV_FILE" '^DB_'
export_pg_env

server_version="$(psql -XAtc 'SHOW server_version' 2>/dev/null)" \
    || die "connexion impossible à ${PGHOST}:${PGPORT}/${PGDATABASE} (utilisateur ${PGUSER})"

client_major="$(pg_dump --version | grep -oE '[0-9]+' | head -1)"
server_major="${server_version%%.*}"
if (( client_major < server_major )); then
    die "pg_dump $client_major est plus ancien que le serveur $server_version : installez postgresql-client-$server_major"
fi

timestamp="$(date -u '+%Y%m%dT%H%M%SZ')"
base="${PGDATABASE}_${timestamp}"
dump="$OUT_DIR/$base.dump"

log "Base : ${PGDATABASE} sur ${PGHOST}:${PGPORT} (PostgreSQL ${server_version})"
log "Destination : $dump"

if (( DRY_RUN )); then
    log "[dry-run] connexion OK; aucune sauvegarde écrite."
    exit 0
fi

umask 077
mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR" 2>/dev/null || true

tmp="$dump.partial"
trap 'rm -f "$tmp"' EXIT

# --format=custom : compressé, restauration sélective et parallèle possible.
# pg_dump s'exécute dans une transaction : la sauvegarde est cohérente
# même si l'application continue d'écrire.
pg_dump --format=custom --compress=6 --no-password --file="$tmp" "$PGDATABASE"

# Vérifier que l'archive est lisible avant de la publier
pg_restore --list "$tmp" >/dev/null || die "archive produite illisible"
mv "$tmp" "$dump"
trap - EXIT

checksum="$(sha256_file "$dump")"
printf '%s  %s\n' "$checksum" "$(basename "$dump")" > "$dump.sha256"

tables="$(psql -XAtc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")"
cat > "$OUT_DIR/$base.json" <<EOF
{
  "database": "${PGDATABASE}",
  "host": "${PGHOST}",
  "port": ${PGPORT},
  "server_version": "${server_version}",
  "pg_dump_version": "$(pg_dump --version | awk '{print $NF}')",
  "created_utc": "${timestamp}",
  "format": "custom",
  "file": "$(basename "$dump")",
  "size_bytes": $(stat -c %s "$dump"),
  "sha256": "${checksum}",
  "public_tables": ${tables}
}
EOF
chmod 600 "$dump" "$dump.sha256" "$OUT_DIR/$base.json"

log "Sauvegarde terminée : $(basename "$dump") ($(du -h "$dump" | cut -f1), sha256 ${checksum:0:16}…)"

if (( KEEP > 0 )); then
    mapfile -t old < <(ls -1t "$OUT_DIR/${PGDATABASE}"_*.dump 2>/dev/null | tail -n +$((KEEP + 1)))
    for f in "${old[@]}"; do
        log "Rotation : suppression de l'ancienne sauvegarde $(basename "$f")"
        rm -f -- "$f" "$f.sha256" "${f%.dump}.json"
    done
fi
