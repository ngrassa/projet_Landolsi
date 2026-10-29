
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllPneus } from "../../services/pneuApi";
import PneuCard from "./PneuCard";
import "./CataloguePneus.css";

function CataloguePneus() {
  const [pneus, setPneus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  const marqueId = searchParams.get("marqueId") || "";
  const dimension = searchParams.get("dimension") || "";
  const saison = searchParams.get("saison") || "";

  // Filtrer les pneus selon les critères de recherche
  const pneusFiltres = useMemo(() => {
    return pneus.filter((pneu) => {
      const correspondMarque =
        !marqueId || String(pneu.marqueId) === marqueId;

      const correspondDimension =
        !dimension || pneu.dimension === dimension;

      const correspondSaison =
        !saison || pneu.saison === saison;

      return (
        correspondMarque &&
        correspondDimension &&
        correspondSaison
      );
    });
  }, [pneus, marqueId, dimension, saison]);

  // Réinitialiser les filtres
  const reinitialiserFiltres = () => {
    setSearchParams({});
  };

  // Charger les pneus depuis le backend
  useEffect(() => {
    const loadPneus = async () => {
      try {
        const response = await getAllPneus();

        console.log(response.data);

        setPneus(response.data.pneus || []);
      } catch (error) {
        console.error("Erreur lors du chargement des pneus :", error);
        setError("Erreur lors du chargement des pneus.");
      } finally {
        setLoading(false);
      }
    };

    loadPneus();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        Chargement des pneus...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        {error}
      </div>
    );
  }

  return (
    <section className="catalogue-section">
      <div className="catalogue-header">
        <h1>Catalogue Pneus</h1>

        <p>
          Découvrez nos pneus automobiles adaptés à tous vos besoins.
        </p>

        {(marqueId || dimension || saison) && (
          <button
            type="button"
            onClick={reinitialiserFiltres}
            className="btn-reset-filtres"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <div className="pneus-grid">
        {pneusFiltres.length > 0 ? (
          pneusFiltres.map((pneu) => (
            <PneuCard
              key={pneu.id}
              pneu={pneu}
            />
          ))
        ) : (
          <p className="aucun-pneu">
            Aucun pneu ne correspond à votre recherche.
          </p>
        )}
      </div>
    </section>
  );
}

export default CataloguePneus;
