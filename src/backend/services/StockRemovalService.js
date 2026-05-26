import api from "../utils/api";
import StockAvailable from "../entities/StockAvailable";

/**
 * Service pour gérer la suppression de stock de produits.
 * 
 * Fonctionnalités:
 * - Vérifier les credentials admin
 * - Retirer du stock pour un produit et une catégorie
 * - Mettre à jour le stock dans la base de données
 */

const ADMIN_PASSWORD = 'admin123';

/**
 * Vérifie si le mot de passe fourni est correct.
 * 
 * Paramètres:
 * - password (string): le mot de passe à vérifier
 * 
 * Retour: boolean - true si correct, false sinon
 */
export const verifyAdminPassword = (password) => {
    return password === ADMIN_PASSWORD;
};

/**
 * Retire une quantité de stock pour un produit dans une catégorie spécifique.
 * 
 * Paramètres:
 * - productId (number): identifiant du produit
 * - categoryId (number): identifiant de la catégorie
 * - quantityToRemove (number): quantité à retirer
 * 
 * Retour: Promise<object> - données de mise à jour du stock
 * 
 * Règles métier:
 * - La quantité ne peut pas être négative
 * - L'opération met à jour la base de données via l'API
 */
export const removeProductStock = async (productId, categoryId, quantityToRemove) => {
    try {
        const stockAvailable = new StockAvailable({}, false);
        
        // Récupérer le stock actuel pour ce produit et cette catégorie
        const currentStocks = await stockAvailable.getList({
            id_product: productId,
            id_product_attribute: categoryId
        });

        if (!currentStocks || currentStocks.length === 0) {
            throw new Error('Stock not found for this product and category');
        }

        const currentStock = currentStocks[0];
        const newQuantity = Math.max(0, currentStock.quantity - quantityToRemove);

        // Mettre à jour le stock
        currentStock.quantity = newQuantity;
        await currentStock.save();

        return {
            success: true,
            message: `Stock updated successfully. Quantity reduced from ${currentStock.quantity + quantityToRemove} to ${newQuantity}`,
            newQuantity: newQuantity
        };
    } catch (error) {
        console.error('Error removing stock:', error);
        throw error;
    }
};

export default {
    verifyAdminPassword,
    removeProductStock
};
