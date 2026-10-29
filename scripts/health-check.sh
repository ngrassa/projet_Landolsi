#!/usr/bin/env bash
# Contrôle de santé : API directe, API via Nginx et frontend.
#
# Usage :
#   scripts/health-check.sh [--backend-url URL] [--public-url URL] [--retries N] [--backend-only]
#
#   --backend-url  défaut http://127.0.0.1:5001/health
#   --public-url   défaut http://127.0.0.1 (Nginx). Ex. http://<IP publique EC2>
#   --retries N    nombre de tentatives pour l'API (1 s d'intervalle, défaut 1)
#   --backend-only ne vérifier que l'API directe
#
# Code de sortie 0 si tout est sain, 1 sinon.

set -uo pipefail

BACKEND_URL="http://127.0.0.1:5001/health"
PUBLIC_URL="http://127.0.0.1"
RETRIES=1
BACKEND_ONLY=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --backend-url)  BACKEND_URL="${2:-}"; shift 2 ;;
        --public-url)   PUBLIC_URL="${2%/}"; shift 2 ;;
        --retries)      RETRIES="${2:-}"; shift 2 ;;
        --backend-only) BACKEND_ONLY=1; shift ;;
        -h|--help) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
        *) echo "Argument inconnu : $1" >&2; exit 2 ;;
    esac
done
[[ "$RETRIES" =~ ^[0-9]+$ && "$RETRIES" -ge 1 ]] || { echo "--retries invalide" >&2; exit 2; }

status=0
check() {
    local name="$1" url="$2" expect="$3" body
    if body="$(curl -fsS --max-time 10 "$url" 2>&1)" && grep -q -- "$expect" <<<"$body"; then
        echo "OK      $name ($url)"
    else
        echo "ÉCHEC   $name ($url) : ${body:0:200}"
        status=1
    fi
}

# Attendre l'API (démarrage après restart)
for ((i = 1; i <= RETRIES; i++)); do
    curl -fsS --max-time 5 "$BACKEND_URL" 2>/dev/null | grep -q '"status":"ok"' && break
    (( i < RETRIES )) && sleep 1
done

check "API (directe)" "$BACKEND_URL" '"database":"up"'

if (( ! BACKEND_ONLY )); then
    check "API via Nginx" "$PUBLIC_URL/api/health" '"database":"up"'
    check "Frontend" "$PUBLIC_URL/" '<div id="root">'
fi

exit $status
