const yup = require("yup");
const bcrypt = require("bcrypt");
const User = require("../models/UserModel");


const registerValidation = async (req, res, next) => {

    try {

        const schema = yup.object({

            // Nom obligatoire
            nom: yup
                .string()
                .required("Le nom est obligatoire")
                .min(2)
                .max(100),


            // Prénom obligatoire
            prenom: yup
                .string()
                .required("Le prénom est obligatoire")
                .min(2)
                .max(100),


            // Email obligatoire + unique
            email: yup
                .string()
                .email("Email invalide")
                .required("L'email est obligatoire")
                .test(
                    "email_unique",
                    "Cette adresse est déjà associée à un compte utilisateur.",
                    async function (value) {

                        const user = await User.findOne({
                            where: {
                                email: value
                            }
                        });

                        return !user;
                    }
                ),


            // Mot de passe
            password: yup
                .string()
                .required("Le mot de passe est obligatoire")
                .min(8, "Minimum 8 caractères")
                .matches(
                    /^(?=.*[A-Za-z])(?=.*\d)/,
                    "Le mot de passe doit contenir au moins une minuscule, une majuscule, un caractère spécial et un chiffre"
                ),


            telephone: yup
                .string()
                .required("Le téléphone est obligatoire")
                .matches(
                    /^[0-9]{8}$/,
                    "Le numéro doit contenir exactement 8 chiffres"
                ),

            adresse: yup
                .string()
                .required("L'adresse est obligatoire"),


            ville: yup
                .string()
                .required("La ville est obligatoire"),


            codePostal: yup
                .string()
                .required("Le code postal est obligatoire"),


            pays: yup
                .string()
                .required("Le pays est obligatoire"),



            // =========================
            // Type du client
            // =========================

            typeClient: yup
                .string()
                .oneOf(
                    ["particulier", "professionnel"],
                    "Type client invalide"
                )
                .required("Le type client est obligatoire"),



            // =========================
            // Champs professionnel
            // obligatoires seulement
            // pour professionnel
            // =========================


            raisonSociale: yup
                .string()
                .when("typeClient", {

                    is: "professionnel",

                    then: (schema) =>
                        schema.required(
                            "La raison sociale est obligatoire"
                        ),

                    otherwise: (schema) =>
                        schema.nullable()

                }),



            activite: yup
                .string()
                .when("typeClient", {

                    is: "professionnel",

                    then: (schema) =>
                        schema.required(
                            "L'activité est obligatoire"
                        ),

                    otherwise: (schema) =>
                        schema.nullable()

                }),



            identifiantEntreprise: yup
                .string()
                .when("typeClient", {

                    is: "professionnel",

                    then: (schema) =>
                        schema.required(
                            "Le SIREN/SIRET est obligatoire"
                        ),

                    otherwise: (schema) =>
                        schema.nullable()

                }),



            numeroTVA: yup
                .string()
                .nullable(),



            secteur: yup
                .string()
                .when("typeClient", {

                    is: "professionnel",

                    then: (schema) =>
                        schema.required(
                            "Le secteur est obligatoire"
                        ),

                    otherwise: (schema) =>
                        schema.nullable()

                })

        });



        // Validation des données reçues
        await schema.validate(req.body, {
            abortEarly: false
        });


        next();


    } catch (error) {


        return res.status(400).json({

            success: false,

            message: "Erreur validation",

           errors: error.inner.map(err => ({
    field: err.path,
    message: err.message
}))

        });

    }

};


User.comparePassword = async function(password, hashedPassword){

    return await bcrypt.compare(
        password,
        hashedPassword
    );

};



User.login = async function(email,password){

    const user = await this.findOne({

        where:{
            email
        }

    });


    if(!user){

        throw new Error(
            "Adresse e-mail incorrecte"
        );

    }



    const auth = await this.comparePassword(
        password,
        user.password
    );


    if(!auth){

        throw new Error(
            "Mot de passe incorrect"
        );

    }


    return user;

};

module.exports = registerValidation;