
require("./config");

const axios = require("axios");

async function testTelegram() {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            throw new Error("TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant dans .env");
        }

        const response = await axios.post(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                chat_id: chatId,
                text: "✅ Test réussi ! Les notifications Telegram de LANDOLSI TIRES fonctionnent."
            }
        );

        console.log("Message envoyé avec succès :", response.data.ok);
    } catch (error) {
        console.error(
            "Erreur Telegram :",
            error.response?.data || error.message
        );
    }
}

testTelegram();
