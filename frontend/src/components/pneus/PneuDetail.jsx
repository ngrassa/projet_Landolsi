
import "./PneuDetail.css";

import { useState } from "react";
import { useCart } from "../../context/CartContext";
import AvisPneu from "../Avis/AvisPneu";
import { API_URL } from "../../config";

function PneuDetail({ pneu }) {
    const { addToCart } = useCart();

    // QUANTITÉ
    const [quantity, setQuantity] = useState(1);

    // VÉRIFIER LE STOCK
    const stockDisponible = Number(pneu.stock) > 0;

    // AUGMENTER LA QUANTITÉ
    const increaseQuantity = () => {
        setQuantity((ancienneQuantite) => {
            if (ancienneQuantite >= Number(pneu.stock)) {
                return ancienneQuantite;
            }

            return ancienneQuantite + 1;
        });
    };

    // DIMINUER LA QUANTITÉ
    const decreaseQuantity = () => {
        setQuantity((ancienneQuantite) => {
            if (ancienneQuantite <= 1) {
                return 1;
            }

            return ancienneQuantite - 1;
        });
    };

    // AJOUTER AU PANIER
    const handleAddToCart = () => {
        if (!stockDisponible) {
            console.log("Pneu en rupture de stock");
            return;
        }

        addToCart(pneu, quantity);
        console.log("Pneu ajouté au panier");
    };

    return (
        <main className="pneu-detail-page">
            <div className="pneu-detail-container">

                {/* IMAGE */}
                <div className="pneu-detail-image-box">
                    <div className="pneu-image-wrapper">
                        <img
                            src={`${API_URL}/uploadPneu/${pneu.image}`}
                            alt={pneu.modele}
                        />
                    </div>
                </div>

                {/* INFORMATIONS */}
                <div className="pneu-detail-info">

                    {/* MARQUE */}
                    <div className="brand-info">
                        <div className="brand-logo">
                            {pneu.marque?.logo && (
                                <img
                                    src={`${API_URL}/images/${pneu.marque.logo}`}
                                    alt={pneu.marque.nom}
                                />
                            )}
                        </div>

                        <div>
                            <span className="brand-label">MARQUE</span>
                            <h2>
                                {pneu.marque?.nom || "Marque inconnue"}
                            </h2>
                        </div>
                    </div>

                    {/* MODÈLE */}
                    <h1 className="pneu-title">{pneu.modele}</h1>

                    {/* DIMENSION */}
                    <div className="dimension">
                        <span>Dimension</span>
                        <strong>{pneu.dimension}</strong>
                    </div>

                    {/* PRIX ET STOCK */}
                    <div className="price-stock">
                        <div>
                            <span className="price-label">Prix</span>
                            <span className="price">{pneu.prix} DT</span>
                        </div>

                        <div className="stock">
                            <span className="stock-dot"></span>
                            {stockDisponible
                                ? `En stock (${pneu.stock})`
                                : "Rupture de stock"}
                        </div>
                    </div>

                    <div className="detail-separator"></div>

                    {/* CARACTÉRISTIQUES */}
                    <div className="specifications">
                        <h3>Caractéristiques</h3>

                        <div className="spec-grid">
                            <div className="spec-item">
                                <span>Largeur</span>
                                <strong>{pneu.largeur || "-"} mm</strong>
                            </div>

                            <div className="spec-item">
                                <span>Hauteur</span>
                                <strong>{pneu.hauteur || "-"}</strong>
                            </div>

                            <div className="spec-item">
                                <span>Diamètre</span>
                                <strong>R{pneu.diametre || "-"}</strong>
                            </div>

                            <div className="spec-item">
                                <span>Saison</span>
                                <strong>{pneu.saison || "-"}</strong>
                            </div>
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="description">
                        <h3>Description</h3>
                        <p>
                            {pneu.description ||
                                "Aucune description disponible."}
                        </p>
                    </div>

                    {/* ACTIONS DU PANIER */}
                    <div className="detail-actions">
                        <div className="quantity">
                            <button
                                type="button"
                                onClick={decreaseQuantity}
                                disabled={!stockDisponible || quantity <= 1}
                            >
                                −
                            </button>

                            <span>{quantity}</span>

                            <button
                                type="button"
                                onClick={increaseQuantity}
                                disabled={
                                    !stockDisponible ||
                                    quantity >= Number(pneu.stock)
                                }
                            >
                                +
                            </button>
                        </div>

                        <button
                            type="button"
                            className="add-cart-btn"
                            onClick={handleAddToCart}
                            disabled={!stockDisponible}
                        >
                            {stockDisponible
                                ? "Ajouter au panier"
                                : "Rupture de stock"}
                        </button>
                    </div>

                    {/* INFORMATION SUR LE STOCK */}
                    {stockDisponible && (
                        <p className="quantity-info">
                            Maximum disponible : {pneu.stock} pneu
                            {Number(pneu.stock) > 1 ? "s" : ""}
                        </p>
                    )}
                </div>
            </div>

            {/* AVIS DES CLIENTS POUR CE PNEU */}
            <AvisPneu pneuId={pneu.id} />
        </main>
    );
}

export default PneuDetail;