const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const Promotion = sequelize.define("Promotion", {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    pneuId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    pourcentage: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    dateDebut: {
        type: DataTypes.DATE,
        allowNull: false
    },

    dateFin: {
        type: DataTypes.DATE,
        allowNull: false
    },

    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }

});

module.exports = Promotion;