import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaHome
} from "react-icons/fa";

import {
    getAllPromotionsAdmin,
    deletePromotion
} from "../../services/promotionApi";

import "./AdminPromotions.css";
import { API_URL } from "../../config";


function AdminPromotions() {

    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();


    // ========================================
    // RÉCUPÉRER LES PROMOTIONS
    // ========================================

    useEffect(() => {

        const chargerPromotions = async () => {

            try {

                const response = await getAllPromotionsAdmin();

                console.log(
                    "✅ Promotions récupérées :",
                    response.data
                );

                if (response.data.success) {

                    setPromotions(response.data.promotions);

                }

            } catch (error) {

                console.error(
                    "❌ Erreur récupération promotions :",
                    error
                );

                setError(
                    "Impossible de récupérer les promotions."
                );

            } finally {

                setLoading(false);

            }

        };

        chargerPromotions();

    }, []);


    // ========================================
    // SUPPRIMER UNE PROMOTION
    // ========================================

    const handleDelete = async (id) => {

        const confirmation = window.confirm(
            "Êtes-vous sûr de vouloir supprimer cette promotion ?"
        );

        if (!confirmation) {
            return;
        }

        try {

            await deletePromotion(id);

            // Supprimer la promotion directement de l'affichage
            setPromotions((promotionsActuelles) =>
                promotionsActuelles.filter(
                    (promotion) => promotion.id !== id
                )
            );

            alert("Promotion supprimée avec succès.");

        } catch (error) {

            console.error(
                "❌ Erreur suppression promotion :",
                error
            );

            alert(
                "Impossible de supprimer cette promotion."
            );

        }

    };


    // ========================================
    // CHARGEMENT
    // ========================================

    if (loading) {

        return (

            <div className="admin-promotions-page">

                <div className="admin-promotions-loading">
                    Chargement des promotions...
                </div>

            </div>

        );

    }


    // ========================================
    // ERREUR
    // ========================================

    if (error) {

        return (

            <div className="admin-promotions-page">

                <div className="admin-promotions-error">
                    {error}
                </div>

            </div>

        );

    }


    // ========================================
    // AFFICHAGE
    // ========================================

    return (

        <div className="admin-promotions-page">


            {/* ========================================
                HEADER
            ======================================== */}

            <div className="admin-promotions-header">

                <div>

                    <h1>
                        Gestion des promotions
                    </h1>

                    <p>
                        Gérez les promotions disponibles sur les pneus.
                    </p>

                </div>


                {/* ========================================
                    BOUTONS
                ======================================== */}

                <div className="admin-promotions-header-actions">


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


                    {/* Ajouter une promotion */}

                    <button
                        className="btn-ajouter-promotion"
                        title="Ajouter une promotion"
                        onClick={() =>
                            navigate("/admin/promotions/ajouter")
                        }
                    >

                        <FaPlus />

                        <span>
                            Ajouter une promotion
                        </span>

                    </button>


                </div>

            </div>


            {/* ========================================
                INFORMATIONS
            ======================================== */}

            <div className="promotions-info">

                <span>
                    Nombre de promotions
                </span>

                <strong>
                    {promotions.length}
                </strong>

            </div>


            {/* ========================================
                GRILLE DES PROMOTIONS
            ======================================== */}

            <div className="admin-promotions-grid">


                {promotions.length === 0 ? (

                    <div className="aucune-promotion">
                        Aucune promotion trouvée.
                    </div>

                ) : (

                    promotions.map((promotion) => (

                        <div
                            className="admin-promotion-card"
                            key={promotion.id}
                        >


                            {/* IMAGE DU PNEU */}

                            <div className="admin-promotion-image-container">

                                {promotion.pneu?.image ? (

                                    <img
                                        src={`${API_URL}/uploadPneu/${promotion.pneu.image}`}
                                        alt={promotion.pneu.modele}
                                        className="admin-promotion-image"
                                    />

                                ) : (

                                    <span className="no-image">
                                        Aucune image
                                    </span>

                                )}

                            </div>


                            {/* CONTENU */}

                            <div className="admin-promotion-content">


                                {/* MODÈLE */}

                                <h3 title={promotion.pneu?.modele}>

                                    {promotion.pneu?.modele || "-"}

                                </h3>


                                {/* DIMENSION */}

                                <p className="admin-promotion-dimension">

                                    {promotion.pneu?.dimension || "-"}

                                </p>


                                {/* POURCENTAGE */}

                                <div className="promotion-pourcentage">

                                    -{promotion.pourcentage}%

                                </div>

                                {/* PRIX */}

                                <div className="admin-promotion-prix">

                                    <span className="prix-ancien">
                                        {promotion.pneu?.prix} DT
                                    </span>

                                    <strong className="prix-promotion">
                                        {(
                                            promotion.pneu?.prix -
                                            (promotion.pneu?.prix * promotion.pourcentage) / 100
                                        ).toFixed(2)} DT
                                    </strong>

                                </div>


                                {/* DATES */}

                                <div className="admin-promotion-dates">

                                    <p>
                                        <strong>Début :</strong>{" "}
                                        {new Date(
                                            promotion.dateDebut
                                        ).toLocaleDateString("fr-FR")}
                                    </p>

                                    <p>
                                        <strong>Fin :</strong>{" "}
                                        {new Date(
                                            promotion.dateFin
                                        ).toLocaleDateString("fr-FR")}
                                    </p>

                                </div>


                                {/* STATUT */}

                                <div className="admin-promotion-statut">

                                    <span
                                        className={
                                            promotion.active
                                                ? "promotion-active"
                                                : "promotion-inactive"
                                        }
                                    >

                                        {promotion.active
                                            ? "Active"
                                            : "Inactive"}

                                    </span>

                                </div>


                                {/* ACTIONS */}

                                <div className="actions-promotion">


                                    {/* MODIFIER */}

                                    <button
                                        className="btn-modifier"
                                        title="Modifier"
                                        onClick={() =>
                                            navigate(
                                                `/admin/promotions/modifier/${promotion.id}`
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
                                            handleDelete(
                                                promotion.id
                                            )
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


export default AdminPromotions;