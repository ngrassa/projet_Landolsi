# Architecture de déploiement — LANDOLSI TIRES

## 1. Application réelle (constatée dans le code)

| Composant | Technologie | Rôle | État |
|---|---|---|---|
| Frontend | React 19 + Vite 8, React Router, Axios | SPA servie en fichiers statiques après `npm run build` | Sans état côté serveur |
| Backend | Node.js + Express 4, un seul processus (`backend/app.js`) | API REST, sessions JWT en cookie HttpOnly, upload d'images (multer), PDF (pdfkit) | Avec état : images téléversées sur disque |
| Base | PostgreSQL via Sequelize 6 | 11 tables (users, Pneus, Marques, commandes, factures…), 2 types ENUM, aucune extension | Persistante |
| Tâche de fond | Polling Telegram (`services/telegramPolling.js`) | Boucle longue durée **dans le même processus** que l'API | Doit tourner sur **une seule** instance |
| Services externes | Gemini (`@google/genai`), SMTP Gmail (nodemailer), API immatriculation, API Telegram | Appels sortants HTTPS uniquement | Facultatifs |

Il n'existe ni file de messages, ni cache, ni service séparé : l'application est un
**monolithe Node.js + une base PostgreSQL**. La découper n'apporterait rien.

## 2. Architecture retenue : une instance EC2 Ubuntu, installation native

```text
                 Internet
                    │  80 / 443 (Security Group + ufw)
          ┌─────────▼──────────────────────────── EC2 Ubuntu 24.04 ─┐
          │  Nginx                                                   │
          │   ├── /            → /opt/landolsi/current/frontend/dist │
          │   ├── /api/uploadPneu/ → /var/lib/landolsi/uploads (disque)│
          │   └── /api/*       → 127.0.0.1:5001 (préfixe retiré)      │
          │                                                          │
          │  systemd : landolsi-backend.service (utilisateur landolsi)│
          │   └── node app.js  (HOST=127.0.0.1, PORT=5001)            │
          │        └── polling Telegram (même processus)              │
          │                                                          │
          │  PostgreSQL 16 (localhost:5432 uniquement)               │
          │  systemd : landolsi-backup.timer → pg_dump quotidien      │
          │            → /var/backups/landolsi (rotation 14)          │
          └──────────────────────────────────────────────────────────┘
                    │ sortie HTTPS : Telegram, Gemini, SMTP, apt, npm
```

### Pourquoi ce choix

- **Native + systemd plutôt que Docker** : un seul processus Node et une base ;
  systemd fournit déjà redémarrage automatique, journaux (`journalctl`),
  isolation (`ProtectSystem=strict`, utilisateur dédié) et ordre de démarrage.
  Docker ajouterait une couche à maintenir sur une instance de 1–2 Go sans gain
  de reproductibilité significatif : `install.sh` est idempotent et les versions
  sont figées par les `package-lock.json`.
- **Une seule instance** : la charge attendue (PFE, démonstration, boutique
  locale) est faible ; le polling Telegram impose de toute façon une instance
  unique ; AWS Academy limite budget et durée de session. Une deuxième instance
  (base séparée) doublerait le coût et la maintenance sans exigence de
  disponibilité qui la justifie.
- **Même origine (`/api`)** : le frontend et l'API sont servis par le même Nginx.
  Le cookie de session `SameSite=Lax` fonctionne sans CORS ni
  `SameSite=None`, et l'API n'est jamais exposée directement (écoute sur
  127.0.0.1).
- **Images hors du répertoire de version** : `UPLOAD_DIR=/var/lib/landolsi/uploads`
  survit aux déploiements et retours arrière ; Nginx les sert directement.

### Versions et déploiement

```text
/opt/landolsi/
├── releases/20261029115247-15f37ff/   # une version = code + node_modules + dist
├── releases/...                       # 5 versions conservées
└── current -> releases/<active>       # bascule atomique (mv -T)
/etc/landolsi/backend.env              # secrets (root:landolsi 0640)
/var/lib/landolsi/uploads/             # images (persistantes)
/var/backups/landolsi/                 # sauvegardes pg_dump (0700)
```

`deploy.sh` : copie → `npm ci` → build Vite → sauvegarde base → migrations →
bascule → redémarrage → contrôle de santé → retour automatique à la version
précédente en cas d'échec. Le redémarrage coupe l'API quelques secondes : ce
n'est **pas** un déploiement sans interruption.

## 3. Communication et ports

| Flux | Port | Exposition |
|---|---|---|
| Navigateur → Nginx | 80 (443 avec domaine) | Public |
| Administrateur → SSH | 22 | Restreint à `ssh_allowed_cidr` (Security Group) |
| Nginx → API Node | 5001 | 127.0.0.1 uniquement |
| API → PostgreSQL | 5432 | localhost uniquement (configuration Ubuntu par défaut) |
| API → Telegram/Gemini/SMTP | 443/465/587 sortant | Sortant |

## 4. Comportement en cas de panne

| Panne | Effet | Récupération |
|---|---|---|
| Crash du processus Node | API indisponible quelques secondes | `Restart=on-failure` (5 s) |
| Base indisponible au démarrage | Le processus s'arrête (code 1) au lieu de servir des erreurs | systemd réessaie ; `/health` renvoie 503 |
| Redémarrage / arrêt du lab AWS | Tout s'arrête | Services `enabled` : redémarrent au boot ; le timer de sauvegarde rattrape (`Persistent=true`) |
| Perte du volume EBS | **Perte de la base et des images** | Restaurer depuis une sauvegarde **copiée hors de l'instance** (voir database-backup-restore.md) |
| Gemini / Telegram / SMTP indisponibles | Fonction concernée en erreur, reste de l'API fonctionnel | Automatique |

## 5. Portabilité

Le code applicatif ne dépend d'aucun service AWS. Les éléments spécifiques à
AWS sont isolés dans `infra/aws/` (Terraform). `scripts/install.sh`,
`deploy.sh`, `systemd/` et `nginx/` fonctionnent sur n'importe quelle VM
Ubuntu 22.04/24.04 (Azure, GCP, OVH, Scaleway, VPS, machine locale).

Dépendances d'infrastructure à fournir ailleurs : une VM Ubuntu avec IP
publique, un pare-feu réseau autorisant 22/80/443, un disque persistant, et
éventuellement un DNS + certificat TLS. La base peut être remplacée par
PostgreSQL managé (Supabase, RDS, Cloud SQL, Azure Database) via `DB_HOST` et
`DB_SSL=true`, sans changement de code.

Limites : les images restent sur le disque local (pas de stockage objet), donc
une seule instance applicative est possible sans travail supplémentaire.
