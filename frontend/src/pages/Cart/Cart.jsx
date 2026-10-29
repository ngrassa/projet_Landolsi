import "./Cart.css";

import { Link, useNavigate } from "react-router-dom";

import {
    FaTrash,
    FaMinus,
    FaPlus,
    FaShoppingCart
} from "react-icons/fa";

import { useCart } from "../../context/CartContext";

import { useState } from "react";
import { API_URL } from "../../config";

function Cart() {

    const navigate = useNavigate();

    const {
        cartItems,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        cartTotal
    } = useCart();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ==============================
    // PASSER LA COMMANDE
    // ==============================

    const handleCommande = async () => {

        // Sécurité
        if (cartItems.length === 0) {

            setError("Votre panier est vide.");

            return;
        }

        setLoading(true);
        setError("");

        try {

            // ==============================
            // Préparer les articles
            // ==============================

            const items = cartItems.map((pneu) => ({

                pneuId: pneu.id,

                quantite: Number(pneu.quantity)

            }));


            console.log("Articles envoyés :", items);


            // ==============================
            // Envoyer au backend
            // ==============================

            const response = await fetch(
                `${API_URL}/commandes`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        items
                    })
                }
            );


            const data = await response.json();


            console.log(
                "Réponse commande :",
                data
            );


            // ==============================
            // Erreur backend
            // ==============================

            if (!response.ok) {

                // Utilisateur non connecté
                if (response.status === 401) {

                    setError(
                        "Vous devez être connecté pour passer une commande."
                    );

                    setTimeout(() => {

                        navigate("/login");

                    }, 1500);

                    return;
                }


                setError(
                    data.message ||
                    "Impossible de créer la commande."
                );

                return;
            }


            // ==============================
            // COMMANDE CRÉÉE
            // ==============================

            if (data.success) {

                console.log(
                    "Commande créée :",
                    data.commande
                );


                // ==============================
                // Vider le panier
                // ==============================

                clearCart();


                // ==============================
                // Redirection
                // ==============================

                navigate(
                    `/commande/${data.commande.id}`
                );

            }

        } catch (error) {

            console.error(
                "Erreur commande :",
                error
            );

            setError(
                "Une erreur est survenue. Vérifiez votre connexion au serveur."
            );

        } finally {

            setLoading(false);

        }

    };


    // ==============================
    // PANIER VIDE
    // ==============================

    if (cartItems.length === 0) {

        return (

            <div className="cart-page">

                <div className="cart-container">

                    <div className="cart-empty">

                        <FaShoppingCart
                            className="cart-empty-icon"
                        />

                        <h1>
                            Votre panier est vide
                        </h1>

                        <p>
                            Vous n'avez encore ajouté aucun pneu à votre panier.
                        </p>

                        <Link
                            to="/pneus"
                            className="cart-continue-btn"
                        >
                            Voir les pneus
                        </Link>

                    </div>

                </div>

            </div>

        );

    }


    // ==============================
    // PANIER
    // ==============================

    return (

        <div className="cart-page">

            <div className="cart-container">


                {/* ==============================
                    TITRE
                ============================== */}

                <div className="cart-header">

                    <h1>
                        Mon panier
                    </h1>

                    <span>
                        {cartItems.length} produit
                        {cartItems.length > 1 ? "s" : ""}
                    </span>

                </div>


                {/* ==============================
                    ERREUR
                ============================== */}

                {error && (

                    <div className="cart-error">

                        {error}

                    </div>

                )}


                <div className="cart-content">


                    {/* ==============================
                        PRODUITS
                    ============================== */}

                    <div className="cart-products">

                        {cartItems.map((pneu) => (

                            <div
                                className="cart-item"
                                key={pneu.id}
                            >


                                {/* IMAGE */}

                                <div className="cart-item-image">

                                    <img
                                        src={`${API_URL}/uploadPneu/${pneu.image}`}
                                        alt={pneu.modele}
                                    />

                                </div>


                                {/* INFORMATIONS */}

                                <div className="cart-item-info">

                                    <h2>
                                        {pneu.modele}
                                    </h2>

                                    <p>
                                        Dimension : {pneu.dimension}
                                    </p>

                                    <p>
                                        Saison : {pneu.saison}
                                    </p>

                                    <p className="cart-item-price">

                                        {pneu.prix} DT

                                    </p>

                                </div>


                                {/* QUANTITÉ */}

                                <div className="cart-quantity">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            decreaseQuantity(pneu.id)
                                        }
                                    >

                                        <FaMinus />

                                    </button>


                                    <span>
                                        {pneu.quantity}
                                    </span>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            increaseQuantity(pneu.id)
                                        }
                                    >

                                        <FaPlus />

                                    </button>

                                </div>


                                {/* SOUS TOTAL */}

                                <div className="cart-item-subtotal">

                                    <strong>

                                        {(
                                            Number(pneu.prix) *
                                            Number(pneu.quantity)
                                        ).toFixed(2)} DT

                                    </strong>

                                </div>


                                {/* SUPPRIMER */}

                                <button
                                    type="button"
                                    className="cart-remove"
                                    onClick={() =>
                                        removeFromCart(pneu.id)
                                    }
                                    aria-label="Supprimer"
                                >

                                    <FaTrash />

                                </button>

                            </div>

                        ))}


                        {/* ==============================
                            VIDER
                        ============================== */}

                        <button
                            type="button"
                            className="cart-clear-btn"
                            onClick={clearCart}
                        >

                            <FaTrash />

                            Vider le panier

                        </button>

                    </div>


                    {/* ==============================
                        RÉSUMÉ
                    ============================== */}

                    <div className="cart-summary">

                        <h2>
                            Résumé de la commande
                        </h2>


                        <div className="cart-summary-line">

                            <span>
                                Sous-total
                            </span>

                            <strong>
                                {cartTotal.toFixed(2)} DT
                            </strong>

                        </div>


                        <div className="cart-summary-line">

                            <span>
                                Livraison
                            </span>

                            <span>
                                À déterminer
                            </span>

                        </div>


                        <div className="cart-summary-total">

                            <span>
                                Total
                            </span>

                            <strong>
                                {cartTotal.toFixed(2)} DT
                            </strong>

                        </div>


                        {/* ==============================
                            PASSER COMMANDE
                        ============================== */}

                        <button
                            type="button"
                            className="cart-order-btn"
                            onClick={handleCommande}
                            disabled={loading}
                        >

                            {loading
                                ? "Création de la commande..."
                                : "Passer la commande"
                            }

                        </button>


                        <Link
                            to="/pneus"
                            className="cart-continue-link"
                        >

                            Continuer mes achats

                        </Link>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Cart;