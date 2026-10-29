
import "./Auth.css";

import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    useState
} from "react";

import {
    login
} from "../../services/apiuser";


function Login() {

    const navigate = useNavigate();


    // ==============================
    // FORMULAIRE
    // ==============================

    const [formData, setFormData] = useState({

        email: "",
        password: ""

    });


    // ==============================
    // ERREUR
    // ==============================

    const [error, setError] = useState("");


    // ==============================
    // MODIFICATION CHAMPS
    // ==============================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;


        setFormData({

            ...formData,

            [name]: value

        });


        setError("");

    };


    // ==============================
    // CONNEXION
    // ==============================

    const handleSubmit = async (e) => {

        e.preventDefault();


        try {

            // ========================================
            // APPEL API LOGIN
            // ========================================

            const response = await login(formData);


            console.log(
                "✅ Connexion réussie :",
                response.data
            );


            // ========================================
            // INFORMER LA NAVBAR
            // ========================================

            window.dispatchEvent(
                new Event("authChanged")
            );


            // ========================================
            // MESSAGE
            // ========================================

            alert("Connexion réussie");


            // ========================================
            // REDIRECTION SELON LE RÔLE
            // ========================================

            if (response.data.user.role === "admin") {

                navigate("/admin");

            } else {

                navigate("/profile");

            }


        }

        catch (error) {

            console.log(
                "STATUS :",
                error.response?.status
            );


            console.log(
                "DATA :",
                error.response?.data
            );


            console.log(
                "MESSAGE :",
                error.response?.data?.message
            );


            setError(

                error.response?.data?.message ||

                "Erreur de connexion"

            );

        }

    };


    // ==============================
    // AFFICHAGE
    // ==============================

    return (

        <div className="auth-container">


            <div className="auth-card">


                <h2>
                    Connexion
                </h2>


                <form onSubmit={handleSubmit}>


                    {/* EMAIL */}

                    <input

                        type="email"

                        name="email"

                        placeholder="Adresse email"

                        value={formData.email}

                        onChange={handleChange}

                        required

                    />


                    {/* MOT DE PASSE */}

                    <input

                        type="password"

                        name="password"

                        placeholder="Mot de passe"

                        value={formData.password}

                        onChange={handleChange}

                        required

                    />


                    {/* ERREUR */}

                    {error && (

                        <p className="error">

                            {error}

                        </p>

                    )}


                    {/* BOUTON */}

                    <button

                        type="submit"

                        className="submit-btn"

                    >

                        Se connecter

                    </button>


                </form>


                <div className="auth-links">


                    <a href="/forgot-password">

                        Mot de passe oublié ?

                    </a>


                    <p>

                        Vous n'avez pas de compte ?{" "}


                        <Link to="/register">

                            Créer un compte

                        </Link>

                    </p>


                </div>


            </div>


        </div>

    );

}


export default Login;

