"use strict";

// =====================================================
// MIGRATION DE RÉFÉRENCE (baseline)
// =====================================================
// Crée les tables définies dans models/ si elles n'existent pas encore.
// Sur une base existante (créée par l'ancien sync({ alter: true })),
// cette migration ne modifie ni ne supprime rien : sync() sans option
// utilise CREATE TABLE IF NOT EXISTS.
//
// Toute évolution ultérieure du schéma doit faire l'objet d'une nouvelle
// migration (npx sequelize-cli migration:generate --name <description>).

module.exports = {
    async up() {
        const sequelize = require("../db/db");
        require("../models/associations");

        try {
            await sequelize.sync();
        } finally {
            await sequelize.close();
        }
    },

    async down() {
        throw new Error(
            "La migration de référence ne peut pas être annulée automatiquement : restaurez une sauvegarde (scripts/restore-db.sh)."
        );
    }
};
