const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendResetPasswordEmail = async (email, code) => {
    await transporter.sendMail({
        from: `"Landolsi Motors" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Réinitialisation de votre mot de passe",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Landolsi Motors</h2>

                <p>Bonjour,</p>

                <p>
                    Vous avez demandé la réinitialisation de votre mot de passe.
                </p>

                <p>Votre code de récupération est :</p>

                <h1 style="letter-spacing: 5px;">
                    ${code}
                </h1>

                <p>
                    Ce code est valable pendant <strong>10 minutes</strong>.
                </p>

                <p>
                    Si vous n'êtes pas à l'origine de cette demande,
                    vous pouvez ignorer cet email.
                </p>

                <p>
                    Cordialement,<br>
                    <strong>Landolsi Motors</strong>
                </p>
            </div>
        `
    });
};

// ========================================
// COMMANDE CONFIRMÉE : FACTURE + RETRAIT EN MAGASIN
// ========================================

const MAGASIN = {
    nom: "LANDOLSI TIRES",
    ville: process.env.STORE_CITY || "Msaken",
    plan: process.env.STORE_MAPS_URL || "https://maps.app.goo.gl/zJo9s75YR1j2UPc86",
    email: process.env.STORE_CONTACT_EMAIL || "contact@landolsi.com"
};

const echapper = (texte) => String(texte ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

const emailConfigure = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

/**
 * Envoie au client sa facture (PDF joint) et l'informe que sa commande
 * est prête à être récupérée chez LANDOLSI TIRES.
 */
const sendFactureCommandePreteEmail = async ({
    email, prenom, nom, commandeId, numeroFacture, total, pdfBuffer
}, transport = transporter) => {
    if (!emailConfigure() && transport === transporter) {
        const error = new Error("EMAIL_USER / EMAIL_PASS non configurés");
        error.code = "EMAIL_NOT_CONFIGURED";
        throw error;
    }

    const client = echapper(`${prenom || ""} ${nom || ""}`.trim()) || "Madame, Monsieur";
    const montant = Number(total).toFixed(2);

    await transport.sendMail({
        from: `"${MAGASIN.nom}" <${process.env.EMAIL_USER}>`,
        to: email,
        replyTo: MAGASIN.email,
        subject: `Votre commande n°${commandeId} est prête à être récupérée — ${MAGASIN.nom}`,
        text:
            `Bonjour ${prenom || ""} ${nom || ""},\n\n` +
            `Votre commande n°${commandeId} a été vérifiée avec vous et confirmée.\n` +
            `Elle est prête à être récupérée chez ${MAGASIN.nom} (${MAGASIN.ville}).\n` +
            `Plan d'accès : ${MAGASIN.plan}\n\n` +
            `Vous trouverez ci-joint votre facture ${numeroFacture} (total : ${montant} DT).\n` +
            `Merci de vous munir de ce courriel ou du numéro de commande lors du retrait.\n\n` +
            `Pour toute question : ${MAGASIN.email}\n\n` +
            `Merci pour votre confiance,\n${MAGASIN.nom}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #222; max-width: 600px;">
                <h2 style="color: #e30613; margin-top: 0;">${MAGASIN.nom}</h2>

                <p>Bonjour ${client},</p>

                <p>
                    Votre commande <strong>n°${echapper(commandeId)}</strong> a été vérifiée avec vous
                    et <strong>confirmée</strong>.
                </p>

                <p style="background: #f1f8e9; border-left: 4px solid #2e7d32; padding: 12px;">
                    ✅ Votre commande est <strong>prête à être récupérée</strong>
                    chez <strong>${MAGASIN.nom}</strong> (${echapper(MAGASIN.ville)}).<br>
                    <a href="${echapper(MAGASIN.plan)}" style="color: #e30613;">Voir le plan d'accès</a>
                </p>

                <p>
                    Vous trouverez ci-joint votre facture <strong>${echapper(numeroFacture)}</strong>
                    (total : <strong>${montant} DT</strong>).
                </p>

                <p>Merci de vous munir de ce courriel ou de votre numéro de commande lors du retrait.</p>

                <p>
                    Pour toute question : <a href="mailto:${echapper(MAGASIN.email)}">${echapper(MAGASIN.email)}</a>
                </p>

                <p>
                    Merci pour votre confiance,<br>
                    <strong>${MAGASIN.nom}</strong>
                </p>
            </div>
        `,
        attachments: [
            {
                filename: `${numeroFacture}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf"
            }
        ]
    });
};

module.exports = {
    sendResetPasswordEmail,
    sendFactureCommandePreteEmail,
    emailConfigure
};