import React, { useState } from 'react';
import { verifyAdminPassword } from '../backend/services/StockRemovalService.js';

/**
 * Modal pour l'authentification admin avant suppression de stock.
 * 
 * Paramètres:
 * - onSuccess (function): callback appelé si le mot de passe est correct
 * - onClose (function): callback pour fermer le modal
 * - productId (number): identifiant du produit
 * 
 * Type de résultat:
 * - JSX.Element. Affiche un modal avec champ de saisie du mot de passe.
 * 
 * Comportement:
 * - Demande le mot de passe admin
 * - Valide les identifiants
 * - Appelle onSuccess si correct, affiche erreur sinon
 */
function AdminPasswordModal({ onSuccess, onClose, productId }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Vérifier le mot de passe
        if (verifyAdminPassword(password)) {
            setIsLoading(false);
            onSuccess(); // Passer à l'étape suivante
        } else {
            setError('Mot de passe admin incorrect');
            setPassword('');
            setIsLoading(false);
        }
    };

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title">Admin Authentication Required</h5>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            onClick={onClose}
                            disabled={isLoading}
                        />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <p>Please enter the admin password to remove stock:</p>
                            <div className="mb-3">
                                <label htmlFor="adminPassword" className="form-label">
                                    Admin Password
                                </label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="adminPassword"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    autoFocus
                                    disabled={isLoading}
                                />
                            </div>
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-danger"
                                disabled={!password || isLoading}
                            >
                                {isLoading ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdminPasswordModal;
