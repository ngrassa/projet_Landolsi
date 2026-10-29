import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyResetCode } from "../../services/apiuser";
import "./Auth.css";

function VerifyResetCode() {

    const navigate = useNavigate();
    const location = useLocation();

    // Email récupéré depuis ForgotPassword
    const email = location.state?.email;

    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    // ==============================
    // VÉRIFIER LE CODE
    // ==============================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!email) {
            setError("Adresse email introuvable.");
            return;
        }

        setLoading(true);

        try {

            await verifyResetCode(email, code);

            // Code correct
            navigate("/reset-password", {
                state: {
                    email: email,
                    code: code
                }
            });

        } catch (error) {

            console.log(
                "Erreur vérification code :",
                error.response?.data
            );

            setError(
                error.response?.data?.message ||
                "Code incorrect."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="auth-container">

            <div className="auth-card">

                <h2>
                    Vérification du code
                </h2>

                <p>
                    Un code de récupération a été envoyé
                    à votre adresse email.
                </p>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        placeholder="Code de récupération"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value);
                            setError("");
                        }}
                        maxLength="6"
                        required
                    />


                    {error && (
                        <p className="error">
                            {error}
                        </p>
                    )}


                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >

                        {loading
                            ? "Vérification..."
                            : "Vérifier le code"
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

export default VerifyResetCode;