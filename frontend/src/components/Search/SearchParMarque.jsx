import "./SearchParMarque.css";

import { useEffect, useState } from "react";

import {
    FaTimes,
    FaArrowLeft
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import {
    getAllMarques
} from "../../services/marqueApi";
import { API_URL } from "../../config";


function SearchParMarque({ onBack, onClose }) {

    const navigate = useNavigate();

    const [marques, setMarques] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ==============================
    // Cliquer sur une marque
    // ==============================

    const handleMarqueClick = (marque) => {

        console.log(
            "Marque sélectionnée :",
            marque
        );


        // Aller vers la page de résultats
        navigate(
            `/recherche-pneus-marque?marqueId=${marque.id}`
        );


        // Fermer le modal
        onClose();

    };


    // ==============================
    // Récupérer les marques
    // ==============================

    useEffect(() => {

        const loadMarques = async () => {

            try {

                const response =
                    await getAllMarques();


                console.log(
                    "Marques reçues :",
                    response.data
                );


                setMarques(
                    response.data.marques || []
                );


            } catch (error) {

                console.error(
                    "Erreur chargement marques :",
                    error
                );


                setError(
                    "Impossible de récupérer les marques."
                );


            } finally {

                setLoading(false);

            }

        };


        loadMarques();

    }, []);


    return (

        <>

            {/* ==============================
                Header
            ============================== */}

            <div className="dimension-header">

                <div className="dimension-header-left">

                    <button
                        className="dimension-back"
                        onClick={onBack}
                        aria-label="Retour"
                    >

                        <FaArrowLeft />

                    </button>


                    <h2>
                        Par marque
                    </h2>

                </div>


                <button
                    className="dimension-close"
                    onClick={onClose}
                    aria-label="Fermer"
                >

                    <FaTimes />

                </button>

            </div>


            {/* ==============================
                Description
            ============================== */}

            <p className="dimension-description">

                Sélectionnez la marque de vos pneus.

            </p>


            {/* ==============================
                Chargement
            ============================== */}

            {loading && (

                <p>
                    Chargement des marques...
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
                Marques
            ============================== */}

            {!loading && !error && (

                <div className="marques-list">

                    {marques.map((marque) => (

                        <button
                            key={marque.id}
                            type="button"
                            className="marque-option"
                            onClick={() =>
                                handleMarqueClick(marque)
                            }
                        >

                            {marque.logo && (

                                <img
                                    src={`${API_URL}/uploadPneu/${marque.logo}`}
                                    alt={marque.nom}
                                />

                            )}


                            <span>
                                {marque.nom}
                            </span>


                        </button>

                    ))}

                </div>

            )}

        </>

    );

}

export default SearchParMarque;