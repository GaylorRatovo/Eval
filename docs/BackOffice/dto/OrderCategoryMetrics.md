# OrderCategoryMetrics

## Rôle
Regrouper les métriques de vente par catégorie.

## Fonctions principales
- `groupByCategoryFromProductLines`
- `groupByCategoryFromTotals`

## Exemple
```js
const rows = OrderCategoryMetrics.groupByCategoryFromTotals(orderLineMetrics)
```
