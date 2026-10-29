
const express = require("express");
const router = express.Router();

const {
    envoyerReponseTelegram
} = require("../services/telegramService");

// Réception des messages Telegram (mode webhook, non utilisé par défaut :
// l'application fonctionne en polling). Désactivé tant que
// TELEGRAM_WEBHOOK_SECRET n'est pas défini; Telegram envoie ce secret
// dans l'en-tête X-Telegram-Bot-Api-Secret-Token (setWebhook secret_token).
router.post("/webhook", async (req, res) => {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!secret || req.get("X-Telegram-Bot-Api-Secret-Token") !== secret) {
        return res.status(404).json({ success: false, message: "Introuvable" });
    }

    try {
        const update = req.body;
        const message = update.message;

        if (!message || !message.text) {
            return res.status(200).json({
                success: true,
                message: "Aucun message texte à traiter."
            });
        }

        const chatId = message.chat.id;
        const texte = message.text;

        console.log("📩 Message reçu :", texte);

        // Réponse temporaire pour tester le bot
        await envoyerReponseTelegram(
            chatId,
            `Bonjour ! 👋 J'ai bien reçu ton message : ${texte}`
        );

        return res.status(200).json({
            success: true,
            message: "Message reçu et réponse envoyée sur Telegram."
        });

    } catch (error) {
        console.error("Erreur webhook Telegram :", error.message);

        return res.status(500).json({
            success: false,
            message: "Erreur lors du traitement du message."
        });
    }
});

module.exports = router;
