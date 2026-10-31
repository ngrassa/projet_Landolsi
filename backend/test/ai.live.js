// Test d'intégration RÉEL avec l'API Mistral (consomme quelques crédits).
// Isolé de `npm test`. Données de catalogue simulées, aucune base requise.
//   MISTRAL_API_KEY=... node test/ai.live.js
const { createAiController } = require("../controllers/AiController");
const { defaultClient } = require("../services/ai/mistralClient");

if (!defaultClient.isConfigured()) {
    console.log("MISTRAL_API_KEY absent : test ignoré.");
    process.exit(0);
}

const TIRES = [
    { id: 1, marque: "Michelin", modele: "Primacy 4", dimension: "205/55 R16", largeur: 205, hauteur: 55, diametre: 16, saison: "Été", prix: 320, prixPromo: null, pourcentagePromotion: 0, stock: 8 },
    { id: 2, marque: "Sailun", modele: "Atrezzo Elite", dimension: "205/55 R16", largeur: 205, hauteur: 55, diametre: 16, saison: "Été", prix: 180, prixPromo: 162, pourcentagePromotion: 10, stock: 20 },
    { id: 3, marque: "Hankook", modele: "Ventus Prime", dimension: "205/55 R16", largeur: 205, hauteur: 55, diametre: 16, saison: "Été", prix: 240, prixPromo: null, pourcentagePromotion: 0, stock: 5 }
];
const repo = {
    listBrands: async () => ["Hankook", "Michelin", "Sailun"],
    listSeasons: async () => ["Été"],
    searchTires: async (f) => TIRES.filter((t) => !f.largeur || (t.largeur === f.largeur && t.hauteur === f.hauteur && t.diametre === f.diametre)),
    getTiresByIds: async (ids) => TIRES.filter((t) => ids.includes(t.id)),
    findVehicleByPlate: async () => null,
    userOrders: async () => [],
    orderForUser: async () => null
};

const c = createAiController({ repo });
const call = (fn, body, req = {}) => new Promise((resolve) => {
    fn({ body, ...req }, { status(s) { this.s = s; return this; }, json(d) { resolve({ status: this.s || 200, ...d }); } });
});

(async () => {
    const r1 = await call(c.tireAdvisorChat, { message: "Je cherche des pneus 205/55 R16 pour rouler sur autoroute, budget 300 DT par pneu." });
    console.log("CONSEILLER", r1.status, "produits:", (r1.products || []).map((p) => `${p.id}:${p.compatibilite}`).join(","));
    console.log(r1.reply || r1.message);
    const r2 = await call(c.supportChat, { message: "Je veux retourner un pneu, comment faire ?" });
    console.log("\nSAV", r2.status, "sources:", JSON.stringify(r2.sources), "brouillon:", Boolean(r2.ticketDraft));
    console.log(r2.reply || r2.message);
})();
