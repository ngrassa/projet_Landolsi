
import { useState } from "react";
import { FaStar } from "react-icons/fa";
import { createAvis } from "../../services/avisApi";
import "./AvisForm.css";

function AvisForm({ commandeId, pneuId, onAvisAjoute }) {
    const [note, setNote] = useState(0);
    const [commentaire, setCommentaire] = useState("");
    const [message, setMessage] = useState("");
    const [erreur, setErreur] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setErreur("");

        if (!note) {
            setErreur("Veuillez sélectionner une note.");
            return;
        }
               console.log("commandeId reçu :", commandeId);
               console.log("pneuId reçu :", pneuId);
        if (!commandeId || !pneuId) {
            setErreur("La commande ou le pneu est introuvable.");
            return;
        }

        try {
            setLoading(true);

            const data = await createAvis({
                commandeId,
                pneuId,
                note,
                commentaire: commentaire.trim() || null
            });

            setMessage("Votre avis a été ajouté avec succès !");
            setNote(0);
            setCommentaire("");

            if (onAvisAjoute) {
                onAvisAjoute(data.avis);
            }
        } catch (error) {
            console.error("Erreur ajout avis :", error);

            setErreur(
                error.response?.data?.message ||
                "Impossible d'ajouter votre avis."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="avis-form" onSubmit={handleSubmit}>
            <h3>Donnez votre avis</h3>

            <p className="avis-description">
                Partagez votre expérience avec ce pneu.
            </p>

            <label>Votre note *</label>

            <div className="avis-stars" role="group" aria-label="Votre note">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className="avis-star-button"
                        onClick={() => setNote(star)}
                        aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                        aria-pressed={note === star}
                    >
                        <FaStar
                            className="star"
                            style={{
                                color: star <= note ? "#ffc107" : "#ddd"
                            }}
                        />
                    </button>
                ))}
            </div>

            <label htmlFor={`avis-commentaire-${commandeId}-${pneuId}`}>
                Commentaire (facultatif)
            </label>

            <textarea
                id={`avis-commentaire-${commandeId}-${pneuId}`}
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Votre avis sur ce pneu..."
                rows={4}
            />

            {erreur && (
                <p className="avis-error" role="alert">{erreur}</p>
            )}

            {message && (
                <p className="avis-success" role="status">{message}</p>
            )}

            <button type="submit" disabled={loading}>
                {loading ? "Envoi..." : "Publier mon avis"}
            </button>
        </form>
    );
}

export default AvisForm;