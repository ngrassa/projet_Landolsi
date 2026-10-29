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

module.exports = {
    sendResetPasswordEmail
};