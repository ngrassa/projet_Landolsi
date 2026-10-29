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
