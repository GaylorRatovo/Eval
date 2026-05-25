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
            <nav>
                <Link to={"/reset"}> Reset </Link>
                <Link to={"/import"}> Import </Link>
                <Link to={"/stocks"}>Stocks</Link>
                <Link to={"/orders"}> Orders </Link>
                <Link to={"/statistics"}>Statistics</Link>
                <Link to={"/dashboard"}>Dashboard</Link>
                <button type="button" onClick={handleLogout}>Logout</button>
            </nav>

            <main>
                <Outlet/>
            </main>
        </>
    )
}

export default BOMainLayout;