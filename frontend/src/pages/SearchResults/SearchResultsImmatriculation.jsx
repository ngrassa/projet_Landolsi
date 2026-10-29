import "./SearchResultsImmatriculation.css";

import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { searchVehiculeByImmatriculation } from "../../services/pneuApi";

import PneuCard from "../../components/pneus/PneuCard";


function SearchResultsImmatriculation() {

    const [searchParams] = useSearchParams();

    const immatriculation = searchParams.get("immatriculation");

    const [vehicule, setVehicule] = useState(null);
    const [pneus, setPneus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
const nettoyerVariante = (variante) => {

    if (!variante) return "";

    // Exemple :
    // "III (JA) ( 03-2017 > )"
    // devient :
    // "III (JA)"

    const parties = variante.split(")");

    if (parties.length >= 2) {
        return parties[0] + ")";
    }

    return variante;
};


const nettoyerMoteur = (moteur) => {

    if (!moteur) return "";

    // Exemple :
    // "1.0 67ch ( 03-2017 > ---- )"
    // devient :
    // "1.0 67 ch"

    const moteurPropre = moteur.split("(")[0].trim();

    return moteurPropre.replace("ch", " ch");
};

    useEffect(() => {

        const loadResultats = async () => {

            try {

                setLoading(true);
                setError("");

                const response =
                    await searchVehiculeByImmatriculation(
                        immatriculation
                    );


                // TEST CONSOLE
                console.log(
                    "RÉPONSE COMPLÈTE :",
                    response.data
                );

                console.log(
                    "VÉHICULE :",
                    response.data.vehicule
                );

                console.log(
                    "PNEUS :",
                    response.data.pneus
                );


                // Véhicule
                setVehicule(
                    response.data.vehicule
                );


                // Pneus compatibles
                setPneus(
                    response.data.pneus || []
                );


            } catch (error) {

                console.error(
                    "Erreur recherche immatriculation :",
                    error
                );

                setError(
                    "Aucun véhicule trouvé avec cette immatriculation."
                );

                setVehicule(null);
                setPneus([]);

            } finally {

                setLoading(false);

            }

        };


        if (immatriculation) {

            loadResultats();

        } else {

            setLoading(false);

            setError(
                "Aucune immatriculation sélectionnée."
            );

        }

    }, [immatriculation]);


    return (

        <div className="search-results-immat-page">

            <div className="container">

                <h1>
                    Résultats de recherche
                </h1>


                {/* CHARGEMENT */}

                {loading && (

                    <div className="search-results-immat-message">

                        <p>
                            Recherche du véhicule...
                        </p>

                    </div>

                )}


                {/* ERREUR */}

                {!loading && error && (

                    <div className="search-results-immat-message">

                        <p>
                            {error}
                        </p>

                    </div>

                )}


                {/* RÉSULTATS */}

                {!loading && !error && vehicule && (

                    <>

                        {/* =========================
                            VÉHICULE
                        ========================= */}

                        <div className="vehicule-result-card">

                            <div className="vehicule-result-image">

                                <img
                                    src={vehicule.image}
                                    alt={vehicule.description}
                                />

                            </div>


                            <div className="vehicule-result-info">

                                <span className="vehicule-result-label">
                                    Votre véhicule
                                </span>


                                <h2>
                                    {vehicule.marque}{" "}
                                    {vehicule.modele}
                                </h2>


                                <p>
                                    <strong>
                                        Immatriculation :
                                    </strong>{" "}
                                    {vehicule.immatriculation}
                                </p>


                                <p>
                                    <strong>
                                        Année :
                                    </strong>{" "}
                                    {vehicule.annee}
                                </p>


                                <p>
                                    <strong>
                                        Carburant :
                                    </strong>{" "}
                                    {vehicule.carburant}
                                </p>


                                <p>
                                    <strong>
                                        Variante :
                                    </strong>{" "}
                                   {nettoyerVariante(vehicule.variante)}
                                </p>


                                <p>
                                    <strong>
                                        Moteur :
                                    </strong>{" "}
                                    {nettoyerMoteur(vehicule.moteur)}
                                </p>

                            </div>

                        </div>


                        {/* =========================
                            PNEUS COMPATIBLES
                        ========================= */}

                        <div className="pneus-result-section">

                            <h2>
                                Pneus compatibles
                            </h2>


                            <div className="search-results-immat-count">

                                {pneus.length} pneu
                                {pneus.length > 1 ? "s" : ""}
                                {" trouvé"}
                                {pneus.length > 1 ? "s" : ""}

                            </div>


                            {/* AUCUN PNEU */}

                            {pneus.length === 0 ? (

                                <div className="search-results-immat-no-results">

                                    <p>
                                        Aucun pneu compatible trouvé
                                        pour ce véhicule.
                                    </p>

                                </div>

                            ) : (

                                /* GRILLE */

                                <div className="search-results-immat-grid">

                                    {pneus.map((pneu) => (

                                        <PneuCard
                                            key={pneu.id}
                                            pneu={pneu}
                                        />

                                    ))}

                                </div>

                            )}

                        </div>

                    </>

                )}

            </div>

        </div>

    );

}


export default SearchResultsImmatriculation;