import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/apiuser";
import "./Auth.css";

function ForgotPassword() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);


    // ==============================
    // ENVOYER LE CODE
    // ==============================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");
        setLoading(true);

        try {

            await forgotPassword(email);

            setMessage(
                "Un code de récupération a été envoyé à votre adresse email."
            );

            // Aller vers la page de vérification
            navigate("/verify-reset-code", {
                state: {
                    email: email.trim().toLowerCase()
                }
            });

        } catch (error) {

            console.log(
                "Erreur mot de passe oublié :",
                error.response?.data
            );

            setError(
                error.response?.data?.message ||
                "Une erreur est survenue."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="auth-container">

            <div className="auth-card">

                <h2>
                    Mot de passe oublié
                </h2>

                <p>
                    Entrez votre adresse email pour recevoir
                    un code de récupération.
                </p>


                <form onSubmit={handleSubmit}>

                    <input
                        type="email"
                        placeholder="Adresse email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                        }}
                        required
                    />


                    {error && (
                        <p className="error">
                            {error}
                        </p>
                    )}


                    {message && (
                        <p className="success">
                            {message}
                        </p>
                    )}


                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >

                        {loading
                            ? "Envoi..."
                            : "Envoyer le code"
                        }

                    </button>

                </form>


                <div className="auth-links">

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="back-link"
                    >
                        Retour à la connexion
                    </button>

                </div>

            </div>

        </div>

    );

}

export default ForgotPassword;