# OrderLineMetrics

## Rôle
Convertir des commandes et des produits en lignes de métriques exploitables par catégorie et par produit.

## Fonctions principales
- `listFromOrderGroups`
- `groupByProductAndCombinationLines`
- `listFromProductsWithStockMovements`

## Exemple
```js
const metrics = OrderLineMetrics.listFromOrderGroups(orderGroups, productsWithDecl)
```
