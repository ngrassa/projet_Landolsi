# Recommandations du README : suivi

Source : `README.md` d'origine (§5, 7, 8, 15, 17, 18, 19). Chaque recommandation a
été confrontée au code réel.

| # | Recommandation | État constaté | Action | Statut | Vérification |
|---|---|---|---|---|---|
| 1 | Ne jamais publier `backend/.env` ; révoquer les secrets partagés (§ intro, §8, §18.1) | `backend/.env` **versionné** dans Git (commits `08db41a`, `9ab951d`) ; `.env` commenté dans `backend/.gitignore` | `.gitignore` corrigés (racine + backend), fichier retiré de l'index (`git rm --cached`, copie locale conservée) | Fait partiellement — **rotation des secrets à faire par l'équipe** ; ils restent dans l'historique Git | `git ls-files backend/.env` vide après commit |
| 2 | Fournir un `.env.example` sans valeurs (§18.2) | Absent | `backend/.env.example` (toutes les variables lues par le code) et `frontend/.env.example` | Fait | Revue ; `install.sh` l'utilise comme modèle |
| 3 | Remplacer les URL `localhost` par l'URL publique (§18 cloud) | 26 URL `http://localhost:5001` codées en dur dans 22 fichiers | `frontend/src/config.js` (`VITE_API_URL`) ; production : `/api` même origine | Fait | Build : 0 occurrence de `localhost:5001` (`run-local-checks.sh`) |
| 4 | Adapter CORS et cookies aux domaines de production, HTTPS (§18 cloud) | Origines CORS et `secure:false` codés en dur | `CORS_ORIGINS`, `COOKIE_SECURE`, `TRUST_PROXY` ; `clearCookie` avec les mêmes options | Fait (HTTPS dépend d'un domaine) | Tests `config.test.js`, `api.test.js` (cookie HttpOnly) |
| 5 | Variables d'environnement hors de Git, chez l'hébergeur (§18 cloud) | — | `/etc/landolsi/backend.env` (0640 root:landolsi) chargé par systemd ; aucun secret dans les unités ni les scripts | Fait | Revue des fichiers `systemd/` |
| 6 | Stockage persistant des images (§17, §18.5, §19) | Chemin relatif `public/uploadPneu` dans la version | `UPLOAD_DIR` (défaut inchangé en dev) ; prod `/var/lib/landolsi/uploads`, servi par Nginx ; copie initiale sans écrasement | Fait (disque local ; stockage objet non retenu, voir architecture §5) | Image servie depuis `UPLOAD_DIR` (HTTP 200) |
| 7 | Garder le polling Telegram actif (§15, §18 cloud) | Lancé dans le processus API | systemd `Restart=on-failure` ; `TELEGRAM_POLLING_ENABLED` pour éviter deux pollers ; arrêt propre | Fait | Démarrage/arrêt testés (polling désactivé en test) |
| 8 | Migrations versionnées plutôt que `sync({ alter: true })` (§7, §19) | `alter: true` à chaque démarrage | `sequelize-cli`, migration de référence non destructive, `DB_SYNC` (`alter` dev / `none` prod, `alter` refusé en prod) | Fait | Migration idempotente ; schéma inchangé sur base existante |
| 9 | Tester sur une base de test avant la production (§18 cloud) | — | `backup-restore.test.sh`, `api.test.js` sur base jetable | Fait | Voir readiness-report.md |
| 10 | Base PostgreSQL distante sauvegardée et protégée (§18 cloud) ; stratégie de sauvegarde/restauration (§19) | Aucune | `backup-db.sh`, `restore-db.sh`, timer quotidien, sauvegarde pré-migration ; base non exposée | Fait | Test de restauration complet réussi |
| 11 | Protéger les opérations admin côté serveur (§2, §16) | **`POST/PUT/DELETE /pneus`, `/marques`, `/compatibilites` sans aucune authentification** ; webhook Telegram public | `requireAdmin` ajouté ; `withCredentials` sur les appels marques ; webhook désactivé sans `TELEGRAM_WEBHOOK_SECRET` | Fait | `api.test.js` : 401 sans session, 403 pour un client |
| 12 | Ne pas renvoyer de détails internes au navigateur (§17 Gemini) | Gestionnaire d'erreurs renvoyant l'objet `err` complet | Message générique en production, détails en dev | Fait | Test 404 en production |
| 13 | Build de production sans erreur (§16, §18.8) | **Échec sous Linux** : 11 imports frontend à la mauvaise casse (Windows tolère) ; un 12ᵉ dans `routes/vehicule.js` aurait fait planter l’API au démarrage | Chemins corrigés ; `check-import-case.cjs` ajouté | Fait | `npm run build` OK |
| 14 | Traiter les erreurs `npm run lint` (§16) | 17 erreurs existantes (hooks React, variables inutilisées) | Aucune nouvelle erreur introduite ; corrections non faites (modifications du comportement des composants, hors périmètre déploiement) | Reporté | `npm run lint` : 17 avant / 17 après |
| 15 | Tests automatisés backend et frontend (§19) | Aucun | 12 tests backend (`node --test`), contrôles de déploiement | Partiel : pas de tests frontend | `npm test` |
| 16 | Logs centralisés et surveillance de disponibilité (§19) | `morgan('dev')` | journald, format `combined` en prod, `/health` (vérifie la base), `health-check.sh` | Partiel : pas de supervision externe (coût/complexité) | `/health` 200/503 testé |
| 17 | Validation des entrées, limitation des tentatives de connexion (§19) | Validation yup à l'inscription ; pas de limitation | Non fait (nouvelle dépendance et réglages métier) ; recommandé : `express-rate-limit` sur `/users/login` et `/users/forgot-password` | Reporté | — |
| 18 | Erreurs chatbot/notifications robustes (§15, §19) | Gemini sans clé : avertissement, pas de plantage | Aucun changement nécessaire pour le déploiement | Vérifié | Démarrage sans clé OK |
| 19 | Documentation OpenAPI/Swagger (§19) | Absente | Hors périmètre déploiement | Reporté | — |
| 20 | Créer l'administrateur de façon contrôlée (§14) | `createAdmin.js` réinitialise le mot de passe si le compte existe | Documenté ; script `npm run create-admin` ; chargement de config unifié | Fait (documentation) | — |
| 21 | Documenter le déploiement : URL, variables, base, images, HTTPS, logs, sauvegardes (§18.11) | Absent | `docs/deployment/*`, README | Fait | — |

## Écarts entre README et code relevés

- `GET /` ne renvoie pas `API fonctionne` mais `"hello world"` (le routeur
  `routes/index.js` est monté avant). Utiliser `GET /health`.
- Le README annonçait les variables `ADMIN_*` comme configuration du backend :
  elles ne servent qu'à `createAdmin.js`.
- `bin/www` (port 3000) n'est pas utilisé : le point d'entrée est `app.js`.
- `middleware/inscription.js` utilisait `bcrypt` sans l'importer
  (`User.login`, non appelé actuellement) : import ajouté.
