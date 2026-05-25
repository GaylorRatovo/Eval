# FOCart

## Rôle
Afficher et modifier le panier courant du client connecté.

## Comportement
- Charge le dernier panier actif du client via `CartService.getLastCartByCustomer()`.
- Enrichit les lignes avec `CartWithDetails.enrich()`.
- Prépare chaque ligne avec nom produit, référence, image, déclinaisons, stock et prix TTC.
- Permet de changer la déclinaison, la quantité et de supprimer une ligne.
- Calcule les totaux HT et TTC côté client.

## Synchronisation
- Les modifications de ligne sont persistées dans le panier via `Cart.update()`.
- Le stock est rechargé après changement de déclinaison.
- Les quantités sont bornées par le stock disponible quand il est connu.

## Passage de commande
- Si l'utilisateur est invité, redirection vers `/fo/checkout`.
- Sinon, création de la commande via `OderService.createOrderFromCart()`.

## Dépendances
- `src/backend/services/CartService.js`
- `src/backend/services/OderService.js`
- `src/backend/dto/CartWithDetails.js`
- `src/components/FOCartRow.jsx`
- `src/hooks/useLocalStorage.jsx`

## Voir aussi
- [FOGuestCheckout](FOGuestCheckout.md)

## Résumé
Panier interactif, synchronisé avec le backend, avec calcul des totaux et déclenchement de commande.
# FOCart

## Présentation générale
`FOCart.jsx` affiche le panier d'un client connecté, permet de changer les déclinaisons, d'ajuster les quantités, de supprimer des lignes et de lancer le checkout.

## Fonctionnement utilisateur
1. La page charge le dernier panier du client via `CartService.getLastCartByCustomer`.
2. Elle vérifie que ce panier est encore actif.
3. Les lignes sont enrichies avec les données produit, image, déclinaison et stock.
4. L'utilisateur modifie une option, une quantité ou supprime une ligne.
5. Le panier est persisté dans PrestaShop.
6. Si l'utilisateur est invité, le checkout redirige vers la page de finalisation invité.

## Flux de données
Utilisateur
    ↓
`FOCart.jsx`
    ↓
`CartService` + `Cart` + `Product`
    ↓
`CartWithDetails`
    ↓
`FOCartRow.jsx`
    ↓
`OderService.createOrderFromCart` au moment du checkout

## Logique métier
La page limite les quantités au stock disponible, calcule les totaux avec `CartService.getCartTotals`, et réécrit le panier à chaque modification importante. Les lignes sont enrichies une seule fois au chargement pour éviter des requêtes répétées.

## Explication du code
`useEffect` charge le panier et construit `rowDetails`. `useMemo` calcule les totaux. `updateRow`, `updateCartRow` et `persistCartRows` gardent le state React et le panier persistant synchronisés.

Fonctions importantes : `getLastCartByCustomer`, `isCartActive`, `getStockForProductAttribute`, `deleteItems`, `addProductToCart`, `getCartTotals`, `createOrderFromCart`.

## Analogies simples
Comme un panier de supermarché numérique : on peut changer la variété d'un produit, retirer un article, voir le total, puis passer en caisse.

## Exemples concrets
- Changer une déclinaison d'une chemise met à jour le stock et le prix de la ligne.
- Supprimer la dernière ligne vide supprime aussi le panier côté base.

## Relations avec PrestaShop
Ressources utilisées : `carts`, `cart_rows`, `products`, `stock_availables`, `orders`.

## Dépendances
- `src/backend/services/CartService.js`
- `src/backend/services/OderService.js`
- `src/backend/dto/CartWithDetails.js`
- `src/components/FOCartRow.jsx`

## Voir aussi
- [FOCartRow](components/FOCartRow.md)
- [CartService](../BackOffice/services/CartService.md)

## Résumé
Panier client complet, avec enrichissement métier, contrôle de stock et passage à la commande.
