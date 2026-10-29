import "./Footer.css";

import {
  Link,
  useNavigate,
  useLocation
} from "react-router-dom";

import {
  FaFacebookF,
  FaInstagram,
  FaPhone,
  FaEnvelope,
  FaLocationDot
} from "react-icons/fa6";

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation vers une section de la page d'accueil
  const goToSection = (sectionId) => {
    if (location.pathname !== "/") {
      navigate("/", {
        state: { scrollTo: sectionId }
      });
    } else {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth"
      });
    }
  };

  return (
    <footer className="footer" id="contact">
      <div className="footer-container">

        {/* Description entreprise */}
        <div className="footer-box">
          <h2>
            Landolsi <span>Tires</span>
          </h2>

          <p>
            Votre spécialiste de la vente de pneus automobiles en ligne.
            Découvrez une large gamme de pneus de grandes marques
            adaptés à votre véhicule.
          </p>
        </div>

        {/* Navigation */}
        <div className="footer-box">
          <h3>Navigation</h3>

          <ul>
           <li>
              <a
                href="/#acuille"
                onClick={(e) => {
                  e.preventDefault();
                  goToSection("acuille");
                }}
              >
                Acuille
              </a>
            </li>

            <li>
              <Link to="/pneus">Produits</Link>
            </li>

            <li>
              <a
                href="/#marques"
                onClick={(e) => {
                  e.preventDefault();
                  goToSection("marques");
                }}
              >
                Marques
              </a>
            </li>

            <li>
              <a
                href="/#avis"
                onClick={(e) => {
                  e.preventDefault();
                  goToSection("avis");
                }}
              >
                Avis
              </a>
            </li>

            <li>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  goToSection("contact");
                }}
              >
                Contact
              </a>
            </li>
          </ul>
        </div>

        {/* Marques pneus */}
        <div className="footer-box">
          <h3>Marques pneus</h3>

          <ul>
            <li>Michelin</li>
            <li>GoodYear</li>
            <li>Bridgestone</li>
            <li>Pirelli</li>
            <li>Dunlop</li>
            <li>Hankook</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-box">
          <h3>Contact</h3>

          <p>
            <FaPhone />
            <a href="tel:+216XXXXXXXX">
              +216 XX XXX XXX
            </a>
          </p>

          <p>
            <FaEnvelope />
            <a href="mailto:contact@landolsi.com">
              contact@landolsi.com
            </a>
          </p>

          
<p className="footer-address">
  <FaLocationDot />

  <span>Msaken</span>

  <a
    href="https://maps.app.goo.gl/zJo9s75YR1j2UPc86?g_st=ic"
    target="_blank"
    rel="noopener noreferrer"
    className="location-link"
  >
    Voir notre localisation
  </a>
</p>

          {/* Réseaux sociaux */}
          <div className="social-icons">
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>
          © 2026 Landolsi Tires - Tous droits réservés
        </p>

        <p>
          Mentions légales | Politique de confidentialité
        </p>
      </div>
    </footer>
  );
}

export default Footer;