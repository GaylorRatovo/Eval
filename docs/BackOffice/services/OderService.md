# OderService

## Rôle
Gérer les commandes : lecture, mise à jour d'état, duplication d'un panier depuis une commande et création d'une commande à partir d'un panier.

## Fonctions
### `checkCartStock(cartRows = [], multiplicateur = 1)`
Vérifie que chaque ligne de panier reste inférieure ou égale au stock disponible.

### `getOrderRows()`
Charge les commandes, les clients et les états pour produire des lignes enrichies avec `customerName` et `orderStateName`.

### `getOrderRowsByCustomer(customerId)`
Même logique que `getOrderRows`, mais filtrée pour un client précis.

### `updateOrderState(orderId, newStateId, dateUpdate)`
Crée un `MyOrderState` après avoir validé la transition autorisée et normalisé la date.

### `createOrderFromCart(cart, customerId, date, clone = 0)`
Crée une commande à partir d'un panier, avec option de clonage pour générer plusieurs commandes identiques.

### `duplicateCart(orderId, multiplicateur, dateUpdate)`
Récupère le panier d'une commande puis délègue la duplication au `CartService`.

### `createOrderFromCartId(cartId, customerId, date, clone = 0)`
Charge un panier par son identifiant puis appelle `createOrderFromCart`.

## Exemple
```js
await orderService.updateOrderState(123, 5, '2026-05-25 10:00:00')
```

## Point métier important
Les transitions de statut sont limitées à un ensemble autorisé. La logique refuse les changements hors scénario attendu.
