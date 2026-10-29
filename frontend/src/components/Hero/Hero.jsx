
import "./Hero.css";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  const voirMarques = () => {
    document.getElementById("nos-marques")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <h1>
          Des pneus de qualité
          <span> pour votre véhicule</span>
        </h1>

        <p>
          Découvrez notre large gamme de pneus automobiles
          des meilleures marques au meilleur prix.
        </p>

        <div className="hero-buttons">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate("/pneus")}
          >
            Acheter maintenant
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={voirMarques}
          >
            Voir les marques
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
