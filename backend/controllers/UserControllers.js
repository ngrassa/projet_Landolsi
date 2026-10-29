const User = require("../models/UserModel");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const config = require("../config");
const { sendResetPasswordEmail } = require("../services/emailService");


const maxAge = 2 * 60*60


const createToken = (id) => {
    return jwt.sign( { id }, config.jwtSecret, { expiresIn: maxAge, }
    )
}






// =====================================
// Inscription d'un nouvel utilisateur
// =====================================
module.exports.signup = async (req, res) => {

    try {

        // Récupérer les données envoyées par le frontend
        const {
            nom,
            prenom,
            email,
            password,
            telephone,
            adresse,
            ville,
            codePostal,
            pays,
            typeClient,
            raisonSociale,
            activite,
            identifiantEntreprise,
            numeroTVA,
            secteur
        } = req.body;



        // Création de l'utilisateur
        // IMPORTANT :
        // Le password sera automatiquement haché
        // grâce au hook beforeCreate dans User.js
        const user = await User.create({

            nom,
            prenom,
            email,
            password,

            telephone,
            adresse,
            ville,
            codePostal,
            pays,

            typeClient,

            // Informations professionnelles
            raisonSociale,
            activite,
            identifiantEntreprise,
            numeroTVA,
            secteur

            // role n'est pas envoyé
            // par sécurité
            // Sequelize met automatiquement:
            // role = "client"

        });



        // Réponse envoyée au client
        return res.status(201).json({

            success: true,

            message: "Compte créé avec succès",

            user: {

                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                typeClient: user.typeClient

            }

        });



    } catch (error) {


        console.log(error);


        return res.status(500).json({

            success: false,

            message: "Erreur lors de la création du compte"

        });

    }

};
module.exports.login_post = async (req, res) => {

    try {

        // ==============================
        // 1. Récupérer les données
        // ==============================

        const { email, password } = req.body;


        // ==============================
        // 2. Vérifier les champs
        // ==============================

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "L'adresse e-mail et le mot de passe sont obligatoires."

            });

        }


        // ==============================
        // 3. Rechercher l'utilisateur
        // ==============================

        const user = await User.findOne({

            where: {
                email: email.trim().toLowerCase()
            }

        });


        // Debug : on affiche seulement l'email
        console.log(
            "Tentative de connexion :",
            email
        );


        // ==============================
        // 4. Vérifier l'e-mail
        // ==============================

        if (!user) {

            return res.status(400).json({

                success: false,

                message:
                    "Adresse e-mail incorrecte."

            });

        }


        // ==============================
        // 5. Vérifier si le compte est actif
        // ==============================

        if (!user.isActive) {

            return res.status(403).json({

                success: false,

                message:
                    "Votre compte est désactivé."

            });

        }


        // ==============================
        // 6. Vérifier le mot de passe
        // ==============================

        const auth = await bcrypt.compare(

            password,

            user.password

        );


        if (!auth) {

            return res.status(400).json({

                success: false,

                message:
                    "Mot de passe incorrect."

            });

        }


        // ==============================
        // 7. Créer le JWT
        // ==============================

        const token = createToken(user.id);


        // ==============================
        // 8. Envoyer le cookie
        // ==============================

        res.cookie(

            "jwt_token",

            token,

            {

                httpOnly: true,

                secure: config.cookieSecure,

                sameSite: "lax",

                maxAge: maxAge * 1000

            }

        );


        // ==============================
        // 9. Connexion réussie
        // ==============================

        console.log(
            "Connexion réussie pour :",
            user.email
        );


        return res.status(200).json({

            success: true,

            message:
                "Connexion réussie",

            user: {

                id: user.id,

                nom: user.nom,

                prenom: user.prenom,

                email: user.email,

                telephone: user.telephone,

                role: user.role,

                typeClient: user.typeClient

            }

        });


    } catch (error) {

        console.error(
            "Erreur login :",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Une erreur est survenue lors de la connexion."

        });

    }

};


module.exports.logout = (req, res) => {

    // Supprimer le cookie JWT
    res.clearCookie("jwt_token", {
        httpOnly: true,
        secure: config.cookieSecure,
        sameSite: "lax"
    });

    return res.status(200).json({
        success: true,
        message: "Déconnexion réussie"
    });

};

// =====================================
// Récupérer le profil de l'utilisateur connecté
// =====================================

module.exports.getProfile = async (req, res) => {

    try {

        // Récupérer l'utilisateur grâce à l'id du token JWT
        const user = await User.findByPk(req.userId, {

            attributes: [
                "id",
                "nom",
                "prenom",
                "email",
                "telephone",
                "adresse",
                "ville",
                "codePostal",
                "pays",
                "typeClient",
                "raisonSociale",
                "activite",
                "identifiantEntreprise",
                "numeroTVA",
                "secteur",
                "role"
            ]

        });



        // Si utilisateur non trouvé
        if (!user) {

            return res.status(404).json({

                message: "Utilisateur introuvable"

            });

        }



        // Retourner les informations
        res.status(200).json({

            success: true,

            user: user

        });



    } catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: "Erreur serveur"

        });

    }

};



// =====================================
// Modifier le profil de l'utilisateur connecté
// =====================================

module.exports.updateProfile = async (req, res) => {

    try {

        // ID récupéré depuis le JWT
        const userId = req.userId;

        // Données envoyées par le frontend
        const {
            nom,
            prenom,
            telephone,
            adresse,
            ville,
            codePostal,
            pays,
            raisonSociale,
            activite,
            identifiantEntreprise,
            numeroTVA,
            secteur
        } = req.body;


        // ==============================
        // Récupérer l'utilisateur
        // ==============================

        const user = await User.findByPk(userId);

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "Utilisateur introuvable."

            });

        }


        // ==============================
        // Modifier les informations
        // ==============================

        user.nom = nom;
        user.prenom = prenom;
        user.telephone = telephone;
        user.adresse = adresse;
        user.ville = ville;
        user.codePostal = codePostal;
        user.pays = pays;


        // ==============================
        // Informations professionnelles
        // ==============================

        user.raisonSociale = raisonSociale;
        user.activite = activite;
        user.identifiantEntreprise = identifiantEntreprise;
        user.numeroTVA = numeroTVA;
        user.secteur = secteur;


        // ==============================
        // Sauvegarder
        // ==============================

        await user.save();


        // ==============================
        // Réponse
        // ==============================

        return res.status(200).json({

            success: true,

            message: "Profil modifié avec succès.",

            user: {

                id: user.id,

                nom: user.nom,

                prenom: user.prenom,

                email: user.email,

                telephone: user.telephone,

                adresse: user.adresse,

                ville: user.ville,

                codePostal: user.codePostal,

                pays: user.pays,

                typeClient: user.typeClient,

                raisonSociale: user.raisonSociale,

                activite: user.activite,

                identifiantEntreprise:
                    user.identifiantEntreprise,

                numeroTVA: user.numeroTVA,

                secteur: user.secteur,

                role: user.role

            }

        });


    } catch (error) {

        console.error(
            "Erreur modification profil :",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Impossible de modifier le profil."

        });

    }

};



// =====================================================
// MOT DE PASSE OUBLIÉ
// =====================================================

// =====================================================
// MOT DE PASSE OUBLIÉ
// =====================================================

module.exports.ForgotPassword = async (req, res) => {

    try {

        // ==============================
        // 1. Récupérer l'email
        // ==============================

        const { email } = req.body;

        if (!email) {

            return res.status(400).json({
                success: false,
                message: "Veuillez saisir votre adresse email."
            });

        }


        // ==============================
        // 2. Nettoyer l'email
        // ==============================

        const emailClean = email.trim().toLowerCase();


        // ==============================
        // 3. Rechercher l'utilisateur
        // ==============================

        const user = await User.findOne({
            where: {
                email: emailClean
            }
        });


        // ==============================
        // 4. Vérifier l'utilisateur
        // ==============================

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "Aucun compte associé à cette adresse email."
            });

        }


        // ==============================
        // 5. Générer un code à 6 chiffres
        // ==============================

        const resetCode = crypto
            .randomInt(100000, 1000000)
            .toString();


        // ==============================
        // 6. Expiration : 10 minutes
        // ==============================

        const expiration = new Date(
            Date.now() + 10 * 60 * 1000
        );


        // ==============================
        // 7. Enregistrer le code en base
        // ==============================

        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = expiration;

        await user.save();


        // ==============================
        // 8. Envoyer le code par email
        // ==============================

        await sendResetPasswordEmail(
            user.email,
            resetCode
        );


        // ==============================
        // 9. Réponse
        // ==============================

        return res.status(200).json({

            success: true,

            message:
                "Un code de récupération a été envoyé à votre adresse email."

        });


    } catch (error) {

        console.error(
            "❌ Erreur ForgotPassword :",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Une erreur est survenue lors de l'envoi du code de récupération."

        });

    }

};

module.exports.VerifyResetCode = async (req, res) => {

    try {

        const { email, code } = req.body;

        // Vérifier que les données sont présentes
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: "Email et code sont obligatoires."
            });
        }

        // Nettoyer l'email
        const emailClean = email.trim().toLowerCase();

        // Chercher l'utilisateur
        const user = await User.findOne({
            where: {
                email: emailClean
            }
        });

        // Utilisateur inexistant
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Aucun compte associé à cette adresse email."
            });
        }

        // Vérifier qu'un code existe
        if (!user.resetPasswordCode) {
            return res.status(400).json({
                success: false,
                message: "Aucun code de récupération n'a été demandé."
            });
        }

        // Vérifier le code
        if (user.resetPasswordCode !== code.toString()) {
            return res.status(400).json({
                success: false,
                message: "Code de récupération incorrect."
            });
        }

        // Vérifier l'expiration
        if (
            !user.resetPasswordExpires ||
            new Date() > new Date(user.resetPasswordExpires)
        ) {
            return res.status(400).json({
                success: false,
                message: "Le code de récupération a expiré."
            });
        }

        // Tout est correct
        return res.status(200).json({
            success: true,
            message: "Code de récupération valide."
        });

    } catch (error) {

        console.error("❌ Erreur VerifyResetCode :", error);

        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la vérification du code."
        });
    }
};
module.exports.ResetPassword = async (req, res) => {

    try {

        const { email, code, newPassword } = req.body;

        // 1. Vérifier les données
        if (!email || !code || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, code et nouveau mot de passe sont obligatoires."
            });
        }

        // 2. Vérifier la longueur du mot de passe
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Le nouveau mot de passe doit contenir au moins 8 caractères."
            });
        }

        // 3. Nettoyer l'email
        const emailClean = email.trim().toLowerCase();

        // 4. Chercher l'utilisateur
        const user = await User.findOne({
            where: {
                email: emailClean
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Aucun compte associé à cette adresse email."
            });
        }

        // 5. Vérifier qu'un code existe
        if (!user.resetPasswordCode) {
            return res.status(400).json({
                success: false,
                message: "Aucun code de récupération n'a été demandé."
            });
        }

        // 6. Vérifier le code
        if (user.resetPasswordCode !== code.toString()) {
            return res.status(400).json({
                success: false,
                message: "Code de récupération incorrect."
            });
        }

        // 7. Vérifier l'expiration
        if (
            !user.resetPasswordExpires ||
            new Date() > new Date(user.resetPasswordExpires)
        ) {
            return res.status(400).json({
                success: false,
                message: "Le code de récupération a expiré."
            });
        }

        // 8. Modifier le mot de passe
        user.password = newPassword;

        // 9. Supprimer le code après utilisation
        user.resetPasswordCode = null;
        user.resetPasswordExpires = null;

        // 10. Sauvegarder
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Votre mot de passe a été réinitialisé avec succès."
        });

    } catch (error) {

        console.error("❌ Erreur ResetPassword :", error);

        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la réinitialisation du mot de passe."
        });
    }
};





// ========================================
// ADMIN — Afficher tous les utilisateurs
// ========================================

module.exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: {
                exclude: [
                    "password",
                    "resetPasswordCode",
                    "resetPasswordExpires"
                ]
            },
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            success: true,
            users
        });

    } catch (error) {
        console.error("❌ Erreur récupération utilisateurs :", error);

        return res.status(500).json({
            success: false,
            message: "Impossible de récupérer les utilisateurs.",
            error: error.message
        });
    }
};


// ========================================
// ADMIN — Activer / désactiver un utilisateur
// ========================================

module.exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur introuvable."
            });
        }

        // L'admin connecté ne peut pas désactiver son propre compte
        if (Number(user.id) === Number(req.userId)) {
            return res.status(400).json({
                success: false,
                message: "Vous ne pouvez pas désactiver votre propre compte."
            });
        }

        user.isActive = !user.isActive;

        await user.save();

        return res.status(200).json({
            success: true,
            message: user.isActive
                ? "Utilisateur activé avec succès."
                : "Utilisateur désactivé avec succès.",
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error("❌ Erreur modification statut utilisateur :", error);

        return res.status(500).json({
            success: false,
            message: "Impossible de modifier le statut de l'utilisateur.",
            error: error.message
        });
    }
};


// ========================================
// ADMIN — Supprimer un utilisateur
// ========================================

module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur introuvable."
            });
        }

        // L'admin ne peut pas supprimer son propre compte
        if (Number(user.id) === Number(req.userId)) {
            return res.status(400).json({
                success: false,
                message: "Vous ne pouvez pas supprimer votre propre compte."
            });
        }

        await user.destroy();

        return res.status(200).json({
            success: true,
            message: "Utilisateur supprimé avec succès."
        });

    } catch (error) {
        console.error("❌ Erreur suppression utilisateur :", error);

        return res.status(500).json({
            success: false,
            message: "Impossible de supprimer cet utilisateur.",
            error: error.message
        });
    }
};