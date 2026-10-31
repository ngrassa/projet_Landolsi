import { useNavigate } from "react-router-dom";

import { FaHome } from "react-icons/fa";

import MfaSettings from "../Auth/MfaSettings";

import "./AdminUtilisateurs.css";


// ========================================
// ADMIN — Sécurité du compte (double authentification)
// ========================================

function AdminSecurite() {

    const navigate = useNavigate();

    return (

        <div className="admin-utilisateurs-page">

            <div className="admin-utilisateurs-header">

                <div>

                    <h1>
                        Sécurité du compte
                    </h1>

                    <p>
                        Fortement recommandé pour les comptes administrateurs.
                    </p>

                </div>

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

            <MfaSettings />

        </div>

    );

}


export default AdminSecurite;
