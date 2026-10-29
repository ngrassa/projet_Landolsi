import "./MesCommandes.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaBoxOpen,
    FaCalendarAlt,
    FaShoppingBag
} from "react-icons/fa";

import { getMesCommandes } from "../../services/commandeApi";
import { API_URL } from "../../config";

function MesCommandes() {

    const navigate = useNavigate();

    // ========================================
    // STATES
    // ========================================

    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // ========================================
    // CHARGER LES COMMANDES
    // ========================================

    useEffect(() => {

        const loadCommandes = async () => {

            try {

                console.log(
                    "🔄 Récupération des commandes..."
                );

                const response = await getMesCommandes();

                console.log(
                    "✅ Commandes :",
                    response.data
                );

                setCommandes(
                    response.data.commandes || []
                );

            } catch (error) {

                console.error(
                    "❌ Erreur commandes :",
                    error
                );

                // ========================================
                // UTILISATEUR NON CONNECTÉ
                // ========================================

                if (error.response?.status === 401) {

                    navigate("/login");

                    return;
                }

                setError(
                    error.response?.data?.message ||
                    "Impossible de récupérer vos commandes."
                );

            } finally {

                setLoading(false);

            }

        };


        loadCommandes();

    }, [navigate]);


    // ========================================
    // CHARGEMENT
    // ========================================

    if (loading) {

        return (

            <div className="commandes-page">

                <div className="commandes-container">

                    <div className="commandes-loading">

                        <FaShoppingBag />

                        <p>
                            Chargement de vos commandes...
                        </p>

                    </div>

                </div>

            </div>

        );
    }


    // ========================================
    // ERREUR
    // ========================================

    if (error) {

        return (

            <div className="commandes-page">

                <div className="commandes-container">

                    <div className="commandes-error">

                        {error}

                    </div>

                </div>

            </div>

        );
    }


    // ========================================
    // AUCUNE COMMANDE
    // ========================================

    if (commandes.length === 0) {

        return (

            <div className="commandes-page">

                <div className="commandes-container">

                    {/* HEADER */}

                    <div className="commandes-title">

                        <div className="commandes-title-icon">

                            <FaBoxOpen />

                        </div>

                        <div>

                            <h1>
                                Mes commandes
                            </h1>

                            <p>
                                Consultez l'historique de vos commandes
                            </p>

                        </div>

                    </div>


                    {/* EMPTY */}

                    <div className="commandes-empty">

                        <FaShoppingBag />

                        <h2>
                            Aucune commande
                        </h2>

                        <p>
                            Vous n'avez pas encore passé de commande.
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate("/pneus")}
                        >
                            Découvrir nos pneus
                        </button>

                    </div>

                </div>

            </div>

        );
    }


    // ========================================
    // AFFICHAGE
    // ========================================

    return (

        <div className="commandes-page">

            <div className="commandes-container">


                {/* ========================================
                    HEADER
                ======================================== */}

                <div className="commandes-title">

                    <div className="commandes-title-icon">

                        <FaBoxOpen />

                    </div>

                    <div>

                        <h1>
                            Mes commandes
                        </h1>

                        <p>
                            Retrouvez toutes vos commandes
                        </p>

                    </div>

                </div>


                {/* ========================================
                    NOMBRE COMMANDES
                ======================================== */}

                <div className="commandes-count">

                    <strong>
                        {commandes.length}
                    </strong>

                    <span>
                        {commandes.length > 1
                            ? " commandes"
                            : " commande"
                        }
                    </span>

                </div>


                {/* ========================================
                    LISTE COMMANDES
                ======================================== */}

                <div className="commandes-list">

                    {commandes.map((commande) => (

                        <div
                            className="commande-card"
                            key={commande.id}
                        >


                            {/* ========================================
                                HEADER COMMANDE
                            ======================================== */}

                            <div className="commande-header">

                                <div>

                                    <span className="commande-label">
                                        Commande
                                    </span>

                                    <h2>
                                        #{commande.id}
                                    </h2>

                                </div>


                                <span
                                    className={`commande-status status-${commande.statut
                                        ?.toLowerCase()
                                        .normalize("NFD")
                                        .replace(/[\u0300-\u036f]/g, "")
                                        .replace(/\s+/g, "-")}`}
                                >
                                    {commande.statut}
                                </span>

                            </div>


                            {/* ========================================
                                DATE
                            ======================================== */}

                            <div className="commande-date">

                                <FaCalendarAlt />

                                <span>

                                    {commande.createdAt
                                        ? new Date(
                                            commande.createdAt
                                        ).toLocaleDateString(
                                            "fr-FR",
                                            {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric"
                                            }
                                        )
                                        : "Date inconnue"
                                    }

                                </span>

                            </div>


                            {/* ========================================
                                PRODUITS
                            ======================================== */}

                            <div className="commande-products">

                                {commande.items?.map((item) => {

                                    const prixUnitaire =
                                        Number(item.prix) || 0;

                                    const quantite =
                                        Number(item.quantite) || 0;

                                    const prixTotal =
                                        prixUnitaire * quantite;


                                    return (

                                        <div
                                            className="commande-product"
                                            key={item.id}
                                        >


                                            {/* IMAGE */}

                                            <div className="commande-product-image">

                                                {item.pneu?.image ? (

                                                    <img
                                                        src={`${API_URL}/uploadPneu/${item.pneu.image}`}
                                                        alt={
                                                            item.pneu?.modele ||
                                                            "Pneu"
                                                        }
                                                    />

                                                ) : (

                                                    <FaShoppingBag />

                                                )}

                                            </div>


                                            {/* INFORMATIONS */}

                                            <div className="commande-product-info">

                                                <h3>

                                                    {item.pneu?.modele ||
                                                        "Pneu"}

                                                </h3>


                                                {/* MARQUE */}

                                                {item.pneu?.marque?.nom && (

                                                    <span className="commande-marque">

                                                        {item.pneu.marque.nom}

                                                    </span>

                                                )}


                                                {/* DIMENSION */}

                                                <span>

                                                    Dimension :{" "}

                                                    {item.pneu?.dimension ||
                                                        "Non renseignée"}

                                                </span>


                                                {/* SAISON */}

                                                <span>

                                                    Saison :{" "}

                                                    {item.pneu?.saison ||
                                                        "Non renseignée"}

                                                </span>

                                            </div>


                                            {/* PRIX */}

                                            <div className="commande-product-price">

                                                <span>

                                                    × {quantite}

                                                </span>

                                                <strong>

                                                    {prixTotal.toFixed(2)} DT

                                                </strong>

                                                <small>

                                                    {prixUnitaire.toFixed(2)} DT / unité

                                                </small>

                                            </div>

                                        </div>

                                    );

                                })}

                            </div>


                            {/* ========================================
                                FOOTER
                            ======================================== */}

                            <div className="commande-footer">


                                {/* TOTAL */}

                                <div className="commande-footer-total">

                                    <span>
                                        Total de la commande
                                    </span>

                                    <strong>

                                        {Number(
                                            commande.total
                                        ).toFixed(2)} DT

                                    </strong>

                                </div>


                                {/* DETAILS */}

                                <button
                                    type="button"
                                    className="commande-details-btn"
                                    onClick={() =>
                                        navigate(
                                            `/commande/${commande.id}`
                                        )
                                    }
                                >
                                    Voir les détails
                                </button>

                            </div>


                        </div>

                    ))}

                </div>

            </div>

        </div>

    );
}

export default MesCommandes;