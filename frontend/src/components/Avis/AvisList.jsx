
import { useEffect, useState, useRef } from "react";
import {
  FaStar,
  FaRegStar,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import { getAllAvis } from "../../services/avisApi";
import "./AvisList.css";

function AvisList() {
  const [avis, setAvis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const carouselRef = useRef(null);

  useEffect(() => {
    const fetchAvis = async () => {
      try {
        const data = await getAllAvis();

        if (data.success) {
          setAvis(data.avis || []);
        } else {
          setErreur("Impossible de récupérer les avis.");
        }
      } catch (error) {
        console.error("Erreur récupération des avis :", error);
        setErreur("Impossible de charger les avis.");
      } finally {
        setLoading(false);
      }
    };

    fetchAvis();
  }, []);

  const faireDefiler = (direction) => {
    if (carouselRef.current) {
      const carte = carouselRef.current.querySelector(".avis-card");
      const largeur = carte ? carte.offsetWidth + 20 : 350;

      carouselRef.current.scrollBy({
        left: direction * largeur,
        behavior: "smooth",
      });
    }
  };

  const moyenne = avis.length
    ? avis.reduce((total, item) => total + Number(item.note), 0) /
      avis.length
    : 0;

  if (loading) {
    return <p className="avis-loading">Chargement des avis...</p>;
  }

  if (erreur) {
    return <p className="avis-error">{erreur}</p>;
  }

  return (
    <section className="avis-list">
      <h2>Avis de nos clients</h2>

      {avis.length > 0 ? (
        <>
          <div className="avis-resume">
            <strong>{moyenne.toFixed(1)}/5</strong>

            <div className="avis-etoiles">
              {[1, 2, 3, 4, 5].map((star) =>
                star <= Math.round(moyenne) ? (
                  <FaStar key={star} />
                ) : (
                  <FaRegStar key={star} />
                )
              )}
            </div>

            <p>
              Basé sur {avis.length} avis client
              {avis.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="avis-carousel" ref={carouselRef}>
            {avis.map((item) => (
              <article className="avis-card" key={item.id}>
                <div className="avis-note">
                  <div className="avis-card-stars">
                    {[1, 2, 3, 4, 5].map((star) =>
                      star <= Number(item.note) ? (
                        <FaStar key={star} />
                      ) : (
                        <FaRegStar key={star} />
                      )
                    )}
                  </div>

                  <strong>{Number(item.note)}/5</strong>
                </div>

                <p className="avis-card-commentaire">
                  {item.commentaire || "Aucun commentaire."}
                </p>

                <div className="avis-client">
                  <strong>
                    {item.user
                      ? `${item.user.prenom || ""} ${item.user.nom || ""}`.trim()
                      : "Client"}
                  </strong>

                  <span>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : ""}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="avis-footer">
            <p>Découvrez les avis de nos clients</p>

            <div className="avis-navigation">
              <button
                type="button"
                onClick={() => faireDefiler(-1)}
                aria-label="Avis précédents"
              >
                <FaChevronLeft />
              </button>

              <button
                type="button"
                onClick={() => faireDefiler(1)}
                aria-label="Avis suivants"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="avis-empty">
          Aucun avis pour le moment. Soyez le premier à partager votre
          expérience !
        </p>
      )}
    </section>
  );
}

export default AvisList;
