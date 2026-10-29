const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const Facture = sequelize.define(
    "Facture",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        commandeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },

        numeroFacture: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        dateFacture: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },

        statut: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "en attente"
        }
    },
    {
        tableName: "factures",
        timestamps: true
    }
);

module.exports = Facture;