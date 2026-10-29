
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FaArrowLeft, FaSave } from "react-icons/fa";

import { getAllPneus } from "../../services/pneuApi";
import { addPromotion } from "../../services/promotionApi";

import "./AjouterPromotion.css";


function AjouterPromotion() {

    const navigate = useNavigate();

    const [pneus, setPneus] = useState([]);

    const [formData, setFormData] = useState({
        pneuId: "",
        pourcentage: "",
        dateDebut: "",
        dateFin: ""
    });

    const [loading, setLoading] = useState(false);
    const [loadingPneus, setLoadingPneus] = useState(true);
    const [error, setError] = useState("");


    // ========================================
    // Obtenir la date d'aujourd'hui
    // ========================================

    const obtenirDateAujourdhui = () => {

        const aujourdHui = new Date();

        const annee = aujourdHui.getFullYear();
        const mois = String(aujourdHui.getMonth() + 1).padStart(2, "0");
        const jour = String(aujourdHui.getDate()).padStart(2, "0");

        return `${annee}-${mois}-${jour}`;

    };


    // ========================================
    // Récupérer les pneus
    // ========================================

    useEffect(() => {

        const chargerPneus = async () => {

            try {

                const response = await getAllPneus();

                console.log("✅ Pneus récupérés :", response.data);

                if (response.data.success) {
                    setPneus(response.data.pneus);
                }

            } catch (error) {

                console.error("❌ Erreur récupération pneus :", error);

                setError("Impossible de récupérer les pneus.");

            } finally {

                setLoadingPneus(false);

            }
        };

        chargerPneus();

    }, []);


    // ========================================
    // Modifier les champs
    // ========================================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });

        setError("");

    };


    // ========================================
    // Ajouter promotion
    // ========================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        // Vérification des champs obligatoires
        if (
            !formData.pneuId ||
            !formData.pourcentage ||
            !formData.dateDebut ||
            !formData.dateFin
        ) {

            setError("Veuillez remplir tous les champs.");

            return;
        }

        // Vérifier que la date de début n'est pas passée
        if (formData.dateDebut < obtenirDateAujourdhui()) {

            setError(
                "La date de début ne peut pas être antérieure à aujourd'hui."
            );

            return;
        }

        // Vérifier que la date de fin est égale ou postérieure
        // à la date de début
        if (formData.dateFin < formData.dateDebut) {

            setError(
                "La date de fin ne peut pas être antérieure à la date de début."
            );

            return;
        }


        try {

            setLoading(true);

            const data = {
                pneuId: Number(formData.pneuId),
                pourcentage: Number(formData.pourcentage),
                dateDebut: formData.dateDebut,
                dateFin: formData.dateFin
            };

            console.log("📤 Promotion envoyée :", data);

            await addPromotion(data);

            alert("Promotion ajoutée avec succès.");

            navigate("/admin/promotions");

        } catch (error) {

            console.error("❌ Erreur ajout promotion :", error);

            setError(
                error.response?.data?.message ||
                "Impossible d'ajouter la promotion."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="ajouter-promotion-page">

            <div className="ajouter-promotion-container">

                {/* Header */}

                <div className="ajouter-promotion-header">

                    <div>

                        <h1>Ajouter une promotion</h1>

                        <p>
                            Créez une nouvelle promotion pour un pneu.
                        </p>

                    </div>

                    <button
                        className="btn-retour-promotions"
                        onClick={() => navigate("/admin/promotions")}
                    >
                        <FaArrowLeft />
                        <span>Retour</span>
                    </button>

                </div>


                {/* Erreur */}

                {error && (
                    <div className="promotion-error">
                        {error}
                    </div>
                )}


                {/* Formulaire */}

                <form
                    className="ajouter-promotion-form"
                    onSubmit={handleSubmit}
                >

                    {/* Pneu */}

                    <div className="form-group">

                        <label htmlFor="pneuId">
                            Pneu
                        </label>

                        <select
                            id="pneuId"
                            name="pneuId"
                            value={formData.pneuId}
                            onChange={handleChange}
                            disabled={loadingPneus}
                        >

                            <option value="">
                                {loadingPneus
                                    ? "Chargement des pneus..."
                                    : "Sélectionner un pneu"
                                }
                            </option>

                            {pneus.map((pneu) => (

                                <option
                                    key={pneu.id}
                                    value={pneu.id}
                                >
                                    {pneu.modele} - {pneu.dimension} - {pneu.prix} DT
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* Pourcentage */}

                    <div className="form-group">

                        <label htmlFor="pourcentage">
                            Pourcentage de réduction
                        </label>

                        <input
                            type="number"
                            id="pourcentage"
                            name="pourcentage"
                            min="1"
                            max="99"
                            placeholder="Exemple : 25"
                            value={formData.pourcentage}
                            onChange={handleChange}
                        />

                    </div>


                    {/* Date début */}

                    <div className="form-group">

                        <label htmlFor="dateDebut">
                            Date de début
                        </label>

                        <div className="date-input-container">

                            <input
                                type="date"
                                id="dateDebut"
                                name="dateDebut"
                                value={formData.dateDebut}
                                min={obtenirDateAujourdhui()}
                                onChange={handleChange}
                            />

                        </div>

                    </div>


                    {/* Date fin */}

                    <div className="form-group">

                        <label htmlFor="dateFin">
                            Date de fin
                        </label>

                        <div className="date-input-container">

                            <input
                                type="date"
                                id="dateFin"
                                name="dateFin"
                                value={formData.dateFin}
                                min={
                                    formData.dateDebut ||
                                    obtenirDateAujourdhui()
                                }
                                onChange={handleChange}
                            />

                        </div>

                    </div>


                    {/* Boutons */}

                    <div className="form-actions">

                        <button
                            type="button"
                            className="btn-annuler"
                            onClick={() =>
                                navigate("/admin/promotions")
                            }
                        >
                            Annuler
                        </button>

                        <button
                            type="submit"
                            className="btn-enregistrer-promotion"
                            disabled={loading}
                        >
                            <FaSave />

                            <span>
                                {loading
                                    ? "Ajout en cours..."
                                    : "Ajouter la promotion"
                                }
                            </span>

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}

export default AjouterPromotion;
