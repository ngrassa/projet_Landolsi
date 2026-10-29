
import {
    FaTachometerAlt,
    FaBoxOpen,
    FaTags,
    FaShoppingCart,
    FaUsers,
    FaWarehouse,
    FaSignOutAlt,
    FaBars,
    FaTimes
} from "react-icons/fa";

import {
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import "./admindashboard.css";


function AdminDashboard() {

    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);


    // ========================================
    // DECONNEXION
    // ========================================

    const handleLogout = () => {

        // Pour le moment, on reviendra ici
        // lorsque nous connecterons la vraie API logout.

        window.dispatchEvent(
            new Event("authChanged")
        );

        navigate("/login");

    };


    // ========================================
    // NAVIGATION
    // ========================================

    const handleNavigation = (path) => {

        navigate(path);

        setSidebarOpen(false);

    };


    return (

        <div className="admin-layout">


            {/* ========================================
                OVERLAY MOBILE
            ======================================== */}

            {sidebarOpen && (

                <div
                    className="admin-overlay"
                    onClick={() => setSidebarOpen(false)}
                ></div>

            )}


            {/* ========================================
                SIDEBAR
            ======================================== */}

            <aside
                className={
                    sidebarOpen
                        ? "admin-sidebar open"
                        : "admin-sidebar"
                }
            >


                {/* LOGO */}

                <div className="admin-logo">

                    <h2>
                        LANDOLSI
                    </h2>

                    <span>
                        Administration
                    </span>

                </div>


                {/* BOUTON FERMER MOBILE */}

                <button
                    className="close-sidebar"
                    onClick={() => setSidebarOpen(false)}
                >

                    <FaTimes />

                </button>


                {/* MENU */}

                <nav className="admin-menu">


                    <button
                        className="admin-menu-item active"
                        onClick={() => handleNavigation("/admin")}
                    >

                        <FaTachometerAlt />

                        <span>
                            Tableau de bord
                        </span>

                    </button>


                    <button
                        className="admin-menu-item"
                        onClick={() => handleNavigation("/admin/pneus")}
                    >

                        <FaBoxOpen />

                        <span>
                            Pneus
                        </span>

                    </button>


                    <button
                        className="admin-menu-item"
                        onClick={() => handleNavigation("/admin/promotions")}
                    >

                        <FaTags />

                        <span>
                            Promotions
                        </span>

                    </button>


                    <button
                        className="admin-menu-item"
                        onClick={() => handleNavigation("/admin/commandes")}
                    >

                        <FaShoppingCart />

                        <span>
                            Commandes
                        </span>

                    </button>


                    <button
                        className="admin-menu-item"
                        onClick={() => handleNavigation("/admin/utilisateurs")}
                    >

                        <FaUsers />

                        <span>
                            Utilisateurs
                        </span>

                    </button>


                    <button
                        className="admin-menu-item"
                        onClick={() => handleNavigation("/admin/stock")}
                    >

                        <FaWarehouse />

                        <span>
                            Stock
                        </span>

                    </button>


                </nav>


                {/* DECONNEXION */}

                <div className="admin-sidebar-bottom">

                    <button
                        className="admin-logout"
                        onClick={handleLogout}
                    >

                        <FaSignOutAlt />

                        <span>
                            Déconnexion
                        </span>

                    </button>

                </div>


            </aside>


            {/* ========================================
                CONTENU PRINCIPAL
            ======================================== */}

            <main className="admin-main">


                {/* HEADER */}

                <header className="admin-header">


                    <button
                        className="menu-button"
                        onClick={() => setSidebarOpen(true)}
                    >

                        <FaBars />

                    </button>


                    <div>

                        <h1>
                            Tableau de bord
                        </h1>

                        <p>
                            Bienvenue dans l'espace administrateur Landolsi Motors.
                        </p>

                    </div>


                </header>


                {/* ========================================
                    STATISTIQUES
                ======================================== */}

                <section className="admin-stats">


                    <div className="admin-stat-card">

                        <div className="stat-icon">

                            <FaBoxOpen />

                        </div>

                        <div>

                            <h3>
                                0
                            </h3>

                            <p>
                                Pneus
                            </p>

                        </div>

                    </div>


                    <div className="admin-stat-card">

                        <div className="stat-icon">

                            <FaShoppingCart />

                        </div>

                        <div>

                            <h3>
                                0
                            </h3>

                            <p>
                                Commandes
                            </p>

                        </div>

                    </div>


                    <div className="admin-stat-card">

                        <div className="stat-icon">

                            <FaUsers />

                        </div>

                        <div>

                            <h3>
                                0
                            </h3>

                            <p>
                                Utilisateurs
                            </p>

                        </div>

                    </div>


                    <div className="admin-stat-card">

                        <div className="stat-icon">

                            <FaTags />

                        </div>

                        <div>

                            <h3>
                                0
                            </h3>

                            <p>
                                Promotions actives
                            </p>

                        </div>

                    </div>


                </section>


                {/* ========================================
                    CONTENU
                ======================================== */}

                <section className="admin-welcome-card">

                    <h2>
                        Gestion de Landolsi Motors
                    </h2>

                    <p>
                        Depuis cet espace, vous pouvez gérer les pneus,
                        les promotions, les commandes, les utilisateurs
                        et le stock.
                    </p>


                    <div className="admin-quick-actions">


                        <button
                            onClick={() => handleNavigation("/admin/pneus")}
                        >

                            <FaBoxOpen />

                            Gérer les pneus

                        </button>


                        <button
                            onClick={() => handleNavigation("/admin/promotions")}
                        >

                            <FaTags />

                            Gérer les promotions

                        </button>


                        <button
                            onClick={() => handleNavigation("/admin/commandes")}
                        >

                            <FaShoppingCart />

                            Voir les commandes

                        </button>


                    </div>

                </section>


            </main>

        </div>

    );

}


export default AdminDashboard;

