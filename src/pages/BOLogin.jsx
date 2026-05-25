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
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card mt-5">
                        <div className="card-body">
                            <div className="text-center mb-4">
                                <h4 className="mb-1">Connexion Backoffice</h4>
                                <p className="text-muted">Acces reserve a l'equipe EvalShop</p>
                            </div>
                            <form onSubmit={handleSubmit} className="d-grid gap-3">
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
                                <button className="btn btn-primary" type="submit">Se connecter</button>
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