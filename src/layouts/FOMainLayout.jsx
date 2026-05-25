import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

function FOMainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    // const [searchTerm, setSearchTerm] = useState("");

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

    // const handleSearchChange = (event) => {
    //     const nextValue = event.target.value;
    //     setSearchTerm(nextValue);
    //
    //     const query = nextValue.trim();
    //     const target = query ? `/fo/products?q=${encodeURIComponent(query)}` : "/fo/products";
    //     navigate(target, { replace: true });
    // };

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
                                    <div className="nav-item d-flex align-items-center w-100" style={{ maxWidth: "400px" }}>
                                        <i className="bx bx-search fs-4 lh-0"></i>
                                        <input
                                            type="text"
                                            className="form-control border-0 shadow-none ps-2"
                                            placeholder="Rechercher un produit..."
                                            aria-label="Recherche"
                                            // value={searchTerm}
                                            // onChange={handleSearchChange}
                                        />
                                    </div>
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
                                    <div className="row g-4 py-5">
                                        {/* À propos */}
                                        <div className="col-12 col-md-3">
                                            <div className="d-flex align-items-center gap-2 mb-3">
                                                <i className="bx bxs-shopping-bags fs-5" style={{ color: "var(--bs-primary)" }}></i>
                                                <h6 className="mb-0 fw-bold">EvalShop</h6>
                                            </div>
                                            <p className="text-body-secondary small mb-3">
                                                Votre boutique en ligne de confiance pour tous vos besoins. Découvrez une sélection qualité de produits à prix compétitifs.
                                            </p>
                                            <div className="d-flex gap-3">
                                                <Link className="text-body-secondary" to="#" title="Facebook">
                                                    <i className="bx bxl-facebook fs-5"></i>
                                                </Link>
                                                <Link className="text-body-secondary" to="#" title="Instagram">
                                                    <i className="bx bxl-instagram fs-5"></i>
                                                </Link>
                                                <Link className="text-body-secondary" to="#" title="Twitter">
                                                    <i className="bx bxl-twitter fs-5"></i>
                                                </Link>
                                                <Link className="text-body-secondary" to="#" title="LinkedIn">
                                                    <i className="bx bxl-linkedin fs-5"></i>
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Informations */}
                                        <div className="col-12 col-md-2">
                                            <h6 className="mb-3 fw-bold">Informations</h6>
                                            <div className="d-flex flex-column gap-2">
                                                <Link className="text-body-secondary text-decoration-none small" to="#">À propos</Link>
                                                <Link className="text-body-secondary text-decoration-none small" to="#">CGV</Link>
                                                <Link className="text-body-secondary text-decoration-none small" to="#">Politique de confidentialité</Link>
                                                <Link className="text-body-secondary text-decoration-none small" to="#">FAQ</Link>
                                            </div>
                                        </div>

                                        {/* Aide */}
                                        <div className="col-12 col-md-2">
                                            <h6 className="mb-3 fw-bold">Aide</h6>
                                            <div className="d-flex flex-column gap-2">
                                                <Link className="text-body-secondary text-decoration-none small" to="#">Nous contacter</Link>
                                                <Link className="text-body-secondary text-decoration-none small" to="#">Suivi de commande</Link>
                                                <Link className="text-body-secondary text-decoration-none small" to="#">Retours & Échanges</Link>
                                                <Link className="text-body-secondary text-decoration-none small" to="#">Livraison</Link>
                                            </div>
                                        </div>

                                        {/* Contact & Newsletter */}
                                        <div className="col-12 col-md-5">
                                            <h6 className="mb-3 fw-bold">Newsletter</h6>
                                            <p className="text-body-secondary small mb-3">
                                                Inscrivez-vous pour recevoir nos meilleures offres et actualités.
                                            </p>
                                            <div className="input-group input-group-sm mb-3">
                                                <input 
                                                    type="email" 
                                                    className="form-control" 
                                                    placeholder="Votre adresse email" 
                                                    aria-label="Email"
                                                />
                                                <button className="btn btn-primary" type="button">S'inscrire</button>
                                            </div>
                                            <h6 className="mb-2 fw-bold small">Nous contacter</h6>
                                            <p className="text-body-secondary small mb-1">
                                                <i className="bx bx-phone me-2"></i> +33 1 23 45 67 89
                                            </p>
                                            <p className="text-body-secondary small mb-1">
                                                <i className="bx bx-envelope me-2"></i> contact@evalshop.fr
                                            </p>
                                            <p className="text-body-secondary small">
                                                <i className="bx bx-map me-2"></i> 15 Rue du Commerce, 75001 Paris
                                            </p>
                                        </div>
                                    </div>

                                    {/* Divider & Copyright */}
                                    <div className="row">
                                        <div className="col-12">
                                            <hr className="my-3" />
                                            <div className="d-flex justify-content-between align-items-center py-3 flex-wrap gap-2">
                                                <p className="text-body-secondary small mb-0">
                                                    © 2026 EvalShop. Tous droits réservés.
                                                </p>
                                                <div className="d-flex gap-3">
                                                    <Link className="text-body-secondary text-decoration-none small" to="#">Conditions d'utilisation</Link>
                                                    <span className="text-body-secondary">•</span>
                                                    <Link className="text-body-secondary text-decoration-none small" to="#">Politique de cookies</Link>
                                                </div>
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