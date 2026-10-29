const Marque = require("../models/MarqueModel");
const Pneu = require("../models/PneuModel");


// =================================
// Ajouter une marque
// =================================

module.exports.addMarque = async (req, res) => {

    try {


        const { nom } = req.body;


        const marque = await Marque.create({

            nom,

            logo: req.file
                ? req.file.filename
                : null

        });



        return res.status(201).json({

            success:true,

            message:"Marque ajoutée avec succès",

            marque

        });



    } catch(error) {


        console.log(error);


        return res.status(500).json({

            success:false,

            message:error.message

        });


    }

};



// =================================
// Récupérer toutes les marques
// =================================

module.exports.getAllMarques = async (req, res) => {
    try {
        const marques = await Marque.findAll({
            order: [["id", "ASC"]]
        });

        return res.status(200).json({
            success: true,
            marques
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// =================================
// Récupérer une marque par ID
// =================================




// =================================
// Supprimer une marque
// =================================

module.exports.deleteMarque = async(req,res)=>{


    try{


        const marque = await Marque.findByPk(req.params.id);



        if(!marque){

            return res.status(404).json({

                success:false,

                message:"Marque introuvable"

            });

        }



        await marque.destroy();



        return res.status(200).json({

            success:true,

            message:"Marque supprimée"

        });



    }catch(error){


        return res.status(500).json({

            success:false,

            message:error.message

        });


    }


};



// =================================
// Modifier une marque
// =================================

module.exports.updateMarque = async(req,res)=>{


    try{


        const marque = await Marque.findByPk(req.params.id);



        if(!marque){

            return res.status(404).json({

                success:false,

                message:"Marque introuvable"

            });

        }



        await marque.update({


            nom:req.body.nom,


            logo:req.file
            ? req.file.filename
            : marque.logo


        });



        return res.status(200).json({

            success:true,

            message:"Marque modifiée",

            marque

        });



    }catch(error){


        return res.status(500).json({

            success:false,

            message:error.message

        });


    }


};

module.exports.getMarqueById = async(req,res)=>{


    try{


        const {id} = req.params;


        const marque = await Marque.findByPk(id,{

            include:{

                model:Pneu,

                as:"pneus"

            }

        });



        if(!marque){

            return res.status(404).json({

                success:false,

                message:"Marque introuvable"

            });

        }



        return res.status(200).json({

            success:true,

            marque

        });



    }catch(error){


        return res.status(500).json({

            success:false,

            message:error.message

        });

    }

};



module.exports.searchPneusByMarque = async (req, res) => {

    try {

        const { id } = req.params;


        // Vérifier que la marque existe

        const marque = await Marque.findByPk(id);


        if (!marque) {

            return res.status(404).json({

                success: false,

                message: "Marque introuvable"

            });

        }


        // Rechercher tous les pneus de cette marque

        const pneus = await Pneu.findAll({

            where: {

                marqueId: id

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

            marque: marque,

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