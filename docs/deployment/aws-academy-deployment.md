# Déploiement sur AWS EC2 Ubuntu (AWS Academy)

Cible : **une instance EC2 Ubuntu 24.04**, Nginx + API Node.js (systemd) +
PostgreSQL local. Durée : ~20 minutes.

## 1. Contraintes AWS Academy à connaître

Vérifiées dans la documentation générale du Learner Lab, **non vérifiées sur
votre compte** (les identifiants AWS n'étaient pas disponibles pendant la
préparation) :

| Contrainte | Conséquence |
|---|---|
| Session limitée (environ 4 h), instances arrêtées à la fin | Les services sont `enabled` et redémarrent au démarrage suivant ; le timer de sauvegarde rattrape l'exécution manquée |
| IP publique changée à chaque arrêt/démarrage | Utiliser `allocate_eip = true` (si autorisé) ou relire l'IP ; pas de nom de domaine stable → HTTP seulement |
| Création de rôles IAM interdite | Ne rien créer côté IAM ; utiliser `LabInstanceProfile` si un profil est nécessaire |
| Paire de clés fournie : `vockey` | Télécharger `labsuser.pem` depuis *AWS Details* |
| Régions et types d'instance restreints | Généralement `us-east-1` / `us-west-2`, familles t2/t3 jusqu'à `large` |
| Budget de crédits limité | Arrêter l'instance hors démonstration ; ne pas créer RDS/NAT inutiles |
| Identifiants temporaires | Recopier `~/.aws/credentials` depuis *AWS Details → AWS CLI* à chaque session ; ne jamais les committer ni les coller dans un chat |

Vérifier ce qui est permis sur votre lab :
```bash
aws sts get-caller-identity
aws ec2 describe-instance-type-offerings --location-type region \
    --filters Name=instance-type,Values=t3.micro,t3.small --query 'InstanceTypeOfferings[].InstanceType'
aws ec2 describe-key-pairs --query 'KeyPairs[].KeyName'
aws iam list-instance-profiles --query 'InstanceProfiles[].InstanceProfileName' 2>/dev/null
```

**Dimensionnement :** `t3.small` (2 vCPU, 2 Go) recommandé ; `t3.micro`
(1 Go) fonctionne grâce au swap de 2 Go créé par `install.sh`, avec un build
frontend plus lent. Disque : 20 Go gp3 chiffré.

## 2. Option A — Provisionnement avec Terraform (recommandé)

Sur votre poste, avec les identifiants du lab configurés :

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars
# Éditer : ssh_allowed_cidr = "<votre IP>/32"  (curl -s https://checkip.amazonaws.com)
terraform init
terraform fmt -check && terraform validate
terraform plan -out tfplan        # RELIRE : 1 instance, 1 security group, 4 règles (+1 EIP)
terraform apply tfplan
terraform output
```

**Restrictions constatées le 2026-10-29 sur un compte AWS Academy (rôle `voclabs`, « Student View ») :**

| Action | Résultat | Contournement dans ce dépôt |
|---|---|---|
| `ec2:RevokeSecurityGroupEgress` | Refusée ; le provider AWS l'appelle toujours en créant un `aws_security_group` | Créer le groupe avec l'AWS CLI (ci-dessous), puis `security_group_id = "sg-..."` |
| `ec2:ImportKeyPair` | Refusée | `ssh_public_key` est injectée par cloud-init ; la paire `vockey` reste attachée |
| `ec2:RunInstances` | **Refusée** (toutes AMI, tous types, us-east-1 et us-west-2, même en `--dry-run`) | Aucun : à faire débloquer par l'enseignant ; utiliser un compte *Learner Lab* standard, démarré (« Start Lab ») et disposant de crédit |
| `AuthorizeSecurityGroupIngress`, `CreateSecurityGroup` | Autorisées | — |

Tester les permissions avant `apply`, sans rien créer :
```bash
aws ec2 run-instances --dry-run --region us-east-1 --instance-type t3.small --count 1 \
  --image-id "$(aws ssm get-parameter --region us-east-1 --name /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id --query Parameter.Value --output text)"
# "DryRunOperation" = autorisé ; "UnauthorizedOperation" = refusé
```

Créer le Security Group compatible avec le lab :
```bash
VPC=$(aws ec2 describe-vpcs --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)
aws ec2 create-security-group --group-name landolsi-tires-app --vpc-id "$VPC" \
  --description "LANDOLSI TIRES" --query GroupId --output text     # -> security_group_id
```

Le plan ne doit contenir **aucune destruction** (`0 to destroy`). L'instance
ignore les changements d'AMI et de `user_data` pour ne jamais être recréée (ce
qui effacerait la base locale). Le volume racine n'est pas supprimé à la
terminaison (`root_volume_delete_on_termination = false`) : pensez à le
supprimer manuellement si vous abandonnez le projet.

Avec `git_repo_url` (dépôt **public** uniquement), cloud-init exécute
automatiquement les étapes 4 et 5 ci-dessous ; suivez-les dans
`/var/log/cloud-init-output.log`, puis passez à l'étape 6.

## 3. Option B — Console AWS (sans Terraform)

1. EC2 → *Launch instance* : AMI **Ubuntu Server 24.04 LTS (x86_64)**, type
   `t3.small`, paire de clés `vockey`.
2. *Network settings* → créer un Security Group :
   - SSH 22 : **My IP** uniquement ;
   - HTTP 80 : 0.0.0.0/0 ; HTTPS 443 : 0.0.0.0/0 (si domaine).
   - **Ne pas** ouvrir 5432 ni 5001.
3. *Storage* : 20 Gio gp3, chiffré.
4. *Advanced details* → *Metadata version* : **V2 only**.
5. Lancer, puis noter l'IP publique.

## 4. Installation du serveur

```bash
chmod 600 ~/.ssh/labsuser.pem
ssh -i ~/.ssh/labsuser.pem ubuntu@<IP>

sudo git clone <URL_DU_DEPOT> /opt/landolsi-src
#   dépôt privé : utiliser une deploy key SSH en lecture seule, ou depuis le poste :
#   rsync -az --exclude node_modules --exclude .git --exclude 'backend/.env' \
#         -e "ssh -i ~/.ssh/labsuser.pem" ./ ubuntu@<IP>:/tmp/landolsi-src/ \
#   puis : sudo mv /tmp/landolsi-src /opt/landolsi-src

sudo /opt/landolsi-src/scripts/install.sh
```

`install.sh` (idempotent) installe Nginx, Node.js 22, PostgreSQL 16, crée
l'utilisateur `landolsi`, la base `landolsi_tires` et son rôle (mot de passe
aléatoire), génère `JWT_SECRET`, installe les unités systemd et le site Nginx,
active ufw (22/80/443) et un swap si la RAM est < 2 Go.

Options : `--external-db` (Supabase/RDS), `--domain app.exemple.com --email vous@exemple.com`
(HTTPS Let's Encrypt), `--pg-client-version 17`.

## 5. Configuration et premier déploiement

```bash
sudo nano /etc/landolsi/backend.env
#   Facultatif : EMAIL_USER/EMAIL_PASS, GEMINI_API_KEY, TELEGRAM_BOT_TOKEN,
#   TELEGRAM_CHAT_ID, VEHICULE_API_USERNAME, ADMIN_EMAIL/ADMIN_PASSWORD
#   Utilisez de NOUVEAUX secrets : ceux de l'ancien backend/.env ont été versionnés.

# (Facultatif) restaurer la base existante : database-backup-restore.md §3

sudo /opt/landolsi-src/scripts/deploy.sh --source /opt/landolsi-src
```

Le déploiement s'arrête si la sauvegarde, le build, les migrations ou le
contrôle de santé échouent.

## 6. Compte administrateur

Uniquement sur une base neuve (sur une base restaurée, l'administrateur existe
déjà) :
```bash
cd /opt/landolsi/current/backend
sudo -u landolsi env NODE_ENV=production ENV_FILE=/etc/landolsi/backend.env node createAdmin.js
```
Si le compte existe déjà, ce script **réinitialise son mot de passe** avec
`ADMIN_PASSWORD`. Retirez ensuite `ADMIN_PASSWORD` du fichier.

## 7. Vérification

```bash
# Sur le serveur : API directe + API via Nginx + frontend
/opt/landolsi/current/scripts/health-check.sh
# Depuis votre poste : chemin public complet (Security Group, Nginx, API, base)
curl -fsS http://<IP>/api/health && curl -fsS -o /dev/null -w '%{http_code}\n' http://<IP>/
systemctl status landolsi-backend nginx postgresql landolsi-backup.timer
```

Puis dans le navigateur, `http://<IP>/` : catalogue et images, inscription,
connexion, panier → commande, connexion admin → confirmation → facture PDF,
ajout d'un pneu avec image, chatbot, Telegram.

## 8. Exploitation courante

| Action | Commande |
|---|---|
| Journaux API | `journalctl -u landolsi-backend -f` |
| Journaux Nginx | `/var/log/nginx/access.log`, `error.log` |
| Redémarrer l'API | `sudo systemctl restart landolsi-backend` |
| Mettre à jour | `cd /opt/landolsi-src && sudo git pull && sudo scripts/deploy.sh --source /opt/landolsi-src` |
| Retour arrière | `sudo /opt/landolsi/current/scripts/rollback.sh` (voir rollback.md) |
| Sauvegarde manuelle | `sudo -u landolsi /opt/landolsi/current/scripts/backup-db.sh` |
| Espace disque | `df -h /; du -sh /var/backups/landolsi /var/lib/landolsi/uploads` |
| Mises à jour de sécurité | `sudo apt update && sudo apt upgrade` (unattended-upgrades est actif par défaut sur Ubuntu) |

Journalisation : stdout/stderr dans journald (rotation automatique),
journal d'accès au format `combined` en production.

## 9. HTTPS

Sans nom de domaine (cas habituel du lab), le site est en HTTP et
`COOKIE_SECURE=false` : le cookie de session circule en clair. Acceptable pour
une démonstration, **pas pour de vraies données clients**.

Avec un domaine pointant vers l'IP (idéalement élastique) :
```bash
sudo /opt/landolsi-src/scripts/install.sh --domain app.exemple.com --email vous@exemple.com
sudo sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=true/' /etc/landolsi/backend.env
sudo systemctl restart landolsi-backend
```

## 10. Arrêt et coûts

- Arrêter l'instance entre deux sessions (le lab le fait automatiquement).
- Une IP élastique peut être facturée ; libérez-la si inutilisée.
- Fin de projet : `terraform destroy` (supprime instance, SG, EIP — **pas** le
  volume conservé ; le supprimer dans EC2 → Volumes après avoir copié les
  sauvegardes).
