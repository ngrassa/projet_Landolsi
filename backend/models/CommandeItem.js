const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const CommandeItem = sequelize.define(
    "CommandeItem",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        commandeId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        pneuId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        quantite: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        // Prix réellement payé
        prix: {
            type: DataTypes.FLOAT,
            allowNull: false
        },

        // Prix normal du pneu avant promotion
        prixOriginal: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
},

pourcentagePromotion: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
}
    },
    {
        tableName: "commande_items",
        timestamps: true
    }
);

module.exports = CommandeItem;