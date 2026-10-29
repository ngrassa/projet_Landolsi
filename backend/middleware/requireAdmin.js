
const { User } = require("../models/associations");
const requireAuth = require("./requireAuth");


// ========================================
// Middleware pour vérifier si l'utilisateur
// est administrateur
// ========================================

const requireAdmin = (req, res, next) => {

    // Vérifier d'abord que l'utilisateur est connecté
    requireAuth(req, res, async () => {

        try {

            // Récupérer l'utilisateur connecté
            const user = await User.findByPk(req.userId);

            // Utilisateur introuvable
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Utilisateur introuvable"
                });
            }

            // Vérifier le rôle
            if (user.role !== "admin") {
                return res.status(403).json({
                    success: false,
                    message: "Accès réservé aux administrateurs"
                });
            }

            // Stocker l'utilisateur dans req.user
            req.user = user;

            // Autoriser l'accès
            next();

        } catch (error) {

            console.error("Erreur vérification admin :", error);

            return res.status(500).json({
                success: false,
                message: "Erreur serveur"
            });
        }

    });
};


module.exports = requireAdmin;

