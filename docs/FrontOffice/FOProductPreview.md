# FOProductPreview

## 1. Présentation générale
- Rôle : Afficher les détails d'un produit, gérer sélection de déclinaison, quantité et ajout au panier.
- Utilisateurs : Clients.

## 2. Fonctionnement utilisateur
- Charge le produit par `id` via `Product.getById(id)`.
- Récupère images, prix TTC, tax rate, déclinaisons, stock et badge.
- Sélectionner une déclinaison met à jour le stock via `CartService.getStockForProductAttribute`.
- Ajouter au panier via `CartService.addProductToCart` nécessite client connecté (lecture user dans `localStorage`).
- Le prix affiché est recalculé avec l'impact de déclinaison.

## 3. Dépendances
- `Product` entity, `CartService` et hook `useLocalStorage` pour l'utilisateur.

## 4. Résumé
Page de détail produit permettant configuration (déclinaison/quantité) et ajout au panier avec checks de stock.
