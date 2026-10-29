
const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const Reclamation = sequelize.define("Reclamation", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    sujet: {
        type: DataTypes.STRING,
        allowNull: false
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    statut: {
        type: DataTypes.ENUM(
            "En attente",
            "En cours",
            "Résolue"
        ),
        allowNull: false,
        defaultValue: "En attente"
    },

    reponseAdmin: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

module.exports = Reclamation;