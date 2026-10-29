
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { FaArrowLeft, FaSave } from "react-icons/fa";

import {
    getPromotionById,
    updatePromotion
} from "../../services/promotionApi";

import "./ModifierPromotion.css";


function ModifierPromotion() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        pourcentage: "",
        dateDebut: "",
        dateFin: "",
        active: true
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");


    // ========================================
    // Récupérer la promotion
    // ========================================

    useEffect(() => {

        const chargerPromotion = async () => {

            try {

                const response = await getPromotionById(id);

                console.log("✅ Promotion récupérée :", response.data);

                const promotion = response.data;

                setFormData({
                    pourcentage: promotion.pourcentage,
                    dateDebut: promotion.dateDebut
                        ? promotion.dateDebut.substring(0, 10)
                        : "",
                    dateFin: promotion.dateFin
                        ? promotion.dateFin.substring(0, 10)
                        : "",
                    active: promotion.active
                });

            } catch (error) {

                console.error(
                    "❌ Erreur récupération promotion :",
                    error
                );

                if (error.response?.status === 401) {
                    alert(
                        "Votre session a expiré. Veuillez vous connecter."
                    );
                    navigate("/login");
                    return;
                }

                setError(
                    error.response?.data?.message ||
                    "Impossible de récupérer la promotion."
                );

            } finally {

                setLoading(false);

            }
        };

        chargerPromotion();

    }, [id, navigate]);


    // ========================================
    // Modifier les champs
    // ========================================

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });

    };


    // ========================================
    // Enregistrer les modifications
    // ========================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (
            !formData.pourcentage ||
            !formData.dateDebut ||
            !formData.dateFin
        ) {

            setError("Veuillez remplir tous les champs.");

            return;
        }

        if (
            new Date(formData.dateFin) <=
            new Date(formData.dateDebut)
        ) {

            setError(
                "La date de fin doit être après la date de début."
            );

            return;
        }


        try {

            setSaving(true);

            const data = {
                pourcentage: Number(formData.pourcentage),
                dateDebut: formData.dateDebut,
                dateFin: formData.dateFin,
                active: formData.active
            };

            console.log("📤 Modification envoyée :", data);

            await updatePromotion(id, data);

            alert("Promotion modifiée avec succès.");

            navigate("/admin/promotions");

        } catch (error) {

            console.error(
                "❌ Erreur modification promotion :",
                error
            );

            if (error.response?.status === 401) {
                alert(
                    "Votre session a expiré. Veuillez vous connecter."
                );
                navigate("/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Impossible de modifier la promotion."
            );

        } finally {

            setSaving(false);

        }

    };


    // ========================================
    // Chargement
    // ========================================

    if (loading) {

        return (
            <div className="modifier-promotion-page">

                <div className="modifier-promotion-loading">
                    Chargement de la promotion...
                </div>

            </div>
        );

    }


    return (

        <div className="modifier-promotion-page">

            <div className="modifier-promotion-container">

                {/* Header */}

                <div className="modifier-promotion-header">

                    <div>

                        <h1>Modifier une promotion</h1>

                        <p>
                            Modifiez les informations de la promotion.
                        </p>

                    </div>

                    <button
                        className="btn-retour-promotions"
                        onClick={() =>
                            navigate("/admin/promotions")
                        }
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
                    className="modifier-promotion-form"
                    onSubmit={handleSubmit}
                >

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
                            value={formData.pourcentage}
                            onChange={handleChange}
                        />

                    </div>


                    {/* Date début */}

                    <div className="form-group">

                        <label htmlFor="dateDebut">
                            Date de début
                        </label>

                        <input
                            type="date"
                            id="dateDebut"
                            name="dateDebut"
                            value={formData.dateDebut}
                            onChange={handleChange}
                        />

                    </div>


                    {/* Date fin */}

                    <div className="form-group">

                        <label htmlFor="dateFin">
                            Date de fin
                        </label>

                        <input
                            type="date"
                            id="dateFin"
                            name="dateFin"
                            value={formData.dateFin}
                            onChange={handleChange}
                        />

                    </div>


                    {/* Statut */}

                    <div className="form-group checkbox-group">

                        <label>

                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleChange}
                            />

                            <span>
                                Promotion active
                            </span>

                        </label>

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
                            disabled={saving}
                        >
                            <FaSave />

                            <span>
                                {saving
                                    ? "Modification..."
                                    : "Enregistrer"
                                }
                            </span>

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}

export default ModifierPromotion;

