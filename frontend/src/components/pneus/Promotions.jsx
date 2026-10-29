
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllPromotions } from "../../services/promotionApi";
import { useCart } from "../../context/CartContext";
import "./Promotions.css";
import { API_URL } from "../../config";

function Promotions() {

    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const { addToCart } = useCart();


    // ==============================
    // CHARGER LES PROMOTIONS
    // ==============================

    useEffect(() => {

        const loadPromotions = async () => {

            try {

                const response = await getAllPromotions();

                console.log("Promotions :", response.data);

                setPromotions(response.data);

            } catch (error) {

                console.error(error);

                setError(
                    "Erreur lors du chargement des promotions."
                );

            } finally {

                setLoading(false);

            }

        };

        loadPromotions();

    }, []);


    // ==============================
    // AJOUTER AU PANIER
    // ==============================

    const handleAddToCart = (pneu, pourcentage) => {

        if (Number(pneu.stock) <= 0) {
            return;
        }

        const ancienPrix = Number(pneu.prix);
        const reduction = Number(pourcentage);

        const nouveauPrix =
            ancienPrix -
            (ancienPrix * reduction / 100);


        // Copie du pneu avec le prix promotionnel

        const pneuPromotion = {

            ...pneu,

            prixOriginal: ancienPrix,

            prix: nouveauPrix,

            enPromotion: true,

            pourcentagePromotion: reduction

        };


        addToCart(pneuPromotion);

    };


    // ==============================
    // FORMAT DATE
    // ==============================

    const formatDate = (date) => {

        if (!date) {
            return "";
        }

        return new Date(date).toLocaleDateString("fr-FR");

    };


    // ==============================
    // LOADING
    // ==============================

    if (loading) {

        return (
            <div className="loading">
                Chargement des promotions...
            </div>
        );

    }


    // ==============================
    // ERREUR
    // ==============================

    if (error) {

        return (
            <div className="error">
                {error}
            </div>
        );

    }


    // ==============================
    // AFFICHAGE
    // ==============================

    return (

        <section className="promotions-section">


            {/* ==============================
                HEADER
            ============================== */}

            <div className="promotions-header">

                <h1>
                    Nos Promotions
                </h1>

                <p>
                    Profitez de nos offres exceptionnelles
                    sur une sélection de pneus.
                </p>

            </div>


            {/* ==============================
                GRILLE
            ============================== */}

            <div className="promotions-grid">

                {promotions.length === 0 ? (

                    <p className="no-promotions">
                        Aucune promotion disponible
                        actuellement.
                    </p>

                ) : (

                    promotions.map((promotion) => {

                        const pneu = promotion.pneu;

                        if (!pneu) {
                            return null;
                        }


                        // ==============================
                        // CALCUL PRIX PROMOTION
                        // ==============================

                        const ancienPrix = Number(pneu.prix);

                        const reduction =
                            Number(promotion.pourcentage);

                        const nouveauPrix =
                            ancienPrix -
                            (ancienPrix * reduction / 100);


                        // ==============================
                        // STOCK
                        // ==============================

                        const stockDisponible =
                            Number(pneu.stock) > 0;


                        return (

                            <div
                                className="promotion-card"
                                key={promotion.id}
                            >


                                {/* ==============================
                                    BADGE
                                ============================== */}

                                <div className="promotion-badge">

                                    -{reduction}%

                                </div>


                                {/* ==============================
                                    IMAGE
                                ============================== */}

                                <div className="promotion-image">

                                    <img
                                        src={`${API_URL}/uploadPneu/${pneu.image}`}
                                        alt={pneu.modele}
                                    />

                                </div>


                                {/* ==============================
                                    CONTENU
                                ============================== */}

                                <div className="promotion-content">


                                    <h3>
                                        {pneu.modele}
                                    </h3>


                                    <p>
                                        Dimension : {pneu.dimension}
                                    </p>


                                    <p>
                                        Saison : {pneu.saison}
                                    </p>


                                    {/* ==============================
                                        DATES PROMOTION
                                    ============================== */}

                                    <div className="promotion-dates">

                                        <p>
                                            <strong>
                                                Début :
                                            </strong>{" "}
                                            {formatDate(
                                                promotion.dateDebut
                                            )}
                                        </p>

                                        <p>
                                            <strong>
                                                Fin :
                                            </strong>{" "}
                                            {formatDate(
                                                promotion.dateFin
                                            )}
                                        </p>

                                    </div>


                                    {/* ==============================
                                        PRIX
                                    ============================== */}

                                    <div className="promotion-prices">

                                        <span className="old-price">

                                            {ancienPrix.toFixed(2)} DT

                                        </span>


                                        <span className="new-price">

                                            {nouveauPrix.toFixed(2)} DT

                                        </span>

                                    </div>


                                    {/* ==============================
                                        STOCK
                                    ============================== */}

                                    <p
                                        className={
                                            stockDisponible
                                                ? "promotion-stock available"
                                                : "promotion-stock unavailable"
                                        }
                                    >

                                        {stockDisponible
                                            ? `Stock : ${pneu.stock}`
                                            : "Rupture de stock"
                                        }

                                    </p>


                                    {/* ==============================
                                        BOUTONS
                                    ============================== */}

                                    <div className="promotion-buttons">


                                        {/* VOIR PLUS */}

                                        <Link
                                            className="details-btn"
                                            to={`/pneu/${pneu.id}`}
                                        >
                                            Voir plus
                                        </Link>


                                        {/* AJOUTER AU PANIER */}

                                        <button
                                            type="button"
                                            className="cart-btn"
                                            onClick={() =>
                                                handleAddToCart(
                                                    pneu,
                                                    promotion.pourcentage
                                                )
                                            }
                                            disabled={!stockDisponible}
                                        >

                                            {stockDisponible
                                                ? "Ajouter au panier"
                                                : "Rupture de stock"
                                            }

                                        </button>


                                    </div>


                                </div>

                            </div>

                        );

                    })

                )}

            </div>

        </section>

    );

}

export default Promotions;

