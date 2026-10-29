const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const Vehicule = sequelize.define("Vehicule", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    immatriculation: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    description: {
        type: DataTypes.STRING
    },

    annee: {
        type: DataTypes.INTEGER
    },

    dateImmatriculation: {
        type: DataTypes.DATE
    },

    marque: {
        type: DataTypes.STRING
    },

    modele: {
        type: DataTypes.STRING
    },

    carburant: {
        type: DataTypes.STRING
    },

    variante: {
        type: DataTypes.STRING
    },

    moteur: {
        type: DataTypes.STRING
    },

    type: {
        type: DataTypes.STRING
    },

    puissanceFiscale: {
        type: DataTypes.STRING
    },

    image: {
        type: DataTypes.STRING
    }
});

module.exports = Vehicule;