import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaHome
} from "react-icons/fa";

import {
    getAllPneus,
    deletePneu
} from "../../services/pneuApi";

import "./AdminPneus.css";
import { API_URL } from "../../config";


function AdminPneus() {

    const [pneus, setPneus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();


    // ========================================
    // RÉCUPÉRER LES PNEUS
    // ========================================

    useEffect(() => {

        const chargerPneus = async () => {

            try {

                const response = await getAllPneus();

                console.log(
                    "✅ Pneus récupérés :",
                    response.data
                );

                if (response.data.success) {

                    setPneus(response.data.pneus);

                }

            } catch (error) {

                console.error(
                    "❌ Erreur récupération pneus :",
                    error
                );

                setError(
                    "Impossible de récupérer les pneus."
                );

            } finally {

                setLoading(false);

            }

        };

        chargerPneus();

    }, []);


    // ========================================
    // SUPPRIMER UN PNEU
    // ========================================

    const handleDelete = async (id) => {

        const confirmation = window.confirm(
            "Êtes-vous sûr de vouloir supprimer ce pneu ?"
        );

        if (!confirmation) {
            return;
        }

        try {

            await deletePneu(id);

            // Supprimer le pneu directement de l'affichage
            setPneus((pneusActuels) =>
                pneusActuels.filter(
                    (pneu) => pneu.id !== id
                )
            );

            alert("Pneu supprimé avec succès.");

        } catch (error) {

            console.error(
                "❌ Erreur suppression pneu :",
                error
            );

            alert(
                "Impossible de supprimer ce pneu."
            );

        }

    };


    // ========================================
    // CHARGEMENT
    // ========================================

    if (loading) {

        return (

            <div className="admin-pneus-page">

                <div className="admin-pneus-loading">
                    Chargement des pneus...
                </div>

            </div>

        );

    }


    // ========================================
    // ERREUR
    // ========================================

    if (error) {

        return (

            <div className="admin-pneus-page">

                <div className="admin-pneus-error">
                    {error}
                </div>

            </div>

        );

    }


    // ========================================
    // AFFICHAGE
    // ========================================

    return (

        <div className="admin-pneus-page">


            {/* ========================================
                HEADER
            ======================================== */}

            <div className="admin-pneus-header">

                <div>

                    <h1>
                        Gestion des pneus
                    </h1>

                    <p>
                        Gérez les pneus disponibles dans votre catalogue.
                    </p>

                </div>


                {/* ========================================
                    BOUTONS
                ======================================== */}

                <div className="admin-pneus-header-actions">


                    {/* Retour Dashboard */}

                    <button
                        className="btn-retour-dashboard"
                        title="Retour au dashboard"
                        onClick={() => navigate("/admin")}
                    >

                        <FaHome />

                        <span>
                            Dashboard
                        </span>

                    </button>


                    {/* Ajouter un pneu */}

                    <button
                        className="btn-ajouter-pneu"
                        title="Ajouter un pneu"
                        onClick={() =>
                            navigate("/admin/pneus/ajouter")
                        }
                    >

                        <FaPlus />

                        <span>
                            Ajouter un pneu
                        </span>

                    </button>


                </div>

            </div>


            {/* ========================================
                INFORMATIONS
            ======================================== */}

            <div className="pneus-info">

                <span>
                    Nombre de pneus
                </span>

                <strong>
                    {pneus.length}
                </strong>

            </div>


            {/* ========================================
                GRILLE DES PNEUS
            ======================================== */}

            <div className="admin-pneus-grid">


                {pneus.length === 0 ? (

                    <div className="aucun-pneu">
                        Aucun pneu trouvé.
                    </div>

                ) : (

                    pneus.map((pneu) => (

                        <div
                            className="admin-pneu-card"
                            key={pneu.id}
                        >


                            {/* IMAGE */}

                            <div className="admin-pneu-image-container">

                                {pneu.image ? (

                                    <img
                                        src={`${API_URL}/uploadPneu/${pneu.image}`}
                                        alt={pneu.modele}
                                        className="admin-pneu-image"
                                    />

                                ) : (

                                    <span className="no-image">
                                        Aucune image
                                    </span>

                                )}

                            </div>


                            {/* CONTENU */}

                            <div className="admin-pneu-content">


                                {/* MODÈLE */}

                                <h3 title={pneu.modele}>
                                    {pneu.modele}
                                </h3>


                                {/* MARQUE */}

                                <p className="admin-pneu-marque">

                                    {pneu.Marque?.nom ||
                                        pneu.marque?.nom ||
                                        "-"}

                                </p>


                                {/* DIMENSION + SAISON */}

                                <div className="admin-pneu-details">

                                    <span>
                                        {pneu.dimension || "-"}
                                    </span>

                                    <span>
                                        {pneu.saison || "-"}
                                    </span>

                                </div>


                                {/* PRIX + STOCK */}

                                <div className="admin-pneu-bottom">

                                    <strong>
                                        {pneu.prix} DT
                                    </strong>

                                    <span
                                        className={
                                            pneu.stock > 0
                                                ? "stock-disponible"
                                                : "stock-rupture"
                                        }
                                    >

                                        {pneu.stock > 0
                                            ? `Stock : ${pneu.stock}`
                                            : "Rupture"}

                                    </span>

                                </div>


                                {/* ACTIONS */}

                                <div className="actions-pneu">


                                    {/* MODIFIER */}

                                    <button
                                        className="btn-modifier"
                                        title="Modifier"
                                        onClick={() =>
                                            navigate(
                                                `/admin/pneus/modifier/${pneu.id}`
                                            )
                                        }
                                    >

                                        <FaEdit />

                                    </button>


                                    {/* SUPPRIMER */}

                                    <button
                                        className="btn-supprimer"
                                        title="Supprimer"
                                        onClick={() =>
                                            handleDelete(pneu.id)
                                        }
                                    >

                                        <FaTrash />

                                    </button>


                                </div>


                            </div>

                        </div>

                    ))

                )}

            </div>

        </div>

    );

}


export default AdminPneus;