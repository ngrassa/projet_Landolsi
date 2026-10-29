import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/apiuser";
import "./Auth.css";

function ResetPassword() {

    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;
    const code = location.state?.code;

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!email || !code) {
            setError("Les informations de récupération sont introuvables.");
            return;
        }

        if (newPassword.length < 8) {
            setError(
                "Le nouveau mot de passe doit contenir au moins 8 caractères."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);

        try {

            await resetPassword(
                email,
                code,
                newPassword
            );

            setMessage(
                "Votre mot de passe a été réinitialisé avec succès."
            );

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {

            console.log(
                "Erreur réinitialisation :",
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

                <h2>Nouveau mot de passe</h2>

                <p>
                    Entrez votre nouveau mot de passe.
                </p>

                <form onSubmit={handleSubmit}>

                    <input
                        type="password"
                        placeholder="Nouveau mot de passe"
                        value={newPassword}
                        onChange={(e) => {
                            setNewPassword(e.target.value);
                            setError("");
                        }}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Confirmer le mot de passe"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
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
                            ? "Réinitialisation..."
                            : "Réinitialiser le mot de passe"
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

export default ResetPassword;