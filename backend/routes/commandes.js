const express = require("express");

const router = express.Router();

const commandeController = require("../controllers/CommandeController");

const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");


// ========================================
// CRÉER UNE COMMANDE
// ========================================

router.post(
    "/",
    requireAuth,
    commandeController.createCommande
);


// ========================================
// MES COMMANDES
// ========================================
router.get(
    "/mes-commandes",
    requireAuth,
    commandeController.getMesCommandes
);



router.get(
    "/admin",
    requireAdmin,
    commandeController.getAllCommandesAdmin
);


// ========================================
// UNE COMMANDE PAR ID
// ========================================

router.get(
    "/:id",
    requireAuth,
    commandeController.getCommandeById
);



// ========================================
// MODIFIER LE STATUT - ADMIN
 //========================================

router.put(
    "/:id/statut",
    requireAdmin,
    commandeController.updateStatutCommande
);

// ========================================
// SUPPRIMER UNE COMMANDE - ADMIN
// ========================================

router.delete(
    "/:id",
    requireAdmin,
    commandeController.deleteCommande
);


module.exports = router;