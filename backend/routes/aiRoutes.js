const express = require("express");

const config = require("../config");
const requireAdmin = require("../middleware/requireAdmin");
const optionalAuth = require("../middleware/optionalAuth");
const rateLimit = require("../middleware/rateLimit");
const { createAiController } = require("../controllers/AiController");

// Fabrique : les tests injectent un client Mistral et un dépôt simulés
function createAiRouter({ controller = createAiController(), admin = requireAdmin } = {}) {
    const router = express.Router();
    const max = config.mistral.rateLimitPerMinute;

    router.post("/tire-advisor/chat",
        rateLimit({ key: "tire", max }),
        controller.tireAdvisorChat);

    router.post("/support/chat",
        rateLimit({ key: "support", max }),
        optionalAuth,
        controller.supportChat);

    // Contrôle des droits AVANT toute consommation de quota ou appel IA
    router.post("/admin/analytics/chat",
        admin,
        rateLimit({ key: "analytics", max }),
        controller.analyticsChat);

    router.get("/admin/analytics/kpis", admin, controller.analyticsKpis);

    return router;
}

module.exports = createAiRouter;
