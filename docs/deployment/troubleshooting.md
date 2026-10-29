# Dépannage

Premier réflexe :
```bash
/opt/landolsi/current/scripts/health-check.sh
systemctl status landolsi-backend nginx postgresql
journalctl -u landolsi-backend -n 100 --no-pager
sudo tail -n 50 /var/log/nginx/error.log
```

| Symptôme | Cause probable | Vérification / correction |
|---|---|---|
| `Configuration invalide : JWT_SECRET est obligatoire` au démarrage | Variable absente en production | `openssl rand -hex 32` → `JWT_SECRET=` dans `/etc/landolsi/backend.env` |
| `DB_SYNC=alter est interdit en production` | Ancien réglage | `DB_SYNC=none` et `npm run db:migrate` (fait par `deploy.sh`) |
| `Démarrage impossible : connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL arrêté | `sudo systemctl start postgresql` ; le service API redémarre seul |
| `password authentication failed` | `DB_PASSWORD` différent du rôle | `sudo -u postgres psql -c "ALTER ROLE landolsi PASSWORD '<nouveau>'"` puis mettre à jour le fichier |
| `relation "users" does not exist` | Migrations non appliquées | `cd /opt/landolsi/current/backend && sudo -u landolsi env NODE_ENV=production ENV_FILE=/etc/landolsi/backend.env ./node_modules/.bin/sequelize-cli db:migrate` |
| `/api/health` → 502 Bad Gateway | API arrêtée ou en boucle de redémarrage | `journalctl -u landolsi-backend` ; `systemctl reset-failed landolsi-backend` après correction |
| `/api/health` → 503 `database: down` | API démarrée mais base inaccessible | Voir lignes PostgreSQL ci-dessus |
| Page blanche / 404 sur `/` | Build frontend absent | `ls /opt/landolsi/current/frontend/dist/index.html` ; relancer `deploy.sh` |
| 404 au rafraîchissement d'une page React | Fallback SPA absent | Le site Nginx doit contenir `try_files $uri $uri/ /index.html` ; `sudo nginx -t` |
| Le site ne répond pas du tout | Security Group, ufw, IP changée | IP actuelle dans la console ; règle 80 ; `sudo ufw status` |
| Connexion OK mais « session expirée » immédiate | `COOKIE_SECURE=true` en HTTP | `COOKIE_SECURE=false` tant que le site n'est pas en HTTPS |
| Images manquantes | Fichiers absents de `UPLOAD_DIR` | `ls /var/lib/landolsi/uploads` ; copier depuis la sauvegarde ou le poste (database-backup-restore.md §3) |
| `413 Request Entity Too Large` à l'upload | Image > 6 Mo | Limite multer 5 Mo ; réduire l'image |
| Erreur `EACCES` à l'upload | Droits du répertoire | `sudo chown -R landolsi: /var/lib/landolsi/uploads` |
| 401 sur les écrans admin (pneus, marques) | Session absente/expirée (ces routes sont désormais protégées) | Se reconnecter avec un compte `admin` |
| `EADDRINUSE :::5001` | Un autre processus utilise le port | `sudo ss -ltnp 'sport = :5001'` |
| Build frontend tué (`Killed`) | Mémoire insuffisante (t3.micro) | Vérifier le swap : `swapon --show` ; ou `t3.small` |
| `Could not resolve './components/Pneus/...'` | Casse des chemins (fonctionne sous Windows, pas sous Linux) | `node tests/deployment/check-import-case.cjs frontend/src backend` |
| Telegram : `409 Conflict` dans les journaux | Deux processus font le polling du même bot (ex. poste de dev + serveur) | `TELEGRAM_POLLING_ENABLED=false` sur l'un des deux |
| Chatbot `503 UNAVAILABLE` | Saturation temporaire de Gemini | Réessayer ; vérifier `GEMINI_API_KEY` et les quotas |
| E-mail de réinitialisation non reçu | SMTP Gmail | Mot de passe d'application Gmail dans `EMAIL_PASS` ; sortie 465/587 autorisée |
| `pg_dump: server version mismatch` | Client plus ancien que le serveur | `sudo scripts/install.sh --pg-client-version <N>` |
| `restore-db.sh` code 3 | Base cible non vide | Restaurer dans une nouvelle base (voir rollback.md) |
| Sauvegarde nocturne absente | Timer désactivé | `systemctl list-timers landolsi-backup.timer` ; `journalctl -u landolsi-backup` |
| Disque plein | Sauvegardes / journaux | `df -h` ; `du -sh /var/backups/landolsi` ; `journalctl --vacuum-size=200M` |
