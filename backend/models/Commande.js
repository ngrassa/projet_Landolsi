const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const Commande = sequelize.define(
    "Commande",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        nom: {
            type: DataTypes.STRING,
            allowNull: false
        },

        prenom: {
            type: DataTypes.STRING,
            allowNull: false
        },

        telephone: {
            type: DataTypes.STRING,
            allowNull: false
        },

        adresse: {
            type: DataTypes.STRING,
            allowNull: false
        },

        ville: {
            type: DataTypes.STRING,
            allowNull: false
        },

        codePostal: {
            type: DataTypes.STRING,
            allowNull: false
        },

        total: {
            type: DataTypes.FLOAT,
            allowNull: false
        },

        statut: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "en attente"
        }
    },
    {
        tableName: "commandes",
        timestamps: true
    }
);

module.exports = Commande;