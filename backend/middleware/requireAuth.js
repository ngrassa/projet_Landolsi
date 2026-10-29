const jwt = require("jsonwebtoken");
const config = require("../config");


// Middleware pour vérifier si l'utilisateur est authentifié
const requireAuth = (req, res, next) => {


    // Récupérer le token JWT depuis le cookie
    const token = req.cookies.jwt_token;


    // Si le cookie n'existe pas
    if (!token) {

        return res.status(401).json({

            success: false,

            message: "Accès refusé, veuillez vous connecter"

        });

    }



    // Vérifier si le token est valide
    jwt.verify(
        token,
        config.jwtSecret,
        (err, decodedToken) => {


            // Token invalide ou expiré
            if (err) {

                return res.status(401).json({

                    success: false,

                    message: "Token invalide ou expiré"

                });

            }



            // Stocker l'id utilisateur pour les contrôleurs
            req.userId = decodedToken.id;



            // Passer au middleware ou contrôleur suivant
            next();

        }
    );

};


module.exports = requireAuth;