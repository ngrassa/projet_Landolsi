const Facture = require("../models/FactureModel");
const Commande = require("../models/Commande");
const CommandeItem = require("../models/CommandeItem");
const Pneu = require("../models/PneuModel");
const Marque = require("../models/MarqueModel");
const PDFDocument = require("pdfkit");


// ========================================
// RÉCUPÉRER UNE FACTURE PAR ID DE COMMANDE
// ========================================

const getFactureByCommandeId = async (req, res) => {

    try {

        const { commandeId } = req.params;

        const facture = await Facture.findOne({

            where: {
                commandeId: commandeId
            },

            include: [
                {
                    model: Commande,
                    as: "commande",

                    include: [
                        {
                            model: CommandeItem,
                            as: "items",

                            include: [
                                {
                                    model: Pneu,
                                    as: "pneu",

                                    include: [
                                        {
                                            model: Marque,
                                            as: "marque"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]

        });


        // ========================================
        // VÉRIFIER SI LA FACTURE EXISTE
        // ========================================

        if (!facture) {

            return res.status(404).json({

                success: false,

                message: "Facture introuvable."

            });

        }


        // ========================================
        // RETOURNER LA FACTURE
        // ========================================

        return res.status(200).json({

            success: true,

            facture: facture

        });


    } catch (error) {

        console.error(
            "❌ Erreur récupération facture :",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Impossible de récupérer la facture.",

            error: error.message

        });

    }

};




// ========================================
// GÉNÉRER LE PDF D'UNE FACTURE
// ========================================
// ========================================
// GÉNÉRER LE PDF D'UNE FACTURE
// ========================================

const generateFacturePDF = async (req, res) => {

    try {

        const { commandeId } = req.params;


        // ========================================
        // RÉCUPÉRER LA FACTURE
        // ========================================

        const facture = await Facture.findOne({

            where: {
                commandeId: commandeId
            },

            include: [
                {
                    model: Commande,
                    as: "commande",

                    include: [
                        {
                            model: CommandeItem,
                            as: "items",

                            include: [
                                {
                                    model: Pneu,
                                    as: "pneu",

                                    include: [
                                        {
                                            model: Marque,
                                            as: "marque"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]

        });


        // ========================================
        // VÉRIFIER LA FACTURE
        // ========================================

        if (!facture) {

            return res.status(404).json({

                success: false,

                message: "Facture introuvable."

            });

        }


        // ========================================
        // CRÉER LE DOCUMENT PDF
        // ========================================

        const doc = new PDFDocument({
            size: "A4",
            margin: 50
        });


        // ========================================
        // NOM DU FICHIER
        // ========================================

        const filename =
            `${facture.numeroFacture}.pdf`;


        // ========================================
        // HEADERS
        // ========================================

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );


        doc.pipe(res);


        // ========================================
        // EN-TÊTE
        // ========================================

        doc
            .fontSize(24)
            .font("Helvetica-Bold")
            .text("LANDOLSI TIRES", {
                align: "center"
            });


        doc
            .moveDown(0.3)
            .fontSize(11)
            .font("Helvetica")
            .text("Vente de pneumatiques", {
                align: "center"
            });


        doc.moveDown();


        doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .text("FACTURE", {
                align: "center"
            });


        doc.moveDown();


        // ========================================
        // INFORMATIONS FACTURE
        // ========================================

        doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(
                `Facture N° : ${facture.numeroFacture}`
            );


        const dateFacture =
            new Date(facture.dateFacture)
                .toLocaleDateString("fr-FR");


        doc
            .font("Helvetica")
            .text(
                `Date : ${dateFacture}`
            );


        doc.moveDown(1.5);


        // ========================================
        // INFORMATIONS CLIENT
        // ========================================

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("CLIENT");


        doc.moveDown(0.4);


        const commande =
            facture.commande;


        doc
            .fontSize(11)
            .font("Helvetica")
            .text(
                `Nom : ${commande.nom} ${commande.prenom}`
            );


        doc.text(
            `Téléphone : ${commande.telephone}`
        );


        doc.text(
            `Adresse : ${commande.adresse}, ${commande.ville}, ${commande.codePostal}`
        );


        doc.moveDown(1.5);


        // ========================================
        // TITRE ARTICLES
        // ========================================

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("DÉTAIL DE LA COMMANDE");


        doc.moveDown(0.7);


        // ========================================
        // TABLEAU
        // ========================================

        const tableTop = doc.y;

        const colX = {
            designation: 50,
            dimension: 225,
            quantite: 325,
            prix: 385,
            total: 465
        };


        // ----------------------------------------
        // EN-TÊTE DU TABLEAU
        // ----------------------------------------

        doc
            .fontSize(9)
            .font("Helvetica-Bold");


        doc.text(
            "Désignation",
            colX.designation,
            tableTop,
            {
                width: 165
            }
        );


        doc.text(
            "Dimension",
            colX.dimension,
            tableTop,
            {
                width: 90
            }
        );


        doc.text(
            "Qté",
            colX.quantite,
            tableTop,
            {
                width: 40,
                align: "center"
            }
        );


        doc.text(
            "P.U.",
            colX.prix,
            tableTop,
            {
                width: 60,
                align: "right"
            }
        );


        doc.text(
            "Total",
            colX.total,
            tableTop,
            {
                width: 80,
                align: "right"
            }
        );


        doc.moveDown(0.8);


        // Ligne sous l'en-tête
        doc
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();


        doc.moveDown(0.7);


        // ----------------------------------------
        // ARTICLES
        // ----------------------------------------

        for (const item of commande.items) {

            const pneu = item.pneu;


            const marque =
                pneu.marque
                    ? pneu.marque.nom
                    : "";


            const designation =
                `${marque} ${pneu.modele}`;


            const totalItem =
                item.quantite * item.prix;


            const ligneY = doc.y;


            doc
                .fontSize(9)
                .font("Helvetica");


            // Désignation
            doc.text(
                designation,
                colX.designation,
                ligneY,
                {
                    width: 165
                }
            );


            // Dimension
            doc.text(
                pneu.dimension,
                colX.dimension,
                ligneY,
                {
                    width: 90
                }
            );


            // Quantité
            doc.text(
                String(item.quantite),
                colX.quantite,
                ligneY,
                {
                    width: 40,
                    align: "center"
                }
            );


            // Prix unitaire
            doc.text(
                `${item.prix.toFixed(2)} DT`,
                colX.prix,
                ligneY,
                {
                    width: 60,
                    align: "right"
                }
            );


            // Total
            doc.text(
                `${totalItem.toFixed(2)} DT`,
                colX.total,
                ligneY,
                {
                    width: 80,
                    align: "right"
                }
            );


            doc.moveDown(1.2);


            // Ligne de séparation
            doc
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();


            doc.moveDown(0.7);

        }


        // ========================================
        // TOTAL
        // ========================================

       // ========================================
// TOTAL
// ========================================

doc.moveDown(0.8);


// Ligne supérieure du total
doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

doc.moveDown(0.8);


// Total sur une seule ligne
doc
    .fontSize(15)
    .font("Helvetica-Bold")
    .text(
        `TOTAL : ${commande.total.toFixed(2)} DT`,
        350,
        doc.y,
        {
            width: 195,
            align: "right",
            lineBreak: false
        }
    );


doc.moveDown(1.5);


// ========================================
// STATUT
// ========================================

doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(
        `Statut commande : ${commande.statut}`,
        50,
        doc.y,
        {
            width: 495,
            align: "left",
            lineBreak: false
        }
    );


doc.moveDown(2);


// ========================================
// INFORMATIONS RÉCUPÉRATION
// ========================================

doc
    .fontSize(10)
    .font("Helvetica")
    .text(
        "Le client récupère sa commande directement chez LANDOLSI TIRES.",
        50,
        doc.y,
        {
            width: 495,
            align: "center"
        }
    );


doc.moveDown(0.7);


// ========================================
// MESSAGE FINAL
// ========================================

doc
    .fontSize(10)
    .font("Helvetica")
    .text(
        "Merci pour votre confiance !",
        50,
        doc.y,
        {
            width: 495,
            align: "center"
        }
    );


// ========================================
// TERMINER LE PDF
// ========================================

doc.end();


    } catch (error) {

        console.error(
            "❌ Erreur génération PDF facture :",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Impossible de générer la facture PDF.",

            error:
                error.message

        });

    }

};


module.exports = {
    getFactureByCommandeId,
    generateFacturePDF
};