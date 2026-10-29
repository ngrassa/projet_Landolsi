# Rapport de préparation au déploiement

Date : 2026-10-29. Cible : AWS EC2 Ubuntu 24.04, une instance, installation native.

## 1. Synthèse

**Statut : PRÊT AVEC LIMITES.** Le code, la base, l'automatisation et la
documentation sont prêts et testés localement. Le déploiement réel sur AWS n'a
**pas** été exécuté (identifiants AWS Academy expirés : `InvalidClientTokenId`),
et `install.sh` n'a pas pu être exécuté sur une Ubuntu neuve (pas de VM ni de
Docker disponible).

## 2. Bloquants trouvés et corrigés

| Problème | Impact sur un déploiement Linux | Correction |
|---|---|---|
| 11 imports frontend à la mauvaise casse | `npm run build` échouait | Chemins corrigés + test `check-import-case.cjs` |
| `require("../controllers/vehiculeController")` (fichier `VehiculeController.js`) | **L'API plantait au démarrage** | Chemin corrigé |
| URL `http://localhost:5001` codées en dur (26) | Frontend inutilisable hors du poste de dev | `VITE_API_URL`, `/api` en production |
| Écritures `/pneus`, `/marques`, `/compatibilites` sans authentification | N'importe qui pouvait modifier/supprimer le catalogue | `requireAdmin` |
| Webhook Telegram public | Envoi de messages par le bot à n'importe quel chat | Désactivé sans secret |
| Secret JWT codé en dur (`"net pneus secret"`) | Jetons forgeables par quiconque lit le dépôt | `JWT_SECRET` obligatoire (≥ 32 caractères) en production |
| `backend/.env` versionné | Secrets exposés | Retiré de l'index, `.gitignore` corrigé — **rotation requise** |
| `sync({ alter: true })` à chaque démarrage | Modification non contrôlée du schéma de production | Migrations ; `alter` interdit en production |
| Serveur démarré même sans base | Service « vivant » mais en erreur | Démarrage conditionné à la base ; code 1 → redémarrage systemd |
| Erreurs 500 renvoyant l'objet `err` | Fuite d'informations internes | Message générique en production |
| Images dans le répertoire de code | Perdues à chaque déploiement | `UPLOAD_DIR` persistant |
| Pas d'arrêt propre | Requêtes coupées | SIGTERM : fermeture serveur, arrêt polling, fermeture pool |

## 3. Tests exécutés

Environnement : WSL2 Ubuntu 24.04, Node 24.15.0, npm 11.17, PostgreSQL 15.17
(instance jetable dans un répertoire temporaire), Terraform 1.14.7,
ShellCheck 0.11.0.

| Commande | Résultat |
|---|---|
| `npm ci` (backend, frontend) | OK |
| `npm run build` (frontend) avant correction | **ÉCHEC** (casse des imports) |
| `VITE_API_URL=/api npm run build` après correction | OK ; 0 `localhost:5001` dans le bundle |
| `npm run lint` (frontend) | 17 erreurs **existantes** avant et après (aucune introduite) — non corrigées |
| `node tests/deployment/check-import-case.cjs frontend/src backend` | OK |
| `npm test` (backend, base de test) | **12/12 réussis** : config (6), `/health`, catalogue public, 404 sans détails, 10 routes admin → 401, webhook → 404, inscription + connexion cookie HttpOnly + profil + 403 client |
| `sequelize-cli db:migrate` ×2 sur base vide | Tables créées, 2ᵉ exécution sans effet |
| Base créée par l'ancien `sync({ alter: true })` puis `db:migrate` | Schéma **identique** (diff `pg_dump -s`), données conservées |
| `node app.js` production + `SIGTERM` | `/health` 200, arrêt propre, code 0 |
| `node app.js` base indisponible | Échec immédiat, code 1 |
| `tests/deployment/backup-restore.test.sh` | **Tous réussis** (comptages exacts, séquences, schéma, refus base non vide, archive altérée rejetée) |
| `scripts/deploy.sh --no-restart` (répertoires temporaires) | OK : version construite sans `.env`, 36 images copiées, sauvegarde + migration, lien `current` |
| Version déployée lancée + `health-check.sh --backend-only` | OK ; image servie depuis `UPLOAD_DIR` (200) ; code 1 si API arrêtée |
| `rollback.sh --list` | OK |
| `bash -n` + `shellcheck -S warning` sur tous les scripts | OK (4 notes de style SC2012 sur des noms horodatés maîtrisés) |
| `terraform fmt -check`, `init -backend=false`, `validate` | OK (provider AWS 6.71.0) |
| Rendu du modèle cloud-init (avec/sans dépôt) + analyse YAML | OK |
| `tests/deployment/run-local-checks.sh <env test>` | 9/9 PASS |

## 4. Non exécuté / non vérifié

| Élément | Raison | Action requise |
|---|---|---|
| Création de l'instance EC2 | Tentative du 2026-10-29 : `terraform plan` OK, Security Group et 3 règles d'entrée créés, mais **`ec2:RunInstances` refusé** par la politique du lab (rôle `voclabs` « Student View », toutes AMI/types/régions) | Faire autoriser le lancement d'instances (enseignant / Learner Lab démarré avec crédit), puis `terraform plan` et `apply` |
| `install.sh` sur Ubuntu neuve | Pas de VM/Docker ; nécessite root | Exécuter sur l'EC2 ; surveiller la sortie |
| Unités systemd et `nginx -t` | systemd/Nginx non disponibles localement | Vérifiés par `install.sh` (`nginx -t`) et `deploy.sh` (contrôle de santé via Nginx) |
| Sauvegarde de la base réelle `pneus_db` | Serveur PostgreSQL de dev non démarré/inaccessible | Procédure database-backup-restore.md §3 |
| Parcours complets dans le navigateur (commande, facture PDF, upload admin, chatbot, Telegram, e-mail) | Pas de navigateur ni de secrets valides | Liste de contrôle README §16 après déploiement |
| HTTPS / certbot | Pas de nom de domaine | Facultatif, voir aws-academy-deployment.md §9 |
| Tests frontend | Aucun framework de test frontend dans le projet | Évolution recommandée |

## 5. Risques restants

1. **Secrets exposés dans l'historique Git** (mot de passe Gmail, clé Gemini,
   jeton Telegram, mot de passe admin et base) : les révoquer/remplacer chez
   chaque fournisseur. Retirer le fichier de l'historique (`git filter-repo`)
   réécrit l'historique partagé : décision de l'équipe.
2. **Coéquipiers :** après le commit qui retire `backend/.env` de l'index, un
   `git pull` **supprimera leur `backend/.env` local** : le sauvegarder avant.
3. **HTTP sans TLS** dans le cas AWS Academy sans domaine : cookie de session en
   clair.
4. **Une seule instance** : base, images et sauvegardes sur le même volume EBS
   tant que les sauvegardes ne sont pas copiées ailleurs.
5. Pas de limitation des tentatives de connexion (force brute possible).
6. 17 erreurs de lint React existantes, dont `setAvis` non défini dans
   `frontend/src/pages/CommandeDetails/CommandeDetails.jsx:148` (la déclaration
   ligne 35 est commentée) : `ReferenceError` à l'exécution sur ce chemin de
   code. Non corrigé ici (comportement métier à valider par l'équipe).
7. `npm audit` non analysé en détail ; `jade` (déprécié) et `express` 4.16
   figurent parmi les dépendances : mise à jour recommandée hors de ce
   périmètre.

## 6. Critères de fin

| Critère | État |
|---|---|
| README et documentation relus | Oui |
| Recommandations implémentées ou reportées avec raison | Oui (readme-recommendations.md) |
| Architecture et stratégie de base documentées | Oui |
| Versions d'exécution identifiées | Node 22 LTS (`engines >= 20.19`), PostgreSQL 16 (Ubuntu 24.04) |
| Build de production | Oui |
| Installation / déploiement reproductibles | Scripts testés localement ; **installation sur EC2 non exécutée** |
| Tests automatisés exécutés | Oui |
| Sauvegarde / restauration | Oui, testées |
| Migration validée | Sur bases de test ; **base réelle non migrée** |
| Secrets et configuration | Oui ; **rotation à faire** |
| Contraintes AWS Academy considérées | Oui |
| Déploiement EC2 automatisé | Oui (Terraform + cloud-init + scripts) ; **non exécuté** |
| Portabilité documentée | Oui |
| Dépannage et retour arrière | Oui |
