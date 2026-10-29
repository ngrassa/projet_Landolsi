const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");


const Pneu = sequelize.define("Pneu", {


    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },


    modele:{
        type:DataTypes.STRING,
        allowNull:false
    },


    dimension:{
        type:DataTypes.STRING,
        allowNull:false
    },


    largeur:{
        type:DataTypes.INTEGER
    },


    hauteur:{
        type:DataTypes.INTEGER
    },


    diametre:{
        type:DataTypes.INTEGER
    },


    saison:{
        type:DataTypes.STRING,
        allowNull:false
    },


    prix:{
        type:DataTypes.FLOAT,
        allowNull:false
    },


    stock:{
        type:DataTypes.INTEGER,
        defaultValue:0
    },


    description:{
        type:DataTypes.TEXT
    },


    image:{
        type:DataTypes.STRING,
         allowNull:false
    },


    marqueId:{
        type:DataTypes.INTEGER,
        allowNull:false
    }


});


module.exports = Pneu;