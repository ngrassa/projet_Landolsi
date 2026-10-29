# shellcheck shell=bash
# Fonctions communes aux scripts d'exploitation LANDOLSI TIRES.
# À sourcer : . "$(dirname "$0")/lib/common.sh"

set -Eeuo pipefail

APP_NAME="${APP_NAME:-landolsi}"
APP_ROOT="${APP_ROOT:-/opt/landolsi}"
APP_ENV_FILE="${APP_ENV_FILE:-/etc/landolsi/backend.env}"
SERVICE_NAME="${SERVICE_NAME:-landolsi-backend}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/landolsi}"

log()  { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
warn() { printf '[%s] ATTENTION : %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2; }
die()  { printf '[%s] ERREUR : %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2; exit "${2:-1}"; }

require_cmd() {
    local cmd
    for cmd in "$@"; do
        command -v "$cmd" >/dev/null 2>&1 || die "commande requise introuvable : $cmd"
    done
}

# Lit un fichier KEY=VALUE (format systemd EnvironmentFile / dotenv)
# sans l'exécuter comme du shell, et exporte uniquement les clés
# correspondant au motif donné (ex. '^DB_').
load_env_file() {
    local file="$1" pattern="${2:-.}" line key value
    [[ -r "$file" ]] || die "fichier d'environnement illisible : $file"
    while IFS= read -r line || [[ -n "$line" ]]; do
        line="${line%$'\r'}"
        [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
        [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
        key="${BASH_REMATCH[2]}"
        value="${BASH_REMATCH[3]}"
        [[ "$key" =~ $pattern ]] || continue
        # Retirer des guillemets englobants éventuels
        if [[ "$value" =~ ^\"(.*)\"$ ]] || [[ "$value" =~ ^\'(.*)\'$ ]]; then
            value="${BASH_REMATCH[1]}"
        fi
        export "$key=$value"
    done < "$file"
}

# Prépare les variables libpq (PGHOST, PGPASSWORD...) à partir de DB_*.
# Le mot de passe n'est jamais affiché ni passé en argument de commande.
export_pg_env() {
    : "${DB_NAME:?DB_NAME manquant}" "${DB_USER:?DB_USER manquant}"
    export PGHOST="${DB_HOST:-localhost}"
    export PGPORT="${DB_PORT:-5432}"
    export PGUSER="$DB_USER"
    export PGDATABASE="$DB_NAME"
    export PGPASSWORD="${DB_PASSWORD:-}"
    export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}"
    if [[ "${DB_SSL:-false}" =~ ^(1|true|yes|on)$ ]]; then
        export PGSSLMODE="${PGSSLMODE:-require}"
    fi
}

sha256_file() { sha256sum "$1" | awk '{print $1}'; }
