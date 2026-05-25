# StockProductAvailability

## Rôle
Calculer la disponibilité produit à partir des mouvements, des réservations et du stock actuel.

## Fonction principale
### `listFromProductsAndStockData(...)`
Construit les lignes de disponibilité stock par produit ou déclinaison.

## Exemple
```js
const rows = StockProductAvailability.listFromProductsAndStockData(movements, orders, productsWithDecl, stockAvailables)
```
