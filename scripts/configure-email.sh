#!/usr/bin/env bash
# Configure l'envoi d'e-mails (SMTP Gmail : factures, réinitialisation de mot
# de passe), puis vérifie la connexion SMTP et redémarre l'API.
# Les identifiants sont lus sur l'ENTRÉE STANDARD (lignes EMAIL_USER=... et
# EMAIL_PASS=...) : ils n'apparaissent ni dans la ligne de commande, ni dans Git.
#
# Usage (root) :
#   sudo scripts/configure-email.sh [--no-restart] < fichier_avec_EMAIL_USER_et_EMAIL_PASS
#
# Depuis le poste d'administration (identifiants dans backend/.env local) :
#   grep -E '^EMAIL_(USER|PASS)=' backend/.env | \
#     ssh -i ~/.ssh/landolsi_ec2_ed25519 ubuntu@<IP> 'sudo /opt/landolsi-src/scripts/configure-email.sh'
#
# EMAIL_PASS est un « mot de passe d'application » Google (compte avec
# validation en deux étapes), pas le mot de passe du compte.

. "$(dirname "$(readlink -f "$0")")/lib/common.sh"

RESTART=1
case "${1:-}" in
    --no-restart) RESTART=0 ;;
    -h|--help) sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
    "") ;;
    *) echo "Argument inconnu : $1" >&2; exit 2 ;;
esac

[[ $EUID -eq 0 ]] || die "à exécuter en root (sudo)" 2
[[ -w "$APP_ENV_FILE" ]] || die "$APP_ENV_FILE absent : lancez d'abord scripts/install.sh"
[[ -t 0 ]] && die "fournissez EMAIL_USER=... et EMAIL_PASS=... sur l'entrée standard (voir --help)" 2

USER_VAL=""
PASS_VAL=""
while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    case "$line" in
        EMAIL_USER=*) USER_VAL="${line#EMAIL_USER=}" ;;
        EMAIL_PASS=*) PASS_VAL="${line#EMAIL_PASS=}" ;;
    esac
done
USER_VAL="${USER_VAL//\"/}"; PASS_VAL="${PASS_VAL//\"/}"
[[ "$USER_VAL" =~ ^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$ ]] || die "EMAIL_USER absent ou invalide" 2
[[ -n "$PASS_VAL" && "$PASS_VAL" != *$'\n'* ]] || die "EMAIL_PASS absent" 2

set_env() {
    local key="$1" value="$2" tmp
    tmp="$(mktemp)"
    grep -vE "^${key}=" "$APP_ENV_FILE" > "$tmp" || true
    printf '%s=%s\n' "$key" "$value" >> "$tmp"
    cat "$tmp" > "$APP_ENV_FILE"   # conserve propriétaire et droits
    rm -f "$tmp"
}
set_env EMAIL_USER "$USER_VAL"
set_env EMAIL_PASS "$PASS_VAL"
unset PASS_VAL
log "EMAIL_USER et EMAIL_PASS enregistrés dans $APP_ENV_FILE."

# Vérification de la connexion SMTP (authentification, sans envoyer de message)
BACKEND_DIR="${APP_ROOT:-/opt/landolsi}/current/backend"
if [[ -d "$BACKEND_DIR" ]]; then
    if runuser -u landolsi -- env ENV_FILE="$APP_ENV_FILE" NODE_ENV=production node -e '
        require(process.argv[1] + "/config");
        const nodemailer = require(process.argv[1] + "/node_modules/nodemailer");
        nodemailer.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } })
          .verify().then(() => process.exit(0)).catch((e) => { console.error("SMTP :", e.code || "erreur", e.responseCode || ""); process.exit(1); });
    ' "$BACKEND_DIR"; then
        log "Connexion SMTP vérifiée."
    else
        warn "connexion SMTP refusée : vérifiez le mot de passe d'application Google"
        exit 1
    fi
fi

if (( RESTART )); then
    systemctl restart landolsi-backend
    log "landolsi-backend redémarré."
fi
