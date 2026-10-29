
import "./PneuCard.css";

import { Link } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { API_URL } from "../../config";

function PneuCard({ pneu }) {

    const { addToCart } = useCart();


    // ==============================
    // Vérifier le stock
    // ==============================

    const stockDisponible = Number(pneu.stock) > 0;


    // ==============================
    // Ajouter au panier
    // ==============================

    const handleAddToCart = () => {

        if (!stockDisponible) {
            return;
        }

        addToCart(pneu);

    };


    return (

        <div className="pneu-card">


            {/* ==============================
                IMAGE
            ============================== */}

            <div className="pneu-image">

                <img
                    src={`${API_URL}/uploadPneu/${pneu.image}`}
                    alt={pneu.modele}
                />

            </div>


            {/* ==============================
                CONTENU
            ============================== */}

            <div className="pneu-content">


                <h3>
                    {pneu.modele}
                </h3>


                <p>
                    Dimension : {pneu.dimension}
                </p>


                <p>
                    Saison : {pneu.saison}
                </p>


                <p className="price">
                    {pneu.prix} DT
                </p>


                {/* ==============================
                    STOCK
                ============================== */}

                <p
                    className={
                        stockDisponible
                            ? "stock available"
                            : "stock unavailable"
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

                <div className="pneu-buttons">


                    <Link
                        className="details-btn"
                        to={`/pneu/${pneu.id}`}
                    >
                        Voir plus
                    </Link>


                    <button
                        type="button"
                        className="cart-btn"
                        onClick={handleAddToCart}
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

}

export default PneuCard;
