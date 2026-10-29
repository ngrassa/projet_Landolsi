import "./Auth.css";
import { register } from "../../services/apiuser";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


function Register() {

    const [typeAccount, setTypeAccount] = useState("particulier");
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();



    const [formData, setFormData] = useState({

        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        adresse: "",
        ville: "",
        codePostal: "",
        pays: "",

        password: "",
        confirmPassword: "",

        typeClient: "particulier",

        raisonSociale: "",
        activite: "",
        identifiantEntreprise: "",
        numeroTVA: "",
        secteur: ""

    });


    const handleChange = (e) => {

        const { name, value } = e.target;


        setFormData({

            ...formData,

            [name]: value

        });


        // supprimer l'erreur du champ corrigé
        setErrors({

            ...errors,

            [name]: ""

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();


        // Vérification confirmation mot de passe
        if (formData.password !== formData.confirmPassword) {

           setErrors({

        ...errors,

        confirmPassword: "Les mots de passe ne correspondent pas"

    });

            return;
        }



        try {


            // On enlève confirmPassword avant l'envoi
            const userData = {

                ...formData

            };


            delete userData.confirmPassword;



            const response = await register(userData);


            console.log(response.data);


            alert("Compte créé avec succès");
            navigate("/login");



        } catch (error) {


            const apiErrors = {};


            error.response.data.errors.forEach((err) => {

                apiErrors[err.field] = err.message;

            });


            setErrors(apiErrors);


        }
    };
    return (

        <div className="auth-container">


            <div className="auth-card">


                <h2>
                    Créer un compte
                </h2>



                <div className="account-choice">


                    <button
                        type="button"
                        className={
                            typeAccount === "particulier" ? "active" : ""
                        }
                        onClick={() => {

                            setTypeAccount("particulier");

                            setFormData({
                                ...formData,
                                typeClient: "particulier"
                            });

                        }}
                    >
                        Particulier
                    </button>



                    <button
                        type="button"
                        className={
                            typeAccount === "professionnel" ? "active" : ""
                        }
                        onClick={() => {

                            setTypeAccount("professionnel");

                            setFormData({
                                ...formData,
                                typeClient: "professionnel"
                            });

                        }}
                    >
                        Professionnel
                    </button>


                </div>




                <form onSubmit={handleSubmit}>


                    <div className="input-group">


                        <div className="field">

                            <input
                                type="text"
                                name="nom"
                                placeholder="Nom"
                                value={formData.nom}
                                onChange={handleChange}
                                className={errors.nom ? "input-error" : ""}
                            />

                            {
                                errors.nom && (
                                    <p className="error">
                                        {errors.nom}
                                    </p>
                                )
                            }

                        </div>



                        <div className="field">

                            <input
                                type="text"
                                name="prenom"
                                placeholder="Prénom"
                                value={formData.prenom}
                                onChange={handleChange}
                                 className={errors.prenom ? "input-error" : ""}
                            />
                             {
                                errors.prenom && (
                                    <p className="error">
                                        {errors.prenom}
                                    </p>
                                )
                            }

                        </div>


                    </div>



                    <input
                        type="email"
                        name="email"
                        placeholder="Adresse email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? "input-error" : ""}
                    />
                     {
                                errors.email && (
                                    <p className="error">
                                        {errors.email}
                                    </p>
                                )
                            }




                    <input
                        type="tel"
                        name="telephone"
                        placeholder="Numéro téléphone"
                        value={formData.telephone}
                        onChange={handleChange}
                    className={errors.telephone ? "input-error" : ""}
                    />
                     {
                                errors.telephone && (
                                    <p className="error">
                                        {errors.telephone}
                                    </p>
                                )
                            }


                    <input
                        type="text"
                        name="adresse"
                        placeholder="Adresse"
                        value={formData.adresse}
                        onChange={handleChange}
                    className={errors.adresse ? "input-error" : ""}
                    />
                     {
                                errors.adresse && (
                                    <p className="error">
                                        {errors.adresse}
                                    </p>
                                )
                            }




                    <div className="input-group">
<div>

                        <input
                            type="text"
                            name="pays"
                            placeholder="Pays"
                            value={formData.pays}
                            onChange={handleChange}
                        className={errors.pays ? "input-error" : ""}
                    />
                     {
                                errors.pays && (
                                    <p className="error">
                                        {errors.pays}
                                    </p>
                                )
                            }
                            </div>
                            <div>
                        <input
                            type="text"
                            name="ville"
                            placeholder="Ville"
                            value={formData.ville}
                            onChange={handleChange}
                        className={errors.ville ? "input-error" : ""}
                    />
                     {
                                errors.ville && (
                                    <p className="error">
                                        {errors.ville}
                                    </p>
                                )
                            }
                            </div>
                    </div>





                    <input
                        type="text"
                        name="codePostal"
                        placeholder="Code postal"
                        value={formData.codePostal}
                        onChange={handleChange}
                     className={errors.codePostal ? "input-error" : ""}
                    />
                     {
                                errors.codePostal && (
                                    <p className="error">
                                        {errors.codePostal}
                                    </p>
                                )
                            }







                    {/* Sécurité */}




                    <input
                        type="password"
                        name="password"
                        placeholder="Mot de passe"
                        value={formData.password}
                        onChange={handleChange}
                    className={errors.password ? "input-error" : ""}
                    />
                     {
                                errors.password && (
                                    <p className="error">
                                        {errors.password}
                                    </p>
                                )
                            }
                    <input
    type="password"
    name="confirmPassword"
    placeholder="Confirmation mot de passe"
    value={formData.confirmPassword}
    onChange={handleChange}
    className={errors.confirmPassword ? "input-error" : ""}
/>


{
    errors.confirmPassword && (

        <p className="error">
            {errors.confirmPassword}
        </p>

    )
}


                    {/* Informations professionnelles */}


                    {
                        typeAccount === "professionnel" && (


                            <div className="professional-fields">


                                <h3>
                                    Informations entreprise
                                </h3>



                                <input
                                    type="text"
                                    name="raisonSociale"
                                    placeholder="Raison sociale *"
                                    value={formData.raisonSociale}
                                    onChange={handleChange}
                                 className={errors.raisonSociale ? "input-error" : ""}
                    />
                     {
                                errors.raisonSociale && (
                                    <p className="error">
                                        {errors.raisonSociale}
                                    </p>
                                )
                            }



                                <input
                                    type="text"
                                    name="activite"
                                    placeholder="Activité"
                                    value={formData.activite}
                                    onChange={handleChange}
                                 className={errors.activite ? "input-error" : ""}
                    />
                     {
                                errors.activite && (
                                    <p className="error">
                                        {errors.activite}
                                    </p>
                                )
                            }



                                <input
                                    type="text"
                                    name="identifiantEntreprise"
                                    placeholder="SIRET / SIREN *"
                                    value={formData.identifiantEntreprise}
                                    onChange={handleChange}
                               className={errors.identifiantEntreprise ? "input-error" : ""}
                    />
                     {
                                errors.identifiantEntreprise && (
                                    <p className="error">
                                        {errors.identifiantEntreprise}
                                    </p>
                                )
                            }



                                <input
                                    type="text"
                                    name="numeroTVA"
                                    placeholder="Numéro TVA intracommunautaire"
                                    value={formData.numeroTVA}
                                    onChange={handleChange}
                                className={errors.numeroTVA ? "input-error" : ""}
                    />
                     {
                                errors.numeroTVA && (
                                    <p className="error">
                                        {errors.numeroTVA}
                                    </p>
                                )
                            }



                                <select
                                    name="secteur"
                                    value={formData.secteur}
                                    onChange={handleChange}
                                >


                                    <option value="">
                                        Secteur d'activité *
                                    </option>


                                    <option value="Commerce automobile">
                                        Commerce automobile
                                    </option>


                                    <option value="Distribution pneus">
                                        Distribution pneus
                                    </option>


                                    <option value="Garage automobile">
                                        Garage automobile
                                    </option>


                                    <option value="Autre">
                                        Autre
                                    </option>


                                </select>



                            </div>


                        )
                    }






                    <button
                        type="submit"
                        className="submit-btn"

                    >

                        Créer mon compte

                    </button>



                </form>



            </div>



        </div>


    );

}


export default Register;