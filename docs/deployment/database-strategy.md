# Stratégie de base de données

## 1. Constat

| Élément | Valeur constatée |
|---|---|
| Moteur | PostgreSQL (dialecte Sequelize `postgres`, pilote `pg` 8) |
| Version source | **Inconnue** : la base de développement (`pneus_db` sur `localhost:5432`) n'était pas accessible depuis l'environnement de travail |
| Taille | Non mesurable pour la même raison ; 36 images dans le dépôt (~3 Mo) ; catalogue de boutique : volume attendu faible (Mo, pas Go) |
| Schéma | 11 tables + `SequelizeMeta`, 2 types ENUM, clés étrangères, contrainte unique sur `users.email` |
| Extensions | Aucune |
| Requêtes SQL brutes | Aucune (`sequelize.query` absent) : tout passe par l'ORM |
| Migrations | Aucune à l'origine : `sync({ alter: true })` à chaque démarrage |
| Authentification | Applicative (bcrypt + JWT), **indépendante** de la base |
| Fichiers | Images sur disque, pas en base |

Ajouté pendant ce travail : migrations versionnées (`sequelize-cli`), migration
de référence non destructive, option `DB_SSL` pour une base managée, sauvegarde
et restauration scriptées et testées.

## 2. Options comparées

| Critère | A. PostgreSQL sur la même EC2 | A'. PostgreSQL sur une 2ᵉ EC2 | B. Supabase (PostgreSQL managé) | C. Amazon RDS PostgreSQL |
|---|---|---|---|---|
| Compatibilité | Totale (même moteur) | Totale | Totale (PostgreSQL standard, aucune extension requise) | Totale |
| Complexité de migration | `pg_dump` / `pg_restore` | Idem + réseau privé | Idem + TLS + pooler | Idem + TLS + sous-réseaux |
| Intégrité | Transactionnelle, sauvegardes scriptées | Idem | Sauvegardes du fournisseur (selon plan) | Snapshots automatiques |
| Charge d'exploitation | Mises à jour Ubuntu, sauvegardes à superviser | Double | Faible | Faible |
| Sécurité | Port non exposé (localhost) | Port à ouvrir entre SG | Base joignable sur Internet (TLS + mot de passe) | Privé dans le VPC |
| Disponibilité | Celle de l'instance | Idem ×2 points de panne | Gérée | Gérée (Multi-AZ en option payante) |
| Latence | Nulle (local) | Réseau VPC | Internet (région à choisir) | Réseau VPC |
| Portabilité | Toute VM | Toute VM | Hors AWS, accessible de partout | Spécifique AWS |
| Coût | Inclus dans l'instance | 2ᵉ instance | Offre gratuite limitée ; projets gratuits mis en pause après inactivité (vérifier les conditions actuelles) | Facturé à l'heure, consomme le crédit du lab |
| AWS Academy | Fonctionne (seulement EC2/EBS) | Fonctionne | Indépendant du lab (survit à la fin des crédits) | Souvent disponible mais coûteux pour le crédit et arrêté avec le lab ; création parfois restreinte |
| Maintenabilité | Simple, un seul hôte | Plus complexe | Simple | Simple |

Points spécifiques Supabase à vérifier avant de l'adopter :
- la connexion directe est généralement en IPv6 ; depuis une EC2 IPv4 il faut le
  **pooler** (Supavisor, mode session, port 5432) ;
- le mode « transaction » du pooler (port 6543) est déconseillé avec Sequelize
  (instructions préparées / état de session) ;
- inutile d'adopter Supabase Auth, Storage ou RLS : l'application garde son
  authentification et accède à la base uniquement côté serveur avec un rôle
  dédié. La clé `service_role` ne doit jamais apparaître dans le frontend.

## 3. Décision : option A — PostgreSQL 16 local sur l'instance EC2

**Raisons :**
1. L'application est un monolithe à faible volume ; la base locale n'ajoute
   aucune latence ni dépendance réseau.
2. Aucun port de base exposé : surface d'attaque minimale.
3. Seuls EC2 et EBS sont nécessaires : compatible avec les restrictions et le
   budget AWS Academy.
4. Migration la plus simple et entièrement vérifiable (`pg_dump` → `pg_restore`,
   testé sur PostgreSQL 15).
5. **Réversible** : passer à Supabase ou RDS plus tard ne demande que
   `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_SSL=true` et une restauration de la
   même archive. Aucun code à modifier.

**Contreparties assumées (ce n'est pas un service managé) :**
- l'équipe est responsable des sauvegardes, de leur copie hors instance, des
  mises à jour de sécurité et de la surveillance de l'espace disque ;
- la disponibilité est celle d'une seule instance ;
- une sauvegarde stockée uniquement sur l'instance ne protège pas contre la
  perte du volume : **copiez régulièrement `/var/backups/landolsi` hors de
  l'EC2** (voir database-backup-restore.md §4).

**Quand changer d'avis :** si l'instance doit être recréée souvent (fin de lab,
nouveau compte), si plusieurs instances applicatives deviennent nécessaires, ou
si une disponibilité supérieure est exigée → Supabase (hors AWS Academy, survit
au lab) ou RDS (compte AWS standard).

## 4. Gestion du schéma

- Production : `DB_SYNC=none` (imposé : `alter` est refusé au démarrage en
  production). Le schéma évolue uniquement par `npm run db:migrate`, exécuté par
  `deploy.sh` **après** une sauvegarde.
- Développement : `DB_SYNC=alter` reste le défaut pour ne pas changer les
  habitudes de l'équipe.
- `migrations/20261029000000-baseline-schema.js` crée les tables manquantes
  (`CREATE TABLE IF NOT EXISTS`) et n'altère rien sur une base existante
  (vérifié : schéma identique avant/après sur une base créée par l'ancien
  `sync({ alter: true })`).
- Nouvelle évolution : `npx sequelize-cli migration:generate --name ajout-colonne-x`,
  puis écrire `up`/`down` avec `queryInterface`.
