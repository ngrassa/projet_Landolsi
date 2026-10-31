"use strict";

// =====================================================
// DOUBLE AUTHENTIFICATION (MFA TOTP)
// =====================================================
// Ajoute à la table users les colonnes de la double authentification.
// Non destructive : une colonne déjà présente (créée par sync en
// développement) n'est pas modifiée.

const COLUMNS = (Sequelize) => ({
    mfaEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    mfaSecret: { type: Sequelize.STRING(255), allowNull: true },
    mfaTempSecret: { type: Sequelize.STRING(255), allowNull: true },
    mfaLastUsedStep: { type: Sequelize.BIGINT, allowNull: true },
    mfaRecoveryCodes: { type: Sequelize.JSONB, allowNull: true }
});

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable("users");

        for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
            if (!table[name]) {
                await queryInterface.addColumn("users", name, definition);
            }
        }
    },

    async down(queryInterface) {
        for (const name of ["mfaEnabled", "mfaSecret", "mfaTempSecret", "mfaLastUsedStep", "mfaRecoveryCodes"]) {
            await queryInterface.removeColumn("users", name);
        }
    }
};
