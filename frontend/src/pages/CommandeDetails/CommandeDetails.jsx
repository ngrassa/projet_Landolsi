
import "./CommandeDetails.css";

import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

import {
    FaCheckCircle,
    FaMapMarkerAlt,
    FaPhone,
    FaBoxOpen,
    FaArrowLeft,
    FaShoppingBag
} from "react-icons/fa";

import {
    getCommandeById,
    downloadFacturePDF
} from "../../services/commandeApi";

import { getAvisByCommande } from "../../services/avisApi";

import AvisForm from "../../components/Avis/AvisForm";
import { API_URL } from "../../config";


function CommandeDetails() {

    const { id } = useParams();

    const [commande, setCommande] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    //const [avis, setAvis] = useState(null);
     const [avisParPneu, setAvisParPneu] = useState({});

    // ========================================
    // TÉLÉCHARGER LA FACTURE PDF
    // ========================================

    const handleDownloadFacture = async () => {

        try {

            await downloadFacturePDF(commande.id);

        } catch (error) {

            console.error(
                "Erreur téléchargement facture :",
                error
            );

            alert(
                error.response?.data?.message ||
                "Impossible de télécharger la facture."
            );

        }

    };


    // ========================================
    // RÉCUPÉRER LA COMMANDE
    // ========================================

    useEffect(() => {

        const fetchCommande = async () => {

            try {

                const response =
                    await getCommandeById(id);

                if (response.data.success) {

                    setCommande(
                        response.data.commande
                    );

                }

            } catch (error) {

                console.error(
                    "Erreur récupération commande :",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Impossible de récupérer la commande."
                );

            } finally {

                setLoading(false);

            }

        };

        fetchCommande();

    }, [id]);


    // ========================================
    // RÉCUPÉRER L'AVIS EXISTANT
    // ========================================

    useEffect(() => {

        const fetchAvis = async () => {

            // Attendre que la commande soit chargée
            if (!commande) {
                return;
            }

            // Vérifier si le statut permet de laisser un avis
            const statutAutorise =
                commande.statut === "confirmée" ||
                commande.statut === "expédiée" ||
                commande.statut === "livrée";

            // Si le statut ne permet pas encore de laisser un avis
            if (!statutAutorise) {
                return;
            }

            try {

                const response =
                    await getAvisByCommande(
                        commande.id
                    );

                // Si un avis existe déjà
                if (
                    response.success &&
                    response.existe
                ) {

                    setAvis(
                        response.avis
                    );

                }

            } catch (error) {

                console.error(
                    "Erreur récupération avis :",
                    error
                );

            }

        };

        fetchAvis();

    }, [commande]);


    // ========================================
    // CHARGEMENT
    // ========================================

    if (loading) {

        return (

            <div className="commande-page">

                <div className="commande-loading">

                    <div className="commande-loader"></div>

                    <p>
                        Chargement de votre commande...
                    </p>

                </div>

            </div>

        );

    }


    // ========================================
    // ERREUR
    // ========================================

    if (error || !commande) {

        return (

            <div className="commande-page">

                <div className="commande-error">

                    <h2>
                        Commande introuvable
                    </h2>

                    <p>
                        {error}
                    </p>

                    <Link
                        to="/pneus"
                        className="commande-back-btn"
                    >

                        <FaArrowLeft />

                        Retour aux pneus

                    </Link>

                </div>

            </div>

        );

    }


    // ========================================
    // AVIS AUTORISÉ ?
    // ========================================

    const avisAutorise =
        commande.statut === "confirmée" ||
        commande.statut === "expédiée" ||
        commande.statut === "livrée";


    // ========================================
    // AFFICHAGE
    // ========================================

    return (

        <div className="commande-page">

            <div className="commande-container">


                {/* ========================================
                    BREADCRUMB
                ======================================== */}

                <div className="commande-breadcrumb">

                    <Link to="/">
                        Accueil
                    </Link>

                    <span> / </span>

                    <Link to="/panier">
                        Panier
                    </Link>

                    <span> / </span>

                    <strong>
                        Commande #{commande.id}
                    </strong>

                </div>


                {/* ========================================
                    HEADER SUCCÈS
                ======================================== */}

                <div className="commande-success-card">

                    <div className="commande-success-icon">

                        <FaCheckCircle />

                    </div>


                    <div className="commande-success-text">

                        <h1>
                            Commande confirmée
                        </h1>

                        <p>

                            Merci pour votre commande,

                            <strong>
                                {" "}
                                {commande.prenom}
                            </strong>.

                        </p>

                        <span>
                            Votre commande a bien été enregistrée.
                        </span>

                    </div>


                    <div className="commande-number">

                        <span>
                            N° commande
                        </span>

                        <strong>
                            #{commande.id}
                        </strong>

                    </div>

                </div>


                {/* ========================================
                    STATUT
                ======================================== */}

                <div className="commande-status-card">

                    <div>

                        <span className="status-label">
                            Statut de la commande
                        </span>

                        <strong className="status-value">
                            {commande.statut}
                        </strong>

                    </div>


                    <div className="status-step">

                        <div className="status-circle active">
                            ✓
                        </div>

                        <span>
                            Commande reçue
                        </span>

                    </div>


                    <div className="status-line"></div>


                    <div className="status-step">

                        <div className="status-circle">
                            2
                        </div>

                        <span>
                            Préparation
                        </span>

                    </div>


                    <div className="status-line"></div>


                    <div className="status-step">

                        <div className="status-circle">
                            3
                        </div>

                        <span>
                            Récupération
                        </span>

                    </div>

                </div>


                {/* ========================================
                    CONTENU PRINCIPAL
                ======================================== */}

                <div className="commande-grid">


                    {/* ========================================
                        COLONNE GAUCHE
                    ======================================== */}

                    <div className="commande-main">


                        {/* ========================================
                            ARTICLES
                        ======================================== */}

                        <div className="commande-card">

                            <div className="commande-card-header">

                                <div>

                                    <FaShoppingBag />

                                    <h2>
                                        Articles commandés
                                    </h2>

                                </div>

                                <span>

                                    {commande.items.length} article
                                    {commande.items.length > 1
                                        ? "s"
                                        : ""}

                                </span>

                            </div>


                            <div className="commande-items">

                                {commande.items.map((item) => (

                                    <div
                                        className="commande-item"
                                        key={item.id}
                                    >


                                        {/* IMAGE */}

                                        <div className="commande-item-image">

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


                                        {/* INFOS */}

                                        <div className="commande-item-info">

                                            <h3>
                                                {item.pneu?.modele ||
                                                    "Pneu"}
                                            </h3>


                                            {item.pneu?.marque?.nom && (

                                                <span className="commande-marque">

                                                    {item.pneu.marque.nom}

                                                </span>

                                            )}


                                            <p>

                                                {item.pneu?.dimension ||
                                                    "Dimension non renseignée"}

                                            </p>


                                            <span>

                                                Saison :{" "}

                                                {item.pneu?.saison ||
                                                    "Non renseignée"}

                                            </span>


                                            <span>

                                                Quantité :{" "}

                                                {item.quantite}

                                            </span>

                                        </div>


                                        {/* PRIX */}

                                        <div className="commande-item-price">

                                            {Number(
                                                item.pourcentagePromotion
                                            ) > 0 ? (

                                                <>

                                                    <span className="commande-original-price">

                                                        {Number(
                                                            item.prixOriginal
                                                        ).toFixed(2)}{" "}
                                                        DT / unité

                                                    </span>


                                                    <span className="commande-promotion">

                                                        -
                                                        {Number(
                                                            item.pourcentagePromotion
                                                        )}{" "}
                                                        %

                                                    </span>


                                                    <strong className="commande-promo-price">

                                                        {Number(
                                                            item.prix
                                                        ).toFixed(2)}{" "}
                                                        DT / unité

                                                    </strong>

                                                </>

                                            ) : (

                                                <span className="commande-normal-price">

                                                    {Number(
                                                        item.prix
                                                    ).toFixed(2)}{" "}
                                                    DT / unité

                                                </span>

                                            )}


                                            <strong className="commande-item-total">

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
                            INFORMATIONS CLIENT
                        ======================================== */}

                        <div className="commande-card">

                            <div className="commande-card-header">

                                <div>

                                    <FaMapMarkerAlt />

                                    <h2>
                                        Informations de récupération
                                    </h2>

                                </div>

                            </div>


                            <div className="livraison-content">

                                <div className="livraison-icon">

                                    <FaMapMarkerAlt />

                                </div>


                                <div>

                                    <strong>

                                        {commande.prenom}{" "}
                                        {commande.nom}

                                    </strong>


                                    <p>
                                        {commande.adresse}
                                    </p>


                                    <p>

                                        {commande.codePostal}{" "}
                                        {commande.ville}

                                    </p>


                                    <p className="telephone">

                                        <FaPhone />

                                        {commande.telephone}

                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* ========================================
                            AVIS CLIENT
                        ======================================== */}

{/* AVIS CLIENT PAR PNEU */}
{avisAutorise && (
    <div className="commande-card">
        <h2>Donnez votre avis sur vos pneus</h2>

        {commande.items?.map((item) => {
            const pneuId = item.pneuId ?? item.pneu?.id;

            if (!pneuId) return null;

            return (
                <div key={item.id} className="avis-pneu-item">
                    <h3>
                        {item.pneu?.marque?.nom}{" "}
                        {item.pneu?.modele}
                    </h3>

                    {avisParPneu[pneuId] ? (
                        <p>
                            ⭐ Merci ! Votre avis pour ce pneu
                            a bien été enregistré.
                        </p>
                    ) : (
                        <AvisForm
                            key={`${commande.id}-${pneuId}`}
                            commandeId={commande.id}
                            pneuId={pneuId}
                            onAvisAjoute={(nouvelAvis) => {
                                setAvisParPneu((anciensAvis) => ({
                                    ...anciensAvis,
                                    [pneuId]: nouvelAvis
                                }));
                            }}
                        />
                    )}
                </div>
            );
        })}
    </div>
)}

                    </div>


                    {/* ========================================
                        COLONNE DROITE
                    ======================================== */}

                    <aside className="commande-sidebar">


                        {/* ========================================
                            RÉSUMÉ
                        ======================================== */}

                        <div className="commande-summary-card">

                            <div className="summary-header">

                                <FaBoxOpen />

                                <h2>
                                    Résumé
                                </h2>

                            </div>


                            <div className="summary-line">

                                <span>
                                    Sous-total
                                </span>

                                <strong>

                                    {Number(
                                        commande.total
                                    ).toFixed(2)}{" "}
                                    DT

                                </strong>

                            </div>


                            <div className="summary-line">

                                <span>
                                    Récupération
                                </span>

                                <span className="summary-gray">
                                    Sur place
                                </span>

                            </div>


                            <div className="summary-separator"></div>


                            <div className="summary-total">

                                <span>
                                    Total
                                </span>

                                <strong>

                                    {Number(
                                        commande.total
                                    ).toFixed(2)}{" "}
                                    DT

                                </strong>

                            </div>


                            <div className="summary-payment">

                                Paiement lors de la récupération

                            </div>

                        </div>


                        {/* ========================================
                            FACTURE
                        ======================================== */}

                        {commande.statut === "confirmée" && (

                            <button
                                type="button"
                                className="commande-facture-btn"
                                onClick={handleDownloadFacture}
                            >

                                📄 Télécharger la facture PDF

                            </button>

                        )}


                        {/* ========================================
                            ACTIONS
                        ======================================== */}

                        <Link
                            to="/pneus"
                            className="commande-shopping-btn"
                        >

                            <FaShoppingBag />

                            Continuer mes achats

                        </Link>


                        <Link
                            to="/"
                            className="commande-home-btn"
                        >

                            Retour à l'accueil

                        </Link>

                    </aside>

                </div>

            </div>

        </div>

    );

}


export default CommandeDetails;

