import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

function FOMainLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const isGuest = localStorage.getItem("isGuest") === "true";
    const isLoginRoute = location.pathname === "/fo";
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    const isAuthenticated = Boolean(user?.id);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("isGuest");
        navigate("/fo");
    };

    return (
        <div className="layout-wrapper layout-content-navbar">
            <div className="layout-container">
                <div className="layout-page">
                    {!isLoginRoute ? (
                        <nav className="layout-navbar navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme">
                            <div className="container-xxl">
                                <div className="navbar-brand app-brand d-flex align-items-center gap-2">
                                    <span className="app-brand-logo">
                                        <i className="bx bxs-shopping-bags"></i>
                                    </span>
                                    <Link className="app-brand-text text-body fw-bold" to="/fo/products">
                                        EvalShop
                                    </Link>
                                </div>

                                <div className="navbar-nav align-items-center flex-grow-1">
                                    {/*
                                    <div className="nav-item d-flex align-items-center w-100">
                                        <i className="bx bx-search fs-4 lh-0"></i>
                                        <input
                                            type="text"
                                            className="form-control border-0 shadow-none ps-2"
                                            placeholder="Rechercher un produit..."
                                            aria-label="Recherche"
                                            disabled={isLoginRoute}
                                        />
                                    </div>
                                    */}
                                </div>

                                <div className="navbar-nav-right d-flex align-items-center gap-2">
                                    <div className="d-none d-lg-flex align-items-center gap-3 me-2">
                                        <Link className="nav-link" to="/fo/products">Produits</Link>
                                        {!isGuest && isAuthenticated ? (
                                            <Link className="nav-link" to="/fo/orders">Mes commandes</Link>
                                        ) : null}
                                        <Link className="nav-link" to="/fo/cart">
                                            <i className="bx bx-cart"></i>
                                            <span className="ms-1">Panier</span>
                                        </Link>
                                    </div>

                                    {isAuthenticated ? (
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge bg-label-primary">
                                                {isGuest ? "Invite" : `${user?.firstname || "Client"}`}
                                            </span>
                                            <button className="btn btn-outline-danger" onClick={handleLogout}>
                                                Deconnexion
                                            </button>
                                        </div>
                                    ) : (
                                        <Link className="btn btn-primary" to="/fo">
                                            Se connecter
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </nav>
                    ) : null}

                    <div className="content-wrapper">
                        <div className="container-xxl flex-grow-1 container-p-y">
                            <Outlet />
                        </div>

                        {!isLoginRoute ? (
                            <footer className="content-footer footer bg-footer-theme">
                                <div className="container-xxl">
                                    <div className="row g-4 py-3">
                                        <div className="col-md-4">
                                            <h6 className="mb-2">EvalShop</h6>
                                            <p className="mb-1">15 Rue du Commerce</p>
                                            <p className="mb-0">Paris, FR 75001</p>
                                        </div>
                                        <div className="col-md-4">
                                            <h6 className="mb-2">Informations</h6>
                                            <div className="d-flex flex-column">
                                                <Link className="text-body" to="#">CGV</Link>
                                                <Link className="text-body" to="#">FAQ</Link>
                                                <Link className="text-body" to="#">Contact</Link>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <h6 className="mb-2">Newsletter</h6>
                                            <div className="input-group">
                                                <input type="email" className="form-control" placeholder="Votre email" />
                                                <button className="btn btn-primary" type="button">S'inscrire</button>
                                            </div>
                                            <div className="d-flex gap-3 mt-3">
                                                <Link className="text-body" to="#"><i className="bx bxl-instagram"></i></Link>
                                                <Link className="text-body" to="#"><i className="bx bxl-facebook"></i></Link>
                                                <Link className="text-body" to="#"><i className="bx bxl-linkedin"></i></Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </footer>
                        ) : null}

                        <div className="content-backdrop fade"></div>
                    </div>
                </div>
            </div>
            <div className="layout-overlay layout-menu-toggle"></div>
        </div>
    );
}

export default FOMainLayout;