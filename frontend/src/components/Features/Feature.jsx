import "./Feature.css";
import { FaTruck, FaShieldAlt, FaCar, FaTools } from "react-icons/fa";

function Features() {
  const features = [
    {
      icon: <FaCar />,
      title: "Large choix de pneus",
      description:
        "Une gamme complète de pneus adaptée à tous les types de véhicules."
    },
    {
      icon: <FaShieldAlt />,
      title: "Produits de qualité",
      description:
        "Des pneus provenant de marques reconnues et fiables."
    },
    {
      icon: <FaTruck />,
      title: "Livraison rapide",
      description:
        "Recevez vos commandes rapidement et en toute sécurité."
    },
    {
      icon: <FaTools />,
      title: "Service professionnel",
      description:
        "Un accompagnement et des conseils pour choisir vos pneus."
    }
  ];

  return (
    <section className="features">

      <h2>Pourquoi choisir Landolsi Motors ?</h2>

      <div className="features-container">

        {features.map((feature, index) => (
          <div className="feature-card" key={index}>

            <div className="feature-icon">
              {feature.icon}
            </div>

            <h3>{feature.title}</h3>

            <p>
              {feature.description}
            </p>

          </div>
        ))}

      </div>

    </section>
  );
}

export default Features;