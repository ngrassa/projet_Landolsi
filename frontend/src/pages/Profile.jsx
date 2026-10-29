import "./Profile.css";

import { useEffect, useState } from "react";
import {
    getProfile,
    logout,
    updateProfile
} from "../services/apiuser";

import { useNavigate } from "react-router-dom";


import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaCity,
    FaGlobe,
    FaUserTag,
    FaSignOutAlt,
    FaIdCard,
    FaEdit,
    FaSave,
    FaTimes,
    FaBriefcase,
    FaBuilding,
    FaFileInvoice
} from "react-icons/fa";


function Profile() {

    const navigate = useNavigate();


    // ==============================
    // STATES
    // ==============================

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [isEditing, setIsEditing] = useState(false);

    const [saving, setSaving] = useState(false);


    const [formData, setFormData] = useState({

        nom: "",
        prenom: "",
        telephone: "",
        adresse: "",
        ville: "",
        codePostal: "",
        pays: ""

    });


    // ==============================
    // CHARGER LE PROFIL
    // ==============================

    useEffect(() => {

        const loadProfile = async () => {

            try {

                const response = await getProfile();

                console.log("Profil :", response.data);

                const profile = response.data.user;

                setUser(profile);


                // Remplir le formulaire

                setFormData({

                    nom: profile.nom || "",

                    prenom: profile.prenom || "",

                    telephone: profile.telephone || "",

                    adresse: profile.adresse || "",

                    ville: profile.ville || "",

                    codePostal: profile.codePostal || "",

                    pays: profile.pays || ""

                });

            }

            catch (error) {

                console.log(error);

                if (error.response?.status === 401) {

                    navigate("/login");

                }

                else {

                    setError(
                        "Impossible de récupérer votre profil."
                    );

                }

            }

            finally {

                setLoading(false);

            }

        };


        loadProfile();

    }, [navigate]);


    // ==============================
    // DECONNEXION
    // ==============================

    const handleLogout = async () => {

        try {

            await logout();

            navigate("/login");

        }

        catch (error) {

            console.log(error);

            setError(
                "Impossible de se déconnecter."
            );

        }

    };


    // ==============================
    // MODIFICATION DES CHAMPS
    // ==============================

    const handleChange = (e) => {

        const { name, value } = e.target;


        setFormData((previous) => ({

            ...previous,

            [name]: value

        }));

    };


    // ==============================
    // ACTIVER MODIFICATION
    // ==============================

    const handleEdit = () => {

        setIsEditing(true);

        setError("");

        setSuccess("");

    };


    // ==============================
    // ANNULER MODIFICATION
    // ==============================

    const handleCancel = () => {

        setFormData({

            nom: user.nom || "",

            prenom: user.prenom || "",

            telephone: user.telephone || "",

            adresse: user.adresse || "",

            ville: user.ville || "",

            codePostal: user.codePostal || "",

            pays: user.pays || ""

        });

        setIsEditing(false);

        setError("");

        setSuccess("");

    };


    // ==============================
    // ENREGISTRER MODIFICATION
    // ==============================

    const handleUpdateProfile = async (e) => {

        e.preventDefault();


        setSaving(true);

        setError("");

        setSuccess("");


        try {

            console.log(
                "Données envoyées :",
                formData
            );


            const response = await updateProfile(formData);


            console.log(
                "Réponse modification :",
                response.data
            );


            /*
                On récupère l'utilisateur
                retourné par le backend
            */

            const updatedUser = response.data.user;


            setUser(updatedUser);


            // Mettre à jour le formulaire

            setFormData({

                nom: updatedUser.nom || "",

                prenom: updatedUser.prenom || "",

                telephone: updatedUser.telephone || "",

                adresse: updatedUser.adresse || "",

                ville: updatedUser.ville || "",

                codePostal: updatedUser.codePostal || "",

                pays: updatedUser.pays || ""

            });


            setIsEditing(false);


            setSuccess(
                "Votre profil a été modifié avec succès."
            );


        }

        catch (error) {

            console.log(error);


            setError(

                error.response?.data?.message ||

                "Impossible de modifier votre profil."

            );

        }

        finally {

            setSaving(false);

        }

    };


    // ==============================
    // CHARGEMENT
    // ==============================

    if (loading) {

        return (

            <div className="profile-page">

                <div className="profile-container">

                    <div className="profile-loading">

                        Chargement de votre profil...

                    </div>

                </div>

            </div>

        );

    }


    // ==============================
    // ERREUR
    // ==============================

    if (error && !user) {

        return (

            <div className="profile-page">

                <div className="profile-container">

                    <div className="profile-error">

                        {error}

                    </div>

                </div>

            </div>

        );

    }


    return (

        <div className="profile-page">

            <div className="profile-container">


                {/* ========================================
                    HEADER
                ======================================== */}

                <div className="profile-header">


                    <div className="profile-avatar">

                        <FaUser />

                    </div>


                    <div className="profile-header-info">

                        <h1>

                            Bonjour {user?.prenom} !

                        </h1>


                        <p>

                            Gérez vos informations personnelles

                        </p>

                    </div>

                </div>


                {/* ========================================
                    MESSAGES
                ======================================== */}

                {success && (

                    <div className="profile-success">

                        {success}

                    </div>

                )}


                {error && (

                    <div className="profile-error">

                        {error}

                    </div>

                )}


                <form
                    id="profile-edit-form"
                    onSubmit={handleUpdateProfile}
                >


                    {/* ========================================
                        INFORMATIONS PERSONNELLES
                    ======================================== */}

                    <div className="profile-section">


                        <div className="profile-section-title">

                            <FaUser />

                            <h2>

                                Informations personnelles

                            </h2>

                        </div>


                        <div className="profile-grid">


                            {/* NOM */}

                            <div className="profile-info">

                                <FaUser />

                                <div>

                                    <span>

                                        Nom

                                    </span>


                                    {isEditing ? (

                                        <input
                                            type="text"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            className="profile-edit-input"
                                            required
                                        />

                                    ) : (

                                        <strong>

                                            {user.nom}

                                        </strong>

                                    )}

                                </div>

                            </div>


                            {/* PRENOM */}

                            <div className="profile-info">

                                <FaUser />

                                <div>

                                    <span>

                                        Prénom

                                    </span>


                                    {isEditing ? (

                                        <input
                                            type="text"
                                            name="prenom"
                                            value={formData.prenom}
                                            onChange={handleChange}
                                            className="profile-edit-input"
                                            required
                                        />

                                    ) : (

                                        <strong>

                                            {user.prenom}

                                        </strong>

                                    )}

                                </div>

                            </div>


                            {/* EMAIL */}

                            <div className="profile-info">

                                <FaEnvelope />

                                <div>

                                    <span>

                                        Adresse e-mail

                                    </span>


                                    <strong>

                                        {user.email}

                                    </strong>


                                    {isEditing && (

                                        <small className="profile-readonly">

                                            L'adresse e-mail ne peut pas être
                                            modifiée ici.

                                        </small>

                                    )}

                                </div>

                            </div>


                            {/* TELEPHONE */}

                            <div className="profile-info">

                                <FaPhone />

                                <div>

                                    <span>

                                        Téléphone

                                    </span>


                                    {isEditing ? (

                                        <input
                                            type="tel"
                                            name="telephone"
                                            value={formData.telephone}
                                            onChange={handleChange}
                                            className="profile-edit-input"
                                        />

                                    ) : (

                                        <strong>

                                            {user.telephone ||
                                                "Non renseigné"}

                                        </strong>

                                    )}

                                </div>

                            </div>


                        </div>

                    </div>


                    {/* ========================================
                        ADRESSE
                    ======================================== */}

                    <div className="profile-section">


                        <div className="profile-section-title">

                            <FaMapMarkerAlt />

                            <h2>

                                Adresse

                            </h2>

                        </div>


                        <div className="profile-grid">


                            {/* ADRESSE */}

                            <div className="profile-info">

                                <FaMapMarkerAlt />

                                <div>

                                    <span>

                                        Adresse

                                    </span>


                                    {isEditing ? (

                                        <input
                                            type="text"
                                            name="adresse"
                                            value={formData.adresse}
                                            onChange={handleChange}
                                            className="profile-edit-input"
                                        />

                                    ) : (

                                        <strong>

                                            {user.adresse ||
                                                "Non renseignée"}

                                        </strong>

                                    )}

                                </div>

                            </div>


                            {/* VILLE */}

                            <div className="profile-info">

                                <FaCity />

                                <div>

                                    <span>

                                        Ville

                                    </span>


                                    {isEditing ? (

                                        <input
                                            type="text"
                                            name="ville"
                                            value={formData.ville}
                                            onChange={handleChange}
                                            className="profile-edit-input"
                                        />

                                    ) : (

                                        <strong>

                                            {user.ville ||
                                                "Non renseignée"}

                                        </strong>

                                    )}

                                </div>

                            </div>


                            {/* CODE POSTAL */}

                            <div className="profile-info">

                                <FaIdCard />

                                <div>

                                    <span>

                                        Code postal

                                    </span>


                                    {isEditing ? (

                                        <input
                                            type="text"
                                            name="codePostal"
                                            value={formData.codePostal}
                                            onChange={handleChange}
                                            className="profile-edit-input"
                                        />

                                    ) : (

                                        <strong>

                                            {user.codePostal ||
                                                "Non renseigné"}

                                        </strong>

                                    )}

                                </div>

                            </div>


                            {/* PAYS */}

                            <div className="profile-info">

                                <FaGlobe />

                                <div>

                                    <span>

                                        Pays

                                    </span>


                                    {isEditing ? (

                                        <input
                                            type="text"
                                            name="pays"
                                            value={formData.pays}
                                            onChange={handleChange}
                                            className="profile-edit-input"
                                        />

                                    ) : (

                                        <strong>

                                            {user.pays ||
                                                "Non renseigné"}

                                        </strong>

                                    )}

                                </div>

                            </div>


                        </div>

                    </div>


                    {/* ========================================
                        TYPE DE COMPTE
                    ======================================== */}

                    <div className="profile-section">


                        <div className="profile-section-title">

                            <FaUserTag />

                            <h2>

                                Compte

                            </h2>

                        </div>


                        <div className="profile-client-type">


                            <span>

                                Type de client

                            </span>


                            <strong>

                                {user.typeClient ||
                                    "Particulier"}

                            </strong>


                        </div>


                    </div>


                    {/* ========================================
                        INFORMATIONS PROFESSIONNELLES
                    ======================================== */}

                    {user.typeClient === "professionnel" && (

                        <div className="profile-section">


                            <div className="profile-section-title">

                                <FaBriefcase />

                                <h2>

                                    Informations professionnelles

                                </h2>

                            </div>


                            <div className="profile-grid">


                                {user.activite && (

                                    <div className="profile-info">

                                        <FaBriefcase />

                                        <div>

                                            <span>

                                                Activité

                                            </span>

                                            <strong>

                                                {user.activite}

                                            </strong>

                                        </div>

                                    </div>

                                )}


                                {user.raisonSociale && (

                                    <div className="profile-info">

                                        <FaBuilding />

                                        <div>

                                            <span>

                                                Raison sociale

                                            </span>

                                            <strong>

                                                {user.raisonSociale}

                                            </strong>

                                        </div>

                                    </div>

                                )}


                                {user.siret && (

                                    <div className="profile-info">

                                        <FaIdCard />

                                        <div>

                                            <span>

                                                SIRET

                                            </span>

                                            <strong>

                                                {user.siret}

                                            </strong>

                                        </div>

                                    </div>

                                )}


                                {user.siren && (

                                    <div className="profile-info">

                                        <FaIdCard />

                                        <div>

                                            <span>

                                                SIREN

                                            </span>

                                            <strong>

                                                {user.siren}

                                            </strong>

                                        </div>

                                    </div>

                                )}


                                {user.tva && (

                                    <div className="profile-info">

                                        <FaFileInvoice />

                                        <div>

                                            <span>

                                                TVA intracommunautaire

                                            </span>

                                            <strong>

                                                {user.tva}

                                            </strong>

                                        </div>

                                    </div>

                                )}


                            </div>


                            <div className="professional-info-note">

                                Les informations professionnelles sont
                                conservées séparément de vos informations
                                personnelles.

                            </div>

                        </div>

                    )}


                </form>


                {/* ========================================
                    ACTIONS
                ======================================== */}

                <div className="profile-actions">


                    {!isEditing ? (

                        <>


                            <button
                                type="button"
                                className="profile-edit-btn"
                                onClick={handleEdit}
                            >

                                <FaEdit />

                                Modifier le profil

                            </button>


                            <button
                                type="button"
                                className="profile-logout-btn"
                                onClick={handleLogout}
                            >

                                <FaSignOutAlt />

                                Se déconnecter

                            </button>


                        </>

                    ) : (

                        <>


                            <button
                                type="button"
                                className="profile-cancel-btn"
                                onClick={handleCancel}
                                disabled={saving}
                            >

                                <FaTimes />

                                Annuler

                            </button>


                            <button
                                type="submit"
                                form="profile-edit-form"
                                className="profile-save-btn"
                                disabled={saving}
                            >

                                <FaSave />

                                {saving
                                    ? "Enregistrement..."
                                    : "Enregistrer"
                                }

                            </button>


                        </>

                    )}

                </div>


            </div>

        </div>

    );

}


export default Profile;