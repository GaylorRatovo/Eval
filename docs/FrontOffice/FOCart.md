# FOCart

## 1. Présentation générale
- Rôle : Afficher et gérer le panier client (quantités, déclinaisons, suppression, total, passage en commande).
- Utilisateurs : Clients connectés.

## 2. Fonctionnement utilisateur
1. Chargement du dernier panier du client connecté via `CartService.getLastCartByCustomer`.
2. Vérification que le panier est actif (`CartService.isCartActive`).
3. Enrichissement des lignes via `CartWithDetails.enrich()` + compléments `Product`/stock.
4. Affichage des lignes du panier (`FOCartRow`), images, options et stock.
3. L'utilisateur modifie quantité/option ou supprime une ligne → `cart.update()` et `CartService` sont appelés.
4. L'utilisateur peut passer au checkout (si invité redirection vers `/fo/checkout`).

## 3. Flux de données
Utilisateur
    ↓
`FOCart.jsx` (state `cart`, `rowDetails`)
    ↓
`CartService` / `Cart` entity (lecture, update, delete, getStockForProductAttribute)
    ↓
`CartWithDetails` (enrichissement métier des lignes)
    ↓
`OderService.createOrderFromCart` pour créer la commande lors du checkout

## 4. Logique métier
- Vérification stock lors du changement de quantité.
- Calcul des totaux via `CartService.getCartTotals`.
- Persistance du panier par `cart.update()`.
- Fallback invité : redirection obligatoire vers `FOGuestCheckout` avant création de commande.

## 5. Relations PrestaShop
- Ressources : `carts`, `products`, `stock_availables`.

## 6. Dépendances
- `CartService`, `Cart` entity, `FOCartRow` component, `OderService`.
- `CartWithDetails` DTO pour enrichissement des lignes panier.

## 7. Résumé
Composant client pour gérer et finaliser les paniers, avec validations stock et persistance côté entité `Cart`.
