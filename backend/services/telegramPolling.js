
const axios = require("axios");
const { Op } = require("sequelize");

const { analyserQuestionTelegram } = require("./telegramAI");
const User = require("../models/UserModel");
const Commande = require("../models/Commande");
const Reclamation = require("../models/ReclamationModel");

const { envoyerReponseTelegram } = require("./telegramService");

let dernierUpdateId = 0;
let pollingActif = false;
const messagesTraites = new Set();

function normaliser(texte) {
    return texte
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

// Recherche un client par nom, prénom ou email.
async function rechercherClients(texte) {
    const recherche = (texte || "").trim();

    if (!recherche || recherche.length < 2) {
        return [];
    }

    const emailMatch = recherche.match(
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
    );

    let where;

    if (emailMatch) {
        where = {
            email: { [Op.iLike]: emailMatch[0] }
        };
    } else {
        const mots = normaliser(recherche)
            .replace(/[?!,;:]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .split(" ")
            .filter(Boolean);

        if (mots.length === 0) {
            return [];
        }

        where = {
            [Op.or]: [
                ...mots.map(mot => ({
                    nom: { [Op.iLike]: `%${mot}%` }
                })),
                ...mots.map(mot => ({
                    prenom: { [Op.iLike]: `%${mot}%` }
                })),
                {
                    email: { [Op.iLike]: `%${recherche}%` }
                }
            ]
        };
    }

    return User.findAll({
        where: {
            ...where,
            role: "client"
        },
        attributes: [
            "id",
            "nom",
            "prenom",
            "email",
            "telephone",
            "ville",
            "typeClient"
        ],
        limit: 10,
        order: [["id", "DESC"]]
    });
}

function afficherAide() {
    return (
        "🤖 Assistant LANDOLSI TIRES\n\n" +
        "Écris simplement un mot ou une demande courte :\n\n" +
        "• clients : consulter les clients\n" +
        "• Minyar : rechercher un client\n" +
        "• commandes : les 10 commandes récentes\n" +
        "• commandes Minyar : commandes du client\n" +
        "• réclamation : les 10 réclamations récentes\n" +
        "• réclamation Minyar : réclamations du client\n" +
        "• /help : afficher cette aide"
    );
}

function afficherClient(client) {
    return (
        "👤 Informations du client\n\n" +
        `Nom : ${client.nom || "Non renseigné"}\n` +
        `Prénom : ${client.prenom || "Non renseigné"}\n` +
        `Email : ${client.email || "Non renseigné"}\n` +
        `Téléphone : ${client.telephone || "Non renseigné"}\n` +
        `Ville : ${client.ville || "Non renseignée"}\n` +
        `Type : ${client.typeClient || "Non renseigné"}\n` +
        `ID : ${client.id}\n\n` +
        "Tu peux demander ses commandes ou ses réclamations."
    );
}

function afficherListeClients(clients) {
    if (clients.length === 0) {
        return "Aucun client enregistré.";
    }

    return (
        "👥 Liste des clients (maximum 10)\n\n" +
        clients.map((c, i) =>
            `${i + 1}. ${c.prenom || ""} ${c.nom || ""}\n` +
            `Email : ${c.email || "Non renseigné"}\n` +
            `ID : ${c.id}`
        ).join("\n\n") +
        "\n\nPour consulter un client, écris son nom ou son email."
    );
}

function afficherCommandes(commandes, titre) {
    if (commandes.length === 0) {
        return "📦 Aucune commande enregistrée pour cette recherche.";
    }

    return (
        `${titre}\n\n` +
        commandes.map(c =>
            `📦 Commande #${c.id}\n` +
            `Client : ${[c.prenom, c.nom].filter(Boolean).join(" ") || "Non renseigné"}\n` +
            `Date : ${c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : "Non disponible"}\n` +
            `Total : ${Number(c.total || 0).toFixed(2)} DT\n` +
            `Statut : ${c.statut || "Non renseigné"}`
        ).join("\n\n")
    );
}

function afficherReclamations(reclamations, titre) {
    if (reclamations.length === 0) {
        return "📝 Aucune réclamation enregistrée pour cette recherche.";
    }

    return (
        `${titre}\n\n` +
        reclamations.map(r =>
            `📝 Réclamation #${r.id}\n` +
            `Sujet : ${r.sujet || "Non renseigné"}\n` +
            `Description : ${r.description || "Non renseignée"}\n` +
            `Statut : ${r.statut || "Non renseigné"}\n` +
            `Réponse admin : ${r.reponseAdmin || "Aucune réponse"}`
        ).join("\n\n")
    );
}

async function traiterMessageTelegram(texte) {
    const question = normaliser(texte);

    if (
        ["/start", "/help", "bonjour", "salut", "aide"].includes(question)
    ) {
        return afficherAide();
    }

    // Gemini interprète la demande ; PostgreSQL fournit les données réelles.
    const intention = await analyserQuestionTelegram(texte);

    if (intention.action === "aide") {
        return afficherAide();
    }

    if (intention.action === "inconnu") {
        return (
            "🤔 Je n'ai pas compris ta demande.\n\n" +
            "Essaie : clients, commandes, réclamation ou le nom d'un client.\n" +
            "Envoie /help pour afficher les exemples."
        );
    }

    // Afficher les clients sans exiger un nom.
    if (intention.action === "client" && !intention.recherche) {
        const clients = await User.findAll({
            where: { role: "client" },
            attributes: [
                "id",
                "nom",
                "prenom",
                "email",
                "telephone",
                "ville",
                "typeClient"
            ],
            order: [["id", "DESC"]],
            limit: 10
        });

        return afficherListeClients(clients);
    }

    // Commandes récentes de tous les clients.
    if (intention.action === "commandes_recentes") {
        const commandes = await Commande.findAll({
            order: [["createdAt", "DESC"]],
            limit: 10
        });

        return afficherCommandes(
            commandes,
            "📦 Les 10 commandes les plus récentes"
        );
    }

    // Réclamations récentes de tous les clients.
    if (intention.action === "reclamations_recentes") {
        const reclamations = await Reclamation.findAll({
            order: [["createdAt", "DESC"]],
            limit: 10
        });

        return afficherReclamations(
            reclamations,
            "📝 Les 10 réclamations les plus récentes"
        );
    }

    const actionsAutorisees = [
        "client",
        "commandes_client",
        "reclamations_client"
    ];

    if (!actionsAutorisees.includes(intention.action)) {
        return "Action non reconnue. Envoie /help pour afficher les exemples.";
    }

    const clients = await rechercherClients(intention.recherche);

    if (clients.length === 0) {
        return (
            `🔎 Aucun client trouvé pour : ${intention.recherche || "(vide)"}\n\n` +
            "Essaie avec son nom, son prénom ou son email exact."
        );
    }

    if (clients.length > 1) {
        return (
            "Plusieurs clients correspondent à ta recherche :\n\n" +
            clients.map((c, i) =>
                `${i + 1}. ${c.prenom || ""} ${c.nom || ""}\n` +
                `Email : ${c.email || "Non renseigné"}\n` +
                `ID : ${c.id}`
            ).join("\n\n") +
            "\n\nPrécise l'email exact du client pour éviter toute confusion."
        );
    }

    const client = clients[0];

    if (intention.action === "client") {
        return afficherClient(client);
    }

    if (intention.action === "commandes_client") {
        const commandes = await Commande.findAll({
            where: { userId: client.id },
            order: [["createdAt", "DESC"]],
            limit: 10
        });

        return afficherCommandes(
            commandes,
            `📦 Commandes de ${client.prenom || ""} ${client.nom || ""}`
        );
    }

    if (intention.action === "reclamations_client") {
        const reclamations = await Reclamation.findAll({
            where: { userId: client.id },
            order: [["createdAt", "DESC"]],
            limit: 10
        });

        return afficherReclamations(
            reclamations,
            `📝 Réclamations de ${client.prenom || ""} ${client.nom || ""}`
        );
    }

    return "Demande non traitée. Envoie /help pour afficher les exemples.";
}

async function demarrerTelegramPolling() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !adminChatId) {
        console.error(
            "❌ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant dans .env"
        );
        return;
    }

    if (pollingActif) {
        console.log("⚠️ Le polling Telegram est déjà actif.");
        return;
    }

    pollingActif = true;
    console.log("🤖 Assistant Telegram LANDOLSI TIRES démarré.");

    while (pollingActif) {
        try {
            const response = await axios.get(
                `https://api.telegram.org/bot${token}/getUpdates`,
                {
                    params: {
                        offset: dernierUpdateId + 1,
                        timeout: 30
                    },
                    timeout: 35000
                }
            );

            if (!response.data.ok) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            for (const update of response.data.result) {
                dernierUpdateId = update.update_id;

                const message = update.message;
                if (!message || !message.text) continue;

                const chatId = String(message.chat.id);
                const texte = message.text.trim();
                const messageId = message.message_id;

                // Autoriser uniquement le chat de l'administrateur.
                if (chatId !== String(adminChatId)) {
                    console.warn(
                        "⚠️ Message ignoré : chat Telegram non autorisé."
                    );
                    continue;
                }

                const cle = `${chatId}:${messageId}`;

                if (messagesTraites.has(cle)) continue;
                messagesTraites.add(cle);

                console.log("📩 Question de l'administrateur :", texte);

                try {
                    const reponse = await traiterMessageTelegram(texte);

                    // Découper les réponses longues pour Telegram.
                    const morceaux = reponse.match(/[\s\S]{1,3800}/g) || [
                        "Aucune réponse disponible."
                    ];

                    for (const morceau of morceaux) {
                        await envoyerReponseTelegram(chatId, morceau);
                    }
                } catch (error) {
                    console.error(
                        "❌ Erreur traitement assistant :",
                        error.response?.data || error.message
                    );

                    await envoyerReponseTelegram(
                        chatId,
                        "Une erreur est survenue pendant la recherche. Vérifie Gemini, le serveur et la base de données."
                    );
                }

                if (messagesTraites.size > 500) {
                    messagesTraites.clear();
                }
            }
        } catch (error) {
            console.error(
                "❌ Erreur polling Telegram :",
                error.response?.data || error.message
            );

            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

function arreterTelegramPolling() {
    pollingActif = false;
}

module.exports = { demarrerTelegramPolling, arreterTelegramPolling };
