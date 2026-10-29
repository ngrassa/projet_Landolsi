const express = require("express");

const router = express.Router();

const factureController = require("../controllers/FactureController");

const requireAuth = require("../middleware/requireAuth");


// ========================================
// RÉCUPÉRER LA FACTURE D'UNE COMMANDE
// ========================================

router.get(
    "/commande/:commandeId",
    requireAuth,
    factureController.getFactureByCommandeId
);


// ========================================
// TÉLÉCHARGER LA FACTURE EN PDF
// ========================================

router.get(
    "/commande/:commandeId/pdf",
    requireAuth,
    factureController.generateFacturePDF
);


module.exports = router;