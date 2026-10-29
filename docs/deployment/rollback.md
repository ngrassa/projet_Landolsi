# Retour arrière

## 1. Retour du code (automatique ou manuel)

`deploy.sh` revient **automatiquement** à la version précédente si le contrôle
de santé échoue après redémarrage.

Manuellement :
```bash
sudo /opt/landolsi/current/scripts/rollback.sh --list     # versions disponibles (* = active)
sudo /opt/landolsi/current/scripts/rollback.sh            # version précédente
sudo /opt/landolsi/current/scripts/rollback.sh --to 20261029115247-15f37ff
```

La bascule du lien `current` est atomique ; seul le redémarrage du processus
Node coupe l'API quelques secondes. Les 5 dernières versions sont conservées
(`deploy.sh --keep N`).

Les images (`/var/lib/landolsi/uploads`) et la configuration
(`/etc/landolsi/backend.env`) ne font pas partie des versions et ne changent
pas lors d'un retour arrière.

## 2. Base de données

`rollback.sh` **n'annule pas les migrations**. Deux cas :

- **Migration compatible** avec l'ancienne version (ajout de colonne ou de
  table) : le retour du code suffit.
- **Migration incompatible** (renommage, suppression, contrainte) :
  1. `sudo systemctl stop landolsi-backend`
  2. Si la migration a une méthode `down` fiable, depuis la version qui l'a
     introduite :
     ```bash
     cd /opt/landolsi/releases/<version_avec_migration>/backend
     sudo -u landolsi env NODE_ENV=production ENV_FILE=/etc/landolsi/backend.env \
         ./node_modules/.bin/sequelize-cli db:migrate:undo
     ```
  3. Sinon, restaurer la sauvegarde pré-déploiement **dans une nouvelle base**
     (le nom du fichier est affiché par `deploy.sh`) et y basculer :
     ```bash
     sudo -u postgres createdb --owner=landolsi landolsi_rollback
     sudo -u landolsi /opt/landolsi/current/scripts/restore-db.sh \
         --file /var/backups/landolsi/<fichier>.dump --target-db landolsi_rollback
     sudo sed -i 's/^DB_NAME=.*/DB_NAME=landolsi_rollback/' /etc/landolsi/backend.env
     ```
     Les écritures effectuées entre la sauvegarde et le retour arrière sont
     perdues dans cette base ; elles restent dans l'ancienne base, qui n'est
     pas supprimée.
  4. `sudo /opt/landolsi/current/scripts/rollback.sh`

La migration de référence (`20261029000000-baseline-schema`) ne s'annule pas
(`down` lève volontairement une erreur) : elle ne fait que créer les tables
manquantes.

## 3. Retour de l'infrastructure

- Terraform : revenir au commit précédent de `infra/aws/`, `terraform plan`,
  vérifier **qu'aucune ressource n'est détruite**, puis `apply`.
- Perte complète de l'instance : nouvelle instance (Terraform ou console),
  `install.sh`, restauration de la dernière sauvegarde **copiée hors instance**
  et des images, puis `deploy.sh`.
