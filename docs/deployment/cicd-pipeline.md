# Pipeline CI/CD GitHub Actions — LANDOLSI TIRES

Deux workflows automatisent tout le cycle de vie du site, du commit jusqu'à la
machine virtuelle AWS, puis le chemin inverse :

| Workflow | Fichier | Déclenchement |
|---|---|---|
| **CI/CD — LANDOLSI TIRES** | `.github/workflows/cicd.yml` | push / pull request (phases 1-3) ; bouton **Run workflow** (phases 1-4) |
| **Destroy — infrastructure AWS** | `.github/workflows/destroy.yml` | bouton **Run workflow** + saisie `DESTROY` |

Fichiers associés :

| Fichier | Rôle |
|---|---|
| `.github/actions/terraform-init/action.yml` | identifiants AWS, bucket d'état, `terraform init` sur S3 (partagé par les deux workflows) |
| `.github/scripts/sg-ssh.sh` | ouverture/fermeture « juste-à-temps » du port 22 pour l'IP du runner |
| `.github/scripts/ssh-setup.sh` | clé SSH, vérification de l'empreinte d'hôte via la console AWS, alias `ssh ec2` |
| `.zap/rules.tsv` | réglage des règles OWASP ZAP (faux positifs justifiés) |
| `infra/aws/.checkov.yaml` | exceptions Checkov justifiées (contexte AWS Academy) |

## 1. Vue d'ensemble

```
push / PR / bouton
        │
        ├── 1.1 Qualité ─────────┐
        ├── 1.2 Tests (PG 16) ───┼──► 3.1 DAST préprod (ZAP actif) ──┐
        ├── 1.3 Build ───────────┘                                   │
        ├── 2.1 CodeQL (JS, Actions)                                 │
        ├── 2.2 Semgrep                                              ├──► 3.2 Porte qualité & sécurité
        ├── 2.3 Gitleaks                                             │            │ (bouton ou AUTO_DEPLOY)
        ├── 2.4 SCA (npm audit, Trivy, SBOM)                         │            ▼
        └── 2.5 IaC (Checkov, Trivy) ────────────────────────────────┘   4.1 AWS prérequis
                                                                                  ▼
                                                                         4.2 Terraform plan/apply (VM)
                                                                                  ▼
                                                                         4.3 Déploiement (cloud-init, HTTPS)
                                                                                  ▼
                                                                         4.4 Tests de fumée
                                                                                  ▼
                                                                         4.5 DAST production
                                                                                  ▼
                                                                         4.6 Rapport (URL du site)
```

Chaque job écrit un **résumé** (onglet *Summary* du run) : tableaux de résultats,
plan Terraform, sorties, URL. Les constats SAST/IaC/SCA sont aussi publiés au
format SARIF dans **Security > Code scanning**.

## 2. Phase 1 — Intégration continue

| Job | Ce qui est vérifié | Bloquant |
|---|---|---|
| **1.1 Qualité** | ESLint (React) ; `node --check` sur tout le backend ; casse des imports (Windows → Linux) ; ShellCheck des scripts d'exploitation ; **actionlint** des workflows ; `terraform fmt` + `validate` | oui |
| **1.2 Tests** | PostgreSQL 16 éphémère (service Docker) ; migrations Sequelize **deux fois** (idempotence) ; 93 tests `node:test` (configuration, API HTTP, MFA, IA, facture, photo) avec **couverture de code** et rapport JUnit ; test sauvegarde → restauration → comparaison schéma/comptages/séquences | oui |
| **1.3 Build** | `npm ci` + build Vite avec `VITE_API_URL=/api` ; aucune URL `localhost:5001` dans le bundle ; artefact `frontend-dist` réutilisé par le DAST | oui |

ESLint : la règle `react-hooks/set-state-in-effect` (12 composants, dette
recensée dans `readiness-report.md`) est signalée en avertissement ; toute autre
erreur bloque. Le premier passage a révélé un vrai bug (`setAvis` non défini
dans `CommandeDetails.jsx`), corrigé.

## 3. Phase 2 — Sécurité statique (SAST, SCA, IaC, secrets)

| Job | Outil | Cible | Politique |
|---|---|---|---|
| **2.1** | **CodeQL** (`security-extended`) | JavaScript/React/Node et workflows GitHub Actions (injections, XSS, SSRF, chemins, ReDoS, injection de commandes dans les workflows...) | alertes dans Code scanning |
| **2.2** | **Semgrep** | règles OWASP Top 10, JavaScript, Node.js, nodejsscan, React, secrets, Terraform, GitHub Actions | **bloque** sur sévérité ERROR (règle MongoDB `node_nosqli_injection` exclue : faux positif avec Sequelize) |
| **2.3** | **Gitleaks** | **tout l'historique Git** (clés AWS, jetons, mots de passe) | **bloque** au moindre secret |
| **2.4** | **npm audit** | dépendances backend et frontend | **bloque** sur vulnérabilité haute/critique en production |
| 2.4 | **Trivy fs** | vulnérabilités + secrets du dépôt | rapport SARIF |
| 2.4 | **SBOM CycloneDX** | inventaire des composants | artefact `sbom-cyclonedx` |
| **2.5** | **Checkov** | Terraform + workflows | **bloquant** (7 exceptions justifiées une à une dans `infra/aws/.checkov.yaml`) |
| 2.5 | **Trivy config** | Terraform | rapport SARIF |

Le premier passage de la SCA a trouvé **4 vulnérabilités critiques** et 9 hautes
dans le backend : `jade` (moteur de vues inutilisé) supprimé, `express` 4.16 → 4.22
et `morgan` mis à jour, `npm audit fix` appliqué au frontend. Résultat : 0 vulnérabilité
haute ou critique dans les dépendances de production.

### Corrections apportées grâce aux analyses (1er novembre 2026)

| Outil | Constat | Correction |
|---|---|---|
| ESLint | `setAvis` non défini (`CommandeDetails.jsx`) : exception à chaque affichage d'avis | état restauré |
| npm audit | 4 critiques + 9 hautes (jade, proxy-addr, express 4.16...) | jade supprimé (inutilisé), express 4.22, morgan 1.12, `npm audit fix` |
| Semgrep | AES-GCM sans longueur de tag imposée (`mfaService.js`) : tag tronqué accepté | `authTagLength: 16` + contrôle explicite (secrets existants compatibles) |
| CodeQL | aucune limitation de débit sur connexion, MFA, mot de passe oublié (force brute d'un code à 6 chiffres) | `rateLimit` : 10/min (connexion, MFA, inscription), 5/min (réinitialisation) + tests |
| OWASP ZAP | X-Powered-By, CSP, Permissions-Policy, CORP absents | `app.disable("x-powered-by")`, `nginx/security-headers.conf` (CSP stricte, HSTS, COOP/CORP) |
| Checkov | sortie SARIF mal écrite | corrigée ; Checkov devient bloquant |

Faux positifs analysés et documentés : `node_nosqli_injection` (MongoDB, 13), `node_secret`
(secret de développement refusé en production, nom de paramètre), alertes CodeQL sur les
cookies (`httpOnly` et `secure` sont fixés par `cookieOptions()`).

## 4. Phase 3 — DAST avant production

**3.1 DAST préproduction** reconstruit l'architecture de production **dans le
runner** : PostgreSQL 16, API Node en `NODE_ENV=production`, Nginx avec le
fichier réel `nginx/landolsi.conf`, frontend issu du job Build. OWASP ZAP lance
ensuite un **scan complet actif** (spider, AJAX spider pour la SPA React,
injections SQL, XSS, traversée de chemins, etc.). Les attaques actives sont
faites ici, sur une base jetable, jamais sur la production.
Porte : **aucune alerte de risque élevé**. Rapports HTML/JSON/Markdown dans
l'artefact `zap-preproduction`.

**3.2 Porte qualité & sécurité** : tableau de tous les contrôles ; si un seul
échoue, la phase 4 ne démarre pas.

## 5. Phase 4 — Déploiement continu sur AWS (création de la VM → site en ligne)

### 4.1 Prérequis AWS (AWS CLI)
1. `sts get-caller-identity` : message explicite si la session AWS Academy a expiré.
2. `run-instances --dry-run` : le compte peut-il lancer une instance ?
3. **Bucket S3 de l'état Terraform** `landolsi-tires-tfstate-<compte>-<région>` :
   créé si absent, versionné, chiffré, accès public bloqué. Indispensable :
   un runner est éphémère, le workflow Destroy doit retrouver l'état.
4. **Security Group** `landolsi-tires-app` : retrouvé ou créé par l'AWS CLI
   (AWS Academy interdit à Terraform de le créer, voir `main.tf`). Les règles
   SSH temporaires d'un run interrompu sont purgées.
5. **IP élastique** : variable `EIP_ALLOCATION_ID` (`eipalloc-09a864995fee440c0`,
   IP 54.146.95.182), sinon recherche par tag, sinon réservation. Hors Terraform :
   **même URL** à chaque déploiement.
6. **Clé SSH** : la clé publique est dérivée du secret `SSH_PRIVATE_KEY` et
   injectée par cloud-init (`ImportKeyPair` est interdit dans le lab).
7. Écriture de `ci.auto.tfvars.json` dans le bucket (réutilisé par Destroy).

### 4.2 Terraform
`init` (backend S3, verrou `use_lockfile`) → `validate` → import des règles
déjà présentes dans le Security Group → `plan` (affiché dans le résumé) →
**garde-fou** : échec si le plan détruit ou remplace l'instance (sa base
PostgreSQL serait perdue) → `apply` → sorties (instance, IP, domaine sslip.io,
volume racine) → attente de l'état `running`.

Ressources créées : instance EC2 Ubuntu 24.04 (IMDSv2 obligatoire, volume gp3
chiffré), règles HTTP/HTTPS/SSH du Security Group, association de l'IP élastique.

### 4.3 Déploiement applicatif
1. **SSH juste-à-temps** : le port 22 n'est ouvert qu'à l'IP `/32` du runner,
   le temps du job, puis refermé (`if: always()`). Par défaut, SSH est fermé
   à Internet (`ADMIN_SSH_CIDR` absent = `127.0.0.1/32`).
2. **Empreinte d'hôte vérifiée** : la clé ED25519 du serveur est comparée à
   celle que cloud-init publie dans la console série AWS (protection MITM).
3. Attente de **cloud-init** (mises à jour, `install.sh`, premier `deploy.sh`) ;
   affichage de la fin de son journal.
4. Positionnement du code serveur sur **le commit du pipeline**, `install.sh`
   (idempotent) avec `--domain landolsi-tires-<ip>.sslip.io` : certificat
   **Let's Encrypt**. En cas d'échec (limite de 5 certificats par semaine pour
   un même nom), retour automatique en HTTP et avertissement.
5. `deploy.sh` si la version active n'est pas celle du commit : build, sauvegarde,
   migrations, bascule atomique, **rollback automatique** si le contrôle de
   santé échoue.
6. Secrets facultatifs, transmis sur l'entrée standard (jamais en ligne de
   commande, jamais dans Terraform) : `MISTRAL_API_KEY`, `EMAIL_USER`/`EMAIL_PASS`,
   `ADMIN_EMAIL`/`ADMIN_PASSWORD` (seulement si aucun administrateur),
   `DB_BACKUP_URL`/`DB_BACKUP_PASSPHRASE` (restauration seulement sur base vide).
7. `health-check.sh` (API, Nginx, frontend, certificat) et état des services.

### 4.4 Tests de fumée (depuis Internet)
Page d'accueil, `/api/health` (base up), catalogue, route admin → 401, 404 sans
pile d'erreur, en-têtes de sécurité, version Nginx masquée, **ports 5001 et 5432
fermés**, SSH fermé après le job, certificat valide, redirection HTTP → HTTPS, HSTS
(avertissement).

### 4.5 DAST production (non intrusif)
- **OWASP ZAP baseline** : analyse passive (aucune attaque) ;
- **Nuclei** : CVE, expositions, mauvaises configurations, modèles intrusifs exclus ;
- **testssl.sh** : protocoles, suites de chiffrement, vulnérabilités TLS (Heartbleed, ROBOT...).
Porte : aucune alerte élevée ZAP, aucun constat Nuclei high/critical, aucun constat TLS critique.

### 4.6 Rapport
URL du site, instance, IP, résultat de chaque étape.

## 6. Pipeline Destroy (chemin inverse)

**Actions > Destroy — infrastructure AWS > Run workflow**, saisir `DESTROY`.

| Job | Action |
|---|---|
| D1 Vérifications | confirmation, identifiants, état S3, liste des ressources |
| D2 Sauvegarde | `backup-db.sh` sur le serveur, **instantané EBS** du volume racine ; archive **chiffrée GPG** téléchargeable si `DB_BACKUP_PASSPHRASE` existe (le dépôt est public : jamais de données en clair) |
| D3 Destruction | `terraform plan -destroy` affiché, puis destroy ; vérification `instance-terminated` et état vide. Ne s'exécute **pas** si la sauvegarde a échoué |
| D4 Nettoyage | règles SSH temporaires ; volume racine supprimé **sur option** (refusé sans instantané ni archive) ; IP élastique libérée **sur option** |
| D5 Rapport | ce qui est supprimé / conservé |

Options : `backup` (défaut oui), `delete_root_volume` (défaut non),
`release_eip` (défaut non : même URL au prochain déploiement).

## 7. Configuration

**Secrets** (Settings > Secrets and variables > Actions > Secrets)

| Secret | Obligatoire | Usage |
|---|---|---|
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` | oui | AWS Academy > AWS Details > AWS CLI. **Expirent avec la session du lab (~4 h)** : les recopier à chaque session |
| `SSH_PRIVATE_KEY` | oui | clé privée sans phrase secrète (ex. `~/.ssh/landolsi_ec2_ed25519`) |
| `MISTRAL_API_KEY` | non | assistants IA |
| `EMAIL_USER`, `EMAIL_PASS` | non | factures par e-mail |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | non | compte administrateur sur une base neuve |
| `DB_BACKUP_URL`, `DB_BACKUP_TOKEN`, `DB_BACKUP_PASSPHRASE` | non | restauration automatique / sauvegarde chiffrée |

**Variables** (onglet Variables)

| Variable | Défaut | Usage |
|---|---|---|
| `EIP_ALLOCATION_ID` | `eipalloc-09a864995fee440c0` | IP élastique conservée |
| `AWS_REGION` | `us-east-1` | région |
| `INSTANCE_TYPE` | `t3.small` | type d'instance (push) |
| `ADMIN_SSH_CIDR` | fermé | votre IP `/32` pour SSH manuel |
| `SECURITY_GROUP_ID` | recherche par nom | groupe imposé |
| `MISTRAL_MODEL` | `ministral-14b-latest` | modèle Mistral |
| `LETSENCRYPT_EMAIL` | aucun | e-mail du compte Let's Encrypt |
| `AUTO_DEPLOY` | `false` | `true` = déploiement à chaque push sur master |
| `ENABLE_HTTPS` | `true` | HTTPS lors des déploiements automatiques |

## 8. Utilisation

```bash
# Déployer (équivalent du bouton Run workflow)
gh workflow run cicd.yml --repo ngrassa/projet_Landolsi -f deploy=true
gh run watch --repo ngrassa/projet_Landolsi

# Détruire
gh workflow run destroy.yml --repo ngrassa/projet_Landolsi -f confirm=DESTROY
```

**Nouvelle session AWS Academy** : mettre à jour les 3 secrets AWS, puis relancer.

```bash
gh secret set AWS_ACCESS_KEY_ID     --repo ngrassa/projet_Landolsi
gh secret set AWS_SECRET_ACCESS_KEY --repo ngrassa/projet_Landolsi
gh secret set AWS_SESSION_TOKEN     --repo ngrassa/projet_Landolsi
```

## 9. Coexistence avec le déploiement manuel

Le pipeline utilise un **état Terraform distant (S3)** ; le poste local garde
son état local (`infra/aws/terraform.tfstate`). Ne pas gérer la même instance
des deux façons : utiliser le pipeline (ou, localement, `terraform init
-backend-config=...` avec le même bucket, voir l'action `terraform-init`).
