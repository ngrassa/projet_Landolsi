
const Avis = require("../models/AvisModel");
const User = require("../models/UserModel");
const Pneu = require("../models/PneuModel");
const Commande = require("../models/Commande");
const CommandeItem = require("../models/CommandeItem");
const { envoyerNotificationTelegram } = require("../services/telegramService");

// ========================================
// Ajouter un avis
// ========================================

const createAvis = async (req, res) => {
    try {
        const userId = req.userId;
        const { commandeId, pneuId, note, commentaire } = req.body;

        // Vérifier les données obligatoires
        if (!commandeId || !pneuId || note === undefined || note === null || note === "") {
            return res.status(400).json({
                success: false,
                message: "La commande, le pneu et la note sont obligatoires."
            });
        }

        const noteNombre = Number(note);

        if (!Number.isInteger(noteNombre) || noteNombre < 1 || noteNombre > 5) {
            return res.status(400).json({
                success: false,
                message: "La note doit être un nombre entier entre 1 et 5."
            });
        }

        if (
            commentaire !== undefined &&
            commentaire !== null &&
            typeof commentaire !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Le commentaire doit être un texte."
            });
        }

        // Vérifier que la commande appartient au client connecté
        const commande = await Commande.findOne({
            where: {
                id: commandeId,
                userId: userId
            }
        });

      if (!commande) {
    return res.status(404).json({
        success: false,
        message: "Commande introuvable ou non autorisée."
    });
}

// Récupérer le client connecté
const user = await User.findByPk(userId);

if (!user) {
    return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable."
    });
}

        // Vérifier le statut de la commande
        const statutsAutorises = [
            "confirmée",
            "expédiée",
            "livrée"
        ];

        if (!statutsAutorises.includes(commande.statut)) {
            return res.status(400).json({
                success: false,
                message: "Vous pourrez laisser un avis lorsque votre commande sera confirmée."
            });
        }

        // Vérifier que ce pneu figure réellement dans cette commande
        const articleAchete = await CommandeItem.findOne({
            where: {
                commandeId: commande.id,
                pneuId: pneuId
            }
        });

        if (!articleAchete) {
            return res.status(403).json({
                success: false,
                message: "Vous ne pouvez pas évaluer un pneu qui ne figure pas dans cette commande."
            });
        }

        // Créer l'avis : aucun contrôle limitant le nombre d'avis
        const avis = await Avis.create({
            userId: userId,
            commandeId: commande.id,
            pneuId: Number(pneuId),
            note: noteNombre,
            commentaire:
                typeof commentaire === "string"
                    ? commentaire.trim() || null
                    : null
        });


        // ========================================
        // NOTIFICATION TELEGRAM - NOUVEL AVIS
        // ========================================

        try {
            const nomClient = `${user.prenom} ${user.nom}`;

            const messageTelegram =
                `⭐ NOUVEL AVIS - LANDOLSI TIRES\n\n` +
                `👤 Client : ${nomClient}\n` +
                `📦 Commande n° : ${commande.id}\n` +
                `🛞 Pneu n° : ${pneuId}\n` +
                `⭐ Note : ${noteNombre}/5\n` +
                `💬 Commentaire : ${typeof commentaire === "string" && commentaire.trim()
                    ? commentaire.trim()
                    : "Aucun commentaire écrit"
                }`;

            await envoyerNotificationTelegram(messageTelegram);

        } catch (telegramError) {
            console.error(
                "Erreur notification Telegram avis :",
                telegramError.message
            );
        }


        // Retourner l'avis avec les informations du client et du pneu
        const avisAvecDetails = await Avis.findByPk(avis.id, {
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "nom", "prenom"]
                },
                {
                    model: Pneu,
                    as: "pneu"
                }
            ]
        });

        return res.status(201).json({
            success: true,
            message: "Votre avis a été ajouté avec succès.",
            avis: avisAvecDetails
        });

    } catch (error) {
        console.error("Erreur création avis :", error);

        return res.status(500).json({
            success: false,
            message: "Impossible d'ajouter l'avis.",
            error: error.message
        });
    }
};

// ========================================
// Récupérer tous les avis d'une commande
// ========================================

const getAvisByCommande = async (req, res) => {
    try {
        const userId = req.userId;
        const { commandeId } = req.params;

        // Vérifier que la commande appartient au client
        const commande = await Commande.findOne({
            where: {
                id: commandeId,
                userId: userId
            }
        });

        if (!commande) {
            return res.status(404).json({
                success: false,
                message: "Commande introuvable ou non autorisée."
            });
        }

        // Une commande peut maintenant avoir plusieurs avis
        const avis = await Avis.findAll({
            where: {
                commandeId: commande.id,
                userId: userId
            },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "nom", "prenom"]
                },
                {
                    model: Pneu,
                    as: "pneu"
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            success: true,
            existe: avis.length > 0,
            count: avis.length,
            avis: avis
        });

    } catch (error) {
        console.error("Erreur récupération avis commande :", error);

        return res.status(500).json({
            success: false,
            message: "Impossible de récupérer les avis.",
            error: error.message
        });
    }
};

// ========================================
// Afficher tous les avis
// ========================================

const getAllAvis = async (req, res) => {
    try {
        const avis = await Avis.findAll({
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "nom", "prenom"]
                },
                {
                    model: Pneu,
                    as: "pneu"
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            success: true,
            count: avis.length,
            avis: avis
        });

    } catch (error) {
        console.error("Erreur récupération avis :", error);

        return res.status(500).json({
            success: false,
            message: "Impossible de récupérer les avis.",
            error: error.message
        });
    }
};

// ========================================
// Supprimer un avis
// ========================================

const deleteAvis = async (req, res) => {
    try {
        const { id } = req.params;

        const avis = await Avis.findByPk(id);

        if (!avis) {
            return res.status(404).json({
                success: false,
                message: "Avis introuvable."
            });
        }

        await avis.destroy();

        return res.status(200).json({
            success: true,
            message: "Avis supprimé avec succès."
        });

    } catch (error) {
        console.error("Erreur suppression avis :", error);

        return res.status(500).json({
            success: false,
            message: "Impossible de supprimer l'avis.",
            error: error.message
        });
    }
};



// ========================================
// Récupérer les avis d'un pneu
// ========================================

const getAvisByPneu = async (req, res) => {
    try {
        const { pneuId } = req.params;

        if (!Number.isInteger(Number(pneuId)) || Number(pneuId) < 1) {
            return res.status(400).json({
                success: false,
                message: "Identifiant du pneu invalide."
            });
        }

        const pneu = await Pneu.findByPk(pneuId);

        if (!pneu) {
            return res.status(404).json({
                success: false,
                message: "Pneu introuvable."
            });
        }

        const avis = await Avis.findAll({
            where: { pneuId: Number(pneuId) },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "nom", "prenom"]
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            success: true,
            count: avis.length,
            avis: avis
        });

    } catch (error) {
        console.error("Erreur récupération avis du pneu :", error);

        return res.status(500).json({
            success: false,
            message: "Impossible de récupérer les avis du pneu."
        });
    }
};

module.exports = {
    createAvis,
    getAvisByCommande,
    getAllAvis,
    deleteAvis,
    getAvisByPneu
};