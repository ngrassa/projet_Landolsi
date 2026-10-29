const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");


const Marque = sequelize.define("Marque", {

    id:{
        type: DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },


    nom:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },


    logo:{
        type:DataTypes.STRING
    }


});


module.exports = Marque;