const { Pneu, Promotion } = require("../models/associations");

// ========================================
// Ajouter une promotion
// ========================================

const createPromotion = async (req, res) => {
    try {

        const {
            pneuId,
            pourcentage,
            dateDebut,
            dateFin
        } = req.body;

        // Vérifier que le pneu existe
        const pneu = await Pneu.findByPk(pneuId);

        if (!pneu) {
            return res.status(404).json({
                message: "Pneu introuvable."
            });
        }

        // Vérifier le pourcentage
        if (pourcentage <= 0 || pourcentage >= 100) {
            return res.status(400).json({
                message: "Le pourcentage doit être compris entre 1 et 99."
            });
        }

        // Vérifier les dates
        if (new Date(dateFin) <= new Date(dateDebut)) {
            return res.status(400).json({
                message: "La date de fin doit être après la date de début."
            });
        }

        // Vérifier si le pneu possède déjà une promotion active
        const promotionExistante = await Promotion.findOne({
            where: {
                pneuId,
                active: true
            }
        });

        if (promotionExistante) {
            return res.status(400).json({
                message: "Ce pneu possède déjà une promotion active."
            });
        }

        // Créer la promotion
        const promotion = await Promotion.create({
            pneuId,
            pourcentage,
            dateDebut,
            dateFin,
            active: true
        });

        res.status(201).json({
            message: "Promotion créée avec succès.",
            promotion
        });

    } catch (error) {

        console.error("Erreur création promotion :", error);

        res.status(500).json({
            message: "Erreur serveur.",
            error: error.message
        });
    }
};


// ========================================
// Récupérer toutes les promotions
// ========================================


// ========================================
// Récupérer les promotions actuellement actives
// ========================================

const getPromotions = async (req, res) => {

    try {

        const maintenant = new Date();

        const promotions = await Promotion.findAll({
            where: {
                active: true
            },

            include: [
                {
                    model: Pneu,
                    as: "pneu"
                }
            ],

            order: [["createdAt", "DESC"]]
        });

        // Garder uniquement les promotions
        // dont la période est actuellement valide
        const promotionsActives = promotions.filter((promotion) => {

            const dateDebut = new Date(promotion.dateDebut);
            const dateFin = new Date(promotion.dateFin);

            return (
                maintenant >= dateDebut &&
                maintenant <= dateFin
            );

        });

        res.status(200).json(promotionsActives);

    } catch (error) {

        console.error("Erreur récupération promotions :", error);

        res.status(500).json({
            message: "Erreur serveur.",
            error: error.message
        });
    }
};


// ========================================
// Récupérer une promotion par ID
// ========================================

const getPromotionById = async (req, res) => {

    try {

        const promotion = await Promotion.findByPk(req.params.id, {
            include: [
                {
                    model: Pneu,
                    as: "pneu"
                }
            ]
        });

        if (!promotion) {
            return res.status(404).json({
                message: "Promotion introuvable."
            });
        }

        res.status(200).json(promotion);

    } catch (error) {

        console.error("Erreur récupération promotion :", error);

        res.status(500).json({
            message: "Erreur serveur.",
            error: error.message
        });
    }
};


// ========================================
// Modifier une promotion
// ========================================

const updatePromotion = async (req, res) => {

    try {

        const promotion = await Promotion.findByPk(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                message: "Promotion introuvable."
            });
        }

        const {
            pourcentage,
            dateDebut,
            dateFin,
            active
        } = req.body;

        if (pourcentage !== undefined) {

            if (pourcentage <= 0 || pourcentage >= 100) {
                return res.status(400).json({
                    message: "Le pourcentage doit être compris entre 1 et 99."
                });
            }

            promotion.pourcentage = pourcentage;
        }

        if (dateDebut) {
            promotion.dateDebut = dateDebut;
        }

        if (dateFin) {
            promotion.dateFin = dateFin;
        }

        if (dateDebut && dateFin) {

            if (new Date(dateFin) <= new Date(dateDebut)) {
                return res.status(400).json({
                    message: "La date de fin doit être après la date de début."
                });
            }
        }

        if (active !== undefined) {
            promotion.active = active;
        }

        await promotion.save();

        res.status(200).json({
            message: "Promotion modifiée avec succès.",
            promotion
        });

    } catch (error) {

        console.error("Erreur modification promotion :", error);

        res.status(500).json({
            message: "Erreur serveur.",
            error: error.message
        });
    }
};


// ========================================
// Supprimer une promotion
// ========================================

const deletePromotion = async (req, res) => {

    try {

        const promotion = await Promotion.findByPk(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                message: "Promotion introuvable."
            });
        }

        await promotion.destroy();

        res.status(200).json({
            message: "Promotion supprimée avec succès."
        });

    } catch (error) {

        console.error("Erreur suppression promotion :", error);

        res.status(500).json({
            message: "Erreur serveur.",
            error: error.message
        });
    }
};






// ========================================
// Admin : récupérer toutes les promotions
// ========================================

const getAllPromotionsAdmin = async (req, res) => {

    try {

        const promotions = await Promotion.findAll({
            include: [
                {
                    model: Pneu,
                    as: "pneu"
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        res.status(200).json({
            success: true,
            promotions
        });

    } catch (error) {

        console.error("Erreur récupération promotions admin :", error);

        res.status(500).json({
            success: false,
            message: "Erreur serveur.",
            error: error.message
        });
    }
};

module.exports = {
    createPromotion,
    getPromotions,
    getPromotionById,
    updatePromotion,
    deletePromotion,
    getAllPromotionsAdmin
};