
import { useEffect, useState } from "react";
import {
    createReclamation,
    getMesReclamations
} from "../../services/reclamationApi";
import "./MesReclamations.css";

function MesReclamations() {
    const [sujet, setSujet] = useState("");
    const [description, setDescription] = useState("");
    const [reclamations, setReclamations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const chargerReclamations = async () => {
        try {
            setError("");

            const response = await getMesReclamations();

            // Accepte une réponse sous forme de tableau
            // ou un objet contenant le tableau.
            const data = response.data;
            const liste = Array.isArray(data)
                ? data
                : data.reclamations || data.data || [];

            setReclamations(Array.isArray(liste) ? liste : []);
        } catch (err) {
            if (err.response?.status === 401) {
                setError(
                    "Connectez-vous à votre compte pour consulter vos réclamations."
                );
            } else {
                setError(
                    "Impossible de charger les réclamations. Veuillez réessayer."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chargerReclamations();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!sujet.trim() || !description.trim()) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        try {
            setSending(true);

            await createReclamation({
                sujet: sujet.trim(),
                description: description.trim()
            });

            setSujet("");
            setDescription("");
            setMessage("Votre réclamation a été envoyée avec succès.");

            await chargerReclamations();
        } catch (err) {
            if (err.response?.status === 401) {
                setError(
                    "Vous devez être connecté pour envoyer une réclamation."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    "Une erreur est survenue lors de l'envoi."
                );
            }
        } finally {
            setSending(false);
        }
    };

    const getStatutClass = (statut) => {
        switch (statut) {
            case "Résolue":
                return "statut-resolue";
            case "En cours":
                return "statut-en-cours";
            default:
                return "statut-attente";
        }
    };

    return (
        <div className="reclamations-page">
            <div className="reclamations-header">
                <span className="reclamations-surtitle">
                    SERVICE CLIENT
                </span>

                <h1>Mes réclamations</h1>

                <p>
                    Une question ou un problème ? Envoyez-nous votre
                    réclamation et suivez son traitement depuis votre compte.
                </p>
            </div>

            <div className="reclamations-container">
                <section className="reclamation-form-card">
                    <h2>Envoyer une réclamation</h2>
                    <p className="reclamation-intro">
                        Décrivez votre problème afin que notre équipe puisse
                        vous répondre.
                    </p>

                    {message && (
                        <div className="reclamation-message success">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="reclamation-message error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="reclamation-field">
                            <label htmlFor="sujet">Sujet</label>
                            <input
                                id="sujet"
                                type="text"
                                value={sujet}
                                onChange={(e) => setSujet(e.target.value)}
                                placeholder="Ex. : Problème avec une commande"
                                maxLength={255}
                                required
                            />
                        </div>

                        <div className="reclamation-field">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                                placeholder="Expliquez votre problème..."
                                rows={5}
                                required
                            />
                        </div>

                        <button
                            className="reclamation-submit"
                            type="submit"
                            disabled={sending}
                        >
                            {sending
                                ? "Envoi en cours..."
                                : "Envoyer ma réclamation"}
                        </button>
                    </form>
                </section>

                <section className="reclamation-history">
                    <div className="reclamation-history-heading">
                        <h2>Historique de mes réclamations</h2>
                        <span className="reclamation-count">
                            {reclamations.length}
                        </span>
                    </div>

                    {loading ? (
                        <p className="reclamation-empty">
                            Chargement des réclamations...
                        </p>
                    ) : reclamations.length === 0 ? (
                        <div className="reclamation-empty">
                            <h3>Aucune réclamation</h3>
                            <p>
                                Vos réclamations apparaîtront ici après leur
                                envoi.
                            </p>
                        </div>
                    ) : (
                        <div className="reclamation-list">
                            {reclamations.map((reclamation) => (
                                <article
                                    className="reclamation-card"
                                    key={reclamation.id}
                                >
                                    <div className="reclamation-card-top">
                                        <h3>{reclamation.sujet}</h3>

                                        <span
                                            className={`reclamation-status ${getStatutClass(
                                                reclamation.statut
                                            )}`}
                                        >
                                            {reclamation.statut}
                                        </span>
                                    </div>

                                    <p className="reclamation-description">
                                        {reclamation.description}
                                    </p>

                                    <p className="reclamation-date">
                                        Envoyée le{" "}
                                        {reclamation.createdAt
                                            ? new Date(
                                                  reclamation.createdAt
                                              ).toLocaleDateString("fr-FR")
                                            : "Date indisponible"}
                                    </p>

                                    {reclamation.reponseAdmin && (
                                        <div className="reclamation-reponse">
                                            <strong>
                                                Réponse de LANDOLSI TIRES
                                            </strong>
                                            <p>{reclamation.reponseAdmin}</p>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default MesReclamations;