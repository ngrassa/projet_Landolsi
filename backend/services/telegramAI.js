
require("../config");

const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Comprendre la demande de l'administrateur avec Gemini.
async function analyserQuestionTelegram(question) {
    if (!apiKey || !ai) {
        throw new Error("GEMINI_API_KEY manquante dans .env");
    }

    if (typeof question !== "string" || !question.trim()) {
        throw new Error("La question est vide.");
    }

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: question.trim(),
        config: {
            systemInstruction: `
Tu es l'assistant intelligent de gestion de LANDOLSI TIRES.

Tu dois comprendre les messages courts, les mots isolés et les phrases
incomplètes en français. L'administrateur ne doit pas écrire une phrase complète.

Réponds uniquement avec un objet JSON valide contenant exactement
deux propriétés : "action" et "recherche".

Actions autorisées :
- "client" : rechercher les informations d'un client.
- "commandes_client" : rechercher les commandes d'un client.
- "reclamations_client" : rechercher les réclamations d'un client.
- "commandes_recentes" : consulter les commandes récentes.
- "reclamations_recentes" : consulter les réclamations récentes.
- "aide" : afficher les commandes disponibles.
- "inconnu" : demande non comprise.

Exemples :
Message : "réclamation"
JSON : {"action":"reclamations_recentes","recherche":""}

Message : "réclamations"
JSON : {"action":"reclamations_recentes","recherche":""}

Message : "commandes"
JSON : {"action":"commandes_recentes","recherche":""}

Message : "clients"
JSON : {"action":"client","recherche":""}

Message : "Minyar"
JSON : {"action":"client","recherche":"Minyar"}

Message : "commandes Minyar"
JSON : {"action":"commandes_client","recherche":"Minyar"}

Message : "réclamation Minyar"
JSON : {"action":"reclamations_client","recherche":"Minyar"}

Message : "bonjour"
JSON : {"action":"aide","recherche":""}

Règles :
- Si le message contient réclamation, réclamations, plainte ou plaintes
  sans nom identifiable, utilise "reclamations_recentes".
- Si le message contient commande, commandes, achat ou achats
  sans nom identifiable, utilise "commandes_recentes".
- Si un nom, prénom ou email accompagne une demande de réclamation,
  utilise "reclamations_client".
- Si un nom, prénom ou email accompagne une demande de commande,
  utilise "commandes_client".
- Si un nom, prénom ou email est envoyé seul, utilise "client".
- Pour les actions "client", "commandes_client" et "reclamations_client",
  recherche contient uniquement le nom, prénom ou email recherché.
- Pour "commandes_recentes", "reclamations_recentes", "aide" et "inconnu",
  recherche doit être une chaîne vide.
- Pour "clients" sans nom, utilise "client" avec une recherche vide.
- Ne fabrique jamais de données client.
- N'ajoute aucune autre propriété.
`
        }
    });

    const texte = response.text;

    if (!texte || !texte.trim()) {
        throw new Error("Gemini a renvoyé une réponse vide.");
    }

    // Retirer les éventuelles balises Markdown.
    const json = texte
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    let resultat;

    try {
        resultat = JSON.parse(json);
    } catch {
        throw new Error("La réponse de Gemini n'est pas un JSON valide.");
    }

    const actionsAutorisees = [
        "client",
        "commandes_client",
        "reclamations_client",
        "commandes_recentes",
        "reclamations_recentes",
        "aide",
        "inconnu"
    ];

    if (
        !resultat ||
        typeof resultat !== "object" ||
        Array.isArray(resultat) ||
        !actionsAutorisees.includes(resultat.action)
    ) {
        throw new Error("Action Gemini non autorisée.");
    }

    const actionsAvecRecherche = [
        "client",
        "commandes_client",
        "reclamations_client"
    ];

    if (
        typeof resultat.recherche !== "string" ||
        (
            !actionsAvecRecherche.includes(resultat.action) &&
            resultat.recherche !== ""
        )
    ) {
        throw new Error("Format de réponse Gemini invalide.");
    }

    if (
        actionsAvecRecherche.includes(resultat.action) &&
        !resultat.recherche.trim()
    ) {
        // "clients" seul peut demander la liste des clients.
        if (resultat.action !== "client") {
            throw new Error("Aucun client identifié dans la demande.");
        }
    }

    return {
        action: resultat.action,
        recherche: resultat.recherche.trim()
    };
}

module.exports = { analyserQuestionTelegram };
