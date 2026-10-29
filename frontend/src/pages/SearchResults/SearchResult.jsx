
import "./SearchResult.css";

import {
    useSearchParams
} from "react-router-dom";

import {
    useState,
    useEffect
} from "react";

import {
    searchPneusByDimension
} from "../../services/pneuApi";

import PneuCard from "../../components/pneus/PneuCard";


function SearchResults() {

    // ==============================
    // Récupérer les paramètres URL
    // ==============================

    const [searchParams] = useSearchParams();

    const largeur = searchParams.get("largeur");
    const hauteur = searchParams.get("hauteur");
    const diametre = searchParams.get("diametre");


    // ==============================
    // États
    // ==============================

    const [pneus, setPneus] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ==============================
    // Rechercher les pneus
    // ==============================

    useEffect(() => {

        const loadPneus = async () => {

            try {

                setLoading(true);

                setError("");


                const response =
                    await searchPneusByDimension(
                        largeur,
                        hauteur,
                        diametre
                    );


                console.log(
                    "Pneus trouvés :",
                    response.data
                );


                setPneus(
                    response.data.pneus || []
                );


            } catch (error) {

                console.error(
                    "Erreur recherche pneus :",
                    error
                );


                setError(
                    "Impossible de récupérer les pneus."
                );


                setPneus([]);

            } finally {

                setLoading(false);

            }

        };


        // ==============================
        // Vérifier les paramètres
        // ==============================

        if (
            largeur ||
            hauteur ||
            diametre
        ) {

            loadPneus();

        } else {

            setLoading(false);

            setError(
                "Aucune dimension sélectionnée."
            );

        }

    }, [
        largeur,
        hauteur,
        diametre
    ]);


    // ==============================
    // Affichage
    // ==============================

    return (

        <div className="search-results-page">

            <div className="container">


                {/* ==============================
                    Titre
                ============================== */}

                <h1>
                    Résultats de recherche
                </h1>


                {/* ==============================
                    Dimension recherchée
                ============================== */}

                <p>
                    Dimensions recherchées :
                </p>


                <h3>
                    {largeur || "—"}
                    {" / "}
                    {hauteur || "—"}
                    {" R"}
                    {diametre || "—"}
                </h3>


                {/* ==============================
                    Chargement
                ============================== */}

                {loading && (

                    <p>
                        Recherche des pneus...
                    </p>

                )}


                {/* ==============================
                    Erreur
                ============================== */}

                {!loading && error && (

                    <p>
                        {error}
                    </p>

                )}


                {/* ==============================
                    Résultats
                ============================== */}

                {!loading && !error && (

                    <div className="search-results-content">


                        {/* Nombre de résultats */}

                        <div className="search-results-count">

                            <p>

                                {pneus.length}{" "}

                                pneu
                                {pneus.length > 1
                                    ? "s"
                                    : ""
                                }{" "}

                                trouvé
                                {pneus.length > 1
                                    ? "s"
                                    : ""
                                }

                            </p>

                        </div>


                        {/* ==============================
                            Aucun résultat
                        ============================== */}

                        {pneus.length === 0 ? (

                            <div className="no-results">

                                <p>
                                    Aucun pneu ne correspond
                                    à cette recherche.
                                </p>

                            </div>

                        ) : (


                            /* ==============================
                               Cartes des pneus
                            ============================== */

                            <div className="pneus-grid">

                                {pneus.map((pneu) => (

                                    <PneuCard
                                        key={pneu.id}
                                        pneu={pneu}
                                    />

                                ))}

                            </div>

                        )}

                    </div>

                )}

            </div>

        </div>

    );

}


export default SearchResults;

