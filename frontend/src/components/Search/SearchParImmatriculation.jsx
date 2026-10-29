
import "./SearchParImmatriculation.css";

import { useState } from "react";

import {
    FaTimes,
    FaArrowLeft
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";


function SearchParImmatriculation({
    onBack,
    onClose
}) {

    const [immatriculation, setImmatriculation] =
        useState("");

    const [error, setError] = useState("");

    const navigate = useNavigate();


    // ==============================
    // Rechercher par immatriculation
    // ==============================

    const rechercher = (e) => {

        e.preventDefault();


        if (!immatriculation.trim()) {

            setError(
                "Veuillez saisir une immatriculation."
            );

            return;
        }


        setError("");


        // Fermer le modal

        onClose();


        // Aller vers la page des résultats

        navigate(
            `/recherche/immatriculation?immatriculation=${encodeURIComponent(
                immatriculation.trim()
            )}`
        );

    };


    return (

        <div className="search-immat">


            {/* =========================
                HEADER
            ========================= */}

            <div className="search-immat-header">

                <button
                    type="button"
                    className="search-immat-back"
                    onClick={onBack}
                >

                    <FaArrowLeft />

                    <span>
                        Retour
                    </span>

                </button>


                <button
                    type="button"
                    className="search-close"
                    onClick={onClose}
                    aria-label="Fermer"
                >

                    <FaTimes />

                </button>

            </div>


            {/* =========================
                TITRE
            ========================= */}

            <div className="search-immat-title">

                <h2>
                    Recherche par immatriculation
                </h2>

                <p>
                    Entrez l'immatriculation de votre véhicule
                    pour trouver les pneus compatibles.
                </p>

            </div>


            {/* =========================
                FORMULAIRE
            ========================= */}

            <form
                className="search-immat-form"
                onSubmit={rechercher}
            >

                <input
                    type="text"
                    value={immatriculation}
                    onChange={(e) => {

                        setImmatriculation(
                            e.target.value
                        );

                        setError("");

                    }}
                    placeholder="Ex : 818TU223"
                />


                <button type="submit">

                    Rechercher

                </button>

            </form>


            {/* =========================
                ERREUR
            ========================= */}

            {error && (

                <p className="search-immat-error">

                    {error}

                </p>

            )}

        </div>

    );

}


export default SearchParImmatriculation;

