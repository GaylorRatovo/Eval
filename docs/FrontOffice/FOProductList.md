# FOProductList

## 1. Présentation générale
- Rôle : Afficher la liste des produits du catalogue avec image, stock et accès à l'aperçu produit.
- Utilisateurs : Clients (visiteurs connectés ou anonymes).

## 2. Fonctionnement utilisateur
- Charge tous les produits via `Product.getAll()`.
- Récupère images, quantité et badges par produit (enrichissement côté page).
- Permet l'accès à la page d'aperçu du produit (`/fo/product/preview/:id`).

## 3. Dépendances
- `Product` entity, `CartService` (indirectement pour availability), composants UI.

## 4. Résumé
Page catalogue affichant produits, visuels et informations de stock, permettant navigation vers l'aperçu produit.
