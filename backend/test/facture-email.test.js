// Envoi de la facture par e-mail à la confirmation d'une commande.
// Sans base de données ni serveur SMTP (transport et dépendances simulés).
const { test } = require("node:test");
const assert = require("node:assert");

const { genererFacturePdfBuffer } = require("../controllers/FactureController");
const { sendFactureCommandePreteEmail } = require("../services/emailService");
const { envoyerFactureCommandeConfirmee } = require("../services/factureEmailService");

const COMMANDE = {
    id: 42, userId: 7, nom: "Ben Salah", prenom: "Amine", telephone: "20000000",
    adresse: "Rue 1", ville: "Msaken", codePostal: "4070", total: 700, statut: "confirmée",
    items: [{
        quantite: 2, prix: 350,
        pneu: { modele: "Primacy 4", dimension: "205/55 R16", marque: { nom: "Michelin" } }
    }]
};
const FACTURE = { numeroFacture: "FAC-2026-0042", dateFacture: new Date("2026-10-31"), commande: COMMANDE };

test("le PDF de la facture est généré en mémoire", async () => {
    const pdf = await genererFacturePdfBuffer(FACTURE);
    assert.ok(Buffer.isBuffer(pdf));
    assert.strictEqual(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.ok(pdf.length > 1000);
});

test("e-mail : message « prête à être récupérée », facture jointe, données échappées", async () => {
    const sent = [];
    const transport = { sendMail: async (m) => sent.push(m) };
    const pdf = Buffer.from("%PDF-test");
    await sendFactureCommandePreteEmail({
        email: "client@example.com", prenom: "<script>x</script>", nom: "Ben Salah",
        commandeId: 42, numeroFacture: "FAC-2026-0042", total: 700, pdfBuffer: pdf
    }, transport);

    assert.strictEqual(sent.length, 1);
    const m = sent[0];
    assert.strictEqual(m.to, "client@example.com");
    assert.match(m.subject, /commande n°42 est prête à être récupérée — LANDOLSI TIRES/);
    assert.match(m.html, /prête à être récupérée/);
    assert.match(m.html, /LANDOLSI TIRES/);
    assert.match(m.html, /700\.00 DT/);
    assert.match(m.text, /FAC-2026-0042/);
    assert.ok(!m.html.includes("<script>"), "le prénom doit être échappé");
    assert.strictEqual(m.attachments[0].filename, "FAC-2026-0042.pdf");
    assert.strictEqual(m.attachments[0].contentType, "application/pdf");
    assert.strictEqual(m.attachments[0].content, pdf);
});

test("confirmation : facture générée puis envoyée à l'adresse du compte client", async () => {
    const envois = [];
    const r = await envoyerFactureCommandeConfirmee(COMMANDE, {
        trouverClient: async (id) => (id === 7 ? { email: "amine@example.com", nom: "X", prenom: "Y" } : null),
        chargerFacture: async (id) => (id === 42 ? FACTURE : null),
        genererFacturePdfBuffer: async () => Buffer.from("%PDF-1"),
        envoyerEmail: async (args) => envois.push(args)
    });
    assert.strictEqual(r.envoye, true);
    assert.strictEqual(r.destinataire, "amine@example.com");
    assert.strictEqual(envois.length, 1);
    assert.strictEqual(envois[0].prenom, "Amine"); // nom saisi sur la commande prioritaire
    assert.strictEqual(envois[0].numeroFacture, "FAC-2026-0042");
    assert.ok(Buffer.isBuffer(envois[0].pdfBuffer));
});

test("client sans e-mail : pas d'envoi, message explicite", async () => {
    const r = await envoyerFactureCommandeConfirmee(COMMANDE, {
        trouverClient: async () => ({ email: null }),
        envoyerEmail: async () => assert.fail("ne doit pas envoyer")
    });
    assert.strictEqual(r.envoye, false);
    assert.match(r.message, /Aucune adresse e-mail/);
});

test("SMTP non configuré : la confirmation n'échoue pas, message clair", async () => {
    const err = new Error("x");
    err.code = "EMAIL_NOT_CONFIGURED";
    const r = await envoyerFactureCommandeConfirmee(COMMANDE, {
        trouverClient: async () => ({ email: "a@b.c" }),
        chargerFacture: async () => FACTURE,
        genererFacturePdfBuffer: async () => Buffer.from("x"),
        envoyerEmail: async () => { throw err; }
    });
    assert.strictEqual(r.envoye, false);
    assert.match(r.message, /EMAIL_USER/);
});

test("erreur SMTP : aucun détail technique renvoyé à l'interface", async () => {
    const r = await envoyerFactureCommandeConfirmee(COMMANDE, {
        trouverClient: async () => ({ email: "a@b.c" }),
        chargerFacture: async () => FACTURE,
        genererFacturePdfBuffer: async () => Buffer.from("x"),
        envoyerEmail: async () => { throw new Error("535 Invalid login: user@gmail.com password=secret"); }
    });
    assert.strictEqual(r.envoye, false);
    assert.ok(!/535|secret|gmail/.test(r.message));
});
