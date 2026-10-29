require("./config");

const { sendResetPasswordEmail } = require("./services/emailService");

const test = async () => {
    try {
        await sendResetPasswordEmail(
            "lahwayaminyar@gmail.com",
            "123456"
        );

        console.log("✅ Email envoyé avec succès !");
    } catch (error) {
        console.error("❌ Erreur d'envoi :", error);
    }
};

test();