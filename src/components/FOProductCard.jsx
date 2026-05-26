import { useState } from 'react';
import Product from "../backend/entities/Product.js";
import AdminPasswordModal from "./AdminPasswordModal.jsx";
import RemoveStockModal from "./RemoveStockModal.jsx";

/**
 * Carte FrontOffice d'un produit.
 *
 * Paramètres:
 * - `product` (object): produit à afficher.
 *
 * Type de résultat:
 * - JSX.Element. Rend le nom, le prix et le stock du produit.
 *
 * Ce que fait la fonction:
 * - Présente les informations essentielles d'un produit dans une carte compacte.
 * - Ajoute un lien pour retirer du stock (nécessite authentification admin).
 *
 * Règles métier:
 * - Le stock affiché provient soit du produit enrichi, soit de l'association stock disponible.
 * - La suppression de stock nécessite une authentification admin à deux étapes:
 *   1. Vérification du mot de passe admin
 *   2. Sélection de la catégorie et quantité à retirer
 *
 * Fonctionnement:
 * - Le nom est rendu dans la langue prioritaire via `Product.pickLang`.
 * - Le stock est calculé avec une valeur de repli si nécessaire.
 * - Deux modals gèrent le flux d'authentification et de suppression.
 *
 * Exemple d'utilisation:
 * - Input: `<FOProductCard product={product} />`
 * - Output attendu: une carte avec nom, prix, stock disponible et lien "Remove Stock".
 */
function FOProductCard({ product }) {
    const stockDispo = product.quantity ?? product.associations?.stockAvailables?.[0]?.quantity ?? 0;
    const productName = Product.pickLang(product.name);

    // États pour gérer les modals
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showRemoveStockModal, setShowRemoveStockModal] = useState(false);

    // Ouvrir le modal de mot de passe
    const handleRemoveStockClick = () => {
        setShowPasswordModal(true);
    };

    // Callback quand le mot de passe est correct
    const handlePasswordVerified = () => {
        setShowPasswordModal(false);
        setShowRemoveStockModal(true);
    };

    // Fermer tous les modals
    const handleCloseModals = () => {
        setShowPasswordModal(false);
        setShowRemoveStockModal(false);
    };

    return (
        <>
            <div>
                <h4>{productName}</h4>
                <p>Price TE: {product.price}$</p>
                <p>Stock dispo: {stockDispo}</p>
                <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleRemoveStockClick}
                    title="Remove stock from inventory (admin only)"
                >
                    🗑️ Remove Stock
                </button>
            </div>

            {/* Modal d'authentification admin */}
            {showPasswordModal && (
                <AdminPasswordModal
                    onSuccess={handlePasswordVerified}
                    onClose={handleCloseModals}
                    productId={product.id}
                />
            )}

            {/* Modal de suppression de stock */}
            {showRemoveStockModal && (
                <RemoveStockModal
                    onClose={handleCloseModals}
                    productId={product.id}
                    productName={productName}
                />
            )}
        </>
    );
}

export default FOProductCard;