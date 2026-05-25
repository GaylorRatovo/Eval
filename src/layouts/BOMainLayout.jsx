import {Link, Navigate, Outlet, useLocation, useNavigate} from "react-router-dom";

function BOMainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isAuthed = localStorage.getItem("boAuth") === "true";
    const isLoginRoute = location.pathname === "/";

    const handleLogout = () => {
        localStorage.removeItem("boAuth");
        navigate("/");
    };

    if (!isAuthed && !isLoginRoute) {
        return <Navigate to="/" replace />;
    }

    if (isLoginRoute) {
        return isAuthed ? <Navigate to="/orders" replace /> : <Outlet />;
    }

    return (
        <div className="layout-wrapper layout-content-navbar">
            <div className="layout-container">
                <div className="layout-page">
                    <nav className="layout-navbar navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme">
                        <div className="container-xxl">
                            <div className="navbar-brand app-brand d-flex align-items-center gap-2">
                                <span className="app-brand-logo">
                                    <i className="bx bxs-dashboard"></i>
                                </span>
                                <Link className="app-brand-text text-body fw-bold" to="/dashboard">
                                    EvalShop BO
                                </Link>
                            </div>

                            <div className="navbar-nav-right d-flex align-items-center gap-3">
                                <div className="d-none d-lg-flex align-items-center gap-3 me-2">
                                    <Link className="nav-link" to="/dashboard">Dashboard</Link>
                                    <Link className="nav-link" to="/statistics">Statistiques</Link>
                                    <Link className="nav-link" to="/orders">Commandes</Link>
                                    <Link className="nav-link" to="/stocks">Stocks</Link>
                                    <Link className="nav-link" to="/import">Import</Link>
                                    <Link className="nav-link" to="/reset">Reset</Link>
                                </div>
                                <button className="btn btn-outline-danger" type="button" onClick={handleLogout}>Logout</button>
                            </div>
                        </div>
                    </nav>

                    <div className="content-wrapper">
                        <div className="container-xxl flex-grow-1 container-p-y">
                            <Outlet/>
                        </div>

                        <footer className="content-footer footer bg-footer-theme">
                            <div className="container-xxl">
                                <div className="row g-2 py-3">
                                    <div className="col-md-6">
                                        <h6 className="mb-1">EvalShop BackOffice</h6>
                                        <p className="mb-0 text-muted">Console de gestion interne</p>
                                    </div>
                                    <div className="col-md-6 text-md-end">
                                        <span className="text-muted">Support interne</span>
                                    </div>
                                </div>
                            </div>
                        </footer>

                        <div className="content-backdrop fade"></div>
                    </div>
                </div>
            </div>
            <div className="layout-overlay layout-menu-toggle"></div>
        </div>
    )
}

export default BOMainLayout;