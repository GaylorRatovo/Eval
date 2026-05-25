# OrderPayload

## Rôle
Construire le payload métier nécessaire pour créer une commande PrestaShop à partir d'un panier.

## Méthodes
### `toNumber(value)`
Normalise une valeur numérique.

### `toSafeQty(value)`
Force une quantité à être au moins égale à 1.

### `getRowPriceTtc(product, attributeId)`
Retourne le prix TTC d'un produit ou d'une combinaison.

### `computeRowTotals(product, attributeId, qty)`
Calcule les totaux HT/TTC d'une ligne.

### `computeOrderTotals(cartRows = [])`
Additionne tous les totaux du panier.

### `buildTotalsPayload(totals)`
Prépare les champs `totalPaid`, `totalProducts`, etc.

### `buildOrderRows(cartRows = [])`
Convertit les lignes de panier en lignes de commande.

### `fromCart(cart, data = {})`
Construit un payload complet à partir d'un panier.

## Exemple
```js
const payload = OrderPayload.fromCart(cart, { customerId: 12 })
```
