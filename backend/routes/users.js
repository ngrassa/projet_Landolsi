var express = require('express');
var router = express.Router();
const userController = require("../controllers/UserControllers");
const registerValidation = require("../middleware/inscription");
const requireAuth = require("../middleware/requireAuth")
const requireAdmin = require("../middleware/requireAdmin");
const rateLimit = require("../middleware/rateLimit");

// Anti force brute (constat CodeQL js/missing-rate-limiting) : un code TOTP ou
// de réinitialisation à 6 chiffres ne doit pas pouvoir être essayé en boucle.
const authMessage = "Trop de tentatives. Réessayez dans une minute.";
const loginLimit = rateLimit({ key: "login", max: 10, message: authMessage });
const mfaLimit = rateLimit({ key: "mfa", max: 10, message: authMessage });
const registerLimit = rateLimit({ key: "register", max: 10, message: authMessage });
const resetLimit = rateLimit({ key: "reset", max: 5, message: authMessage });



router.post("/register",registerLimit,registerValidation,userController.signup);
router.post("/login",loginLimit,userController.login_post );
router.post("/login/mfa",mfaLimit,userController.login_mfa );
router.post("/logout",userController.logout );

// Double authentification (application Authenticator)
router.get("/mfa/status",requireAuth,userController.mfaStatus );
router.post("/mfa/setup",requireAuth,userController.mfaSetup );
router.post("/mfa/enable",mfaLimit,requireAuth,userController.mfaEnable );
router.post("/mfa/disable",mfaLimit,requireAuth,userController.mfaDisable );
router.post("/mfa/recovery-codes",requireAuth,userController.mfaRegenerateRecoveryCodes );
router.get("/getprofile",requireAuth,userController.getProfile );
router.put("/updateprofile",requireAuth,userController.updateProfile);
router.post("/forgot-password", resetLimit, userController.ForgotPassword);
console.log("✅ users.js chargé");
router.post("/verify-reset-code", resetLimit, userController.VerifyResetCode);
router.post("/reset-password", resetLimit, userController.ResetPassword);

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

