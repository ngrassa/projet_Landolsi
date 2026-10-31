#!/usr/bin/env bash
# Configure les assistants IA Mistral sur le serveur, puis redémarre l'API.
# La clé est lue sur l'ENTRÉE STANDARD : elle n'apparaît ni dans la ligne de
# commande (ps, historique shell), ni dans Terraform (tfstate, user_data).
#
# Usage (root) :
#   sudo scripts/configure-ai.sh [--model MODELE] [--no-restart] < fichier_contenant_la_cle
#
# Depuis le poste d'administration (clé dans backend/.env local) :
#   grep '^MISTRAL_API_KEY=' backend/.env | cut -d= -f2- | \
#     ssh -i ~/.ssh/landolsi_ec2_ed25519 ubuntu@<IP> 'sudo /opt/landolsi-src/scripts/configure-ai.sh'
#
#   --model MODELE  modèle Mistral avec appel d'outils ouvert sur votre abonnement
#                   (défaut ministral-14b-latest)
#   --no-restart    ne pas redémarrer landolsi-backend

. "$(dirname "$(readlink -f "$0")")/lib/common.sh"

MODEL="ministral-14b-latest"
RESTART=1
while [[ $# -gt 0 ]]; do
    case "$1" in
        --model)      MODEL="${2:?}"; shift 2 ;;
        --no-restart) RESTART=0; shift ;;
        -h|--help)    sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
        *) echo "Argument inconnu : $1" >&2; exit 2 ;;
    esac
done

[[ $EUID -eq 0 ]] || die "à exécuter en root (sudo)" 2
[[ -w "$APP_ENV_FILE" ]] || die "$APP_ENV_FILE absent : lancez d'abord scripts/install.sh"
[[ "$MODEL" =~ ^[A-Za-z0-9._-]+$ ]] || die "nom de modèle invalide" 2
[[ -t 0 ]] && die "fournissez la clé sur l'entrée standard (voir --help)" 2

IFS= read -r KEY || true
KEY="${KEY//[$'\r\n\t ']/}"
[[ "$KEY" =~ ^[A-Za-z0-9_-]{20,200}$ ]] || die "clé Mistral vide ou au format inattendu" 2

set_env() {
    local key="$1" value="$2" tmp
    tmp="$(mktemp)"
    # Réécriture sans passer la valeur à sed (caractères spéciaux, ps)
    grep -vE "^${key}=" "$APP_ENV_FILE" > "$tmp" || true
    printf '%s=%s\n' "$key" "$value" >> "$tmp"
    cat "$tmp" > "$APP_ENV_FILE"   # conserve propriétaire et droits (0640 root:landolsi)
    rm -f "$tmp"
}

set_env MISTRAL_API_KEY "$KEY"
set_env MISTRAL_MODEL "$MODEL"
unset KEY
log "MISTRAL_API_KEY et MISTRAL_MODEL=$MODEL enregistrés dans $APP_ENV_FILE."

if (( RESTART )); then
    systemctl restart landolsi-backend
    for _ in $(seq 1 20); do
        curl -fsS --max-time 3 http://127.0.0.1:5001/health >/dev/null 2>&1 && break
        sleep 1
    done
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 -X POST \
        -H 'Content-Type: application/json' -d '{"message":"Bonjour"}' \
        http://127.0.0.1:5001/ai/support/chat)"
    if [[ "$code" == "200" ]]; then
        log "Assistant IA opérationnel (test SAV : HTTP 200)."
    else
        warn "test de l'assistant : HTTP $code (clé, modèle ou quota Mistral à vérifier ; journal : journalctl -u landolsi-backend)"
        exit 1
    fi
fi
