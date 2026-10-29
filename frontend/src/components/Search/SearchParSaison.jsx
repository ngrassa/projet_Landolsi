import "./SearchParSaison.css";

import {
FaTimes,
FaArrowLeft,
FaSun,
FaSnowflake
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

function SearchParSaison({ onBack, onClose }) {


const navigate = useNavigate();


// ==============================
// Cliquer sur une saison
// ==============================

const handleSaisonClick = (saison) => {

    console.log(
        "Saison sélectionnée :",
        saison
    );


    // Aller vers la page de résultats
    navigate(
        `/recherche-pneus-saison?saison=${encodeURIComponent(saison)}`
    );


    // Fermer le modal
    onClose();

};


return (

    <>

        {/* ==============================
            HEADER
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
                    Par saison
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
            DESCRIPTION
        ============================== */}

        <p className="dimension-description">

            Sélectionnez la saison de vos pneus.

        </p>


        {/* ==============================
            SAISONS
        ============================== */}

        <div className="saisons-list">


            {/* ==============================
                ÉTÉ
            ============================== */}

            <button
                type="button"
                className="saison-option"
                onClick={() =>
                    handleSaisonClick("été")
                }
            >

                <div className="saison-option-icon">

                    <FaSun />

                </div>


                <div className="saison-option-content">

                    <h3>
                        Pneus été
                    </h3>

                    <p>
                        Pour une conduite optimale en été
                    </p>

                </div>


                <span className="saison-option-arrow">
                    ›
                </span>

            </button>


            {/* ==============================
                HIVER
            ============================== */}

            <button
                type="button"
                className="saison-option"
                onClick={() =>
                    handleSaisonClick("hiver")
                }
            >

                <div className="saison-option-icon">

                    <FaSnowflake />

                </div>


                <div className="saison-option-content">

                    <h3>
                        Pneus hiver
                    </h3>

                    <p>
                        Pour une conduite adaptée aux conditions hivernales
                    </p>

                </div>


                <span className="saison-option-arrow">
                    ›
                </span>

            </button>


            {/* ==============================
                4 SAISONS
            ============================== */}

            <button
                type="button"
                className="saison-option"
                onClick={() =>
                    handleSaisonClick("4 saisons")
                }
            >

                <div className="saison-option-icon">

                    <span className="saison-four">
                        4
                    </span>

                </div>


                <div className="saison-option-content">

                    <h3>
                        Pneus 4 saisons
                    </h3>

                    <p>
                        Une solution polyvalente toute l'année
                    </p>

                </div>


                <span className="saison-option-arrow">
                    ›
                </span>

            </button>


        </div>

    </>

);


}

export default SearchParSaison;
