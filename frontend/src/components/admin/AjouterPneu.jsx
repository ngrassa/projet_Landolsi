
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaImage, FaSave } from "react-icons/fa";

import { addPneu } from "../../services/pneuApi";
import { getAllMarques } from "../../services/marqueApi";

import "./AjouterPneu.css";

function AjouterPneu() {

    const navigate = useNavigate();

    const [marques, setMarques] = useState([]);

    const [formData, setFormData] = useState({
        modele: "",
        dimension: "",
        largeur: "",
        hauteur: "",
        diametre: "",
        saison: "",
        prix: "",
        stock: "",
        description: "",
        marqueId: ""
    });

    const [image, setImage] = useState(null);

    const [loading, setLoading] = useState(false);

    const [loadingMarques, setLoadingMarques] = useState(true);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");


    // ========================================
    // Récupérer les marques
    // ========================================

    useEffect(() => {

        const chargerMarques = async () => {

            try {

                const response = await getAllMarques();

                console.log(
                    "✅ Marques récupérées :",
                    response.data
                );

                /*
                    Selon ton API, les marques peuvent
                    être directement dans response.data
                    ou dans response.data.marques.
                */

                if (Array.isArray(response.data)) {

                    setMarques(response.data);

                } else if (Array.isArray(response.data.marques)) {

                    setMarques(response.data.marques);

                }

            } catch (error) {

                console.error(
                    "❌ Erreur récupération marques :",
                    error
                );

                setError(
                    "Impossible de récupérer les marques."
                );

            } finally {

                setLoadingMarques(false);

            }

        };

        chargerMarques();

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

    };


    // ========================================
    // Choisir l'image
    // ========================================

    const handleImageChange = (e) => {

        const file = e.target.files[0];

        if (file) {

            setImage(file);

        }

    };


    // ========================================
    // Ajouter le pneu
    // ========================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        // Vérification image
        if (!image) {

            setError(
                "Veuillez sélectionner une image."
            );

            return;
        }


        // Vérification marque
        if (!formData.marqueId) {

            setError(
                "Veuillez sélectionner une marque."
            );

            return;
        }


        try {

            setLoading(true);


            const data = new FormData();

            data.append("modele", formData.modele);
            data.append("dimension", formData.dimension);
            data.append("largeur", formData.largeur);
            data.append("hauteur", formData.hauteur);
            data.append("diametre", formData.diametre);
            data.append("saison", formData.saison);
            data.append("prix", formData.prix);
            data.append("stock", formData.stock);
            data.append("description", formData.description);
            data.append("marqueId", formData.marqueId);

            data.append("image", image);


            const response = await addPneu(data);


            console.log(
                "✅ Pneu ajouté :",
                response.data
            );


            if (response.data.success) {

                setSuccess(
                    "Pneu ajouté avec succès !"
                );


                // Réinitialiser le formulaire

                setFormData({
                    modele: "",
                    dimension: "",
                    largeur: "",
                    hauteur: "",
                    diametre: "",
                    saison: "",
                    prix: "",
                    stock: "",
                    description: "",
                    marqueId: ""
                });

                setImage(null);

                // Réinitialiser le champ fichier

                document.getElementById(
                    "image"
                ).value = "";

            }


        } catch (error) {

            console.error(
                "❌ Erreur ajout pneu :",
                error
            );


            setError(
                error.response?.data?.message ||
                "Erreur lors de l'ajout du pneu."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="ajouter-pneu-page">


            {/* ========================================
                HEADER
            ======================================== */}

            <div className="ajouter-pneu-header">

                <button
                    className="btn-retour"
                    onClick={() => navigate("/admin/pneus")}
                >
                    <FaArrowLeft />

                    <span>
                        Retour aux pneus
                    </span>
                </button>


                <div>

                    <h1>
                        Ajouter un pneu
                    </h1>

                    <p>
                        Ajouter un nouveau pneu au catalogue.
                    </p>

                </div>

            </div>


            {/* ========================================
                MESSAGES
            ======================================== */}

            {error && (

                <div className="message-error">
                    {error}
                </div>

            )}


            {success && (

                <div className="message-success">
                    {success}
                </div>

            )}


            {/* ========================================
                FORMULAIRE
            ======================================== */}

            <form
                className="ajouter-pneu-form"
                onSubmit={handleSubmit}
            >


                {/* ========================================
                    INFORMATIONS PRINCIPALES
                ======================================== */}

                <div className="form-section">

                    <h2>
                        Informations du pneu
                    </h2>


                    <div className="form-grid">


                        {/* MODELE */}

                        <div className="form-group">

                            <label>
                                Modèle *
                            </label>

                            <input
                                type="text"
                                name="modele"
                                value={formData.modele}
                                onChange={handleChange}
                                placeholder="Ex : Primacy 4"
                                required
                            />

                        </div>


                        {/* MARQUE */}

                        <div className="form-group">

                            <label>
                                Marque *
                            </label>

                            <select
                                name="marqueId"
                                value={formData.marqueId}
                                onChange={handleChange}
                                required
                                disabled={loadingMarques}
                            >

                                <option value="">
                                    {loadingMarques
                                        ? "Chargement..."
                                        : "Sélectionner une marque"}
                                </option>


                                {marques.map((marque) => (

                                    <option
                                        key={marque.id}
                                        value={marque.id}
                                    >
                                        {marque.nom}
                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* DIMENSION */}

                        <div className="form-group">

                            <label>
                                Dimension *
                            </label>

                            <input
                                type="text"
                                name="dimension"
                                value={formData.dimension}
                                onChange={handleChange}
                                placeholder="Ex : 205/55 R16"
                                required
                            />

                        </div>


                        {/* SAISON */}

                        <div className="form-group">

                            <label>
                                Saison *
                            </label>

                            <select
                                name="saison"
                                value={formData.saison}
                                onChange={handleChange}
                                required
                            >

                                <option value="">
                                    Sélectionner une saison
                                </option>

                                <option value="Été">
                                    Été
                                </option>

                                <option value="Hiver">
                                    Hiver
                                </option>

                                <option value="4 saisons">
                                    4 saisons
                                </option>

                            </select>

                        </div>

                    </div>

                </div>


                {/* ========================================
                    DIMENSIONS TECHNIQUES
                ======================================== */}

                <div className="form-section">

                    <h2>
                        Dimensions techniques
                    </h2>


                    <div className="form-grid three-columns">


                        <div className="form-group">

                            <label>
                                Largeur
                            </label>

                            <input
                                type="number"
                                name="largeur"
                                value={formData.largeur}
                                onChange={handleChange}
                                placeholder="Ex : 205"
                                min="0"
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Hauteur
                            </label>

                            <input
                                type="number"
                                name="hauteur"
                                value={formData.hauteur}
                                onChange={handleChange}
                                placeholder="Ex : 55"
                                min="0"
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Diamètre
                            </label>

                            <input
                                type="number"
                                name="diametre"
                                value={formData.diametre}
                                onChange={handleChange}
                                placeholder="Ex : 16"
                                min="0"
                            />

                        </div>

                    </div>

                </div>


                {/* ========================================
                    PRIX ET STOCK
                ======================================== */}

                <div className="form-section">

                    <h2>
                        Prix et stock
                    </h2>


                    <div className="form-grid">


                        <div className="form-group">

                            <label>
                                Prix (DT) *
                            </label>

                            <input
                                type="number"
                                name="prix"
                                value={formData.prix}
                                onChange={handleChange}
                                placeholder="Ex : 350"
                                min="0"
                                step="0.01"
                                required
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Stock
                            </label>

                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="Ex : 10"
                                min="0"
                            />

                        </div>

                    </div>

                </div>


                {/* ========================================
                    DESCRIPTION
                ======================================== */}

                <div className="form-section">

                    <h2>
                        Description
                    </h2>


                    <div className="form-group">

                        <label>
                            Description du pneu
                        </label>

                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Décrivez le pneu..."
                            rows="5"
                        />

                    </div>

                </div>


                {/* ========================================
                    IMAGE
                ======================================== */}

                <div className="form-section">

                    <h2>
                        Image du pneu
                    </h2>


                    <div className="image-upload">


                        <FaImage />


                        <label htmlFor="image">

                            Choisir une image

                        </label>


                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            required
                        />


                        {image && (

                            <p>
                                Image sélectionnée :
                                <strong>
                                    {" "}{image.name}
                                </strong>
                            </p>

                        )}

                    </div>

                </div>


                {/* ========================================
                    BOUTONS
                ======================================== */}

                <div className="form-actions">

                    <button
                        type="button"
                        className="btn-annuler"
                        onClick={() => navigate("/admin/pneus")}
                    >
                        Annuler
                    </button>


                    <button
                        type="submit"
                        className="btn-enregistrer"
                        disabled={loading}
                    >

                        <FaSave />

                        {loading
                            ? "Enregistrement..."
                            : "Ajouter le pneu"}

                    </button>

                </div>


            </form>

        </div>

    );

}

export default AjouterPneu;

