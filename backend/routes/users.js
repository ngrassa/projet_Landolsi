var express = require('express');
var router = express.Router();
const userController = require("../controllers/UserControllers");
const registerValidation = require("../middleware/inscription");
const requireAuth = require("../middleware/requireAuth")
const requireAdmin = require("../middleware/requireAdmin");



router.post("/register",registerValidation,userController.signup);
router.post("/login",userController.login_post );
router.post("/logout",userController.logout );
router.get("/getprofile",requireAuth,userController.getProfile );
router.put("/updateprofile",requireAuth,userController.updateProfile);
router.post("/forgot-password", userController.ForgotPassword);
console.log("✅ users.js chargé");
router.post("/verify-reset-code", userController.VerifyResetCode);
router.post("/reset-password", userController.ResetPassword);

// =====================================
// ROUTES ADMIN - UTILISATEURS
// =====================================

// Voir tous les utilisateurs
router.get(
    "/admin",
    requireAdmin,
    userController.getAllUsers
);

// Activer / désactiver un utilisateur
router.put(
    "/admin/:id/status",
    requireAdmin,
    userController.toggleUserStatus
);

// Supprimer un utilisateur
router.delete(
    "/admin/:id",
    requireAdmin,
    userController.deleteUser
);




module.exports = router;

