import React, { useState, useEffect } from 'react';
import Product from '../backend/entities/Product.js';
import { removeProductStock } from '../backend/services/StockRemovalService.js';

/**
 * Modal pour la sélection de catégorie et quantité à retirer.
 * 
 * Paramètres:
 * - onClose (function): callback pour fermer le modal
 * - productId (number): identifiant du produit
 * - productName (string): nom du produit pour affichage
 * 
 * Type de résultat:
 * - JSX.Element. Affiche un modal avec sélecteur de catégorie et champ quantité.
 * 
 * Comportement:
 * - Charge les attributs (catégories) du produit
 * - Permet de sélectionner une catégorie
 * - Permet de saisir la quantité à retirer
 * - Met à jour le stock via le service
 * - Affiche un message de succès ou erreur
 */
function RemoveStockModal({ onClose, productId, productName }) {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [quantity, setQuantity] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadProductCategories = async () => {
            try {
                setIsLoading(true);
                const product = new Product({ id: productId }, false);
                const attributes = await product.getAttributes();
                
                if (attributes && attributes.length > 0) {
                    setCategories(attributes);
                    setSelectedCategory(attributes[0].id);
                } else {
                    setError('No categories available for this product');
                }
                setIsLoading(false);
            } catch (err) {
                setError('Error loading product categories');
                console.error(err);
                setIsLoading(false);
            }
        };

        loadProductCategories();
    }, [productId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedCategory) {
            setError('Please select a category');
            return;
        }

        if (!quantity || quantity <= 0) {
            setError('Please enter a valid quantity');
            return;
        }

        try {
            setIsSaving(true);
            const result = await removeProductStock(
                productId,
                selectedCategory,
                parseInt(quantity)
            );
            
            setSuccess(`✓ Stock removed successfully! New quantity: ${result.newQuantity}`);
            setQuantity('');
            
            // Fermer le modal après 2 secondes
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setError(`Error removing stock: ${err.message}`);
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-body text-center py-5">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-warning">
                        <h5 className="modal-title">Remove Stock</h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onClose}
                            disabled={isSaving}
                        />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <p className="text-muted">Product: <strong>{productName}</strong></p>
                            
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                            
                            {success && (
                                <div className="alert alert-success" role="alert">
                                    {success}
                                </div>
                            )}

                            <div className="mb-3">
                                <label htmlFor="categorySelect" className="form-label">
                                    Category
                                </label>
                                <select
                                    className="form-select"
                                    id="categorySelect"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    disabled={isSaving || categories.length === 0}
                                >
                                    <option value="">-- Select a category --</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name || `Category ${cat.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="quantityInput" className="form-label">
                                    Quantity to Remove
                                </label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="quantityInput"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Enter quantity"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-warning"
                                disabled={!selectedCategory || !quantity || quantity <= 0 || isSaving}
                            >
                                {isSaving ? 'Removing...' : 'Remove Stock'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RemoveStockModal;
