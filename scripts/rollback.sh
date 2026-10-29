#!/usr/bin/env bash
# Réactive une version précédente du code (lien /opt/landolsi/current).
# N'annule PAS les migrations de base de données : voir docs/deployment/rollback.md.
#
# Usage (root) :
#   sudo scripts/rollback.sh [--list] [--to RELEASE_ID]
#
#   --list           affiche les versions disponibles
#   --to RELEASE_ID  version cible (défaut : la plus récente avant la version active)

. "$(dirname "$(readlink -f "$0")")/lib/common.sh"

TARGET_ID=""
LIST=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --to)   TARGET_ID="${2:-}"; shift 2 ;;
        --list) LIST=1; shift ;;
        -h|--help) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
        *) die "argument inconnu : $1" 2 ;;
    esac
done

CURRENT="$(readlink -f "$APP_ROOT/current" 2>/dev/null || true)"
mapfile -t releases < <(ls -1d "$APP_ROOT"/releases/*/ 2>/dev/null | sed 's#/$##' | sort -r)
(( ${#releases[@]} )) || die "aucune version dans $APP_ROOT/releases"

if (( LIST )); then
    for r in "${releases[@]}"; do
        [[ "$r" == "$CURRENT" ]] && echo "* $(basename "$r")  (active)" || echo "  $(basename "$r")"
    done
    exit 0
fi

[[ $EUID -eq 0 ]] || die "à exécuter en root (sudo)"

if [[ -n "$TARGET_ID" ]]; then
    [[ "$TARGET_ID" =~ ^[A-Za-z0-9._-]+$ ]] || die "identifiant invalide" 2
    TARGET="$APP_ROOT/releases/$TARGET_ID"
    [[ -d "$TARGET" ]] || die "version introuvable : $TARGET_ID"
else
    TARGET=""
    found=0
    for r in "${releases[@]}"; do
        if (( found )); then TARGET="$r"; break; fi
        [[ "$r" == "$CURRENT" ]] && found=1
    done
    [[ -n "$TARGET" ]] || die "aucune version antérieure à $(basename "$CURRENT")"
fi

[[ "$TARGET" != "$CURRENT" ]] || die "$(basename "$TARGET") est déjà active"
[[ -f "$TARGET/frontend/dist/index.html" ]] || die "version $(basename "$TARGET") incomplète"

log "Retour de $(basename "$CURRENT") vers $(basename "$TARGET")..."
ln -sfn "$TARGET" "$APP_ROOT/current.tmp"
mv -Tf "$APP_ROOT/current.tmp" "$APP_ROOT/current"
systemctl restart "$SERVICE_NAME"
systemctl reload nginx

if "$TARGET/scripts/health-check.sh" --retries 20; then
    log "Retour arrière terminé : $(basename "$TARGET") active."
    warn "le schéma de base n'a pas été modifié; si la version restaurée est incompatible, restaurez la sauvegarde pré-déploiement."
else
    die "la version $(basename "$TARGET") ne répond pas : consultez journalctl -u $SERVICE_NAME"
fi
