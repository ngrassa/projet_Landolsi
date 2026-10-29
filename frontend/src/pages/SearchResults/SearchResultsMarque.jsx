
import "./SearchResultsMarque.css";

import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { searchPneusByMarque } from "../../services/marqueApi";

import PneuCard from "../../components/pneus/PneuCard";


function SearchResultsMarque() {

    // =================================
    // Récupérer marqueId depuis URL
    // =================================

    const [searchParams] = useSearchParams();

    const marqueId = searchParams.get("marqueId");


    // =================================
    // États
    // =================================

    const [marque, setMarque] = useState(null);

    const [pneus, setPneus] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // =================================
    // Rechercher les pneus
    // =================================

    useEffect(() => {

        const loadPneus = async () => {

            try {

                setLoading(true);

                setError("");


                const response =
                    await searchPneusByMarque(marqueId);


                console.log(
                    "Résultat recherche marque :",
                    response.data
                );


                // Récupérer la marque

                setMarque(
                    response.data.marque
                );


                // Récupérer les pneus

                setPneus(
                    response.data.pneus || []
                );


            } catch (error) {

                console.error(
                    "Erreur recherche marque :",
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


        // Vérifier qu'une marque existe

        if (marqueId) {

            loadPneus();

        } else {

            setLoading(false);

            setError(
                "Aucune marque sélectionnée."
            );

        }

    }, [marqueId]);


    // =================================
    // Affichage
    // =================================

    return (

        <div className="search-results-marque-page">

            <div className="container">


                {/* =================================
                    TITRE
                ================================= */}

                <h1>
                    Résultats de recherche
                </h1>


                {/* =================================
                    CHARGEMENT
                ================================= */}

                {loading && (

                    <div className="search-results-marque-message">

                        <p>
                            Recherche des pneus...
                        </p>

                    </div>

                )}


                {/* =================================
                    ERREUR
                ================================= */}

                {!loading && error && (

                    <div className="search-results-marque-message">

                        <p>
                            {error}
                        </p>

                    </div>

                )}


                {/* =================================
                    RÉSULTATS
                ================================= */}

                {!loading && !error && marque && (

                    <>

                        <p>
                            Pneus de la marque :
                        </p>


                        <h2>
                            {marque.nom}
                        </h2>


                        {/* =================================
                            COMPTEUR
                        ================================= */}

                        <div className="search-results-marque-count">

                            <p>

                                {pneus.length}

                                {" "}

                                pneu
                                {pneus.length > 1
                                    ? "s"
                                    : ""
                                }

                                {" "}

                                trouvé
                                {pneus.length > 1
                                    ? "s"
                                    : ""
                                }.

                            </p>

                        </div>


                        {/* =================================
                            AUCUN PNEU
                        ================================= */}

                        {pneus.length === 0 ? (

                            <div className="search-results-marque-no-results">

                                <p>
                                    Aucun pneu ne correspond
                                    à cette marque.
                                </p>

                            </div>

                        ) : (


                            /* =================================
                               GRILLE DES PNEUS
                            ================================= */

                            <div className="search-results-marque-grid">

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


export default SearchResultsMarque;

