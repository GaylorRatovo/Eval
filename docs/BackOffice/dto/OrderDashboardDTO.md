# OrderDashboardDTO

## Rôle
Transformer une collection de commandes en lignes prêtes pour le dashboard BO.

## Fonction principale
### `fromOrderCollection(orders, orderDetailsMetrics, orderStates)`
Produit les lignes affichées dans `BODashboard`.

## Exemple
```js
const rows = OrderDashboardDTO.fromOrderCollection(orders, metrics, orderStates)
```
