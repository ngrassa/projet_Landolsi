import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaTrash,
    FaHome,
    FaUserCheck,
    FaUserTimes
} from "react-icons/fa";

import {
    getAllUsers,
    toggleUserStatus,
    deleteUser
} from "../../services/apiuser";

import "./AdminUtilisateurs.css";


function AdminUtilisateurs() {

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();


    // ========================================
    // RÉCUPÉRER LES UTILISATEURS
    // ========================================

    useEffect(() => {

        const chargerUtilisateurs = async () => {

            try {

                const response = await getAllUsers();

                console.log(
                    "✅ Utilisateurs récupérés :",
                    response.data
                );

                if (response.data.success) {

                    setUsers(response.data.users);

                }

            } catch (error) {

                console.error(
                    "❌ Erreur récupération utilisateurs :",
                    error
                );

                setError(
                    "Impossible de récupérer les utilisateurs."
                );

            } finally {

                setLoading(false);

            }

        };

        chargerUtilisateurs();

    }, []);


    // ========================================
    // ACTIVER / DÉSACTIVER UN UTILISATEUR
    // ========================================

    const handleToggleStatus = async (id) => {

        try {

            await toggleUserStatus(id);

            // Recharger la liste
            const response = await getAllUsers();

            if (response.data.success) {

                setUsers(response.data.users);

            }

            alert("Statut de l'utilisateur modifié avec succès.");

        } catch (error) {

            console.error(
                "❌ Erreur modification statut :",
                error
            );

            alert(
                error.response?.data?.message ||
                "Impossible de modifier le statut de l'utilisateur."
            );

        }

    };


    // ========================================
    // SUPPRIMER UN UTILISATEUR
    // ========================================

    const handleDelete = async (id) => {

        const confirmation = window.confirm(
            "Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
        );

        if (!confirmation) {
            return;
        }

        try {

            await deleteUser(id);

            // Supprimer directement de l'affichage
            setUsers((usersActuels) =>
                usersActuels.filter(
                    (user) => user.id !== id
                )
            );

            alert("Utilisateur supprimé avec succès.");

        } catch (error) {

            console.error(
                "❌ Erreur suppression utilisateur :",
                error
            );

            alert(
                error.response?.data?.message ||
                "Impossible de supprimer cet utilisateur."
            );

        }

    };


    // ========================================
    // CHARGEMENT
    // ========================================

    if (loading) {

        return (

            <div className="admin-utilisateurs-page">

                <div className="admin-utilisateurs-loading">
                    Chargement des utilisateurs...
                </div>

            </div>

        );

    }


    // ========================================
    // ERREUR
    // ========================================

    if (error) {

        return (

            <div className="admin-utilisateurs-page">

                <div className="admin-utilisateurs-error">
                    {error}
                </div>

            </div>

        );

    }


    // ========================================
    // AFFICHAGE
    // ========================================

    return (

        <div className="admin-utilisateurs-page">


            {/* ========================================
                HEADER
            ======================================== */}

            <div className="admin-utilisateurs-header">

                <div>

                    <h1>
                        Gestion des utilisateurs
                    </h1>

                    <p>
                        Gérez les comptes clients de Landolsi Motors.
                    </p>

                </div>


                {/* ========================================
                    BOUTON DASHBOARD
                ======================================== */}

                <div className="admin-utilisateurs-header-actions">

                    <button
                        className="btn-retour-dashboard"
                        title="Retour au dashboard"
                        onClick={() => navigate("/admin")}
                    >

                        <FaHome />

                        <span>
                            Dashboard
                        </span>

                    </button>

                </div>

            </div>


            {/* ========================================
                INFORMATIONS
            ======================================== */}

            <div className="utilisateurs-info">

                <span>
                    Nombre d'utilisateurs
                </span>

                <strong>
                    {users.length}
                </strong>

            </div>


            {/* ========================================
                GRILLE DES UTILISATEURS
            ======================================== */}

            <div className="admin-utilisateurs-grid">


                {users.length === 0 ? (

                    <div className="aucun-utilisateur">
                        Aucun utilisateur trouvé.
                    </div>

                ) : (

                    users.map((user) => (

                        <div
                            className="admin-utilisateur-card"
                            key={user.id}
                        >


                            {/* ========================================
                                EN-TÊTE CARTE
                            ======================================== */}

                            <div className="admin-utilisateur-card-header">

                                <div className="utilisateur-avatar">

                                    {user.prenom?.charAt(0).toUpperCase()}
                                    {user.nom?.charAt(0).toUpperCase()}

                                </div>


                                <div className="utilisateur-identite">

                                    <h3
                                        title={`${user.prenom} ${user.nom}`}
                                    >
                                        {user.prenom} {user.nom}
                                    </h3>

                                    <span>
                                        #{user.id}
                                    </span>

                                </div>

                            </div>


                            {/* ========================================
                                INFORMATIONS
                            ======================================== */}

                            <div className="admin-utilisateur-details">


                                {/* EMAIL */}

                                <div className="utilisateur-info-ligne">

                                    <span>
                                        Email
                                    </span>

                                    <strong title={user.email}>
                                        {user.email}
                                    </strong>

                                </div>


                                {/* TÉLÉPHONE */}

                                <div className="utilisateur-info-ligne">

                                    <span>
                                        Téléphone
                                    </span>

                                    <strong>
                                        {user.telephone || "-"}
                                    </strong>

                                </div>


                                {/* TYPE */}

                                <div className="utilisateur-info-ligne">

                                    <span>
                                        Type
                                    </span>

                                    <strong>

                                        {user.typeClient === "professionnel"
                                            ? "Professionnel"
                                            : "Particulier"}

                                    </strong>

                                </div>


                                {/* VILLE */}

                                <div className="utilisateur-info-ligne">

                                    <span>
                                        Ville
                                    </span>

                                    <strong>
                                        {user.ville || "-"}
                                    </strong>

                                </div>

                            </div>


                            {/* ========================================
                                TYPE + STATUT
                            ======================================== */}

                            <div className="admin-utilisateur-bottom">


                                <span
                                    className={
                                        user.role === "admin"
                                            ? "role-admin"
                                            : "role-client"
                                    }
                                >

                                    {user.role === "admin"
                                        ? "Admin"
                                        : "Client"}

                                </span>


                                <span
                                    className={
                                        user.isActive
                                            ? "status-active"
                                            : "status-inactive"
                                    }
                                >

                                    {user.isActive
                                        ? "Actif"
                                        : "Inactif"}

                                </span>

                            </div>


                            {/* ========================================
                                ACTIONS
                            ======================================== */}

                            {user.role !== "admin" && (

                                <div className="actions-utilisateur">


                                    {/* ACTIVER / DÉSACTIVER */}

                                    <button
                                        className={
                                            user.isActive
                                                ? "btn-desactiver"
                                                : "btn-activer"
                                        }
                                        title={
                                            user.isActive
                                                ? "Désactiver"
                                                : "Activer"
                                        }
                                        onClick={() =>
                                            handleToggleStatus(user.id)
                                        }
                                    >

                                        {user.isActive
                                            ? <FaUserTimes />
                                            : <FaUserCheck />
                                        }

                                        <span>
                                            {user.isActive
                                                ? "Désactiver"
                                                : "Activer"}
                                        </span>

                                    </button>


                                    {/* SUPPRIMER */}

                                    <button
                                        className="btn-supprimer"
                                        title="Supprimer"
                                        onClick={() =>
                                            handleDelete(user.id)
                                        }
                                    >

                                        <FaTrash />

                                    </button>


                                </div>

                            )}

                        </div>

                    ))

                )}

            </div>

        </div>

    );

}


export default AdminUtilisateurs;