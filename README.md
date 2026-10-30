# LANDOLSI TIRES — Plateforme web de vente de pneumatiques

Application web responsive réalisée dans le cadre du projet de fin d'études (PFE). Elle permet aux clients de consulter un catalogue de pneus, de rechercher des produits adaptés à leur véhicule, de gérer un panier et des commandes, puis de consulter les informations de facturation. Un espace d'administration permet de gérer les données commerciales. Le projet comprend également un chatbot et des notifications Telegram côté serveur.

> **Dépôt :** https://github.com/ngrassa/projet_Landolsi — nouvel historique Git, créé à partir de l'ancien dépôt `pfeMaster_minyar`. Les changements apportés sont résumés en [§0](#0-modifications-apportées-au-projet-initial).
>
> **Important — sécurité :** dans l'ancien dépôt, `backend/.env` était versionné. Ce nouveau dépôt ne contient ni ce fichier ni l'ancien historique, mais **les secrets qu'il contenait (mot de passe SMTP, clé Gemini, jeton Telegram, mots de passe base et administrateur) restent visibles dans l'ancien dépôt et doivent être révoqués et remplacés**. Le modèle `backend/.env.example` ne contient que des noms de variables ; `backend/.env` est ignoré par Git.

## Sommaire

- [0. Modifications apportées au projet initial](#0-modifications-apportées-au-projet-initial)
- [1. Présentation](#1-présentation)
- [2. Fonctionnalités](#2-fonctionnalités)
- [3. Technologies](#3-technologies)
- [4. Architecture du dépôt](#4-architecture-du-dépôt)
- [5. Prérequis](#5-prérequis)
- [6. Récupérer le projet depuis une URL Git](#6-récupérer-le-projet-depuis-une-url-git)
- [7. Configurer PostgreSQL](#7-configurer-postgresql)
- [8. Configurer le backend](#8-configurer-le-backend)
- [9. Configurer le frontend](#9-configurer-le-frontend)
- [10. Démarrer l'application](#10-démarrer-lapplication)
- [11. URLs locales](#11-urls-locales)
- [12. Principaux modules et API](#12-principaux-modules-et-api)
- [13. Parcours utilisateur](#13-parcours-utilisateur)
- [14. Parcours administrateur](#14-parcours-administrateur)
- [15. Chatbot et Telegram](#15-chatbot-et-telegram)
- [16. Vérifications et tests](#16-vérifications-et-tests)
- [17. Problèmes fréquents](#17-problèmes-fréquents)
- [18. Préparer la livraison finale](#18-préparer-la-livraison-finale)
- [19. Limites et améliorations](#19-limites-et-améliorations)
- [20. Déploiement en production (AWS EC2 Ubuntu)](#20-déploiement-en-production-aws-ec2-ubuntu)

## 0. Modifications apportées au projet initial

Travail de préparation au déploiement cloud (octobre 2026). Le fonctionnement métier (catalogue, panier, commandes, factures, avis, réclamations, chatbot, Telegram) est inchangé ; les modifications portent sur la compatibilité Linux, la sécurité, la configuration, la base de données et le déploiement. Détail et justification : [`docs/deployment/readme-recommendations.md`](docs/deployment/readme-recommendations.md) et [`docs/deployment/readiness-report.md`](docs/deployment/readiness-report.md).

### Corrections bloquantes

| Problème dans l'ancien projet | Conséquence | Correction |
|---|---|---|
| 11 imports frontend avec une casse incorrecte (`components/Pneus/...`, `AdminDashboard.css`, `bridgestone.png`, `pirelli.png`) | `npm run build` échouait sous Linux (fonctionnait uniquement sous Windows) | Chemins corrigés ; contrôle automatique `tests/deployment/check-import-case.cjs` |
| `backend/routes/vehicule.js` importait `vehiculeController` au lieu de `VehiculeController` | L'API plantait au démarrage sous Linux | Chemin corrigé |
| 26 URL `http://localhost:5001` codées en dur dans 22 fichiers React | Frontend inutilisable ailleurs que sur le poste de développement | `frontend/src/config.js` + variable `VITE_API_URL` (`/api` en production) |

### Sécurité

| Avant | Après |
|---|---|
| `POST/PUT/DELETE` sur `/pneus`, `/marques`, `/compatibilites` **sans authentification** | Réservés aux administrateurs (`requireAdmin`) ; appels marques envoyés avec le cookie de session |
| Webhook `/telegram/webhook` public (envoi de messages par le bot à n'importe quel chat) | Désactivé tant que `TELEGRAM_WEBHOOK_SECRET` n'est pas défini |
| Secret JWT codé en dur (`"net pneus secret"`) | `JWT_SECRET` obligatoire en production (≥ 32 caractères) ; ancien secret conservé seulement en développement |
| Cookie de session `secure: false` codé en dur | `COOKIE_SECURE` (vrai par défaut en production) ; `clearCookie` avec les mêmes options |
| CORS limité à `localhost` codé en dur | `CORS_ORIGINS` configurable |
| Erreurs 500 renvoyant l'objet d'erreur complet au navigateur | Message générique en production |
| `backend/.env` versionné ; `.env` commenté dans `.gitignore` | Fichier exclu, `.gitignore` racine et backend corrigés, modèle `.env.example` |
| `bcrypt` utilisé sans import dans `middleware/inscription.js` | Import ajouté |

### Configuration et exécution du backend

- Nouveau module `backend/config/index.js` : lecture centralisée et **validation** des variables d'environnement (arrêt explicite si une variable obligatoire manque) ; tous les fichiers passent par lui (`dotenv` n'est plus appelé ailleurs).
- `backend/db/db.js` : pool de connexions configurable, option TLS `DB_SSL` pour une base managée (Supabase, RDS).
- `backend/app.js` : route **`GET /health`** (vérifie la base), démarrage uniquement après connexion à PostgreSQL, **arrêt propre** sur `SIGTERM`/`SIGINT` (fermeture du serveur, arrêt du polling Telegram, fermeture du pool), journaux `combined` en production, `trust proxy` derrière Nginx, `HOST`/`PORT` configurables, export de l'application pour les tests.
- Images téléversées : répertoire configurable `UPLOAD_DIR` (défaut inchangé `backend/public/uploadPneu`), persistant en production.
- Polling Telegram désactivable (`TELEGRAM_POLLING_ENABLED`) pour éviter deux instances concurrentes.
- Suppression d'un `console.log` de débogage dans `UserModel.js`.

### Base de données

- `sync({ alter: true })` à chaque démarrage remplacé par `DB_SYNC` (`alter` en développement comme avant, `none` en production où `alter` est refusé).
- **Migrations versionnées** avec `sequelize-cli` (`npm run db:migrate`) ; migration de référence non destructive.
- Scripts `scripts/backup-db.sh` et `scripts/restore-db.sh` (sauvegarde `pg_dump` + SHA-256 + métadonnées, restauration transactionnelle, refus d'écraser une base non vide) ; sauvegarde quotidienne et avant chaque déploiement.

### Tests ajoutés

- 12 tests backend (`npm test`) : validation de la configuration, `/health`, refus 401/403 des routes d'administration, inscription/connexion par cookie.
- `tests/deployment/backup-restore.test.sh` : restauration vérifiée (comptages, séquences, schéma).
- `tests/deployment/run-local-checks.sh` : exécute toutes les vérifications (casse des imports, build, scripts shell, Terraform, migrations, sauvegarde).

### Déploiement (nouveau)

- `scripts/install.sh`, `deploy.sh`, `rollback.sh`, `health-check.sh` ; unités `systemd/` ; site `nginx/landolsi.conf`.
- Terraform `infra/aws/` + `infra/cloud-init/` pour une instance EC2 Ubuntu 24.04, adapté aux restrictions AWS Academy (Security Group existant, clé SSH injectée par cloud-init).
- Documentation `docs/deployment/` : architecture, stratégie de base, sauvegarde/restauration, AWS Academy, dépannage, retour arrière.

### Non modifié (à traiter par l'équipe)

- 17 erreurs `npm run lint` existantes, dont `setAvis` non défini dans `frontend/src/pages/CommandeDetails/CommandeDetails.jsx:148` (erreur à l'exécution sur ce chemin).
- Pas de limitation des tentatives de connexion ; dépendances anciennes (Express 4.16, `jade`).
- Données de développement **importées le 30 octobre 2026** depuis le dump SQL `LANDOLSI_TIRES.sql` (PostgreSQL 17.10) : 12 utilisateurs, 8 marques, 9 pneus, 38 commandes, 10 factures, 13 avis. Lors de l'import : 385 contraintes `UNIQUE` en double (créées par les anciens `sync({ alter: true })`) ont été supprimées, les tables `avis_likes` et `reponses_avis` (absentes du code de ce dépôt) ont été conservées, et les colonnes `users.activite` et `users.identifiantEntreprise` (attendues par `UserModel.js`, absentes du dump) ont été ajoutées. Le compte administrateur est désormais celui du dump (mot de passe du poste de développement). Sauvegarde avant import : `/var/backups/landolsi/landolsi_tires_20261030T161213Z.dump` ; sauvegarde après import chiffrée, conservée hors dépôt ([§20](#sauvegarde-chiffrée-et-restauration-cicd)).

### Déploiement AWS réalisé (30 octobre 2026)

| Élément | Valeur |
|---|---|
| URL publique | **https://landolsi-tires-18-213-152-8.sslip.io** (l'IP `18.213.152.8` redirige vers cette adresse) |
| Instance | EC2 `t3.small`, Ubuntu 24.04, `us-east-1`, provisionnée par Terraform, installée par cloud-init |
| IP | IP élastique fixe `18.213.152.8` (conservée entre deux sessions du lab) |
| HTTPS | Certificat Let's Encrypt, renouvellement automatique (`certbot.timer`) |
| Contrôles | `/api/health` → `{"status":"ok","database":"up"}` ; connexion administrateur vérifiée |

Le 29 octobre, `ec2:RunInstances` était refusé sur le compte AWS Academy ; il est autorisé depuis le 30 octobre. Corrections intégrées à `scripts/install.sh` à la suite de ce déploiement : `--email` facultatif avec `--domain`, mise à jour de `COOKIE_SECURE`/`CORS_ORIGINS` lorsque HTTPS est activé après la première installation, redirection de l'accès par IP vers le nom de domaine (Certbot répondait 404).

## 1. Présentation

**LANDOLSI TIRES** est une application web de vente de pneumatiques, accessible depuis un navigateur sur ordinateur ou téléphone. Elle vise à faciliter la recherche de pneus, la préparation d'une commande et le suivi des opérations par l'administrateur.

Le modèle opérationnel retenu est le **retrait de la commande par le client chez LANDOLSI TIRES** : la plateforme ne prévoit pas de livraison à domicile. La facture est créée au moment où l'administrateur confirme la commande, selon la logique métier implémentée.

## 2. Fonctionnalités

### Espace client

- Inscription, connexion et gestion de session.
- Récupération de mot de passe par e-mail (si les paramètres SMTP sont configurés).
- Consultation du catalogue et des fiches détaillées des pneus.
- Recherche de pneus par critères disponibles dans l'interface : marque, dimension, saison et immatriculation/compatibilité véhicule.
- Consultation des promotions.
- Ajout de pneus au panier et ajustement des quantités.
- Création d'une commande et consultation de ses détails/statut.
- Consultation des factures associées aux commandes, selon les actions disponibles dans l'interface.
- Dépôt et consultation d'avis et de réclamations.
- Utilisation du chatbot d'assistance.

### Espace administrateur

- Tableau de bord d'administration.
- Gestion des pneus, de leurs images, de leur stock et de leurs informations.
- Gestion des marques.
- Gestion des promotions.
- Consultation et gestion des commandes et de leur statut.
- Gestion des utilisateurs.
- Gestion des réclamations et des avis selon les écrans disponibles.
- Génération/gestion des factures selon le cycle de confirmation des commandes.

Les accès aux opérations administrateur doivent être protégés par les contrôles d'authentification et de rôle côté serveur. Ne vous fiez pas uniquement au masquage des pages dans le frontend.

## 3. Technologies

| Partie | Technologies |
|---|---|
| Frontend | React, Vite, React Router, Axios, Bootstrap, React Icons |
| Backend | Node.js, Express.js |
| Base de données | PostgreSQL |
| ORM | Sequelize |
| Authentification | Cookies, JWT et bcrypt (selon les modules du backend) |
| Images | Multer et répertoire public du backend |
| E-mail | Nodemailer, avec compte SMTP configuré dans l'environnement |
| Chatbot | Intégration Google Gemini via `@google/genai` |
| Notifications | Bot Telegram avec mécanisme de polling côté serveur |
| Factures | Contrôleur de facturation et génération PDF avec PDFKit (selon les routes prévues) |

## 4. Architecture du dépôt

```text
projet_Landolsi/
├── backend/
│   ├── app.js                  # Configuration Express, routes, /health, démarrage et arrêt propre
│   ├── config/index.js         # Lecture et validation des variables d'environnement
│   ├── db/db.js                # Connexion Sequelize/PostgreSQL
│   ├── migrations/             # Migrations versionnées (sequelize-cli)
│   ├── test/                   # Tests backend (node --test)
│   ├── models/                 # Modèles et associations Sequelize
│   ├── controllers/            # Logique métier des modules
│   ├── routes/                 # Endpoints HTTP
│   ├── middleware/             # Authentification, rôles, téléversement
│   ├── services/               # Services tels que le polling Telegram
│   ├── public/uploadPneu/      # Images de pneus téléversées
│   ├── package.json
│   ├── .env.example            # Modèle de configuration
│   └── .env                    # À créer localement; ne pas versionner
├── frontend/
│   ├── src/
│   │   ├── config.js           # URL de l'API (VITE_API_URL)
│   │   ├── components/         # Composants et écrans, dont administration
│   │   ├── context/            # Contexte du panier
│   │   ├── pages/              # Pages principales
│   │   └── services/           # Appels API depuis React
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── scripts/                    # install, deploy, rollback, health-check, backup-db, restore-db
├── systemd/                    # Unités systemd (API, sauvegarde quotidienne)
├── nginx/                      # Site Nginx (frontend + reverse proxy /api)
├── infra/aws/                  # Terraform EC2 (AWS Academy)
├── infra/cloud-init/           # Amorçage EC2
├── tests/deployment/           # Contrôles de déploiement et test sauvegarde/restauration
└── docs/deployment/            # Architecture, base de données, AWS, dépannage, retour arrière
```

## 5. Prérequis

Installer et vérifier :

- **Node.js 22 LTS** (minimum 20.19, requis par Vite 8).
- **npm** (installé avec Node.js).
- **PostgreSQL** et un serveur de base de données accessible.
- **Git**, si le dépôt est récupéré depuis une URL Git.
- Un navigateur récent (Chrome, Edge ou Firefox).

Commandes de vérification :

```bash
node --version
npm --version
 git --version
```

Supprimez l'espace placé avant `git` si vous copiez la troisième commande dans un terminal qui ne l'accepte pas.

## 6. Récupérer le projet depuis une URL Git

```bash
git clone https://github.com/ngrassa/projet_Landolsi.git
cd projet_Landolsi
```

Si le nom du dossier créé est différent, entrez dans ce dossier à la place. Si le projet est fourni en ZIP, décompressez-le puis ouvrez un terminal dans le dossier racine contenant `backend/` et `frontend/`.

Pour récupérer les changements d'une branche existante :

```bash
git status
git pull
```

Ne partagez pas votre URL si elle contient un jeton d'accès. Pour envoyer vos changements, créez une branche, validez les fichiers non sensibles et ouvrez une pull request ou fusionnez selon les règles du dépôt.

## 7. Configurer PostgreSQL

1. Démarrez PostgreSQL.
2. Créez une base dédiée au projet, par exemple `landolsi_tires`.
3. Créez un utilisateur PostgreSQL réservé à l'application et donnez-lui les droits nécessaires sur cette base.
4. Notez le nom de la base, l'utilisateur, le mot de passe, l'hôte et le port (souvent `localhost:5432`).
5. Renseignez ces valeurs dans `backend/.env`.

Le comportement au démarrage dépend de `DB_SYNC` :

| `DB_SYNC` | Effet | Défaut |
|---|---|---|
| `alter` | `sequelize.sync({ alter: true })` : modifie le schéma (ancien comportement) | Développement |
| `safe` | Crée uniquement les tables manquantes | — |
| `none` | Aucune synchronisation : schéma géré par les migrations | Production (`alter` y est refusé) |

Migrations versionnées :

```bash
cd backend
npm run db:migrate          # applique les migrations en attente
npm run db:migrate:status   # état
```

La première migration (`migrations/20261029000000-baseline-schema.js`) crée les tables manquantes sans modifier une base existante. Sauvegardez la base avant toute migration : `scripts/backup-db.sh --env-file backend/.env --output-dir backups`.

Les tables sont définies par les modèles présents dans `backend/models/` et leurs associations dans `backend/models/associations.js`. Selon la version et l'état de la base, il peut être nécessaire de créer un compte administrateur et de charger les données initiales séparément.

## 8. Configurer le backend

Ouvrez un terminal dans `backend/` :

```bash
cd backend
npm install
```

Créez le fichier `.env` à partir du modèle :

```bash
cp .env.example .env
```

Variables principales (liste complète et commentée dans `backend/.env.example`) :

| Variable | Rôle | Défaut développement |
|---|---|---|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL (obligatoires : nom, utilisateur, mot de passe) | `localhost:5432` |
| `DB_SSL` | `true` pour une base managée (Supabase, RDS) | `false` |
| `DB_SYNC` | `alter`, `safe` ou `none` (voir §7) | `alter` |
| `JWT_SECRET` | Secret de signature des sessions (obligatoire en production, ≥ 32 caractères : `openssl rand -hex 32`) | ancien secret de développement |
| `PORT`, `HOST` | Écoute du serveur | `5001`, toutes interfaces |
| `CORS_ORIGINS` | Origines autorisées, séparées par des virgules | `http://localhost:5173,http://127.0.0.1:5173` |
| `COOKIE_SECURE` | Cookie de session réservé à HTTPS | `false` (`true` en production) |
| `UPLOAD_DIR` | Répertoire des images téléversées | `backend/public/uploadPneu` |
| `EMAIL_USER`, `EMAIL_PASS` | SMTP (récupération du mot de passe) | — |
| `GEMINI_API_KEY` | Chatbot | — |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_POLLING_ENABLED` | Assistant Telegram | polling activé |
| `VEHICULE_API_USERNAME` | Recherche par immatriculation | — |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Utilisées uniquement par `npm run create-admin` | — |

Renseignez uniquement les variables réellement utilisées par les services activés. N'utilisez pas le mot de passe administrateur comme mot de passe de base de données.

Démarrez le serveur :

```bash
npm run dev
```

ou, sans rechargement automatique :

```bash
npm start
```

Le serveur écoute sur le port **5001** (`PORT`). Il ne démarre qu'après une connexion réussie à PostgreSQL ; sinon il s'arrête avec un message explicite. `http://localhost:5001/health` répond `{"status":"ok","database":"up",...}` lorsque l'API et la base fonctionnent (503 si la base est indisponible).

### Sécurité de configuration

- Vérifiez que `.env` est ignoré par Git dans **les deux dossiers** si nécessaire.
- Ne mettez jamais de clés API, de mots de passe, de jetons ou de données clients dans le README.
- Si un secret a été commité, l'ajouter au `.gitignore` ne suffit pas : révoquez-le et remplacez-le.
- N'utilisez pas les paramètres de développement en production.

## 9. Configurer le frontend

Ouvrez un **deuxième terminal** à la racine du projet, puis :

```bash
cd frontend
npm install
npm run dev
```

Vite affiche l'URL locale, normalement `http://localhost:5173/`. L'URL de l'API est définie dans `frontend/src/config.js` à partir de `VITE_API_URL` (défaut : `http://localhost:5001`) ; les requêtes utilisent les cookies (`withCredentials: true`). Le backend autorise par défaut les origines `localhost:5173` et `127.0.0.1:5173` (`CORS_ORIGINS`). En production, le frontend est construit avec `VITE_API_URL=/api` et servi par le même Nginx que l'API.

Pour éviter les problèmes de session/CORS, utilisez de préférence `http://localhost:5173` pour le frontend et `http://localhost:5001` pour l'API, conformément à la configuration actuelle. Si vous changez de port ou d'hôte, adaptez à la fois l'URL API, la configuration CORS et les paramètres des cookies.

Vérifiez que le frontend n'embarque aucun secret serveur. Une clé Gemini, un jeton Telegram ou un mot de passe SMTP doit rester dans le backend.

## 10. Démarrer l'application

L'application nécessite généralement **deux terminaux** ouverts en même temps :

**Terminal 1 — backend**

```bash
cd backend
npm run dev
```

Attendez les messages confirmant le démarrage du serveur et la connexion à PostgreSQL.

**Terminal 2 — frontend**

```bash
cd frontend
npm run dev
```

Ouvrez ensuite `http://localhost:5173/` dans le navigateur. Gardez les deux terminaux ouverts pendant les tests.

## 11. URLs locales

| Ressource | URL de développement |
|---|---|
| Application React | `http://localhost:5173/` |
| API backend | `http://localhost:5001/` |
| Santé API + base | `http://localhost:5001/health` |
| Route utilisateurs | `http://localhost:5001/users` |
| Pneus | `http://localhost:5001/pneus` |
| Marques | `http://localhost:5001/marques` |
| Véhicules | `http://localhost:5001/vehicules` |
| Compatibilités | `http://localhost:5001/compatibilites` |
| Commandes | `http://localhost:5001/commandes` |
| Promotions | `http://localhost:5001/promotions` |
| Administration API | `http://localhost:5001/admin` |
| Chatbot | `http://localhost:5001/chatbot` |
| Factures | `http://localhost:5001/factures` |
| Avis | `http://localhost:5001/avis` |
| Réclamations | `http://localhost:5001/reclamations` |
| Telegram | `http://localhost:5001/telegram` |

Ces URLs indiquent les **préfixes** des routeurs Express. Les chemins exacts, méthodes HTTP, paramètres et droits requis sont définis dans les fichiers de `backend/routes/`. Ouvrir un préfixe directement dans le navigateur ne garantit pas qu'une route GET existe à cet emplacement.

## 12. Principaux modules et API

Les préfixes de routes sont montés dans `backend/app.js` :

| Module | Préfixe | Rôle |
|---|---|---|
| Utilisateurs | `/users` | Inscription, connexion, profil et fonctions de compte |
| Pneus | `/pneus` | Catalogue, détails, recherche et gestion des pneus |
| Marques | `/marques` | Gestion des marques |
| Véhicules | `/vehicules` | Données des véhicules |
| Compatibilités | `/compatibilites` | Correspondance pneus/véhicules |
| Commandes | `/commandes` | Création, consultation et gestion du statut des commandes |
| Promotions | `/promotions` | Création et consultation des promotions |
| Administration | `/admin` | Fonctions dédiées à l'administration |
| Chatbot | `/chatbot` | Échanges avec l'assistant |
| Factures | `/factures` | Opérations liées aux factures |
| Avis | `/avis` | Avis des clients |
| Réclamations | `/reclamations` | Dépôt et gestion des réclamations |
| Telegram | `/telegram` | Fonctions liées à l'intégration Telegram |

Les écritures du catalogue (`POST/PUT/DELETE` sur `/pneus`, `/marques`, `/compatibilites`) exigent une session administrateur. Le webhook `/telegram/webhook` est désactivé tant que `TELEGRAM_WEBHOOK_SECRET` n'est pas défini (l'application utilise le polling).

Pour documenter chaque endpoint avec précision, consulter les fichiers correspondants dans `backend/routes/` et les contrôleurs dans `backend/controllers/`. Utilisez Postman ou Insomnia pour tester les requêtes protégées avec une session valide. Les routes protégées peuvent renvoyer `401` si l'utilisateur n'est pas connecté ou `403` si son rôle ne permet pas l'action.

## 13. Parcours utilisateur

1. Le visiteur ouvre le site et consulte le catalogue.
2. Il recherche un pneu selon les critères proposés et consulte la fiche du produit.
3. Il crée un compte ou se connecte si l'action le nécessite.
4. Il ajoute les produits au panier et vérifie les quantités/prix.
5. Il renseigne les informations demandées et confirme la création de commande.
6. Le backend valide la demande, calcule/enregistre les données de commande et les articles associés.
7. Le client consulte ses commandes et leur état depuis son espace.
8. Lorsque l'administrateur confirme la commande, le système crée la facture selon le fonctionnement implémenté.
9. Le client récupère les pneus directement chez LANDOLSI TIRES. Il n'y a pas de livraison à domicile dans le périmètre retenu.

Le statut précis d'une commande et les conditions de création/téléchargement d'une facture dépendent de la logique dans `CommandeController.js`, `FactureController.js` et des routes associées.

## 14. Parcours administrateur

1. Se connecter avec un compte disposant du rôle administrateur.
2. Ajouter ou modifier les marques et les pneus, y compris les images et les stocks.
3. Créer et gérer les promotions disponibles.
4. Consulter les commandes entrantes et leurs informations.
5. Mettre à jour le statut de la commande selon son traitement.
6. Vérifier la facture associée lorsqu'une commande est confirmée.
7. Gérer les comptes, avis et réclamations depuis les écrans d'administration disponibles.

Un compte administrateur doit être créé de manière contrôlée : renseignez `ADMIN_EMAIL` et `ADMIN_PASSWORD` puis `cd backend && npm run create-admin`. **Si le compte existe déjà, le script réinitialise son mot de passe** : ne le relancez pas aveuglément sur une base de production, et retirez `ADMIN_PASSWORD` de la configuration après usage.

## 15. Chatbot et Telegram

### Chatbot

Le backend contient un contrôleur et des routes de chatbot et utilise le paquet `@google/genai`. Pour activer le service, configurez une clé API valide dans `GEMINI_API_KEY`, puis testez la route et l'interface. Une erreur `503 UNAVAILABLE` peut indiquer une indisponibilité temporaire ou une saturation du service externe; elle ne signifie pas nécessairement que la clé a expiré. Prévoir une gestion des erreurs et un message de repli côté interface.

### Notifications Telegram

Le démarrage du serveur appelle `demarrerTelegramPolling()` depuis le service Telegram. Cela correspond à une logique de **polling** : le service interroge Telegram périodiquement pour récupérer les mises à jour, au lieu d'attendre un webhook entrant. Le fonctionnement nécessite les variables Telegram configurées et un accès réseau. Un déploiement cloud devra maintenir le processus backend en fonctionnement et vérifier les contraintes de polling, les journaux et les droits du bot.

Ne mettez jamais le jeton du bot dans React, dans le README ou dans Git. Si un webhook est adopté ultérieurement, il faudra disposer d'une URL HTTPS publique et configurer le webhook côté Telegram; ne mélangez pas simultanément les modes sans vérifier la configuration.

## 16. Vérifications et tests

### Vérification de base

- [ ] PostgreSQL est démarré et la base est accessible.
- [ ] Le fichier `backend/.env` est renseigné avec des valeurs locales valides.
- [ ] Le backend démarre sur le port `5001` sans erreur de connexion.
- [ ] `http://localhost:5001/health` renvoie `"status":"ok"`.
- [ ] Le frontend démarre sur le port `5173`.
- [ ] Le catalogue s'affiche et les images de pneus sont accessibles.
- [ ] L'inscription et la connexion fonctionnent.
- [ ] Les routes protégées refusent l'accès non autorisé.
- [ ] Le panier et la création de commande fonctionnent.
- [ ] L'administrateur peut traiter une commande et le cycle de facture est vérifié.
- [ ] Les promotions et le calcul des prix sont testés.
- [ ] Les e-mails, le chatbot et Telegram sont testés séparément si ces intégrations sont activées.
- [ ] Les affichages sur téléphone et ordinateur sont vérifiés.

### Build frontend

Dans `frontend/` :

```bash
npm run build
```

Le build de production doit se terminer sans erreur. Pour vérifier le résultat localement :

```bash
npm run preview
```

Le script `npm run lint` est également disponible; traitez les erreurs pertinentes avant la livraison (17 erreurs existantes sont recensées dans `docs/deployment/readiness-report.md`).

### Tests automatisés

```bash
# Backend : tests de configuration (sans base) + tests HTTP (avec une base de TEST migrée)
cd backend
npm test                                   # utilise backend/.env : uniquement une base de test !
ENV_FILE=/chemin/test.env npm test         # fichier dédié recommandé

# Toutes les vérifications de déploiement (casse des imports, build, scripts, Terraform,
# migrations, sauvegarde/restauration si une base de test est fournie)
tests/deployment/run-local-checks.sh [/chemin/test.env]
```

Les tests HTTP créent un compte client : ne les exécutez jamais sur la base de production.

Sous Linux, les chemins d'import sont sensibles à la casse (contrairement à Windows) : `node tests/deployment/check-import-case.cjs frontend/src backend` détecte les imports qui fonctionneraient sous Windows mais casseraient le build sur le serveur.

## 17. Problèmes fréquents

### `ECONNREFUSED` ou erreur Sequelize

Vérifiez que PostgreSQL est démarré, que le nom de base, l'utilisateur, le mot de passe, l'hôte et le port dans `.env` sont corrects, et que la base existe.

### `EADDRINUSE :::5001`

Un autre processus utilise déjà le port 5001. Arrêtez l'ancien serveur avec `Ctrl+C` dans son terminal ou identifiez le processus qui occupe le port avant de redémarrer.

### Erreur CORS ou session non conservée

Utilisez les hôtes prévus (`localhost`) et le port frontend `5173`. Vérifiez `credentials: true` côté Express et `withCredentials: true` côté Axios. Si les ports changent, adaptez la configuration des deux côtés.

### Réponse `401`

La session a peut-être expiré ou le cookie n'est pas envoyé. Reconnectez-vous et vérifiez les paramètres de cookies, CORS et l'URL utilisée.

### Images manquantes

Vérifiez que les fichiers sont présents dans `backend/public/uploadPneu/` et que les chemins stockés en base correspondent aux noms de fichiers. Les fichiers d'images locaux doivent être sauvegardés lors d'une migration.

### E-mail non envoyé

Vérifiez les identifiants SMTP, les paramètres de sécurité du fournisseur et les journaux du backend. N'inscrivez pas le mot de passe de messagerie dans le code source.

### Gemini indisponible

Vérifiez la variable de clé côté backend, les quotas et la disponibilité du service. Gérez les réponses d'erreur temporaires et évitez de renvoyer les secrets ou les détails internes au navigateur.

### Telegram ne reçoit pas les mises à jour

Vérifiez le jeton, l'identifiant de conversation, les droits du bot, l'accès réseau et les journaux du service de polling. Vérifiez également qu'un autre processus n'effectue pas déjà le polling avec le même bot.

## 18. Préparer la livraison finale

La livraison finale doit inclure le code source, les instructions d'installation, le rapport et les éléments nécessaires à la démonstration. Avant de remettre le projet :

1. **Nettoyer le dépôt** : exclure `node_modules/`, les fichiers `.env`, les journaux, les caches et les secrets.
2. **Préparer un `.env.example`** : conserver uniquement les noms des variables et des valeurs vides ou fictives.
3. **Vérifier les accès** : remplacer les secrets de développement, sécuriser le compte administrateur et tester les rôles.
4. **Préparer la base** : fournir un schéma/migrations et, si nécessaire, un jeu de données de démonstration non personnel. Ne pas livrer de données clients réelles.
5. **Sauvegarder les images** : décider comment les fichiers de `backend/public/uploadPneu/` seront transférés ou stockés en production.
6. **Tester les scénarios principaux** : inscription/connexion, recherche, panier, commande, confirmation, facture, promotion et administration.
7. **Tester le responsive** : vérifier les pages principales sur ordinateur et téléphone.
8. **Tester le build** : exécuter `npm run build` dans `frontend/` et corriger les erreurs bloquantes.
9. **Préparer le rapport PFE** : contexte, problématique, étude de l'existant, solution, besoins, conception UML, architecture, choix techniques, réalisation, tests, limites et perspectives.
10. **Préparer la soutenance** : démonstration courte d'un parcours client puis d'un parcours administrateur; prévoir une solution de secours si les services externes sont indisponibles.
11. **Documenter le déploiement** : URLs publiques, variables d'environnement configurées sur l'hébergeur, base de données, stockage des images, HTTPS, logs et sauvegardes.
12. **Vérifier le dépôt final** : le README doit correspondre aux fonctionnalités réellement présentes et les liens doivent être valides.

### Déploiement cloud — points à prévoir

Le projet est configuré par défaut pour le développement local. Pour le publier, il faudra notamment :

- héberger le frontend et le backend (ou utiliser une plateforme qui prend en charge les deux);
- configurer une base PostgreSQL distante, sauvegardée et protégée;
- remplacer les URLs `localhost` par l'URL publique du backend dans le frontend;
- adapter CORS et les cookies à vos domaines de production, avec HTTPS;
- définir les variables d'environnement dans le tableau de bord de l'hébergeur, pas dans Git;
- choisir un stockage persistant pour les images téléversées;
- vérifier que le processus de polling Telegram reste actif;
- appliquer des migrations contrôlées et tester le déploiement sur une base de test avant la production.

Ces points sont désormais traités : voir [§20](#20-déploiement-en-production-aws-ec2-ubuntu) et `docs/deployment/`. Aucune URL de production n'est indiquée ici, car elle dépend du déploiement réellement effectué.

## 19. Limites et améliorations

Pistes d'évolution possibles :

Réalisé : migrations versionnées, tests backend, stockage persistant des images (disque), journaux journald et `/health`, sauvegarde/restauration PostgreSQL, protection des routes d'administration (détail : `docs/deployment/readme-recommendations.md`).

Pistes restantes :

- ajouter des tests frontend et corriger les 17 erreurs de lint React;
- limiter les tentatives de connexion et de réinitialisation de mot de passe (`express-rate-limit`);
- externaliser les images dans un stockage objet (S3 ou équivalent) pour permettre plusieurs instances;
- ajouter une surveillance de disponibilité externe et la copie automatique des sauvegardes hors de l'instance;
- mettre à jour les dépendances anciennes du backend (Express 4.16, `jade`);
- documenter automatiquement tous les endpoints (par exemple avec OpenAPI/Swagger).

## 20. Déploiement en production (AWS EC2 Ubuntu)

### Architecture

Une instance **Ubuntu 24.04** (EC2 `t3.small` recommandée), installation native sans Docker :

- **Nginx** sert le frontend construit (`frontend/dist`) et relaie `/api/*` vers l'API ;
- **API Node.js** gérée par **systemd** (`landolsi-backend.service`), écoute sur `127.0.0.1:5001` ;
- **PostgreSQL 16** local, non exposé ; sauvegarde quotidienne (`landolsi-backup.timer`) ;
- images téléversées dans `/var/lib/landolsi/uploads`, secrets dans `/etc/landolsi/backend.env`.

Justification, alternatives (Supabase, RDS, 2ᵉ instance) et limites : [`docs/deployment/architecture.md`](docs/deployment/architecture.md), [`docs/deployment/database-strategy.md`](docs/deployment/database-strategy.md).

### Contraintes AWS Academy

Session limitée (instances arrêtées en fin de session), IP publique changeante, création de rôles IAM interdite (`LabInstanceProfile`), clé `vockey`, budget limité, identifiants temporaires à ne jamais committer. Sans nom de domaine, le site est en HTTP. Détails : [`docs/deployment/aws-academy-deployment.md`](docs/deployment/aws-academy-deployment.md).

### Étapes

```bash
# 1. Provisionner l'instance (poste local, identifiants du lab configurés)
cd infra/aws
cp terraform.tfvars.example terraform.tfvars    # renseigner ssh_allowed_cidr = "<votre IP>/32"
terraform init && terraform plan -out tfplan     # relire : aucune destruction
terraform apply tfplan
terraform output ssh_command

# 2. Sur l'instance
ssh -i ~/.ssh/labsuser.pem ubuntu@<IP>
sudo git clone https://github.com/ngrassa/projet_Landolsi.git /opt/landolsi-src
sudo /opt/landolsi-src/scripts/install.sh
sudo nano /etc/landolsi/backend.env              # SMTP, Gemini, Telegram, ADMIN_* (nouveaux secrets)
sudo /opt/landolsi-src/scripts/deploy.sh --source /opt/landolsi-src

# 3. Compte administrateur (base neuve uniquement)
cd /opt/landolsi/current/backend
sudo -u landolsi env NODE_ENV=production ENV_FILE=/etc/landolsi/backend.env node createAdmin.js

# 4. Vérifier
/opt/landolsi/current/scripts/health-check.sh
```

Ouvrir ensuite `http://<IP>/`.

**AWS Academy :** le lab interdit la création de Security Group par Terraform et l'import de clés SSH ; créez le groupe avec l'AWS CLI et renseignez `security_group_id` et `ssh_public_key` dans `terraform.tfvars` (procédure : [`docs/deployment/aws-academy-deployment.md`](docs/deployment/aws-academy-deployment.md) §2). Vérifiez aussi que votre compte peut lancer une instance (`aws ec2 run-instances --dry-run ...` doit répondre `DryRunOperation`) : refusé le 2026-10-29, autorisé le 2026-10-30 sur le même compte.

**Nouvelle session du lab :** recopiez les identifiants dans `~/.aws/credentials`, puis vérifiez que le Security Group de `terraform.tfvars` existe encore (`aws ec2 describe-security-groups --group-ids sg-...`). Une réinitialisation du lab peut le supprimer : recréez-le, retirez les anciennes règles de l'état (`terraform state rm aws_vpc_security_group_ingress_rule.ssh ...`) et relancez `terraform plan`. Mettez aussi à jour `ssh_allowed_cidr` si votre IP a changé.

Avec `git_repo_url = "https://github.com/ngrassa/projet_Landolsi.git"` dans `terraform.tfvars`, cloud-init exécute automatiquement l'étape 2 (environ 2 minutes, journal : `/var/log/cloud-init-output.log`).

Sans Terraform, créer l'instance dans la console (Ubuntu 24.04, SSH limité à votre IP, HTTP ouvert, IMDSv2) puis reprendre à l'étape 2.

### IP fixe et HTTPS

1. **IP fixe :** `allocate_eip = true` dans `terraform.tfvars`, puis `terraform plan`/`apply`. L'IP élastique **remplace** l'IP publique temporaire de l'instance (l'ancienne adresse cesse de fonctionner) et reste identique après arrêt/démarrage. Coût : environ 0,005 $/h, y compris instance arrêtée.
2. **Nom de domaine :** sans domaine acheté, utilisez [sslip.io](https://sslip.io), qui résout `<nom>-<IP avec des tirets>.sslip.io` vers l'IP (aucun compte nécessaire), par exemple `landolsi-tires-18-213-152-8.sslip.io`. Avec un domaine acheté, créez un enregistrement `A` vers l'IP élastique.
3. **Certificat :**
   ```bash
   sudo /opt/landolsi-src/scripts/install.sh --domain landolsi-tires-18-213-152-8.sslip.io   # --email facultatif
   ```
   Le script obtient le certificat Let's Encrypt, redirige HTTP et l'accès par IP vers `https://<domaine>`, passe `COOKIE_SECURE=true` et `CORS_ORIGINS=https://<domaine>`, puis redémarre l'API.

Relancer `install.sh` **sans** `--domain` remet la configuration Nginx HTTP d'origine (HTTPS désactivé). Si l'IP élastique est perdue (`terraform destroy`, réinitialisation du lab), le nom sslip.io change : refaire l'étape 3 avec le nouveau nom.

### Compte administrateur sans écrire le mot de passe sur le disque

```bash
cd /opt/landolsi/current/backend
sudo -u landolsi env NODE_ENV=production ENV_FILE=/etc/landolsi/backend.env \
    ADMIN_EMAIL=admin@landolsi.com ADMIN_PASSWORD='<mot de passe robuste>' node createAdmin.js
```

Le site étant public, n'utilisez pas de mot de passe faible ; relancer la commande réinitialise le mot de passe.

### Reprise des données de développement

Procédure complète (export de `pneus_db` depuis le poste, transfert, restauration, images) : [`docs/deployment/database-backup-restore.md`](docs/deployment/database-backup-restore.md) §3.

`scripts/restore-db.sh` a besoin d'une **sauvegarde de la base source** : le dépôt Git ne contient que le code. La sauvegarde présente sur le serveur (`/var/backups/landolsi/landolsi_tires_*.dump`, créée automatiquement avant la première migration) est celle d'une base vide. Sur le poste qui héberge `pneus_db` :

```powershell
pg_dump -h localhost -U postgres --format=custom -f pneus_db.dump pneus_db
```

La base du serveur contient déjà les tables et le compte administrateur : `restore-db.sh` refuse alors de restaurer (code 3). Après une sauvegarde (`sudo -u landolsi /opt/landolsi/current/scripts/backup-db.sh`), ajoutez `--allow-nonempty` (opération destructive : les tables présentes dans l'archive sont recréées, le compte administrateur de la sauvegarde remplace celui du serveur), puis copiez les images dans `/var/lib/landolsi/uploads`.

### Sauvegarde chiffrée et restauration CI/CD

La base de production du 30 octobre 2026 est sauvegardée **chiffrée** (GPG AES-256) **hors de ce dépôt public** ; seules ses sommes SHA-256 de référence sont versionnées dans `db/backup/`. Le workflow `.github/workflows/db-restore.yml` télécharge l'archive depuis un stockage privé (`DB_BACKUP_URL`), vérifie sa somme et la restaure dans un PostgreSQL éphémère (`verify`) ou, sur déclenchement manuel confirmé, sur l'EC2 (`restore-ec2`). Restauration manuelle : `DB_BACKUP_PASSPHRASE=… scripts/restore-encrypted-backup.sh --archive <archive.gpg> -- --target-db <base> --create`. Consignes : [`lisezmoi.txt`](lisezmoi.txt) ; détails : [`docs/deployment/database-backup-restore.md`](docs/deployment/database-backup-restore.md) §6.

### Exploitation

| Action | Commande |
|---|---|
| État des services | `systemctl status landolsi-backend nginx postgresql` |
| Journaux API | `journalctl -u landolsi-backend -f` |
| Santé | `/opt/landolsi/current/scripts/health-check.sh` |
| Mise à jour | `cd /opt/landolsi-src && sudo git pull && sudo scripts/deploy.sh --source /opt/landolsi-src` |
| Retour arrière | `sudo /opt/landolsi/current/scripts/rollback.sh` |
| Sauvegarde manuelle | `sudo -u landolsi /opt/landolsi/current/scripts/backup-db.sh` |
| Restauration (nouvelle base) | `scripts/restore-db.sh --file <archive.dump> --target-db <base>` |

`deploy.sh` sauvegarde la base, applique les migrations, bascule atomiquement vers la nouvelle version et revient automatiquement à la précédente si le contrôle de santé échoue. Le redémarrage coupe l'API quelques secondes. Les migrations ne sont pas annulées par un retour arrière : voir [`docs/deployment/rollback.md`](docs/deployment/rollback.md). Dépannage : [`docs/deployment/troubleshooting.md`](docs/deployment/troubleshooting.md).

### Portabilité

Seul `infra/aws/` est spécifique à AWS. `scripts/`, `systemd/` et `nginx/` fonctionnent sur toute VM Ubuntu 22.04/24.04 ; la base peut être remplacée par un PostgreSQL managé (`DB_HOST`, `DB_SSL=true`, `install.sh --external-db`). Limite : les images sont stockées sur le disque local, ce qui impose une seule instance applicative.

---

**Projet :** LANDOLSI TIRES — plateforme web de vente de pneumatiques  
**Cadre :** Projet de fin d'études (PFE)  
**Langue de documentation :** français
