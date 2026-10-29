
import "./SearchResultsSaison.css";

import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { searchPneusBySaison } from "../../services/pneuApi";

import PneuCard from "../../components/pneus/PneuCard";


function SearchResultsSaison() {

    const [searchParams] = useSearchParams();

    const saison = searchParams.get("saison");


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


                console.log(
                    "Saison recherchée :",
                    saison
                );


                const response =
                    await searchPneusBySaison(saison);


                console.log(
                    "Résultat recherche saison :",
                    response.data
                );


                setPneus(
                    response.data.pneus || []
                );


            } catch (error) {

                console.error(
                    "Erreur recherche saison :",
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


        if (saison) {

            loadPneus();

        } else {

            setLoading(false);

            setError(
                "Aucune saison sélectionnée."
            );

        }

    }, [saison]);


    // ==============================
    // Affichage
    // ==============================

    return (

        <div className="search-results-saison-page">

            <div className="container">


                {/* ==============================
                    TITRE
                ============================== */}

                <h1>
                    Résultats de recherche
                </h1>


                {/* ==============================
                    CHARGEMENT
                ============================== */}

                {loading && (

                    <div className="search-results-saison-message">

                        <p>
                            Recherche des pneus...
                        </p>

                    </div>

                )}


                {/* ==============================
                    ERREUR
                ============================== */}

                {!loading && error && (

                    <div className="search-results-saison-message">

                        <p>
                            {error}
                        </p>

                    </div>

                )}


                {/* ==============================
                    RÉSULTATS
                ============================== */}

                {!loading && !error && (

                    <>

                        <div className="search-results-saison-header">

                            <p>
                                Pneus :
                            </p>


                            <h2>
                                {saison}
                            </h2>


                            <p className="search-results-saison-count">

                                {pneus.length}{" "}

                                pneu
                                {pneus.length > 1
                                    ? "s"
                                    : ""
                                }

                                {" "}trouvé
                                {pneus.length > 1
                                    ? "s"
                                    : ""
                                }.

                            </p>

                        </div>


                        {/* ==============================
                            AUCUN RÉSULTAT
                        ============================== */}

                        {pneus.length === 0 && (

                            <div className="search-results-saison-no-results">

                                <p>
                                    Aucun pneu disponible pour cette saison.
                                </p>

                            </div>

                        )}


                        {/* ==============================
                            LISTE DES PNEUS
                        ============================== */}

                        {pneus.length > 0 && (

                            <div className="search-results-saison-grid">

                                {pneus.map((pneu) => (

                                    <PneuCard
                                        key={pneu.id}
                                        pneu={pneu}
                                    />

                                ))}

                            </div>

                        )}

                    </>

                )}

            </div>

        </div>

    );

}


export default SearchResultsSaison;

