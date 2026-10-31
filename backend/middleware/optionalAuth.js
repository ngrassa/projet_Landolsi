const jwt = require("jsonwebtoken");
const config = require("../config");

// Identifie l'utilisateur s'il est connecté, sans bloquer les visiteurs.
// Les jetons intermédiaires de double authentification sont ignorés.
const optionalAuth = (req, res, next) => {
    const token = req.cookies && req.cookies.jwt_token;
    if (!token) return next();
    jwt.verify(token, config.jwtSecret, (err, decoded) => {
        if (!err && decoded && !decoded.purpose && decoded.id) {
            req.userId = decoded.id;
        }
        next();
    });
};

module.exports = optionalAuth;
