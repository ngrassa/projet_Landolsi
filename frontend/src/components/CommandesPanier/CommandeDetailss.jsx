import "./CommandeDetailss.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCommandeById } from "../../services/commandeApi";
import { API_URL } from "../../config";

function CommandeDetailss() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [commande, setCommande] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ========================================
    // RÉCUPÉRER LA COMMANDE
    // ========================================

    useEffect(() => {

        const loadCommande = async () => {

            try {

                console.log(
                    "🔄 Récupération commande :",
                    id
                );


                const response =
                    await getCommandeById(id);


                console.log(
                    "✅ Commande :",
                    response.data
                );


                setCommande(
                    response.data.commande
                );
                    console.log(
    "Articles de la commande :",
    response.data.commande.items
);

            } catch (error) {

                console.error(
                    "❌ Erreur commande :",
                    error
                );


                if (
                    error.response?.status === 401
                ) {

                    navigate("/login");

                    return;

                }


                setError(
                    error.response?.data?.message ||
                    "Impossible de récupérer cette commande."
                );


            } finally {

                setLoading(false);

            }

        };


        loadCommande();

    }, [id, navigate]);


    // ========================================
    // CHARGEMENT
    // ========================================

    if (loading) {

        return (

            <div className="commande-details-page">

                <div className="commande-details-container">

                    <div className="commande-loading">

                        <p>
                            Chargement de la commande...
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

            <div className="commande-details-page">

                <div className="commande-details-container">

                    <div className="commande-error">

                        {error}

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            navigate("/mes-commandes")
                        }
                        className="back-button"
                    >

                        ← Retour à mes commandes

                    </button>

                </div>

            </div>

        );

    }


    // ========================================
    // AUCUNE COMMANDE
    // ========================================

    if (!commande) {

        return (

            <div className="commande-details-page">

                <div className="commande-details-container">

                    <div className="commande-error">

                        Commande introuvable.

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            navigate("/mes-commandes")
                        }
                        className="back-button"
                    >

                        ← Retour à mes commandes

                    </button>

                </div>

            </div>

        );

    }


    // ========================================
    // AFFICHAGE
    // ========================================

    return (

        <div className="commande-details-page">

            <div className="commande-details-container">


                {/* ========================================
                    HEADER
                ======================================== */}

                <div className="commande-details-header">

                    <div>

                        <span className="commande-details-label">
                            DÉTAILS DE LA COMMANDE
                        </span>


                        <h1>
                            Commande #{commande.id}
                        </h1>


                        <p>

                            Passée le{" "}

                            {new Date(
                                commande.createdAt
                            ).toLocaleDateString(
                                "fr-FR",
                                {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric"
                                }
                            )}

                        </p>

                    </div>


                    <span
                        className={`commande-status status-${commande.statut
                            ?.toLowerCase()
                            .replace(/\s+/g, "-")}`}
                    >

                        {commande.statut}

                    </span>

                </div>


                {/* ========================================
                    INFORMATIONS LIVRAISON
                ======================================== */}

                <div className="commande-card">

                    <h2>
                        Adresse de livraison
                    </h2>


                    <div className="commande-info-grid">


                        {/* NOM */}

                        <div className="commande-info-item">

                            <span>
                                Nom
                            </span>

                            <strong>

                                {commande.nom || "Non renseigné"}{" "}

                                {commande.prenom || ""}

                            </strong>

                        </div>


                        {/* TÉLÉPHONE */}

                        <div className="commande-info-item">

                            <span>
                                Téléphone
                            </span>

                            <strong>

                                {commande.telephone ||
                                    "Non renseigné"}

                            </strong>

                        </div>


                        {/* ADRESSE */}

                        <div className="commande-info-item">

                            <span>
                                Adresse
                            </span>

                            <strong>

                                {commande.adresse ||
                                    "Non renseignée"}

                            </strong>

                        </div>


                        {/* VILLE */}

                        <div className="commande-info-item">

                            <span>
                                Ville
                            </span>

                            <strong>

                                {commande.ville ||
                                    "Non renseignée"}

                            </strong>

                        </div>


                        {/* CODE POSTAL */}

                        <div className="commande-info-item">

                            <span>
                                Code postal
                            </span>

                            <strong>

                                {commande.codePostal ||
                                    "Non renseigné"}

                            </strong>

                        </div>


                    </div>

                </div>


                {/* ========================================
                    PRODUITS COMMANDÉS
                ======================================== */}

                <div className="commande-card">

                    <div className="commande-products-header">

                        <h2>
                            Produits commandés
                        </h2>


                        <span>

                            {commande.items?.length || 0}{" "}

                            {commande.items?.length > 1
                                ? "articles"
                                : "article"}

                        </span>

                    </div>


                    <div className="commande-products">


                        {commande.items?.map((item) => (

                            <div
                                className="commande-product"
                                key={item.id}
                            >


                                {/* ========================================
                                    IMAGE
                                ======================================== */}

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

                                        <div className="no-image">

                                            🛞

                                        </div>

                                    )}

                                </div>


                                {/* ========================================
                                    INFORMATIONS
                                ======================================== */}

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


                                    <p>

                                        {item.pneu?.dimension ||
                                            "Dimension non renseignée"}

                                    </p>


                                    <p>

                                        Saison :{" "}

                                        {item.pneu?.saison ||
                                            "Non renseignée"}

                                    </p>


                                    <p>

                                        Quantité :{" "}

                                        <strong>
                                            {item.quantite}
                                        </strong>

                                    </p>


                                </div>


                                {/* ========================================
                                    PRIX
                                ======================================== */}

                                <div className="commande-product-price">


                                    <span>

                                        {Number(
                                            item.prix
                                        ).toFixed(2)}{" "}
                                        DT / unité

                                    </span>


                                    <strong>

                                        {(
                                            Number(item.prix) *
                                            Number(item.quantite)
                                        ).toFixed(2)}{" "}
                                        DT

                                    </strong>


                                </div>


                            </div>

                        ))}


                    </div>

                </div>


                {/* ========================================
                    TOTAL
                ======================================== */}

                <div className="commande-total-box">

                    <span>
                        Total de la commande
                    </span>


                    <strong>

                        {Number(
                            commande.total
                        ).toFixed(2)}{" "}
                        DT

                    </strong>

                </div>


                {/* ========================================
                    RETOUR
                ======================================== */}

                <button
                    type="button"
                    className="back-button"
                    onClick={() =>
                        navigate("/mes-commandes")
                    }
                >

                    ← Retour à mes commandes

                </button>


            </div>

        </div>

    );

}


export default CommandeDetailss;