# dashboardUtils

## Rôle
Helpers dédiés aux tableaux du dashboard BO.

## Fonctions
### `toNumber(value)`
Convertit une valeur en nombre ou retourne `null`.

### `pickOrderAmount(...values)`
Retourne le premier montant numérique exploitable parmi plusieurs valeurs.

### `getOrderDayKey(order)`
Retourne la date de commande au format jour `YYYY-MM-DD`.

### `getCartDayKey(cart)`
Retourne la date de création du panier au format jour.

### `getOrderStateLabel(state)`
Récupère le libellé lisible d'un état de commande.

### `formatAmount(value)`
Formate un montant à deux décimales.

## Exemple
```js
const label = getOrderStateLabel(state)
const amount = formatAmount(12.345)
```
