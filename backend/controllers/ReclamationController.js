
const Reclamation = require("../models/ReclamationModel");
const { envoyerNotificationTelegram } = require("../services/telegramService");
const User = require("../models/UserModel");

// ========================================
// 1. Créer une réclamation (client connecté)
// ========================================


exports.createReclamation = async (req, res) => {
    try {
        const { sujet, description } = req.body;
        const userId = req.userId;

        // Vérifier que le client est connecté
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Vous devez être connecté."
            });
        }

        // Vérifier les champs obligatoires
        if (
            typeof sujet !== "string" ||
            !sujet.trim() ||
            typeof description !== "string" ||
            !description.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Le sujet et la description sont obligatoires."
            });
        }

        // Récupérer les informations du client
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur introuvable."
            });
        }

        // Créer la réclamation
        const reclamation = await Reclamation.create({
            userId,
            sujet: sujet.trim(),
            description: description.trim(),
            statut: "En attente"
        });

        // Notification Telegram
        const nomClient = `${user.prenom} ${user.nom}`;

        const messageTelegram =
            `📢 NOUVELLE RÉCLAMATION - LANDOLSI TIRES\n\n` +
            `🆔 Réclamation n° : ${reclamation.id}\n` +
            `👤 Client : ${nomClient}\n` +
            `📧 Email : ${user.email || "Non renseigné"}\n` +
            `📌 Sujet : ${reclamation.sujet}\n` +
            `📝 Description : ${reclamation.description}\n` +
            `📊 Statut : ${reclamation.statut}`;

        try {
            await envoyerNotificationTelegram(messageTelegram);
        } catch (telegramError) {
            console.error(
                "Erreur notification Telegram réclamation :",
                telegramError.message
            );
        }

        return res.status(201).json({
            success: true,
            message: "Votre réclamation a été envoyée avec succès.",
            reclamation
        });

    } catch (error) {
        console.error("Erreur création réclamation :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la création de la réclamation."
        });
    }
};



// ========================================
// 2. Afficher les réclamations du client
// ========================================

exports.getMesReclamations = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Vous devez être connecté."
            });
        }

        const reclamations = await Reclamation.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            success: true,
            reclamations
        });

    } catch (error) {
        console.error("Erreur récupération réclamations :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des réclamations."
        });
    }
};


// ========================================
// 3. Afficher toutes les réclamations (admin)
// ========================================

exports.getAllReclamations = async (req, res) => {
    try {
        const reclamations = await Reclamation.findAll({
            include: [{
                model: User,
                as: "user",
                attributes: ["id", "nom", "prenom", "email"]
            }],
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            success: true,
            reclamations
        });

    } catch (error) {
        console.error("Erreur récupération toutes les réclamations :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des réclamations."
        });
    }
};


// ========================================
// 4. Modifier le statut et répondre (admin)
// ========================================


exports.updateReclamation = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, reponseAdmin } = req.body;

        const reclamation = await Reclamation.findByPk(id);

        if (!reclamation) {
            return res.status(404).json({
                success: false,
                message: "Réclamation introuvable."
            });
        }

        const statutsAutorises = [
            "En attente",
            "En cours",
            "Résolue"
        ];

        if (
            statut !== undefined &&
            !statutsAutorises.includes(statut)
        ) {
            return res.status(400).json({
                success: false,
                message: "Statut invalide."
            });
        }

        // Mémoriser les anciennes valeurs avant la modification
        const ancienStatut = reclamation.statut;
        const ancienneReponse = reclamation.reponseAdmin;

        const statutChange =
            statut !== undefined && statut !== ancienStatut;

        const reponseChange =
            reponseAdmin !== undefined &&
            reponseAdmin !== ancienneReponse;

        // Récupérer le client
        const user = await User.findByPk(reclamation.userId);

        // Mettre à jour la réclamation
        await reclamation.update({
            ...(statut !== undefined && { statut }),
            ...(reponseAdmin !== undefined && { reponseAdmin })
        });

        // Notification uniquement si le statut ou la réponse change
        if (user && (statutChange || reponseChange)) {
            const messageTelegram =
                `🔔 MISE À JOUR DE VOTRE RÉCLAMATION - LANDOLSI TIRES\n\n` +
                `🆔 Réclamation n° : ${reclamation.id}\n` +
                `👤 Client : ${user.prenom} ${user.nom}\n` +
                `📌 Sujet : ${reclamation.sujet}\n` +
                `📊 Statut : ${reclamation.statut}\n` +
                `💬 Réponse de l'administration : ${reclamation.reponseAdmin || "Aucune réponse pour le moment."}`;

            try {
                await envoyerNotificationTelegram(messageTelegram);
            } catch (telegramError) {
                console.error(
                    "Erreur notification Telegram mise à jour réclamation :",
                    telegramError.message
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Réclamation mise à jour avec succès.",
            reclamation
        });

    } catch (error) {
        console.error("Erreur mise à jour réclamation :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour de la réclamation."
        });
    }
};


// ========================================
// 5. Supprimer une réclamation (admin)
// ========================================

exports.deleteReclamation = async (req, res) => {
    try {
        const reclamation = await Reclamation.findByPk(req.params.id);

        if (!reclamation) {
            return res.status(404).json({
                success: false,
                message: "Réclamation introuvable."
            });
        }

        await reclamation.destroy();

        return res.status(200).json({
            success: true,
            message: "Réclamation supprimée avec succès."
        });

    } catch (error) {
        console.error("Erreur suppression réclamation :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression de la réclamation."
        });
    }
};