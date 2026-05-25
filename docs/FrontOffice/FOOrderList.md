# FOOrderList

## Rôle
Afficher les commandes du client et ses paniers non convertis en commande.

## Comportement
- Charge les commandes avec `orderService.getOrderRowsByCustomer()`.
- Charge les paniers sans commande avec `cartService.getCartWithoutOrderByCustomer()` puis `enrichCarts()`.
- Permet de dupliquer une commande avec une date et un multiplicateur.
- Permet de transformer un panier en commande.

## Données affichées
- `orders`: commandes du client.
- `carts`: paniers enrichis sans commande.
- `edit`: état local pour la duplication et la commande.

## Logique métier
- Les dates sont normalisées avec `formatDateInput()`.
- Les paniers reçoivent un libellé client et un état par défaut "En attente de commande".
- Après création d'une commande, les listes sont rechargées.

## Dépendances
- `src/backend/services/OderService.js`
- `src/backend/services/CartService.js`
- `src/backend/utils/utils.js`
- `src/components/FOOrderRow.jsx`
- `src/hooks/useLocalStorage.jsx`

## Résumé
Vue de suivi client pour relancer une commande ou convertir un panier existant.
# FOOrderList

## Présentation générale
`FOOrderList.jsx` affiche les commandes du client connecté ainsi que ses paniers sans commande. Elle permet de dupliquer une commande et de transformer un panier en commande.

## Fonctionnement utilisateur
1. La page charge les commandes du client avec `OderService.getOrderRowsByCustomer`.
2. Elle charge aussi les paniers sans commande via `CartService.getCartWithoutOrderByCustomer`.
3. Les paniers sont enrichis avec `CartService.enrichCarts`.
4. Une commande peut être dupliquée avec un multiplicateur.
5. Un panier peut être converti en commande via `createOrderFromCartId`.

## Flux de données
Utilisateur
	↓
`FOOrderList.jsx`
	↓
`OderService.getOrderRowsByCustomer`
	↓
`CartService.getCartWithoutOrderByCustomer` + `CartService.enrichCarts`
	↓
`FOOrderRow.jsx`
	↓
`OderService.duplicateCart` ou `OderService.createOrderFromCartId`

## Logique métier
Les commandes et les paniers sont affichés dans deux sections séparées pour éviter la confusion entre l'historique et les brouillons de commande. Le composant recharge les deux listes après création de commande pour rester cohérent.

## Exemples concrets
- Dupliquer une commande avec un multiplicateur de `2` revient à recréer son panier deux fois plus grand.
- Convertir un panier sans commande le retire de la liste des paniers en attente après succès.

## Relations avec PrestaShop
Ressources utilisées : `orders`, `carts`, `order_states`.

## Dépendances
- `src/backend/services/OderService.js`
- `src/backend/services/CartService.js`
- `src/components/FOOrderRow.jsx`
- `src/hooks/useLocalStorage.jsx`

## Voir aussi
- [FOOrderRow](components/FOOrderRow.md)
- [CartService](../BackOffice/services/CartService.md)

## Résumé
Vue client hybride pour l'historique des commandes et la gestion des paniers sans commande.
