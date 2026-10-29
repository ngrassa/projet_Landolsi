const axios = require("axios");
const Vehicule = require("../models/VehiculeModel");
const Pneu = require("../models/PneuModel");

// =================================
// Rechercher un véhicule
// par immatriculation tunisienne
// =================================

module.exports.searchVehicule = async (req, res) => {

    try {

        const { immatriculation } = req.params;


        // ==============================
        // Vérifier l'immatriculation
        // ==============================

        if (!immatriculation) {

            return res.status(400).json({

                success: false,

                message:
                    "Veuillez saisir une immatriculation."

            });

        }


        console.log(
            "Immatriculation recherchée :",
            immatriculation
        );


        // ==============================
        // Appel VehiculeAPI
        // ==============================

        const response = await axios.get(
            "https://www.regcheck.org.uk/api/reg.asmx/CheckTunisia",
            {

                params: {

                    RegistrationNumber:
                        immatriculation,

                    username:
                        process.env.VEHICULE_API_USERNAME

                }

            }
        );


        // ==============================
        // Réponse de l'API
        // ==============================

        const data = response.data;


        console.log(
            "Réponse brute VehiculeAPI :",
            data
        );


        // ==============================
        // Extraire le JSON
        // ==============================

        const jsonStart =
            data.indexOf("{");


        const jsonEnd =
            data.lastIndexOf("}");


        if (
            jsonStart === -1 ||
            jsonEnd === -1
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Réponse invalide de VehiculeAPI."

            });

        }


        const jsonString =
            data.substring(
                jsonStart,
                jsonEnd + 1
            );


        const vehiculeAPI =
            JSON.parse(jsonString);


        // ==============================
        // Construire notre objet véhicule
        // ==============================

        const vehicule = {

            immatriculation:
                immatriculation,

            description:
                vehiculeAPI.Description,

            annee:
                vehiculeAPI.RegistrationYear,

            dateImmatriculation:
                vehiculeAPI.RegistrationDate,

            marque:
                vehiculeAPI.CarMake
                    ?.CurrentTextValue,

            modele:
                vehiculeAPI.CarModel
                    ?.CurrentTextValue,

            carburant:
                vehiculeAPI.FuelType,

            variante:
                vehiculeAPI.Variant,

            moteur:
                vehiculeAPI.Engine,

            type:
                vehiculeAPI.Type,

            puissanceFiscale:
                vehiculeAPI.FiscalPower,

            image:
                vehiculeAPI.ImageUrl

        };


        console.log(
            "Véhicule traité :",
            vehicule
        );


        // ==============================
        // Enregistrer dans PostgreSQL
        // ==============================

        const [vehiculeDB, created] =
            await Vehicule.findOrCreate({

                where: {

                    immatriculation:
                        immatriculation

                },

                defaults:
                    vehicule

            });


        console.log(
            created
                ? "✅ Nouveau véhicule enregistré"
                : "ℹ️ Véhicule déjà existant"
        );


        // ==============================
        // Récupérer les pneus compatibles
        // ==============================

        const pneus =
            await vehiculeDB.getPneus({

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
                    "description",
                    "image",
                    "marqueId"
                ]

            });


        console.log(
            "Pneus compatibles :",
            pneus
        );


        // ==============================
        // Réponse finale
        // ==============================

        return res.status(200).json({

            success: true,

            created,

            vehicule:
                vehiculeDB,

            pneus

        });


    } catch (error) {

        console.error(
            "Erreur VehiculeAPI :",
            error.response?.data ||
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Impossible de rechercher le véhicule."

        });

    }

};