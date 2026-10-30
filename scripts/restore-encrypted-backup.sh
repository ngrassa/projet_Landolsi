#!/usr/bin/env bash
# Déchiffre une sauvegarde chiffrée GPG (stockée HORS du dépôt), vérifie ses
# sommes SHA-256 par rapport à celles versionnées dans db/backup/, puis la
# restaure avec restore-db.sh.
#
# Usage :
#   DB_BACKUP_PASSPHRASE=... scripts/restore-encrypted-backup.sh --archive F.dump.gpg
#       [--passphrase-file F] [--checksums-dir D] [--decrypt-only DEST.dump]
#       -- ARGUMENTS_DE_restore-db.sh (sans --file)
#
#   --archive          archive chiffrée (défaut : $DB_BACKUP_ARCHIVE ou
#                      ~/.local/share/landolsi/backups/landolsi_tires.dump.gpg)
#   --passphrase-file  fichier contenant la phrase secrète (sinon variable DB_BACKUP_PASSPHRASE)
#   --checksums-dir    répertoire des sommes de référence (défaut : db/backup du dépôt)
#   --decrypt-only     écrit l'archive déchiffrée (+ .sha256) dans DEST et s'arrête
#
# Exemples :
#   scripts/restore-encrypted-backup.sh -- --target-db landolsi_verif --create --env-file test.env
#   scripts/restore-encrypted-backup.sh --archive /tmp/a.dump.gpg --decrypt-only /tmp/landolsi_tires.dump

. "$(dirname "$(readlink -f "$0")")/lib/common.sh"

ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
ARCHIVE="${DB_BACKUP_ARCHIVE:-$HOME/.local/share/landolsi/backups/landolsi_tires.dump.gpg}"
SUMS_DIR="$ROOT/db/backup"
PASS_FILE=""
DECRYPT_ONLY=""

usage() { sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --passphrase-file) PASS_FILE="${2:-}"; shift 2 ;;
        --archive)         ARCHIVE="${2:-}"; shift 2 ;;
        --checksums-dir)   SUMS_DIR="${2:-}"; shift 2 ;;
        --decrypt-only)    DECRYPT_ONLY="${2:-}"; shift 2 ;;
        --)                shift; break ;;
        -h|--help)         usage ;;
        *) echo "Argument inconnu : $1" >&2; usage ;;
    esac
done

require_cmd gpg sha256sum
[[ -r "$ARCHIVE" ]] || die "archive chiffrée illisible : $ARCHIVE" 2

if [[ -z "$PASS_FILE" ]]; then
    [[ -n "${DB_BACKUP_PASSPHRASE:-}" ]] || die "phrase secrète absente (DB_BACKUP_PASSPHRASE ou --passphrase-file)" 2
fi

# 1. Intégrité de l'archive chiffrée (doit correspondre à la version de référence)
ENC_SUM="$SUMS_DIR/landolsi_tires.dump.gpg.sha256"
PLAIN_SUM="$SUMS_DIR/landolsi_tires.dump.sha256.txt"
if [[ -r "$ENC_SUM" ]]; then
    [[ "$(awk '{print $1}' "$ENC_SUM")" == "$(sha256_file "$ARCHIVE")" ]] \
        || die "l'archive ne correspond pas à la sauvegarde de référence ($ENC_SUM)"
    log "Archive chiffrée vérifiée."
else
    warn "pas de somme de référence $ENC_SUM : intégrité non vérifiée"
fi

# 2. Déchiffrement (la phrase secrète ne passe jamais sur la ligne de commande ;
#    GNUPGHOME temporaire : l'utilisateur de service n'a pas de répertoire personnel inscriptible)
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export GNUPGHOME="$WORK/gnupg"
mkdir -m 700 "$GNUPGHOME"
if [[ -n "$DECRYPT_ONLY" ]]; then
    OUT="$DECRYPT_ONLY"
else
    OUT="$WORK/landolsi_tires.dump"
fi
(
    umask 077
    if [[ -n "$PASS_FILE" ]]; then
        gpg --batch --quiet --yes --pinentry-mode loopback --passphrase-file "$PASS_FILE" -o "$OUT" -d "$ARCHIVE"
    else
        gpg --batch --quiet --yes --pinentry-mode loopback --passphrase-fd 3 -o "$OUT" -d "$ARCHIVE" \
            3<<<"$DB_BACKUP_PASSPHRASE"
    fi
) || die "déchiffrement impossible (phrase secrète incorrecte ?)"

# 3. Intégrité de l'archive déchiffrée (somme enregistrée sur le serveur)
if [[ -r "$PLAIN_SUM" ]]; then
    expected="$(awk '{print $1}' "$PLAIN_SUM")"
    [[ "$expected" == "$(sha256_file "$OUT")" ]] || die "somme SHA-256 de l'archive déchiffrée invalide"
    printf '%s  %s\n' "$expected" "$(basename "$OUT")" > "$OUT.sha256"
    log "Archive déchiffrée vérifiée."
fi

if [[ -n "$DECRYPT_ONLY" ]]; then
    log "Archive déchiffrée : $OUT"
    exit 0
fi

# 4. Restauration
"$ROOT/scripts/restore-db.sh" --file "$OUT" "$@"
