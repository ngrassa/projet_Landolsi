
const express = require("express");
const router = express.Router();

const reclamationController = require("../controllers/ReclamationController");

// Middleware d'authentification
const requireAuth = require("../middleware/requireAuth");

// Middleware administrateur
const requireAdmin = require("../middleware/requireAdmin");

// Client connecté : créer une réclamation
router.post(
    "/",
    requireAuth,
    reclamationController.createReclamation
);

// Client connecté : consulter ses réclamations
router.get(
    "/mes-reclamations",
    requireAuth,
    reclamationController.getMesReclamations
);

// Administrateur : consulter toutes les réclamations
router.get(
    "/",
    requireAuth,
    requireAdmin,
    reclamationController.getAllReclamations
);

// Administrateur : répondre et modifier le statut
router.put(
    "/:id",
    requireAuth,
    requireAdmin,
    reclamationController.updateReclamation
);

// Administrateur : supprimer une réclamation
router.delete(
    "/:id",
    requireAuth,
    requireAdmin,
    reclamationController.deleteReclamation
);

module.exports = router;