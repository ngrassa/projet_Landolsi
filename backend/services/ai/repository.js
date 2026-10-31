// =====================================================
// Accès aux données réelles pour les assistants IA
// =====================================================
// Requêtes Sequelize paramétrées uniquement : le LLM ne
// fournit jamais de SQL. Les outils dépendent de cette
// interface, ce qui permet de la simuler dans les tests.

const { Op } = require("sequelize");
const {
    Pneu, Marque, Vehicule, Promotion, Commande, CommandeItem
} = require("../../models/associations");

const TIRE_ATTRS = [
    "id", "modele", "dimension", "largeur", "hauteur", "diametre",
    "saison", "prix", "stock", "description", "image", "marqueId"
];

// Même règle que la création de commande : promotion active
// ET date du jour comprise entre dateDebut et dateFin.
async function activePromotions(pneuIds) {
    if (!pneuIds.length) return new Map();
    const now = new Date();
    const promos = await Promotion.findAll({
        where: {
            pneuId: { [Op.in]: pneuIds },
            active: true,
            dateDebut: { [Op.lte]: now },
            dateFin: { [Op.gte]: now }
        },
        attributes: ["pneuId", "pourcentage", "dateFin"]
    });
    const map = new Map();
    for (const p of promos) {
        const current = map.get(p.pneuId);
        if (!current || p.pourcentage > current.pourcentage) {
            map.set(p.pneuId, { pourcentage: Number(p.pourcentage), dateFin: p.dateFin });
        }
    }
    return map;
}

function toTire(row, promo) {
    const prix = Number(row.prix);
    return {
        id: row.id,
        marque: row.marque ? row.marque.nom : null,
        modele: row.modele,
        dimension: row.dimension,
        largeur: row.largeur,
        hauteur: row.hauteur,
        diametre: row.diametre,
        saison: row.saison,
        prix,
        prixPromo: promo ? Number((prix * (1 - promo.pourcentage / 100)).toFixed(2)) : null,
        pourcentagePromotion: promo ? promo.pourcentage : 0,
        stock: Number(row.stock) || 0,
        description: row.description || null,
        image: row.image || null
    };
}

async function withPromos(rows) {
    const promos = await activePromotions(rows.map((r) => r.id));
    return rows.map((r) => toTire(r, promos.get(r.id)));
}

const repository = {

    async searchTires({ largeur, hauteur, diametre, marque, saison, prixMax, prixMin, ids, limit = 20 }) {
        const where = {};
        if (largeur) where.largeur = largeur;
        if (hauteur) where.hauteur = hauteur;
        if (diametre) where.diametre = diametre;
        if (saison) where.saison = { [Op.iLike]: saison };
        if (prixMax || prixMin) {
            where.prix = {};
            if (prixMax) where.prix[Op.lte] = prixMax;
            if (prixMin) where.prix[Op.gte] = prixMin;
        }
        if (ids) where.id = { [Op.in]: ids };

        const include = [{
            model: Marque,
            as: "marque",
            attributes: ["id", "nom"],
            ...(marque ? { where: { nom: { [Op.iLike]: marque } } } : {})
        }];

        const rows = await Pneu.findAll({
            where, include, attributes: TIRE_ATTRS,
            order: [["prix", "ASC"]],
            limit
        });
        return withPromos(rows);
    },

    async getTiresByIds(ids) {
        if (!ids.length) return [];
        const rows = await Pneu.findAll({
            where: { id: { [Op.in]: ids } },
            include: [{ model: Marque, as: "marque", attributes: ["id", "nom"] }],
            attributes: TIRE_ATTRS
        });
        return withPromos(rows);
    },

    async listBrands() {
        const rows = await Marque.findAll({ attributes: ["nom"], order: [["nom", "ASC"]] });
        return rows.map((r) => r.nom);
    },

    async listSeasons() {
        const rows = await Pneu.findAll({
            attributes: ["saison"], group: ["saison"], raw: true
        });
        return rows.map((r) => r.saison).filter(Boolean);
    },

    // Véhicule connu de la base + pneus associés (table vehicule_pneus)
    async findVehicleByPlate(immatriculation) {
        const v = await Vehicule.findOne({
            where: { immatriculation: { [Op.iLike]: immatriculation } },
            attributes: ["id", "immatriculation", "marque", "modele", "annee", "variante", "carburant"],
            include: [{ model: Pneu, as: "pneus", attributes: ["id"], through: { attributes: [] } }]
        });
        if (!v) return null;
        return {
            immatriculation: v.immatriculation,
            marque: v.marque, modele: v.modele, annee: v.annee,
            variante: v.variante, carburant: v.carburant,
            pneuIds: (v.pneus || []).map((p) => p.id)
        };
    },

    // Lignes de vente d'une période (une ligne par article commandé)
    async salesItems(from, to) {
        const items = await CommandeItem.findAll({
            attributes: ["pneuId", "quantite", "prix", "prixOriginal", "pourcentagePromotion"],
            include: [
                {
                    model: Commande, as: "commande",
                    attributes: ["id", "statut", "createdAt"],
                    where: { createdAt: { [Op.gte]: from, [Op.lt]: to } }
                },
                {
                    model: Pneu, as: "pneu",
                    attributes: ["id", "modele", "dimension", "saison"],
                    include: [{ model: Marque, as: "marque", attributes: ["nom"] }]
                }
            ]
        });
        return items.map((i) => ({
            commandeId: i.commande.id,
            statut: i.commande.statut,
            date: i.commande.createdAt,
            pneuId: i.pneuId,
            modele: i.pneu ? i.pneu.modele : `Pneu #${i.pneuId} (supprimé)`,
            dimension: i.pneu ? i.pneu.dimension : null,
            saison: i.pneu ? i.pneu.saison : null,
            marque: i.pneu && i.pneu.marque ? i.pneu.marque.nom : "Non précisée",
            quantite: Number(i.quantite),
            prix: Number(i.prix)
        }));
    },

    async ordersInPeriod(from, to) {
        const rows = await Commande.findAll({
            where: { createdAt: { [Op.gte]: from, [Op.lt]: to } },
            attributes: ["id", "statut", "total", "createdAt"],
            raw: true
        });
        return rows.map((r) => ({ ...r, total: Number(r.total) }));
    },

    async stockLevels() {
        const rows = await Pneu.findAll({
            attributes: ["id", "modele", "dimension", "stock", "prix"],
            include: [{ model: Marque, as: "marque", attributes: ["nom"] }],
            order: [["stock", "ASC"]]
        });
        return rows.map((r) => ({
            pneuId: r.id, modele: r.modele, dimension: r.dimension,
            marque: r.marque ? r.marque.nom : "Non précisée",
            stock: Number(r.stock) || 0, prix: Number(r.prix)
        }));
    },

    // Commandes du client connecté : uniquement les champs utiles au SAV
    async userOrders(userId, limit = 5) {
        const rows = await Commande.findAll({
            where: { userId },
            attributes: ["id", "statut", "total", "createdAt", "updatedAt"],
            order: [["createdAt", "DESC"]],
            limit
        });
        return rows.map((r) => ({
            id: r.id, statut: r.statut, total: Number(r.total),
            date: r.createdAt, derniereMiseAJour: r.updatedAt
        }));
    },

    // Contrôle d'accès horizontal : la commande doit appartenir à userId
    async orderForUser(orderId, userId) {
        const c = await Commande.findOne({
            where: { id: orderId, userId },
            attributes: ["id", "statut", "total", "createdAt", "updatedAt"],
            include: [{
                model: CommandeItem, as: "items",
                attributes: ["quantite", "prix"],
                include: [{
                    model: Pneu, as: "pneu", attributes: ["modele", "dimension"],
                    include: [{ model: Marque, as: "marque", attributes: ["nom"] }]
                }]
            }]
        });
        if (!c) return null;
        return {
            id: c.id, statut: c.statut, total: Number(c.total),
            date: c.createdAt, derniereMiseAJour: c.updatedAt,
            articles: (c.items || []).map((i) => ({
                pneu: i.pneu ? `${i.pneu.marque ? i.pneu.marque.nom + " " : ""}${i.pneu.modele} ${i.pneu.dimension}` : "Article retiré du catalogue",
                quantite: i.quantite,
                prixUnitaire: Number(i.prix)
            }))
        };
    }
};

module.exports = repository;
