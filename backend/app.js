var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const http = require('http');

// Doit être chargé en premier : lit .env / l'environnement systemd
const config = require("./config");

const sequelize = require("./db/db");

var app = express();

if (config.trustProxy) {
    // Derrière Nginx : IP client et protocole réels (X-Forwarded-*)
    app.set("trust proxy", 1);
}


// =====================================================
// IMPORT DES ROUTES
// =====================================================
const telegramRoutes = require("./routes/telegramRoutes");
const { demarrerTelegramPolling, arreterTelegramPolling } = require("./services/telegramPolling");
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var pneuRoutes = require("./routes/pneuRoutes");
var marqueRouter = require("./routes/marqueRoutes");
const vehiculeRouter = require("./routes/vehicule");
var compatibiliteRouter = require("./routes/compatibiliteRoutes");
const commandesRouter = require("./routes/commandes");
const promotionRoutes = require("./routes/PromotionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const factureRoutes = require("./routes/FactureRoutes");
const avisRoutes = require("./routes/AvisRoutes");
const reclamationRouter = require("./routes/reclamationRoutes");



// =====================================================
// IMPORT DES ASSOCIATIONS
// =====================================================

require("./models/associations");


// =====================================================
// CORS
// =====================================================

app.use(cors({
    origin: config.corsOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));


// =====================================================
// MIDDLEWARES
// =====================================================

app.use(logger(config.isProduction ? 'combined' : 'dev'));

app.use(express.json());

app.use(cookieParser());

app.use(express.urlencoded({
    extended: false
}));

// Images téléversées : répertoire persistant configurable (UPLOAD_DIR)
app.use('/uploadPneu', express.static(config.uploadDir));

app.use(express.static(path.join(__dirname, 'public')));


// =====================================================
// HEALTH CHECK (supervision, Nginx, scripts de déploiement)
// =====================================================

app.get("/health", async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ status: "ok", database: "up", uptime: Math.round(process.uptime()) });
    } catch (error) {
        console.error("❌ Health check : base de données indisponible :", error.message);
        res.status(503).json({ status: "error", database: "down" });
    }
});


// =====================================================
// ROUTES
// =====================================================

app.use('/', indexRouter);

app.use('/users', usersRouter);

app.use("/pneus", pneuRoutes);

app.use("/marques", marqueRouter);

app.use("/vehicules", vehiculeRouter);

app.use("/compatibilites", compatibiliteRouter);

app.use("/commandes", commandesRouter);
app.use("/promotions", promotionRoutes);
app.use("/admin", adminRoutes);
app.use("/chatbot", chatbotRoutes);
app.use("/factures", factureRoutes);
app.use("/avis", avisRoutes);
app.use("/reclamations", reclamationRouter);
app.use("/telegram", telegramRoutes);


// =====================================================
// TEST API
// =====================================================

app.get("/", (req, res) => {
    res.send("API fonctionne");
});


// =====================================================
// ROUTE 404
// =====================================================

app.use(function (req, res, next) {

    next(createError(404));

});


// =====================================================
// GESTION DES ERREURS
// =====================================================

app.use(function (err, req, res, next) {

    const status = err.status || 500;

    if (status >= 500) {
        console.error("❌ Erreur serveur :", err);
    }

    // En production, ne jamais renvoyer les détails internes au navigateur
    if (config.isProduction) {
        return res.status(status).json({
            message: status >= 500 ? "Erreur serveur" : err.message
        });
    }

    res.status(status).json({

        message: err.message,

        error: err

    });

});


// =====================================================
// CONNEXION SEQUELIZE + SYNCHRONISATION DU SCHÉMA
// =====================================================

async function prepareDatabase() {

    await sequelize.authenticate();

    console.log("✅ Connexion Sequelize réussie !");

    if (config.db.sync === "alter") {

        await sequelize.sync({ alter: true });
        console.log("✅ Les tables ont été mises à jour (DB_SYNC=alter) !");

    } else if (config.db.sync === "safe") {

        await sequelize.sync();
        console.log("✅ Tables manquantes créées (DB_SYNC=safe).");

    } else {

        console.log("ℹ️ DB_SYNC=none : schéma géré par les migrations.");

    }
}


// =====================================================
// CRÉATION DU SERVEUR + ARRÊT PROPRE
// =====================================================

async function start() {

    config.validate();

    await prepareDatabase();

    const server = http.createServer(app);

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(config.port, config.host, resolve);
    });

    console.log(`🚀 App is running on port ${config.port}`);

    if (config.telegramPollingEnabled) {
        demarrerTelegramPolling();
    } else {
        console.log("ℹ️ Polling Telegram désactivé (TELEGRAM_POLLING_ENABLED=false).");
    }

    let stopping = false;

    const shutdown = (signal) => {

        if (stopping) return;
        stopping = true;

        console.log(`🛑 ${signal} reçu : arrêt du serveur...`);

        arreterTelegramPolling();

        // Forcer l'arrêt si des connexions restent ouvertes
        setTimeout(() => {
            console.error("⚠️ Arrêt forcé après délai d'attente.");
            process.exit(1);
        }, 10000).unref();

        server.close(async () => {
            await sequelize.close().catch(() => {});
            console.log("✅ Serveur arrêté proprement.");
            process.exit(0);
        });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    return server;
}

if (require.main === module) {

    start().catch((err) => {

        console.error("❌ Démarrage impossible :", err.message);
        process.exit(1);

    });

}

module.exports = app;
module.exports.start = start;
