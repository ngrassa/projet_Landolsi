
const sequelize = require("../db/db");
const { envoyerNotificationTelegram } = require("../services/telegramService");
const { envoyerFactureCommandeConfirmee } = require("../services/factureEmailService");

const User = require("../models/UserModel");
const Pneu = require("../models/PneuModel");
const Marque = require("../models/MarqueModel");
const Vehicule = require("../models/VehiculeModel");
const VehiculePneu = require("../models/VehiculePneuModel");

const Commande = require("../models/Commande");
const CommandeItem = require("../models/CommandeItem");
const Promotion = require("../models/PromotionModel");
const Facture = require("../models/FactureModel");


// ========================================
// CRÉER UNE COMMANDE
// ========================================

module.exports.createCommande = async (req, res) => {

    const transaction = await sequelize.transaction();

    try {

        // ========================================
        // UTILISATEUR CONNECTÉ
        // ========================================

        const userId = req.userId;

        console.log(
            "Utilisateur connecté :",
            userId
        );


        // ========================================
        // VÉRIFIER L'UTILISATEUR
        // ========================================

        const user = await User.findByPk(userId);

        if (!user) {

            await transaction.rollback();

            return res.status(404).json({
                success: false,
                message: "Utilisateur introuvable."
            });

        }


        // ========================================
        // RÉCUPÉRER LE PANIER
        // ========================================

        const { items } = req.body;

        if (
            !items ||
            !Array.isArray(items) ||
            items.length === 0
        ) {

            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: "Le panier est vide."
            });

        }


        // ========================================
        // CALCUL DU TOTAL
        // ========================================

        let total = 0;

        const produits = [];


        // ========================================
        // PARCOURIR LES ARTICLES
        // ========================================

        for (const item of items) {

            // ========================================
            // VÉRIFIER LES DONNÉES
            // ========================================

            if (
                !item.pneuId ||
                !item.quantite
            ) {

                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "pneuId et quantite sont obligatoires."
                });

            }


            // ========================================
            // RÉCUPÉRER LE PNEU
            // ========================================

            const pneu = await Pneu.findByPk(
                item.pneuId,
                {
                    transaction
                }
            );


            if (!pneu) {

                await transaction.rollback();

                return res.status(404).json({
                    success: false,
                    message:
                        `Pneu ${item.pneuId} introuvable.`
                });

            }


            // ========================================
            // VÉRIFIER LA QUANTITÉ
            // ========================================

            const quantite = Number(item.quantite);

            if (
                !Number.isInteger(quantite) ||
                quantite <= 0
            ) {

                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "La quantité est invalide."
                });

            }


            // ========================================
            // VÉRIFIER LE STOCK
            // ========================================

            if (
                Number(pneu.stock) < quantite
            ) {

                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        `Stock insuffisant pour ${pneu.modele}.`
                });

            }


            // ========================================
            // RECHERCHER LA PROMOTION
            // ========================================

            const maintenant = new Date();

            const promotion = await Promotion.findOne({

                where: {

                    pneuId: pneu.id,

                    active: true

                },

                transaction

            });


            // ========================================
            // PRIX ORIGINAL
            // ========================================

            const prixOriginal =
                Number(pneu.prix);

            let prixFinal =
                prixOriginal;

            let pourcentagePromotion = 0;


            // ========================================
            // VÉRIFIER LA PROMOTION
            // ========================================

            if (promotion) {

                const dateDebut =
                    new Date(promotion.dateDebut);

                const dateFin =
                    new Date(promotion.dateFin);


                console.log(
                    "================================="
                );

                console.log(
                    "PNEU ID :",
                    pneu.id
                );

                console.log(
                    "PRIX ORIGINAL :",
                    prixOriginal
                );

                console.log(
                    "PROMOTION TROUVÉE :",
                    promotion.id
                );

                console.log(
                    "POURCENTAGE :",
                    promotion.pourcentage
                );

                console.log(
                    "DATE ACTUELLE :",
                    maintenant
                );

                console.log(
                    "DATE DÉBUT :",
                    dateDebut
                );

                console.log(
                    "DATE FIN :",
                    dateFin
                );


                // ========================================
                // PROMOTION ACTIVE ET VALIDE
                // ========================================

                if (
                    maintenant >= dateDebut &&
                    maintenant <= dateFin
                ) {

                    pourcentagePromotion =
                        Number(
                            promotion.pourcentage
                        );


                    // ========================================
                    // CALCUL DU PRIX PROMOTIONNEL
                    // ========================================

                    prixFinal =
                        prixOriginal -
                        (
                            prixOriginal *
                            pourcentagePromotion /
                            100
                        );


                    // Arrondir à 2 chiffres
                    prixFinal =
                        Number(
                            prixFinal.toFixed(2)
                        );


                    console.log(
                        "✅ PROMOTION APPLIQUÉE"
                    );

                    console.log(
                        "PRIX FINAL :",
                        prixFinal
                    );

                    console.log(
                        "RÉDUCTION :",
                        pourcentagePromotion,
                        "%"
                    );

                } else {

                    console.log(
                        "⚠️ PROMOTION TROUVÉE MAIS HORS PÉRIODE"
                    );

                }

            } else {

                console.log(
                    "❌ AUCUNE PROMOTION ACTIVE POUR LE PNEU",
                    pneu.id
                );

            }


            console.log(
                "PRIX FINAL ENREGISTRÉ :",
                prixFinal
            );

            console.log(
                "================================="
            );


            // ========================================
            // CALCULER LE TOTAL
            // ========================================

            total +=
                prixFinal *
                quantite;


            // ========================================
            // STOCKER LE PRODUIT
            // ========================================

            produits.push({

                pneu,

                quantite,

                prixOriginal,

                prixFinal,

                pourcentagePromotion

            });

        }


        // ========================================
        // ARRONDIR LE TOTAL
        // ========================================

        total =
            Number(
                total.toFixed(2)
            );


        // ========================================
        // CRÉER LA COMMANDE
        // ========================================

        const commande = await Commande.create({

            userId:
                user.id,

            nom:
                user.nom,

            prenom:
                user.prenom,

            telephone:
                user.telephone,

            adresse:
                user.adresse,

            ville:
                user.ville,

            codePostal:
                user.codePostal,

            total:
                total,

            statut:
                "en attente"

        }, {

            transaction

        });


        // ========================================
        // CRÉER LES ARTICLES DE LA COMMANDE
        // ========================================

        for (const produit of produits) {

            const pneu =
                produit.pneu;

            const quantite =
                produit.quantite;

            const prixOriginal =
                produit.prixOriginal;

            const prixFinal =
                produit.prixFinal;

            const pourcentagePromotion =
                produit.pourcentagePromotion;


            // ========================================
            // CRÉER COMMANDE ITEM
            // ========================================

            await CommandeItem.create({

                commandeId:
                    commande.id,

                pneuId:
                    pneu.id,

                quantite:
                    quantite,

                // Prix réellement payé
                prix:
                    prixFinal,

                // Prix normal avant promotion
                prixOriginal:
                    prixOriginal,

                // Pourcentage de promotion
                pourcentagePromotion:
                    pourcentagePromotion

            }, {

                transaction

            });


            // ========================================
            // DIMINUER LE STOCK
            // ========================================

            await pneu.update({

                stock:
                    Number(pneu.stock) -
                    quantite

            }, {

                transaction

            });

        }


        // ========================================
        // VALIDER LA TRANSACTION
        // ========================================

        await transaction.commit();

        
        // ========================================
        // NOTIFICATION TELEGRAM - NOUVELLE COMMANDE
        // ========================================

        const messageTelegram =
            `🛒 NOUVELLE COMMANDE - LANDOLSI TIRES\n\n` +
            `📦 Commande n° : ${commande.id}\n` +
            `👤 Client : ${user.prenom} ${user.nom}\n` +
            `📞 Téléphone : ${user.telephone || "Non renseigné"}\n` +
            `💰 Total : ${Number(total).toFixed(2)} DT\n` +
            `📌 Statut : ${commande.statut}\n\n` +
            `Le client récupérera sa commande chez LANDOLSI TIRES.`;

        await envoyerNotificationTelegram(messageTelegram);



        // ========================================
        // RÉPONSE
        // ========================================

        return res.status(201).json({

            success: true,

            message:
                "Commande créée avec succès.",

            commande: {

                id:
                    commande.id,

                total:
                    commande.total,

                statut:
                    commande.statut

            }

        });


    } catch (error) {

        console.error(
            "❌ Erreur création commande :",
            error
        );


        // ========================================
        // ANNULER LA TRANSACTION
        // ========================================

        try {

            await transaction.rollback();

        } catch (rollbackError) {

            console.error(
                "Erreur rollback :",
                rollbackError
            );

        }


        return res.status(500).json({

            success: false,

            message:
                "Impossible de créer la commande.",

            error:
                error.message

        });

    }

};


// ========================================
// RÉCUPÉRER UNE COMMANDE PAR ID
// ========================================

module.exports.getCommandeById = async (req, res) => {

    try {

        const { id } = req.params;

        const userId =
            req.userId;


        // ========================================
        // VÉRIFIER L'UTILISATEUR
        // ========================================

        const user =
            await User.findByPk(userId);

        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "Utilisateur introuvable."

            });

        }


        // ========================================
        // RÉCUPÉRER LA COMMANDE
        // ========================================

        const commande =
            await Commande.findOne({

                where: {

                    id:
                        id,

                    userId:
                        userId

                },

                include: [

                    {

                        model:
                            CommandeItem,

                        as:
                            "items",

                        include: [

                            {

                                model:
                                    Pneu,

                                as:
                                    "pneu",

                                attributes: [

                                    "id",

                                    "modele",

                                    "dimension",

                                    "saison",

                                    "prix",

                                    "image"

                                ],

                                include: [

                                    {

                                        model:
                                            Marque,

                                        as:
                                            "marque",

                                        attributes: [

                                            "id",

                                            "nom"

                                        ]

                                    }

                                ]

                            }

                        ]

                    }

                ]

            });


        // ========================================
        // COMMANDE INTROUVABLE
        // ========================================

        if (!commande) {

            return res.status(404).json({

                success: false,

                message:
                    "Commande introuvable."

            });

        }


        // ========================================
        // RÉPONSE
        // ========================================

        return res.status(200).json({

            success: true,

            commande:
                commande

        });


    } catch (error) {

        console.error(
            "❌ Erreur récupération commande :",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Impossible de récupérer la commande.",

            error:
                error.message

        });

    }

};


// ========================================
// MES COMMANDES
// ========================================

module.exports.getMesCommandes = async (req, res) => {

    try {

        const userId =
            req.userId;


        console.log(
            "🔥 Récupération commandes utilisateur :",
            userId
        );


        const commandes =
            await Commande.findAll({

                where: {

                    userId:
                        userId

                },

                include: [

                    {

                        model:
                            CommandeItem,

                        as:
                            "items",

                        include: [

                            {

                                model:
                                    Pneu,

                                as:
                                    "pneu",

                                attributes: [

                                    "id",

                                    "modele",

                                    "dimension",

                                    "saison",

                                    "prix",

                                    "image"

                                ],

                                include: [

                                    {

                                        model:
                                            Marque,

                                        as:
                                            "marque",

                                        attributes: [

                                            "id",

                                            "nom"

                                        ]

                                    }

                                ]

                            }

                        ]

                    }

                ],

                order: [

                    [

                        "createdAt",

                        "DESC"

                    ]

                ]

            });


        console.log(
            "🔥 Nombre de commandes :",
            commandes.length
        );


        return res.status(200).json({

            success: true,

            count:
                commandes.length,

            commandes:
                commandes

        });


    } catch (error) {

        console.error(
            "❌ ERREUR MES COMMANDES :",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Impossible de récupérer vos commandes.",

            error:
                error.message

        });

    }

};



// ========================================
// RÉCUPÉRER TOUTES LES COMMANDES - ADMIN
// ========================================

// ========================================
// Récupérer toutes les commandes - ADMIN
// ========================================

module.exports.getAllCommandesAdmin = async (req, res) => {
    try {

        const commandes = await Commande.findAll({

            include: [

                // ========================================
                // Produits de la commande
                // ========================================

                {
                    model: CommandeItem,
                    as: "items",

                    include: [

                        {
                            model: Pneu,
                            as: "pneu",

                            attributes: [
                                "id",
                                "modele",
                                "dimension",
                                "saison",
                                "prix",
                                "image"
                            ],

                            include: [

                                {
                                    model: Marque,
                                    as: "marque",

                                    attributes: [
                                        "id",
                                        "nom"
                                    ]
                                }

                            ]
                        }

                    ]
                },


                // ========================================
                // Client de la commande
                // ========================================

                {
                    model: User,
                    as: "user",

                    attributes: [
                        "id",
                        "nom",
                        "prenom",
                        "email",
                        "telephone"
                    ]
                },


                // ========================================
                // Facture de la commande
                // ========================================

                {
                    model: Facture,
                    as: "facture",

                    attributes: [
                        "id",
                        "numeroFacture",
                        "dateFacture",
                        "statut"
                    ]
                }

            ],


            // ========================================
            // Plus récente commande en premier
            // ========================================

            order: [
                [
                    "createdAt",
                    "DESC"
                ]
            ]

        });


        console.log(
            "🔥 Nombre total de commandes :",
            commandes.length
        );


        return res.status(200).json({

            success: true,

            count: commandes.length,

            commandes: commandes

        });


    } catch (error) {

        console.error(
            "❌ Erreur récupération commandes admin :",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Impossible de récupérer les commandes.",

            error: error.message

        });

    }
};

// ==================================================
// ADMIN : MODIFIER LE STATUT D'UNE COMMANDE
// ==================================================

// ==================================================
// ADMIN : MODIFIER LE STATUT D'UNE COMMANDE
// ==================================================

module.exports.updateStatutCommande = async (req, res) => {

    try {

        const { id } = req.params;
        const { statut } = req.body;


        // ========================================
        // STATUTS AUTORISÉS
        // ========================================

        const statutsAutorises = [
            "en attente",
            "confirmée",
            "en préparation",
            "expédiée",
            "livrée",
            "annulée"
        ];


        // ========================================
        // VÉRIFIER LE STATUT
        // ========================================

        if (!statutsAutorises.includes(statut)) {

            return res.status(400).json({

                success: false,

                message:
                    "Statut de commande invalide."

            });

        }


        // ========================================
        // CHERCHER LA COMMANDE
        // ========================================

        const commande = await Commande.findByPk(id);
            
           

        if (!commande) {
            

            


            return res.status(404).json({

                success: false,

                message:
                    "Commande introuvable."

            });

        }

           // MÉMORISER L'ANCIEN STATUT
        const ancienStatut = commande.statut;
        // ========================================
        // MODIFIER LE STATUT DE LA COMMANDE
        // ========================================

        commande.statut = statut;

        await commande.save();


        // ========================================
        // CRÉER LA FACTURE SI COMMANDE CONFIRMÉE
        // ========================================

        let facture = null;


        if (statut === "confirmée") {


            // ========================================
            // VÉRIFIER SI UNE FACTURE EXISTE DÉJÀ
            // ========================================

            facture =
                await Facture.findOne({

                    where: {

                        commandeId:
                            commande.id

                    }

                });


            // ========================================
            // CRÉER LA FACTURE SI ELLE N'EXISTE PAS
            // ========================================

            if (!facture) {

                const annee =
                    new Date().getFullYear();


                const numeroFacture =
                    `FAC-${annee}-${String(commande.id).padStart(4, "0")}`;


                facture =
                    await Facture.create({

                        commandeId:
                            commande.id,

                        numeroFacture:
                            numeroFacture,

                        dateFacture:
                            new Date(),

                        statut:
                            "confirmée"

                    });

            }

        }
            
        // ========================================
        // E-MAIL AU CLIENT : FACTURE + COMMANDE PRÊTE AU RETRAIT
        // Uniquement au passage à « confirmée » (pas de renvoi si
        // l'administrateur réenregistre le même statut).
        // ========================================

        let emailFacture = null;

        if (statut === "confirmée" && ancienStatut !== "confirmée" && facture) {

            emailFacture =
                await envoyerFactureCommandeConfirmee(commande);

        }


        // NOTIFICATION TELEGRAM - CHANGEMENT DE STATUT
        if (ancienStatut !== commande.statut) {
            const messageTelegram =
                `🔔 CHANGEMENT DE STATUT - LANDOLSI TIRES\n\n` +
                `📦 Commande n° : ${commande.id}\n` +
                `👤 Client : ${commande.prenom} ${commande.nom}\n` +
                `🔄 Ancien statut : ${ancienStatut}\n` +
                `✅ Nouveau statut : ${commande.statut}\n` +
                `💰 Total : ${Number(commande.total).toFixed(2)} DT`;

            await envoyerNotificationTelegram(messageTelegram);
        }


        // ========================================
        // RÉPONSE
        // ========================================

        return res.status(200).json({

            success: true,

            message:
                "Statut de la commande modifié avec succès.",

            commande:
                commande,

            facture:
                facture,

            emailFacture:
                emailFacture

        });


    } catch (error) {


        console.error(

            "❌ Erreur modification statut commande :",

            error

        );


        return res.status(500).json({

            success: false,

            message:
                "Impossible de modifier le statut de la commande.",

            error:
                error.message

        });

    }

};



// ==================================================
// ADMIN : SUPPRIMER UNE COMMANDE
// ==================================================

module.exports.deleteCommande = async (req, res) => {

    try {

        const { id } = req.params;

        // Chercher la commande
        const commande = await Commande.findByPk(id);

        if (!commande) {

            return res.status(404).json({
                success: false,
                message: "Commande introuvable."
            });

        }

        // Supprimer les lignes de la commande
        await CommandeItem.destroy({
            where: {
                commandeId: id
            }
        });

        // Supprimer la commande
        await commande.destroy();

        return res.status(200).json({
            success: true,
            message: "Commande supprimée avec succès."
        });

    } catch (error) {

        console.error(
            "❌ Erreur suppression commande :",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Impossible de supprimer la commande.",
            error: error.message
        });

    }

};