const express = require("express");

const router = express.Router();

const promotionController = require("../controllers/PromotionController");

const requireAdmin = require("../middleware/requireAdmin");


// ========================================
// PROMOTIONS
// ========================================

// Client + Admin : consulter les promotions actives
router.get(
    "/",
    promotionController.getPromotions
);

// Admin uniquement : consulter toutes les promotions
router.get(
    "/admin",
    requireAdmin,
    promotionController.getAllPromotionsAdmin
);

// Client + Admin : consulter une promotion
router.get(
    "/:id",
    promotionController.getPromotionById
);


// ========================================
// ADMIN UNIQUEMENT
// ========================================

// Ajouter une promotion
router.post(
    "/",
    requireAdmin,
    promotionController.createPromotion
);

// Modifier une promotion
router.put(
    "/:id",
    requireAdmin,
    promotionController.updatePromotion
);

// Supprimer une promotion
router.delete(
    "/:id",
    requireAdmin,
    promotionController.deletePromotion
);


module.exports = router;