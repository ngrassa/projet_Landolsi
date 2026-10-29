
const { GoogleGenAI } = require("@google/genai");

const Pneu = require("../models/PneuModel");
const Marque = require("../models/MarqueModel");
const Promotion = require("../models/PromotionModel");

const apiKey = process.env.GEMINI_API_KEY;

console.log(
    "Gemini API key chargée :",
    apiKey ? "OUI" : "NON"
);

const ai = new GoogleGenAI({
    apiKey: apiKey
});


// ========================================
// Formater une date
// ========================================

const formaterDate = (date) => {

    if (!date) {
        return "";
    }

    const d = new Date(date);

    const jour = String(d.getDate()).padStart(2, "0");
    const mois = String(d.getMonth() + 1).padStart(2, "0");
    const annee = d.getFullYear();

    return `${jour}/${mois}/${annee}`;
};


// ========================================
// Chatbot Landolsi
// ========================================

const chatbot = async (req, res) => {

    try {

        const { message } = req.body;


        // ========================================
        // Vérifier le message
        // ========================================

        if (!message || !message.trim()) {

            return res.status(400).json({
                success: false,
                message: "Le message est obligatoire."
            });

        }


        // ========================================
        // Récupérer les pneus depuis PostgreSQL
        // ========================================

        const pneus = await Pneu.findAll({

            include: [
                {
                    model: Marque,
                    as: "marque",
                    attributes: ["id", "nom"]
                }
            ],

            attributes: [
                "id",
                "modele",
                "dimension",
                "largeur",
                "hauteur",
                "diametre",
                "saison",
                "prix",
                "stock",
                "description"
            ],

            order: [["id", "ASC"]]

        });


        // ========================================
        // Transformer les données des pneus
        // ========================================

        const catalogue = pneus.map((pneu) => {

            return {

                id: pneu.id,

                marque: pneu.marque
                    ? pneu.marque.nom
                    : "Non précisée",

                modele: pneu.modele,

                dimension: pneu.dimension,

                largeur: pneu.largeur,

                hauteur: pneu.hauteur,

                diametre: pneu.diametre,

                saison: pneu.saison,

                prix: Number(pneu.prix),

                stock: Number(pneu.stock),

                description: pneu.description || ""

            };

        });


        // ========================================
        // Préparer le catalogue pour Gemini
        // ========================================

        const catalogueTexte = catalogue
            .map((pneu) => {

                return `
PNEU ID : ${pneu.id}
Marque : ${pneu.marque}
Modèle : ${pneu.modele}
Dimension : ${pneu.dimension}
Largeur : ${pneu.largeur}
Hauteur : ${pneu.hauteur}
Diamètre : ${pneu.diametre}
Saison : ${pneu.saison}
Prix : ${pneu.prix} DT
Stock : ${pneu.stock} unité(s)
Description : ${pneu.description}
`;

            })
            .join("\n------------------------\n");


        // ========================================
        // Récupérer les promotions actives
        // ========================================

        const promotions = await Promotion.findAll({

            where: {
                active: true
            },

            include: [
                {
                    model: Pneu,
                    as: "pneu",

                    include: [
                        {
                            model: Marque,
                            as: "marque",
                            attributes: ["id", "nom"]
                        }
                    ]
                }
            ],

            order: [["id", "ASC"]]

        });


        // ========================================
        // Préparer les promotions
        // ========================================

        const promotionsCatalogue = promotions
            .map((promotion) => {

                const pneu = promotion.pneu;

                if (!pneu) {
                    return null;
                }

                const prixOriginal = Number(pneu.prix);

                const pourcentage = Number(
                    promotion.pourcentage
                );

                const prixApresReduction =
                    prixOriginal -
                    (prixOriginal * pourcentage / 100);


                return {

                    promotionId: promotion.id,

                    pneuId: pneu.id,

                    marque: pneu.marque
                        ? pneu.marque.nom
                        : "Non précisée",

                    modele: pneu.modele,

                    dimension: pneu.dimension,

                    saison: pneu.saison,

                    prixOriginal: prixOriginal,

                    pourcentage: pourcentage,

                    prixApresReduction:
                        Number(prixApresReduction.toFixed(2)),

                    stock: Number(pneu.stock),

                    dateDebut:
                        formaterDate(promotion.dateDebut),

                    dateFin:
                        formaterDate(promotion.dateFin)

                };

            })
            .filter(Boolean);


        // ========================================
        // Préparer le texte des promotions
        // ========================================

        const promotionsTexte =
            promotionsCatalogue.length > 0

                ? promotionsCatalogue
                    .map((promotion) => {

                        return `
PROMOTION ID : ${promotion.promotionId}
PNEU ID : ${promotion.pneuId}
Marque : ${promotion.marque}
Modèle : ${promotion.modele}
Dimension : ${promotion.dimension}
Saison : ${promotion.saison}
Prix original : ${promotion.prixOriginal} DT
Réduction : ${promotion.pourcentage} %
Prix après réduction : ${promotion.prixApresReduction} DT
Stock : ${promotion.stock} unité(s)
Date début : ${promotion.dateDebut}
Date fin : ${promotion.dateFin}
`;

                    })
                    .join("\n------------------------\n")

                : "Aucune promotion active actuellement.";


        // ========================================
        // Appel Gemini
        // ========================================

        const response = await ai.models.generateContent({

           model: "gemini-3.5-flash-lite",

            contents: `
QUESTION DU CLIENT :
${message}


========================================
DONNÉES RÉELLES DES PNEUS
========================================

${catalogueTexte}


========================================
DONNÉES RÉELLES DES PROMOTIONS ACTIVES
========================================

${promotionsTexte}
`,

            config: {

                systemInstruction: `
Tu es l'assistant virtuel de Landolsi Motors.

Landolsi Motors est spécialisée dans la vente
de pneus automobiles.

Tu réponds en français, de manière simple,
claire, professionnelle et naturelle.


========================================
RÈGLES IMPORTANTES
========================================

Les informations concernant les pneus et les
promotions doivent provenir UNIQUEMENT des
données réelles fournies dans le message.


NE JAMAIS INVENTER :

- un pneu
- une marque
- un modèle
- une dimension
- une saison
- un prix
- un stock
- une promotion
- un pourcentage
- une date


========================================
PNEUS
========================================

Respecte exactement les valeurs présentes
dans les données :

- marque
- modèle
- dimension
- saison
- prix
- stock


========================================
RECHERCHE PAR MARQUE
========================================

Si le client recherche un pneu par marque :

- utilise uniquement les marques présentes
  dans les données réelles du catalogue ;

- présente uniquement les pneus correspondant
  à la marque demandée ;

- respecte exactement le nom de la marque
  présent dans les données ;

- ne crée jamais une marque qui n'existe pas ;

- si aucun pneu de cette marque n'est trouvé,
  indique simplement qu'aucun pneu correspondant
  n'a été trouvé dans le catalogue.


========================================
AUTRES RECHERCHES
========================================

Le client peut rechercher un pneu selon :

- la marque
- le modèle
- la dimension
- la saison
- le prix
- la disponibilité
- plusieurs critères en même temps


Lorsque plusieurs critères sont demandés,
utilise uniquement les pneus qui correspondent
aux critères demandés.


========================================
STOCK
========================================

Ne modifie jamais les nombres.

Ne change jamais le prix.

Ne change jamais le stock.

Si stock > 0 :
indique que le pneu est disponible.

Si stock = 0 :
indique que le pneu est actuellement
indisponible.


========================================
PROMOTIONS
========================================

Les promotions doivent provenir uniquement
des promotions actives fournies dans les données.

Si le client demande :

"Quels pneus sont en promotion ?"

présente uniquement les promotions présentes
dans les données.


Pour une promotion, tu peux présenter :

- marque
- modèle
- dimension
- saison
- prix original
- pourcentage de réduction
- prix après réduction
- stock
- date de début
- date de fin


Le prix après réduction fourni dans les données
est la valeur officielle à utiliser.

Ne recalcule pas un autre prix.


========================================
DATES
========================================

Les dates des promotions sont déjà fournies
au format :

JJ/MM/AAAA

Utilise exactement ce format.

Ne transforme pas les dates.


========================================
SI AUCUN RÉSULTAT
========================================

Si aucun pneu ne correspond à la demande :

indique simplement qu'aucun pneu correspondant
n'a été trouvé dans le catalogue.


Si aucune promotion active ne correspond
à la demande :

indique qu'aucune promotion correspondante
n'a été trouvée.


========================================
STYLE
========================================

Réponds de façon concise.

Utilise des listes lorsque plusieurs pneus
ou promotions sont disponibles.

Ne donne pas d'informations commerciales
qui ne sont pas présentes dans les données.
`
            }

        });


        // ========================================
        // Réponse au frontend
        // ========================================

        return res.status(200).json({

            success: true,

            reply: response.text

        });


    } catch (error) {

        console.error(
            "❌ Erreur chatbot Gemini :",
            error
        );


        // ========================================
        // Erreur Gemini 503
        // ========================================

        if (
            error.message &&
            error.message.includes("503")
        ) {

            return res.status(503).json({

                success: false,

                message:
                    "L'assistant est momentanément très sollicité. Veuillez réessayer dans quelques instants."

            });

        }


        // ========================================
        // Autres erreurs
        // ========================================

        return res.status(500).json({

            success: false,

            message:
                "Une erreur est survenue avec l'assistant.",

            error: error.message

        });

    }

};


// ========================================
// Export
// ========================================

module.exports = {
    chatbot
};

