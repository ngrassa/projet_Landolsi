const Pneu = require("../models/PneuModel");
const Marque = require("../models/MarqueModel");


// ==============================
// Ajouter un pneu
// ==============================

module.exports.addPneu = async (req, res) => {

    try {


        const {
            modele,
            dimension,
            largeur,
            hauteur,
            diametre,
            saison,
            prix,
            stock,
            description,
            marqueId

        } = req.body;



        // Vérifier si la marque existe

        const marque = await Marque.findByPk(marqueId);


        if(!marque){

            return res.status(404).json({

                success:false,

                message:"Cette marque n'existe pas"

            });

        }



        // Création du pneu

        const pneu = await Pneu.create({


            modele,

            dimension,

            largeur,

            hauteur,

            diametre,

            saison,

            prix,

            stock,

            description,

            marqueId,


            image:req.file
            ? req.file.filename
            : null


        });



        return res.status(201).json({

            success:true,

            message:"Pneu ajouté avec succès",

            pneu

        });



    } catch(error){


        console.log(error);


        return res.status(500).json({

            success:false,

            message:error.message

        });


    }

};


module.exports.getAllPneus = async (req, res) => {

    try {

        const pneus = await Pneu.findAll({

            include: {

                model: Marque,

                as: "marque",

                attributes: [
                    "id",
                    "nom",
                    "logo"
                ]

            },

            order: [["id", "ASC"]]

        });


        return res.status(200).json({

            success: true,

            pneus

        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

module.exports.getPneuById = async (req, res) => {

    try {


        const pneu = await Pneu.findByPk(req.params.id, {


            include: [

                {

                    model: Marque,

                    as: "marque",

                    attributes: [
                        "id",
                        "nom",
                        "logo"
                    ]

                }

            ]


        });



        if (!pneu) {


            return res.status(404).json({

                success: false,

                message: "Pneu introuvable"

            });


        }




        return res.status(200).json({

            success: true,

            pneu

        });



    } catch (error) {


        console.log(error);


        return res.status(200).json({

            success: false,

            message: error.message

        });


    }

};



// ==============================
// Rechercher pneus par dimension
// ==============================

module.exports.searchPneusByDimension = async (req, res) => {

    try {

        const {
            largeur,
            hauteur,
            diametre
        } = req.query;


        // Au moins une dimension obligatoire
        if (!largeur && !hauteur && !diametre) {

            return res.status(400).json({

                success: false,

                message: "Veuillez renseigner au moins une dimension."

            });

        }


        // ==============================
        // Construire la recherche
        // ==============================

        const where = {};


        // Si largeur renseignée
        if (largeur) {

            where.largeur = largeur;

        }


        // Si hauteur renseignée
        if (hauteur) {

            where.hauteur = hauteur;

        }


        // Si diamètre renseigné
        if (diametre) {

            where.diametre = diametre;

        }


        // ==============================
        // Recherche dans PostgreSQL
        // ==============================

        const pneus = await Pneu.findAll({

            where,

            include: {

                model: Marque,

                as: "marque",

                attributes: [
                    "id",
                    "nom",
                    "logo"
                ]

            }

        });


        // ==============================
        // Aucun résultat
        // ==============================

        if (pneus.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Aucun pneu ne correspond à votre recherche.",

                pneus: []

            });

        }


        // ==============================
        // Résultats
        // ==============================

        return res.status(200).json({

            success: true,

            count: pneus.length,

            pneus

        });


    } catch (error) {

        console.log(error);


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// ==============================
// Récupérer les largeurs disponibles
// ==============================

module.exports.getLargeurs = async (req, res) => {

    try {

        const largeurs = await Pneu.findAll({

            attributes: ["largeur"],

            where: {
                largeur: {
                    [require("sequelize").Op.ne]: null
                }
            },

            group: ["largeur"],

            order: [["largeur", "ASC"]]

        });


        const result = largeurs.map(
            (pneu) => pneu.largeur
        );


        return res.status(200).json({

            success: true,

            largeurs: result

        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ==============================
// Récupérer les hauteurs disponibles
// selon la largeur
// ==============================

module.exports.getHauteurs = async (req, res) => {

    try {

        const { largeur } = req.query;


        // Vérifier la largeur
        if (!largeur) {

            return res.status(400).json({

                success: false,

                message: "La largeur est obligatoire"

            });

        }


        const hauteurs = await Pneu.findAll({

            attributes: ["hauteur"],

            where: {

                largeur: largeur,

                hauteur: {
                    [require("sequelize").Op.ne]: null
                }

            },

            group: ["hauteur"],

            order: [["hauteur", "ASC"]]

        });


        const result = hauteurs.map(
            (pneu) => pneu.hauteur
        );


        return res.status(200).json({

            success: true,

            hauteurs: result

        });


    } catch (error) {

        console.log(error);


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ==============================
// Récupérer les diamètres disponibles
// selon largeur + hauteur
// ==============================

module.exports.getDiametres = async (req, res) => {

    try {

        const { largeur, hauteur } = req.query;


        // Vérifier les paramètres

        if (!largeur || !hauteur) {

            return res.status(400).json({

                success: false,

                message: "La largeur et la hauteur sont obligatoires"

            });

        }


        const diametres = await Pneu.findAll({

            attributes: ["diametre"],

            where: {

                largeur: largeur,

                hauteur: hauteur,

                diametre: {
                    [require("sequelize").Op.ne]: null
                }

            },

            group: ["diametre"],

            order: [["diametre", "ASC"]]

        });


        const result = diametres.map(
            (pneu) => pneu.diametre
        );


        return res.status(200).json({

            success: true,

            diametres: result

        });


    } catch (error) {

        console.log(error);


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
// =================================
// Rechercher les pneus par saison
// =================================

module.exports.searchPneusBySaison = async (req, res) => {

    try {

        const { saison } = req.params;

        const pneus = await Pneu.findAll({

            where: {
                saison: saison
            },

            include: {
                model: Marque,
                as: "marque",
                attributes: [
                    "id",
                    "nom",
                    "logo"
                ]
            }

        });

        return res.status(200).json({

            success: true,

            count: pneus.length,

            saison: saison,

            pneus: pneus

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// =================================
// Modifier un pneu
// =================================

module.exports.updatePneu = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            modele,
            dimension,
            largeur,
            hauteur,
            diametre,
            saison,
            prix,
            stock,
            description,
            marqueId
        } = req.body;


        // Vérifier si le pneu existe
        const pneu = await Pneu.findByPk(id);

        if (!pneu) {

            return res.status(404).json({
                success: false,
                message: "Pneu introuvable"
            });

        }


        // Vérifier si la marque existe
        const marque = await Marque.findByPk(marqueId);

        if (!marque) {

            return res.status(404).json({
                success: false,
                message: "Cette marque n'existe pas"
            });

        }


        // Préparer les données à modifier
        const donnees = {
            modele,
            dimension,
            largeur,
            hauteur,
            diametre,
            saison,
            prix,
            stock,
            description,
            marqueId
        };


        // Si une nouvelle image est envoyée
        if (req.file) {
            donnees.image = req.file.filename;
        }


        // Mise à jour
        await pneu.update(donnees);


        return res.status(200).json({

            success: true,

            message: "Pneu modifié avec succès",

            pneu

        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};




// =================================
// Supprimer un pneu
// =================================

module.exports.deletePneu = async (req, res) => {

    try {

        const { id } = req.params;


        // Vérifier si le pneu existe
        const pneu = await Pneu.findByPk(id);

        if (!pneu) {

            return res.status(404).json({

                success: false,

                message: "Pneu introuvable"

            });

        }


        // Supprimer le pneu
        await pneu.destroy();


        return res.status(200).json({

            success: true,

            message: "Pneu supprimé avec succès"

        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

