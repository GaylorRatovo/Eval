import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

/**
 * Layout principal FrontOffice.
 *
 * Paramètres:
 * - Aucun.
 *
 * Type de résultat:
 * - JSX.Element. Rend la navigation et la zone de contenu selon le mode de session.
 *
 * Ce que fait la fonction:
 * - Affiche un layout différent selon que l'utilisateur est invité ou connecté.
 * - Masque ou affiche certaines entrées de navigation selon la route actuelle.
 *
 * Règles métier:
 * - Un invité ne voit que les liens utiles au parcours invité.
 * - La route `/fo` affiche directement le contenu sans navigation.
 *
 * Fonctionnement:
 * - L'état de session est lu depuis `localStorage`.
 * - Le bouton de déconnexion nettoie la session puis renvoie vers `/fo`.
 *
 * Exemple d'utilisation:
 * - Input: `<FOMainLayout />`
 * - Output attendu: un layout FO adapté à la session courante.
 */
function FOMainLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const isGuest = localStorage.getItem("isGuest") === "true";
    const isLoginRoute = location.pathname === "/fo";

    /**
     * Déconnecte l'utilisateur FrontOffice.
     *
     * Paramètres:
     * - Aucun.
     *
     * Type de résultat:
     * - void.
     *
     * Ce que fait la fonction:
     * - Supprime les données de session stockées localement.
     * - Redirige vers la route d'accueil FrontOffice.
     *
     * Règles métier:
     * - La déconnexion doit effacer à la fois l'utilisateur et le statut invité.
     *
     * Fonctionnement:
     * - Les clés `user` et `isGuest` sont retirées du localStorage.
     *
     * Exemple d'utilisation:
     * - Input: clic sur "Logout".
     * - Output attendu: retour sur `/fo`.
     */
    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("isGuest");
        navigate("/fo");
    };

    if (isGuest) {
        return (
            <>
                <nav>
                    <Link to="/fo/products">Products</Link>
                    <Link to="/fo/cart">My cart</Link>
                    <button onClick={handleLogout}>Logout</button>
                </nav>

                <main>
                    <Outlet />
                </main>
            </>
        );
    }

    if (isLoginRoute) {
        return <Outlet />;
    }

    return (
        <>
            <nav>
                <Link to="/fo/products">Products</Link>
                <Link to="/fo/orders">My orders</Link>
                <Link to="/fo/cart">My cart</Link>
                <button onClick={handleLogout}>Logout</button>
            </nav>

            <main>
                <Outlet />
            </main>
        </>
    );
}

export default FOMainLayout;