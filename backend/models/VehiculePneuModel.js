const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const VehiculePneu = sequelize.define("VehiculePneu", {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    vehiculeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    pneuId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }

}, {
    tableName: "vehicule_pneus",

    indexes: [
        {
            unique: true,
            fields: ["vehiculeId", "pneuId"]
        }
    ]
});

module.exports = VehiculePneu;