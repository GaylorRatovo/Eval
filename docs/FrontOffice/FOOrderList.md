# FOOrderList

## 1. Présentation générale
- Rôle : Afficher les commandes d'un client ET ses paniers sans commande.
- Utilisateurs : Clients connectés.

## 2. Fonctionnement utilisateur
- Charge les commandes liées au client via `OderService.getOrderRowsByCustomer`.
- Charge aussi les paniers sans commande via `CartService.getCartWithoutOrderByCustomer` puis `CartService.enrichCarts`.
- Permet la duplication du panier d'une commande via `OderService.duplicateCart`.
- Permet de convertir un panier sans commande en commande via `OderService.createOrderFromCartId`.

## 3. Dépendances
- `OderService`, `CartService`, `FOOrderRow` composant, `useLocalStorage`.

## 4. Résumé
Vue client hybride commandes/paniers: duplication de commandes existantes et conversion directe des paniers en attente.
