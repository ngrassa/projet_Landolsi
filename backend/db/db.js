const { Sequelize } = require("sequelize");
const config = require("../config");

const { db } = config;

const sequelize = new Sequelize(
  db.name,
  db.user,
  db.password,
  {
    host: db.host,
    port: db.port,
    dialect: "postgres",
    logging: false,
    pool: {
      max: db.poolMax,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Base managée (Supabase, RDS...) : connexion TLS
    dialectOptions: db.ssl
      ? { ssl: { require: true, rejectUnauthorized: db.sslRejectUnauthorized } }
      : {}
  }
);

module.exports = sequelize;
