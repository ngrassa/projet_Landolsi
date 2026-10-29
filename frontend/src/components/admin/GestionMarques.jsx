
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaHome,
    FaTimes,
    FaSave,
    FaTrademark
} from "react-icons/fa";

import {
    getAllMarques,
    addMarque,
    updateMarque,
    deleteMarque
} from "../../services/marqueApi";

import "./GestionMarques.css";
import { API_URL } from "../../config";

const API_IMAGES = `${API_URL}/uploadPneu/`;

function GestionMarques() {
    const navigate = useNavigate();

    const [marques, setMarques] = useState([]);
    const [nom, setNom] = useState("");
    const [logo, setLogo] = useState(null);
    const [marqueEnModification, setMarqueEnModification] = useState(null);

    const [chargement, setChargement] = useState(true);
    const [enregistrement, setEnregistrement] = useState(false);

    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");

    // ========================================
    // RÉCUPÉRER LES MARQUES
    // ========================================

    const chargerMarques = async () => {
        try {
            setErreur("");

            const response = await getAllMarques();

            if (response.data.success) {
                setMarques(response.data.marques || []);
            } else {
                setErreur("Impossible de récupérer les marques.");
            }
        } catch (error) {
            console.error("Erreur de récupération des marques :", error);
            setErreur(
                error.response?.data?.message ||
                "Impossible de récupérer les marques. Vérifiez le backend."
            );
        } finally {
            setChargement(false);
        }
    };

    useEffect(() => {
        chargerMarques();
    }, []);

    // ========================================
    // RÉINITIALISER LE FORMULAIRE
    // ========================================

    const reinitialiserFormulaire = () => {
        setNom("");
        setLogo(null);
        setMarqueEnModification(null);

        const input = document.getElementById("logo-marque");

        if (input) {
            input.value = "";
        }
    };

    // ========================================
    // AJOUTER OU MODIFIER UNE MARQUE
    // ========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setErreur("");
        setMessage("");

        if (!nom.trim()) {
            setErreur("Veuillez saisir le nom de la marque.");
            return;
        }

        if (!marqueEnModification && !logo) {
            setErreur("Veuillez sélectionner le logo de la marque.");
            return;
        }

        if (logo) {
            const formatsAutorises = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp"
            ];

            if (!formatsAutorises.includes(logo.type)) {
                setErreur("Formats acceptés : JPG, JPEG, PNG et WEBP.");
                return;
            }

            if (logo.size > 5 * 1024 * 1024) {
                setErreur("Le logo ne doit pas dépasser 5 Mo.");
                return;
            }
        }

        const formData = new FormData();

        formData.append("nom", nom.trim());

        if (logo) {
            formData.append("logo", logo);
        }

        try {
            setEnregistrement(true);

            if (marqueEnModification) {
                await updateMarque(marqueEnModification.id, formData);
                setMessage("Marque modifiée avec succès.");
            } else {
                await addMarque(formData);
                setMessage("Marque ajoutée avec succès.");
            }

            reinitialiserFormulaire();

            await chargerMarques();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        } catch (error) {
            console.error("Erreur d'enregistrement :", error);

            setErreur(
                error.response?.data?.message ||
                "Erreur lors de l'enregistrement de la marque."
            );
        } finally {
            setEnregistrement(false);
        }
    };

    // ========================================
    // PRÉPARER LA MODIFICATION
    // ========================================

    const handleModifier = (marque) => {
        setMarqueEnModification(marque);
        setNom(marque.nom || "");
        setLogo(null);
        setErreur("");
        setMessage("");

        const input = document.getElementById("logo-marque");

        if (input) {
            input.value = "";
        }

        document.getElementById("formulaire-marque")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };

    // ========================================
    // SUPPRIMER UNE MARQUE
    // ========================================

    const handleSupprimer = async (marque) => {
        const confirmation = window.confirm(
            `Voulez-vous vraiment supprimer la marque "${marque.nom}" ?`
        );

        if (!confirmation) {
            return;
        }

        setErreur("");
        setMessage("");

        try {
            await deleteMarque(marque.id);

            setMarques((anciennesMarques) =>
                anciennesMarques.filter(
                    (item) => item.id !== marque.id
                )
            );

            if (marqueEnModification?.id === marque.id) {
                reinitialiserFormulaire();
            }

            setMessage("Marque supprimée avec succès.");
        } catch (error) {
            console.error("Erreur de suppression :", error);

            setErreur(
                error.response?.data?.message ||
                "Impossible de supprimer cette marque. Elle est peut-être utilisée par des pneus."
            );
        }
    };

    // ========================================
    // APERÇU DU LOGO SÉLECTIONNÉ
    // ========================================

    const [logoApercu, setLogoApercu] = useState("");

    useEffect(() => {
        if (!logo) {
            setLogoApercu("");
            return;
        }

        const url = URL.createObjectURL(logo);

        setLogoApercu(url);

        return () => URL.revokeObjectURL(url);
    }, [logo]);

    // ========================================
    // CHARGEMENT
    // ========================================

    if (chargement) {
        return (
            <div className="gestion-marques">
                <div className="marques-chargement">
                    Chargement des marques...
                </div>
            </div>
        );
    }

    // ========================================
    // AFFICHAGE
    // ========================================

    return (
        <main className="gestion-marques">
            {/* EN-TÊTE */}

            <header className="marques-entete">
                <div className="marques-titre">
                    <div className="marques-icone-titre">
                        <FaTrademark />
                    </div>

                    <div>
                        <h1>Gestion des marques</h1>
                        <p>
                            Gérez les marques et les logos des pneus.
                        </p>
                    </div>
                </div>

                <div className="marques-header-actions">
                    <span className="marques-compteur">
                        {marques.length} marque(s)
                    </span>

                    <button
                        type="button"
                        className="btn-retour-dashboard"
                        onClick={() => navigate("/admin")}
                        title="Retour au dashboard"
                    >
                        <FaHome />
                        <span>Dashboard</span>
                    </button>
                </div>
            </header>

            {/* MESSAGES */}

            {message && (
                <div className="marques-message succes" role="status">
                    <span>{message}</span>

                    <button
                        type="button"
                        aria-label="Fermer le message"
                        onClick={() => setMessage("")}
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {erreur && (
                <div className="marques-message erreur" role="alert">
                    <span>{erreur}</span>

                    <button
                        type="button"
                        aria-label="Fermer le message d'erreur"
                        onClick={() => setErreur("")}
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* FORMULAIRE */}

            <section
                className="marques-formulaire"
                id="formulaire-marque"
            >
                <div className="marques-section-titre">
                    <h2>
                        {marqueEnModification
                            ? "Modifier une marque"
                            : "Ajouter une marque"}
                    </h2>

                    {marqueEnModification && (
                        <span className="badge-modification">
                            Modification en cours
                        </span>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="marques-form-grid">
                        <div className="champ-marque">
                            <label htmlFor="nom-marque">
                                Nom de la marque *
                            </label>

                            <input
                                id="nom-marque"
                                type="text"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                placeholder="Ex. Michelin"
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className="champ-marque">
                            <label htmlFor="logo-marque">
                                Logo de la marque{" "}
                                {marqueEnModification
                                    ? "(facultatif)"
                                    : "*"}
                            </label>

                            <input
                                id="logo-marque"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                onChange={(e) =>
                                    setLogo(e.target.files?.[0] || null)
                                }
                                required={!marqueEnModification}
                            />

                            <small>
                                JPG, PNG ou WEBP — 5 Mo maximum.
                                {marqueEnModification &&
                                    " Laisse vide pour conserver le logo actuel."}
                            </small>
                        </div>
                    </div>

                    {(logoApercu ||
                        (marqueEnModification && marqueEnModification.logo)) && (
                        <div className="marque-apercu">
                            <p>
                                {logoApercu
                                    ? "Nouveau logo sélectionné"
                                    : "Logo actuel"}
                            </p>

                            <img
                                src={
                                    logoApercu ||
                                    `${API_IMAGES}${marqueEnModification.logo}`
                                }
                                alt="Aperçu du logo"
                            />
                        </div>
                    )}

                    <div className="marques-actions-form">
                        <button
                            type="submit"
                            className="btn-marque-principal"
                            disabled={enregistrement}
                        >
                            {enregistrement ? (
                                "Enregistrement..."
                            ) : marqueEnModification ? (
                                <>
                                    <FaSave />
                                    Enregistrer les modifications
                                </>
                            ) : (
                                <>
                                    <FaPlus />
                                    Ajouter la marque
                                </>
                            )}
                        </button>

                        {marqueEnModification && (
                            <button
                                type="button"
                                className="btn-marque-annuler"
                                onClick={reinitialiserFormulaire}
                            >
                                <FaTimes />
                                Annuler
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* LISTE DES MARQUES */}

            <section className="marques-liste">
                <div className="marques-section-titre">
                    <h2>Liste des marques</h2>
                    <span className="marques-liste-total">
                        Total : {marques.length}
                    </span>
                </div>

                {marques.length === 0 ? (
                    <div className="marques-vide">
                        <FaTrademark />
                        <h3>Aucune marque trouvée</h3>
                        <p>
                            Ajoutez votre première marque à l'aide du formulaire.
                        </p>
                    </div>
                ) : (
                    <div className="marques-table-conteneur">
                        <table className="marques-table">
                            <thead>
                                <tr>
                                    <th>Logo</th>
                                    <th>Nom de la marque</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {marques.map((marque) => (
                                    <tr key={marque.id}>
                                        <td>
                                            {marque.logo ? (
                                                <img
                                                    className="marque-logo-table"
                                                    src={`${API_IMAGES}${marque.logo}`}
                                                    alt={`Logo ${marque.nom}`}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <span className="sans-logo">
                                                    Sans logo
                                                </span>
                                            )}
                                        </td>

                                        <td className="marque-nom-cellule">
                                            {marque.nom}
                                        </td>

                                        <td>
                                            <div className="marque-actions">
                                                <button
                                                    type="button"
                                                    className="btn-marque-modifier"
                                                    title={`Modifier ${marque.nom}`}
                                                    onClick={() =>
                                                        handleModifier(marque)
                                                    }
                                                >
                                                    <FaEdit />
                                                    <span>Modifier</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn-marque-supprimer"
                                                    title={`Supprimer ${marque.nom}`}
                                                    onClick={() =>
                                                        handleSupprimer(marque)
                                                    }
                                                >
                                                    <FaTrash />
                                                    <span>Supprimer</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

export default GestionMarques;