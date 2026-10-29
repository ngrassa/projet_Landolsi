
require("./config");

const { User } = require("./models/associations");

const createAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        // Vérifier les variables .env
        if (!email || !password) {
            throw new Error(
                "ADMIN_EMAIL ou ADMIN_PASSWORD manque dans le fichier .env"
            );
        }

        // Vérifier si un utilisateur existe déjà avec cet email
        const existingUser = await User.findOne({
            where: { email }
        });

        // =====================================================
        // CAS 1 : L'utilisateur existe déjà
        // =====================================================

        if (existingUser) {
            console.log("⚠️ L'utilisateur existe déjà.");

            // Vérifier que c'est bien un administrateur
            if (existingUser.role === "admin") {

                // On donne le mot de passe en clair au modèle User.
                // Le hook beforeUpdate de UserModel va automatiquement
                // le hasher.
                existingUser.password = password;
                existingUser.isActive = true;

                await existingUser.save();

                console.log("✅ Mot de passe administrateur mis à jour !");
                console.log("📧 Email :", existingUser.email);
                console.log("👤 Rôle :", existingUser.role);

            } else {
                console.log(
                    "❌ Cet email appartient à un utilisateur avec le rôle :",
                    existingUser.role
                );
            }

            return;
        }

        // =====================================================
        // CAS 2 : L'utilisateur n'existe pas
        // =====================================================

        // On ne hash PAS le mot de passe ici.
        // Le hook beforeCreate de UserModel va automatiquement
        // le hasher.
        const admin = await User.create({
            nom: "Landolsi",
            prenom: "Admin",
            email: email,
            password: password,

            telephone: "00000000",
            adresse: "Landolsi Motors",
            ville: "Sousse",
            codePostal: "4000",
            pays: "Tunisie",

            typeClient: "professionnel",
            role: "admin",
            isActive: true
        });

        console.log("✅ Administrateur créé avec succès !");
        console.log("📧 Email :", admin.email);
        console.log("👤 Rôle :", admin.role);

    } catch (error) {
        console.error("❌ Erreur création admin :", error);
    } finally {
        process.exit();
    }
};

createAdmin();

