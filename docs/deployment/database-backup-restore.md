# Sauvegarde, migration et restauration PostgreSQL

Toutes les commandes lisent les identifiants `DB_*` dans un fichier
d'environnement ; aucun mot de passe n'est passé en argument ni affiché.

## 1. Sauvegarde

```bash
# Sur le serveur (fichier /etc/landolsi/backend.env)
sudo -u landolsi /opt/landolsi/current/scripts/backup-db.sh

# Tester la connexion sans rien écrire
sudo -u landolsi /opt/landolsi/current/scripts/backup-db.sh --dry-run

# Depuis le poste de développement (backend/.env), vers ./backups
scripts/backup-db.sh --env-file backend/.env --output-dir backups
```

Produit, avec des permissions 0600 :

| Fichier | Contenu |
|---|---|
| `<base>_<horodatage>.dump` | `pg_dump --format=custom` (schéma, données, séquences, index, contraintes, types ENUM) |
| `<base>_<horodatage>.dump.sha256` | Somme de contrôle |
| `<base>_<horodatage>.json` | Métadonnées : version serveur, version pg_dump, taille, nombre de tables |

`pg_dump` s'exécute dans une transaction : la sauvegarde est cohérente même
pendant que l'application écrit. Ne copiez jamais les fichiers de
`/var/lib/postgresql` d'un serveur en marche.

**Automatique :** `landolsi-backup.timer` lance une sauvegarde chaque nuit
(02:30 ± 15 min, rattrapée au démarrage si l'instance était arrêtée) et garde
les 14 plus récentes. `deploy.sh` en fait une avant chaque migration.

```bash
systemctl list-timers landolsi-backup.timer
journalctl -u landolsi-backup.service -n 20
```

Les rôles et privilèges ne sont pas inclus (sauvegarde d'une base, pas du
cluster) : à la restauration, les objets appartiennent à l'utilisateur qui
restaure (`--no-owner --no-privileges`), ce qui correspond au modèle « un rôle
applicatif propriétaire de sa base ».

## 2. Restauration

```bash
# Vérifier l'archive et lister son contenu, sans rien modifier
scripts/restore-db.sh --file X.dump --target-db landolsi_restore --dry-run

# Restaurer dans une NOUVELLE base (recommandé), puis vérifier
scripts/restore-db.sh --file X.dump --target-db landolsi_restore --create
```

Garanties du script :
- vérifie la somme SHA-256 et la lisibilité de l'archive avant toute action ;
- restaure en **une seule transaction** (`--single-transaction --exit-on-error`) :
  tout ou rien ;
- **refuse** (code 3) une base cible qui contient déjà des tables ;
- ne supprime jamais de base.

`--allow-nonempty` (destructif, remplace les objets existants via `--clean`)
n'est à utiliser qu'après une sauvegarde de la base cible.

### Basculer l'application sur une base restaurée

```bash
sudo systemctl stop landolsi-backend
sudo nano /etc/landolsi/backend.env        # DB_NAME=landolsi_restore
sudo systemctl start landolsi-backend
/opt/landolsi/current/scripts/health-check.sh
```

L'ancienne base reste intacte et permet un retour immédiat.

> Le rôle applicatif créé par `install.sh` n'a pas le droit `CREATEDB`. Pour
> `--create` sur le serveur, créez d'abord la base :
> `sudo -u postgres createdb --owner=landolsi landolsi_restore`.

## 3. Migration de la base de développement existante vers l'EC2

La base source (`pneus_db`) se trouve sur le poste de développement.

**1. Geler les écritures** : arrêter le backend de développement pendant
l'export (sinon les écritures postérieures seront perdues).

**2. Exporter sur le poste source :**

Linux / WSL / Git Bash (depuis la racine du dépôt) :
```bash
scripts/backup-db.sh --env-file backend/.env --output-dir backups
```

Windows PowerShell (client PostgreSQL installé) :
```powershell
pg_dump -h localhost -p 5432 -U <utilisateur> --format=custom -f pneus_db.dump pneus_db
(Get-FileHash pneus_db.dump -Algorithm SHA256).Hash.ToLower() + "  pneus_db.dump" | Out-File -Encoding ascii pneus_db.dump.sha256
psql -h localhost -U <utilisateur> -d pneus_db -Atc "SHOW server_version"
```

Notez la version du serveur : si elle est **supérieure à 16**, installez la
même version majeure sur l'EC2 avant de restaurer
(`sudo scripts/install.sh --pg-client-version 17` installe le client ; pour le
serveur, utilisez le paquet `postgresql-17` du même dépôt).

**3. Transférer l'archive et les images :**
```bash
scp -i ~/.ssh/labsuser.pem backups/pneus_db_*.dump* ubuntu@<IP>:/tmp/
scp -i ~/.ssh/labsuser.pem -r backend/public/uploadPneu ubuntu@<IP>:/tmp/uploadPneu
```

**4. Restaurer sur l'EC2**, après `install.sh` (base `landolsi_tires` vide) et
**avant** le premier `deploy.sh` :
```bash
sudo mv /tmp/pneus_db_*.dump* /var/backups/landolsi/ && sudo chown landolsi: /var/backups/landolsi/pneus_db_*
sudo -u landolsi /opt/landolsi-src/scripts/restore-db.sh \
    --env-file /etc/landolsi/backend.env \
    --file "$(ls -1t /var/backups/landolsi/pneus_db_*.dump | head -1)" \
    --target-db landolsi_tires
sudo cp -n /tmp/uploadPneu/* /var/lib/landolsi/uploads/ && sudo chown -R landolsi: /var/lib/landolsi/uploads
```

**5. Déployer :** `sudo /opt/landolsi-src/scripts/deploy.sh --source /opt/landolsi-src`.
La migration de référence est enregistrée sans modifier les tables restaurées.

**6. Vérifier :**
```bash
sudo -u postgres psql landolsi_tires -c \
  'SELECT (SELECT count(*) FROM users) users, (SELECT count(*) FROM "Pneus") pneus, (SELECT count(*) FROM commandes) commandes, (SELECT count(*) FROM factures) factures'
```
Comparez avec les mêmes comptages sur la source, puis testez connexion
administrateur, catalogue (images), création de commande, facture PDF.

**Retour arrière de la migration :** la base source n'est jamais modifiée ;
il suffit de continuer à l'utiliser.

## 4. Copie hors instance (indispensable)

Une sauvegarde sur le même volume EBS ne protège pas contre sa perte ou la
fermeture du compte AWS Academy. Depuis votre poste :

```bash
rsync -av -e "ssh -i ~/.ssh/labsuser.pem" --rsync-path="sudo rsync" \
    ubuntu@<IP>:/var/backups/landolsi/ ./backups-ec2/
rsync -av -e "ssh -i ~/.ssh/labsuser.pem" ubuntu@<IP>:/var/lib/landolsi/uploads/ ./uploads-ec2/
```

Les archives contiennent des données personnelles (clients, e-mails, hachés de
mots de passe) : stockez-les chiffrées et hors de Git (`backups/` est ignoré).

## 5. Vérification réalisée

`tests/deployment/backup-restore.test.sh` (exécuté sur PostgreSQL 15.17,
base de test avec 12 tables, 50 pneus) : sauvegarde 0600 + SHA-256,
dry-run sans effet, restauration dans une base neuve, **comptages exacts
identiques**, séquences identiques, schéma identique, refus d'une base non vide
(code 3), rejet d'une archive altérée, source intacte — tous réussis.

Non vérifié : sauvegarde de la base réelle `pneus_db` (inaccessible depuis
l'environnement de travail) et restauration sur l'EC2.

## 6. Sauvegarde chiffrée hors dépôt et restauration par CI/CD

Sauvegarde de référence du 30 octobre 2026 (base de production après import
des données de développement : 12 utilisateurs, 9 pneus, 38 commandes,
10 factures, 13 avis) : archive `pg_dump --format=custom` (PostgreSQL 16)
chiffrée GPG AES-256, `landolsi_tires.dump.gpg`.

Le dépôt étant **public**, l'archive n'y est **pas** versionnée, même
chiffrée (une fois publiée, elle ne peut plus être retirée). Seules les sommes
de référence le sont, dans `db/backup/` :

| Fichier | Contenu |
|---|---|
| `landolsi_tires.dump.gpg.sha256` | somme de l'archive chiffrée : désigne la version attendue par le pipeline |
| `landolsi_tires.dump.sha256.txt` | somme de l'archive déchiffrée (identique à celle calculée sur le serveur) |

| Élément | Emplacement |
|---|---|
| Archive chiffrée | poste d'administration : `~/.local/share/landolsi/backups/landolsi_tires.dump.gpg` ; à copier dans un stockage privé (dépôt GitHub privé, bucket S3 privé) |
| Phrase secrète | `~/.config/landolsi/db-backup.passphrase` + secret GitHub `DB_BACKUP_PASSPHRASE` ; à garder aussi dans un gestionnaire de mots de passe (sans elle, l'archive est irrécupérable) |
| Sauvegardes du serveur | `/var/backups/landolsi/` (quotidiennes, en clair, mode 0600) |

**Restauration manuelle :**
```bash
# dans une nouvelle base (archive par défaut : ~/.local/share/landolsi/backups/)
DB_BACKUP_PASSPHRASE='…' scripts/restore-encrypted-backup.sh -- \
    --target-db landolsi_verif --create --env-file backend/.env
# déchiffrer seulement (puis restore-db.sh --file …)
scripts/restore-encrypted-backup.sh --archive /chemin/landolsi_tires.dump.gpg \
    --passphrase-file ~/.config/landolsi/db-backup.passphrase --decrypt-only /tmp/landolsi_tires.dump
```
Le script refuse une archive dont la somme ne correspond pas à
`db/backup/landolsi_tires.dump.gpg.sha256`.

**Stockage privé conseillé (dépôt GitHub privé) :**
```bash
gh repo create ngrassa/landolsi-backups --private --clone && cd landolsi-backups
cp ~/.local/share/landolsi/backups/landolsi_tires.dump.gpg . && git add . && git commit -m "Sauvegarde 2026-10-30" && git push -u origin HEAD
```
Secrets GitHub du dépôt applicatif : `DB_BACKUP_URL` =
`https://raw.githubusercontent.com/ngrassa/landolsi-backups/main/landolsi_tires.dump.gpg`
(adapter la branche) et `DB_BACKUP_TOKEN` = jeton *fine-grained* en lecture
seule (*Contents: Read*) limité à `landolsi-backups`. Avec S3 : URL présignée
dans `DB_BACKUP_URL`, sans jeton (durée de validité limitée).

**Pipeline GitHub Actions** (`.github/workflows/db-restore.yml`) :

- `verify` : à chaque modification de `db/backup/` ou des scripts, et sur
  demande. Télécharge l'archive, vérifie sa somme, la restaure dans un
  PostgreSQL 16 éphémère et contrôle les comptages. Aucun effet sur le serveur.
- `restore-ec2` : manuel uniquement (*Actions → Restauration base de données →
  Run workflow*, `target = ec2`, `confirm = RESTAURER`), dans l'environnement
  GitHub `production` (ajoutez-y des relecteurs obligatoires pour exiger une
  approbation). Sauvegarde la base du serveur, arrête l'API, restaure avec
  `--allow-nonempty`, redémarre et contrôle `/health`. Secrets : `EC2_HOST`,
  `EC2_SSH_KEY`, `EC2_KNOWN_HOSTS` (`ssh-keyscan -t ed25519 <IP>`). Le Security
  Group limite SSH à l'IP de l'administrateur : ouvrez temporairement le port 22
  aux runners GitHub ou utilisez un runner auto-hébergé.

**Mettre à jour la sauvegarde de référence :**
```bash
B=~/.local/share/landolsi/backups
F=$(ssh ubuntu@<IP> 'sudo -u landolsi /opt/landolsi/current/scripts/backup-db.sh >/dev/null && sudo sh -c "ls -1t /var/backups/landolsi/landolsi_tires_*.dump | head -1"')
ssh ubuntu@<IP> "sudo cat $F" > /tmp/landolsi_tires.dump
gpg --batch --yes --pinentry-mode loopback --passphrase-file ~/.config/landolsi/db-backup.passphrase \
    --symmetric --cipher-algo AES256 -o $B/landolsi_tires.dump.gpg /tmp/landolsi_tires.dump
(cd $B && sha256sum landolsi_tires.dump.gpg) > db/backup/landolsi_tires.dump.gpg.sha256
sha256sum /tmp/landolsi_tires.dump | awk '{print $1"  landolsi_tires.dump"}' > db/backup/landolsi_tires.dump.sha256.txt
shred -u /tmp/landolsi_tires.dump
# puis : copier $B/landolsi_tires.dump.gpg dans le stockage privé, commiter db/backup/
```
