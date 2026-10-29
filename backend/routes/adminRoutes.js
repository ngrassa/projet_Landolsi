
const express = require("express");

const router = express.Router();

const requireAdmin = require("../middleware/requireAdmin");


// ========================================
// Route de test administrateur
// ========================================

router.get("/test", requireAdmin, (req, res) => {

    res.status(200).json({
        success: true,
        message: "Bienvenue dans l'espace administrateur !",
        admin: {
            id: req.user.id,
            nom: req.user.nom,
            prenom: req.user.prenom,
            email: req.user.email,
            role: req.user.role
        }
    });

});


module.exports = router;
