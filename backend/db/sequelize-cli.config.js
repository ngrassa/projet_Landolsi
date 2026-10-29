// Configuration utilisée par sequelize-cli (npm run db:migrate).
// Mêmes variables que l'application : voir config/index.js.
const config = require("../config");

const { db } = config;

const connection = {
    database: db.name,
    username: db.user,
    password: db.password,
    host: db.host,
    port: db.port,
    dialect: "postgres",
    logging: false,
    migrationStorageTableName: "SequelizeMeta",
    dialectOptions: db.ssl
        ? { ssl: { require: true, rejectUnauthorized: db.sslRejectUnauthorized } }
        : {}
};

module.exports = {
    development: connection,
    test: connection,
    production: connection
};
