
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAllReclamations,
    updateReclamation,
    deleteReclamation
} from "../../services/reclamationApi";

import "./GestionReclamations.css";

function GestionReclamations() {
    const [reclamations, setReclamations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");
    const [modificationId, setModificationId] = useState(null);
    const [statut, setStatut] = useState("En attente");
    const [reponseAdmin, setReponseAdmin] = useState("");
    const [recherche, setRecherche] = useState("");
    const [filtreStatut, setFiltreStatut] = useState("Toutes");
    const [actionEnCours, setActionEnCours] = useState(false);
    const navigate = useNavigate();

    const chargerReclamations = async () => {
        try {
            setErreur("");

            const response = await getAllReclamations();
            const data = response.data;

            const liste = Array.isArray(data)
                ? data
                : data.reclamations || data.data || [];

            setReclamations(Array.isArray(liste) ? liste : []);
        } catch (error) {
            setErreur(
                error.response?.status === 403
                    ? "Accès réservé à l'administrateur."
                    : "Impossible de charger les réclamations."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chargerReclamations();
    }, []);

    const commencerModification = (reclamation) => {
        setModificationId(reclamation.id);
        setStatut(reclamation.statut || "En attente");
        setReponseAdmin(reclamation.reponseAdmin || "");
        setMessage("");
        setErreur("");
    };

    const enregistrerModification = async (id) => {
        try {
            setActionEnCours(true);
            setErreur("");
            setMessage("");

            await updateReclamation(id, {
                statut,
                reponseAdmin: reponseAdmin.trim()
            });

            setModificationId(null);
            setMessage("La réclamation a été mise à jour.");

            await chargerReclamations();
        } catch (error) {
            setErreur(
                error.response?.data?.message ||
                "Erreur lors de la mise à jour de la réclamation."
            );
        } finally {
            setActionEnCours(false);
        }
    };

    const supprimerReclamation = async (id) => {
        const confirmation = window.confirm(
            "Voulez-vous vraiment supprimer cette réclamation ?"
        );

        if (!confirmation) return;

        try {
            setActionEnCours(true);
            setErreur("");
            setMessage("");

            await deleteReclamation(id);

            setReclamations((anciennes) =>
                anciennes.filter((r) => r.id !== id)
            );

            if (modificationId === id) {
                setModificationId(null);
            }

            setMessage("La réclamation a été supprimée.");
        } catch (error) {
            setErreur(
                error.response?.data?.message ||
                "Erreur lors de la suppression."
            );
        } finally {
            setActionEnCours(false);
        }
    };

    const obtenirNomClient = (reclamation) => {
        const user = reclamation.user || reclamation.User;

        if (!user) return "Client";

        return [user.prenom, user.nom].filter(Boolean).join(" ") || "Client";
    };

    const obtenirEmailClient = (reclamation) => {
        const user = reclamation.user || reclamation.User;
        return user?.email || "Email indisponible";
    };

    const getStatutClass = (valeur) => {
        if (valeur === "Résolue") return "admin-statut-resolue";
        if (valeur === "En cours") return "admin-statut-cours";
        return "admin-statut-attente";
    };

    const reclamationsFiltrees = reclamations.filter((r) => {
        const rechercheMinuscule = recherche.toLowerCase();

        const correspondRecherche = [
            r.sujet,
            r.description,
            obtenirNomClient(r),
            obtenirEmailClient(r)
        ].some((valeur) =>
            String(valeur || "").toLowerCase().includes(rechercheMinuscule)
        );

        const correspondStatut =
            filtreStatut === "Toutes" || r.statut === filtreStatut;

        return correspondRecherche && correspondStatut;
    });

    const enAttente = reclamations.filter(
        (r) => r.statut === "En attente"
    ).length;

    const enCours = reclamations.filter(
        (r) => r.statut === "En cours"
    ).length;

    const resolues = reclamations.filter(
        (r) => r.statut === "Résolue"
    ).length;

    return (
        <main className="gestion-reclamations-page">
            <header className="gestion-reclamations-header">
                <div>
                    <span className="gestion-reclamations-surtitle">
                        ESPACE ADMINISTRATEUR
                    </span>
                    <h1>Gestion des réclamations</h1>
                    <p>
                        Consultez les demandes des clients et assurez leur suivi.
                    </p>
                </div>

                <div className="gestion-reclamations-header-actions">
    <button
        type="button"
        className="admin-reclamation-back"
        onClick={() => navigate("/admin")}
    >
        ← Retour au dashboard
    </button>

    <button
        type="button"
        className="admin-reclamation-refresh"
        onClick={chargerReclamations}
        disabled={loading || actionEnCours}
    >
        Actualiser
    </button>
</div>
            </header>

            {erreur && (
                <div className="admin-reclamation-alert error">
                    {erreur}
                </div>
            )}

            {message && (
                <div className="admin-reclamation-alert success">
                    {message}
                </div>
            )}

            <section className="admin-reclamation-stats">
                <div className="admin-reclamation-stat">
                    <span>Total des réclamations</span>
                    <strong>{reclamations.length}</strong>
                </div>

                <div className="admin-reclamation-stat attente">
                    <span>En attente</span>
                    <strong>{enAttente}</strong>
                </div>

                <div className="admin-reclamation-stat cours">
                    <span>En cours</span>
                    <strong>{enCours}</strong>
                </div>

                <div className="admin-reclamation-stat resolue">
                    <span>Résolues</span>
                    <strong>{resolues}</strong>
                </div>
            </section>

            <section className="admin-reclamation-panel">
                <div className="admin-reclamation-filtres">
                    <input
                        type="search"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder="Rechercher un client ou une réclamation..."
                        aria-label="Rechercher une réclamation"
                    />

                    <select
                        value={filtreStatut}
                        onChange={(e) => setFiltreStatut(e.target.value)}
                        aria-label="Filtrer par statut"
                    >
                        <option value="Toutes">Tous les statuts</option>
                        <option value="En attente">En attente</option>
                        <option value="En cours">En cours</option>
                        <option value="Résolue">Résolue</option>
                    </select>
                </div>

                {loading ? (
                    <p className="admin-reclamation-empty">
                        Chargement des réclamations...
                    </p>
                ) : reclamationsFiltrees.length === 0 ? (
                    <p className="admin-reclamation-empty">
                        Aucune réclamation trouvée.
                    </p>
                ) : (
                    <div className="admin-reclamation-list">
                        {reclamationsFiltrees.map((r) => (
                            <article
                                className="admin-reclamation-card"
                                key={r.id}
                            >
                                <div className="admin-reclamation-card-header">
                                    <div>
                                        <span className="admin-reclamation-id">
                                            Réclamation #{r.id}
                                        </span>
                                        <h2>{r.sujet}</h2>
                                    </div>

                                    <span
                                        className={`admin-reclamation-status ${getStatutClass(
                                            r.statut
                                        )}`}
                                    >
                                        {r.statut}
                                    </span>
                                </div>

                                <div className="admin-reclamation-client">
                                    <div>
                                        <strong>Client</strong>
                                        <span>{obtenirNomClient(r)}</span>
                                    </div>

                                    <div>
                                        <strong>Email</strong>
                                        <span>{obtenirEmailClient(r)}</span>
                                    </div>

                                    <div>
    <strong>Date et heure</strong>
    <span>
        {r.createdAt &&
        !isNaN(new Date(r.createdAt).getTime())
            ? new Date(r.createdAt).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false
              })
            : "Indisponible"}
    </span>
</div>
                                </div>

                                <div className="admin-reclamation-description">
                                    <strong>Description</strong>
                                    <p>{r.description}</p>
                                </div>

                                {modificationId === r.id ? (
                                    <div className="admin-reclamation-edit">
                                        <label htmlFor={`statut-${r.id}`}>
                                            Statut
                                        </label>

                                        <select
                                            id={`statut-${r.id}`}
                                            value={statut}
                                            onChange={(e) =>
                                                setStatut(e.target.value)
                                            }
                                        >
                                            <option value="En attente">
                                                En attente
                                            </option>
                                            <option value="En cours">
                                                En cours
                                            </option>
                                            <option value="Résolue">
                                                Résolue
                                            </option>
                                        </select>

                                        <label htmlFor={`reponse-${r.id}`}>
                                            Réponse au client
                                        </label>

                                        <textarea
                                            id={`reponse-${r.id}`}
                                            rows={4}
                                            value={reponseAdmin}
                                            onChange={(e) =>
                                                setReponseAdmin(e.target.value)
                                            }
                                            placeholder="Écrivez votre réponse..."
                                        />

                                        <div className="admin-reclamation-actions">
                                            <button
                                                type="button"
                                                className="admin-btn-save"
                                                onClick={() =>
                                                    enregistrerModification(r.id)
                                                }
                                                disabled={actionEnCours}
                                            >
                                                {actionEnCours
                                                    ? "Enregistrement..."
                                                    : "Enregistrer"}
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-btn-cancel"
                                                onClick={() =>
                                                    setModificationId(null)
                                                }
                                                disabled={actionEnCours}
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {r.reponseAdmin && (
                                            <div className="admin-reclamation-response">
                                                <strong>
                                                    Réponse actuelle
                                                </strong>
                                                <p>{r.reponseAdmin}</p>
                                            </div>
                                        )}

                                        <div className="admin-reclamation-actions">
                                            <button
                                                type="button"
                                                className="admin-btn-edit"
                                                onClick={() =>
                                                    commencerModification(r)
                                                }
                                            >
                                                Modifier / Répondre
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-btn-delete"
                                                onClick={() =>
                                                    supprimerReclamation(r.id)
                                                }
                                                disabled={actionEnCours}
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default GestionReclamations;