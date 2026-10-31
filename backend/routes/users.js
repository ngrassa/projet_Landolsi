var express = require('express');
var router = express.Router();
const userController = require("../controllers/UserControllers");
const registerValidation = require("../middleware/inscription");
const requireAuth = require("../middleware/requireAuth")
const requireAdmin = require("../middleware/requireAdmin");



router.post("/register",registerValidation,userController.signup);
router.post("/login",userController.login_post );
router.post("/login/mfa",userController.login_mfa );
router.post("/logout",userController.logout );

// Double authentification (application Authenticator)
router.get("/mfa/status",requireAuth,userController.mfaStatus );
router.post("/mfa/setup",requireAuth,userController.mfaSetup );
router.post("/mfa/enable",requireAuth,userController.mfaEnable );
router.post("/mfa/disable",requireAuth,userController.mfaDisable );
router.post("/mfa/recovery-codes",requireAuth,userController.mfaRegenerateRecoveryCodes );
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

// Réinitialiser la double authentification d'un utilisateur
router.put(
    "/admin/:id/mfa/reset",
    requireAdmin,
    userController.resetUserMfa
);

// Supprimer un utilisateur
router.delete(
    "/admin/:id",
    requireAdmin,
    userController.deleteUser
);




module.exports = router;

