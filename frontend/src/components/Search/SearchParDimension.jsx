
import "./SearchParDimension.css";
import { useNavigate } from "react-router-dom";

import {
    FaTimes,
    FaArrowLeft,
    FaSearch
} from "react-icons/fa";

import { useState, useEffect } from "react";

import {
    getLargeurs,
    getHauteurs,
    getDiametres,
    searchPneusByDimension
} from "../../services/pneuApi";


function SearchParDimension({ onBack, onClose }) {

    // ==============================
    // Valeurs sélectionnées
    // ==============================
const navigate = useNavigate();
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");
    const [diameter, setDiameter] = useState("");


    // ==============================
    // Valeurs venant de l'API
    // ==============================

    const [widths, setWidths] = useState([]);
    const [heights, setHeights] = useState([]);
    const [diameters, setDiameters] = useState([]);


    // ==============================
    // Charger les largeurs
    // ==============================

    useEffect(() => {

        const loadLargeurs = async () => {

            try {

                const response = await getLargeurs();

                setWidths(
                    response.data.largeurs
                );

            } catch (error) {

                console.error(
                    "Erreur lors du chargement des largeurs :",
                    error
                );

            }

        };


        loadLargeurs();

    }, []);


    // ==============================
    // Charger les hauteurs
    // selon la largeur
    // ==============================

    useEffect(() => {

        if (!width) {

            setHeights([]);
            setHeight("");

            setDiameters([]);
            setDiameter("");

            return;

        }


        const loadHauteurs = async () => {

            try {

                const response = await getHauteurs(
                    width
                );


                setHeights(
                    response.data.hauteurs
                );

            } catch (error) {

                console.error(
                    "Erreur lors du chargement des hauteurs :",
                    error
                );

                setHeights([]);

            }

        };


        loadHauteurs();

    }, [width]);


    // ==============================
    // Charger les diamètres
    // selon largeur + hauteur
    // ==============================

    useEffect(() => {

        if (!width || !height) {

            setDiameters([]);
            setDiameter("");

            return;

        }


        const loadDiametres = async () => {

            try {

                const response = await getDiametres(
                    width,
                    height
                );


                setDiameters(
                    response.data.diametres
                );

            } catch (error) {

                console.error(
                    "Erreur lors du chargement des diamètres :",
                    error
                );

                setDiameters([]);

            }

        };


        loadDiametres();

    }, [width, height]);


    // ==============================
    // Recherche des pneus
    // ==============================

    const handleSearch = () => {

    if (!width && !height && !diameter) {

        alert(
            "Veuillez sélectionner au moins une dimension."
        );

        return;
    }

    navigate(
        `/recherche-pneus?largeur=${width}&hauteur=${height}&diametre=${diameter}`
    );

    onClose();

};

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
                        Par dimension
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

                Sélectionnez les dimensions indiquées
                sur votre pneu.

            </p>


            {/* ==============================
                Formulaire
            ============================== */}

            <div className="dimension-form">


                {/* Largeur */}

                <div className="dimension-field">

                    <label htmlFor="width">

                        Largeur

                    </label>


                    <select
                        id="width"
                        value={width}
                        onChange={(e) => {

                            const value =
                                e.target.value;


                            setWidth(value);

                            // Réinitialiser
                            // hauteur + diamètre

                            setHeight("");

                            setDiameter("");

                            setDiameters([]);

                        }}
                    >

                        <option value="">

                            Choisir

                        </option>


                        {widths.map((value) => (

                            <option
                                key={value}
                                value={value}
                            >

                                {value}

                            </option>

                        ))}

                    </select>

                </div>


                {/* Hauteur */}

                <div className="dimension-field">

                    <label htmlFor="height">

                        Hauteur

                    </label>


                    <select
                        id="height"
                        value={height}
                        disabled={!width}
                        onChange={(e) => {

                            const value =
                                e.target.value;


                            setHeight(value);

                            setDiameter("");

                        }}
                    >

                        <option value="">

                            Choisir

                        </option>


                        {heights.map((value) => (

                            <option
                                key={value}
                                value={value}
                            >

                                {value}

                            </option>

                        ))}

                    </select>

                </div>


                {/* Diamètre */}

                <div className="dimension-field">

                    <label htmlFor="diameter">

                        Diamètre

                    </label>


                    <select
                        id="diameter"
                        value={diameter}
                        disabled={!height}
                        onChange={(e) => {

                            setDiameter(
                                e.target.value
                            );

                        }}
                    >

                        <option value="">

                            Choisir

                        </option>


                        {diameters.map((value) => (

                            <option
                                key={value}
                                value={value}
                            >

                                R{value}

                            </option>

                        ))}

                    </select>

                </div>

            </div>


            {/* ==============================
                Dimension sélectionnée
            ============================== */}

            {(width || height || diameter) && (

                <div className="dimension-preview">

                    <span>

                        Dimension sélectionnée :

                    </span>


                    <strong>

                        {width || "—"} /{" "}

                        {height || "—"} R

                        {diameter || "—"}

                    </strong>

                </div>

            )}


            {/* ==============================
                Bouton recherche
            ============================== */}

            <button
                className="dimension-search-button"
                onClick={handleSearch}
            >

                <FaSearch />

                Rechercher mes pneus

            </button>

        </>

    );

}


export default SearchParDimension;

