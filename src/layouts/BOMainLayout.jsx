import {Link, Navigate, Outlet, useLocation, useNavigate} from "react-router-dom";

/**
 * Layout principal du BackOffice.
 * Regles metier: toutes les routes BO (sauf login) exigent un flag d'authentification local.
 * Methode: lit `boAuth`, bloque l'acces si besoin, et affiche la navigation commune.
 * Parametres: aucun.
 * Retour: JSX layout avec garde d'acces et navigation.
 */
function BOMainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isAuthed = localStorage.getItem("boAuth") === "true";
    const isLoginRoute = location.pathname === "/";
    const navItems = [
        { to: "/dashboard", label: "Dashboard", icon: "bx bx-grid-alt" },
        { to: "/statistics", label: "Statistiques", icon: "bx bx-line-chart" },
        { to: "/orders", label: "Commandes", icon: "bx bx-receipt" },
        { to: "/stocks", label: "Stocks", icon: "bx bx-package" },
        { to: "/import", label: "Import", icon: "bx bx-upload" },
        { to: "/reset", label: "Reset", icon: "bx bx-refresh" },
    ];

    /**
     * Deconnecte l'utilisateur BackOffice.
     * Regles metier: retire le flag local d'authentification puis renvoie vers la page de login.
     * Parametres: aucun.
     * Retour: void.
     */
    const handleLogout = () => {
        // Etape 1: supprimer la session locale BackOffice.
        localStorage.removeItem("boAuth");
        // Etape 2: revenir au point d'entree de connexion.
        navigate("/");
    };

    // Etape 3: si l'utilisateur n'est pas authentifie et n'est pas sur la page login, bloquer.
    if (!isAuthed && !isLoginRoute) {
        return <Navigate to="/" replace />;
    }

    // Etape 4: sur la route login, rediriger vers les commandes si deja authentifie, sinon afficher le login.
    if (isLoginRoute) {
        return isAuthed ? <Navigate to="/orders" replace /> : <Outlet />;
    }

    // Etape 5: afficher la barre de navigation commune aux pages BO authentifiees.
    return (
        <>
            {/* Barre de navigation principale BackOffice */}
            <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
                <div className="container-xxl">
                    <Link to="/dashboard" className="navbar-brand d-flex align-items-center gap-2">
                        <span className="badge bg-primary">BO</span>
                        <span className="fw-bold">EvalShop</span>
                    </Link>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#boNavbar"
                        aria-controls="boNavbar"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="boNavbar">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            {navItems.map((item) => (
                                <li key={item.to} className="nav-item">
                                    <Link
                                        to={item.to}
                                        className={`nav-link ${location.pathname === item.to ? "active fw-bold" : ""}`}
                                    >
                                        <i className={`${item.icon} me-1`}></i>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
                            <i className="bx bx-log-out me-1"></i>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Contenu principal BackOffice */}
            <main className="container-xxl py-4">
                <Outlet />
            </main>
        </>
    )
}

export default BOMainLayout;