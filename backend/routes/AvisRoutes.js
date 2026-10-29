const express = require("express");

const router = express.Router();

const avisController = require("../controllers/AvisController");

const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// ========================================
// Ajouter un avis
// ========================================

router.post(
    "/",
    requireAuth,
    avisController.createAvis
);


router.get(
    "/pneu/:pneuId",
    avisController.getAvisByPneu
);

// ========================================
// Récupérer tous les avis
// ========================================

router.get(
    "/",
    avisController.getAllAvis
);


// ========================================
// Récupérer l'avis d'une commande
// ========================================

router.get(
    "/commande/:commandeId",
    requireAuth,
    avisController.getAvisByCommande
);


// ========================================
// Supprimer un avis (admin)
// ========================================

router.delete(
    "/:id",
    requireAdmin,
    avisController.deleteAvis
);


module.exports = router;