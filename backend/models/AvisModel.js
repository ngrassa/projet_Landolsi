
const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const Avis = sequelize.define(
    "Avis",
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

        commandeId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        pneuId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        note: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
                isInt: true
            }
        },

        commentaire: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "avis",
        timestamps: true
    }
);

module.exports = Avis;