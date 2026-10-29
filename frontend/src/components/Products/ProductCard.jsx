
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { API_URL } from "../../config";

function ProductCard({ product }) {
  const navigate = useNavigate();

  const imageUrl = product.image
    ? `${API_URL}/uploadPneu/${product.image}`
    : null;

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/pneu/${product.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          navigate(`/pneu/${product.id}`);
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Voir ${product.modele}`}
    >
      <div className="product-image-container">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${product.marque?.nom || ""} ${product.modele}`}
            className="product-image"
            loading="lazy"
          />
        ) : (
          <div className="product-no-image">
            Image non disponible
          </div>
        )}

        <span className="product-season">
          {product.saison}
        </span>
      </div>

      <div className="product-info">
        <p className="product-brand">
          {product.marque?.nom || "Marque"}
        </p>

        <h3>{product.modele}</h3>

        <p className="product-dimension">
          <span>Dimension</span>
          <strong>{product.dimension}</strong>
        </p>

        <div className="product-card-footer">
          <div>
            <span className="product-price-label">Prix</span>
            <h4>{Number(product.prix).toFixed(2)} DT</h4>
          </div>

          <span className="product-arrow" aria-hidden="true">
            <FaArrowRight />
          </span>
        </div>

        <p
          className={`product-stock ${
            product.stock > 0 ? "in-stock" : "out-stock"
          }`}
        >
          <span className="stock-dot" />
          {product.stock > 0
            ? "Disponible"
            : "Rupture de stock"}
        </p>
      </div>
    </div>
  );
}

export default ProductCard;
