import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';

/**
 * Page de connexion BackOffice (mode prototype local).
 * Regles metier: autorise l'acces uniquement si les identifiants en dur correspondent.
 * Methode: validation locale puis ecriture d'un flag d'authentification en localStorage.
 * Parametres: aucun.
 * Retour: JSX du formulaire de connexion.
 */
function BOLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('admin@gmail.com');
    const [password, setPassword] = useState('admin123');

	/**
	 * Verifie les identifiants saisis.
	 * Regles metier: comparaison stricte avec les credentials de test.
	 * Parametres: email (string), password (string).
	 * Retour: boolean.
	 */
    const checkCredentials = (email, password) => {
        if (email === 'admin@gmail.com' && password === 'admin123') {
            return true;
        }
        return false;
    };

	/**
	 * Soumet la connexion BackOffice.
	 * Parametres: e (submit event).
	 * Retour: void.
	 */
    const handleSubmit = (e) => {
		// Etape 1: empecher la soumission HTML native.
        e.preventDefault();
		// Etape 2: appliquer le controle d'acces.
        if (checkCredentials(email, password)) {
			// Etape 3: memoriser l'auth locale et rediriger vers les commandes.
            localStorage.setItem('boAuth', 'true');
            navigate('/orders', { replace: true }); 
        } else {
			// Etape 4: informer l'utilisateur en cas d'echec.
            alert('Email ou mot de passe incorrect.');
        }
    }

    return (
        <div className="container-xxl">
            <div className="row align-items-center min-vh-100 py-4">
                {/* Colonne branding */}
                <div className="col-12 col-lg-6 mb-4 mb-lg-0">
                    <div className="pe-lg-5">
                        <span className="badge bg-primary mb-3">BackOffice</span>
                        <h2 className="fw-bold mb-3">EvalShop Admin Console</h2>
                        <p className="text-body-secondary">
                            Acces reserve a l'equipe EvalShop pour la gestion des commandes, du stock et des imports.
                        </p>

                        <div className="d-flex gap-3 mt-4">
                            <div className="card border-0 shadow-sm p-3 flex-grow-1">
                                <i className="bx bx-shield-quarter text-primary fs-4"></i>
                                <p className="mb-0 mt-2 fw-semibold">Securite</p>
                                <p className="small text-body-secondary mb-0">Acces controle</p>
                            </div>
                            <div className="card border-0 shadow-sm p-3 flex-grow-1">
                                <i className="bx bx-bar-chart-alt text-info fs-4"></i>
                                <p className="mb-0 mt-2 fw-semibold">Pilotage</p>
                                <p className="small text-body-secondary mb-0">KPI temps reel</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Colonne formulaire */}
                <div className="col-12 col-lg-5 offset-lg-1">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <div className="mb-4">
                                <h4 className="mb-1">Connexion Backoffice</h4>
                                <p className="text-muted mb-0">Acces reserve a l'equipe EvalShop</p>
                            </div>

                            <form onSubmit={handleSubmit} className="d-grid gap-3">
                                {/* Email */}
                                <div>
                                    <label className="form-label">Email</label>
                                    <input
                                        className="form-control"
                                        type="text"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                {/* Mot de passe */}
                                <div>
                                    <label className="form-label">Mot de passe</label>
                                    <input
                                        className="form-control"
                                        type="password"
                                        placeholder="Mot de passe"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <button className="btn btn-primary" type="submit">
                                    Se connecter
                                </button>
                            </form>

                            <div className="text-center mt-3">
                                <Link className="text-body" to="/fo">Aller au FrontOffice</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BOLogin;