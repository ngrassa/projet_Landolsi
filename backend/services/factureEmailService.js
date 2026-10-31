// =====================================================
// Envoi de la facture au client à la confirmation de sa commande
// =====================================================
// Ne fait jamais échouer la confirmation : le résultat de l'envoi est
// renvoyé à l'administrateur, qui peut prévenir le client autrement.

const defaults = {
    chargerFacture: (...a) => require("../controllers/FactureController").chargerFacture(...a),
    genererFacturePdfBuffer: (...a) => require("../controllers/FactureController").genererFacturePdfBuffer(...a),
    trouverClient: (userId) => require("../models/associations").User.findByPk(userId, {
        attributes: ["id", "email", "nom", "prenom"]
    }),
    envoyerEmail: (...a) => require("./emailService").sendFactureCommandePreteEmail(...a)
};

/**
 * @returns {Promise<{envoye: boolean, destinataire?: string, message: string}>}
 */
async function envoyerFactureCommandeConfirmee(commande, deps = {}) {
    const d = { ...defaults, ...deps };
    try {
        const client = await d.trouverClient(commande.userId);
        if (!client || !client.email) {
            return { envoye: false, message: "Aucune adresse e-mail pour ce client : facture non envoyée." };
        }

        const facture = await d.chargerFacture(commande.id);
        if (!facture) {
            return { envoye: false, message: "Facture introuvable : e-mail non envoyé." };
        }

        const pdfBuffer = await d.genererFacturePdfBuffer(facture);

        await d.envoyerEmail({
            email: client.email,
            prenom: commande.prenom || client.prenom,
            nom: commande.nom || client.nom,
            commandeId: commande.id,
            numeroFacture: facture.numeroFacture,
            total: commande.total,
            pdfBuffer
        });

        console.log(`📧 Facture ${facture.numeroFacture} envoyée pour la commande ${commande.id}.`);
        return {
            envoye: true,
            destinataire: client.email,
            message: `Facture ${facture.numeroFacture} envoyée à ${client.email}.`
        };
    } catch (error) {
        // Jamais de détail SMTP (identifiants, serveur) dans la réponse
        console.error(`❌ Envoi facture commande ${commande.id} :`, error.code || error.message);
        return {
            envoye: false,
            message: error.code === "EMAIL_NOT_CONFIGURED"
                ? "Envoi d'e-mail non configuré sur le serveur (EMAIL_USER / EMAIL_PASS) : facture non envoyée."
                : "L'e-mail de facture n'a pas pu être envoyé. Prévenez le client par téléphone ou réessayez."
        };
    }
}

module.exports = { envoyerFactureCommandeConfirmee };
