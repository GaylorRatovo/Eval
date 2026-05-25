# DashboardService

## Rôle
Préparer les données du tableau de bord BO : commandes, paniers sans commande, états de commande, agrégations journalières et totaux HT/TTC.

## Fonctions
### `sumRowsTotals(rows = [])`
Additionne les colonnes `totalHT` et `totalTTC` d'une collection de lignes.

Paramètres :
- `rows`: tableau de lignes contenant `totalHT` et `totalTTC`

Retour :
- `{ totalHT, totalTTC }`

Exemple :
```js
sumRowsTotals([{ totalHT: 10, totalTTC: 12 }, { totalHT: 5, totalTTC: 6 }])
// { totalHT: 15, totalTTC: 18 }
```

### `getCartRowTotals(cartRow)`
Calcule le total HT/TTC d'une ligne de panier à partir du produit, de la déclinaison et de la quantité.

### `buildCartDashboardRow(cart)`
Convertit un panier en ligne journalière agrégée avec la clé de jour, le total HT et le total TTC.

### `sumCartDashboardRowsTotals(rows = [])`
Alias de `sumRowsTotals` pour les paniers.

### `aggregateCartDashboardRowsByDay(rows = [])`
Regroupe les lignes de panier par jour et compte le nombre de paniers par jour.

### `loadDashboardData()`
Charge les catégories, produits, commandes, états de commande, détail des commandes et paniers sans commande, puis construit les lignes du dashboard.

### `filterDashboardRowsByDates(rows = [], dateMin = "", dateMax = "")`
Filtre les lignes par plage de dates inclusive.

### `filterDashboardRowsByStatus(rows = [], statusId = "all")`
Filtre les lignes de commande selon l'état choisi.

### `countDashboardRows(rows = [])`
Retourne le nombre de lignes.

### `sumDashboardRowsTotals(rows = [])`
Alias de `sumRowsTotals` pour les commandes.

### `aggregateDashboardRowsByDay(rows = [])`
Regroupe les lignes de commande par jour et compte les commandes du jour.

## Flux de données
`entities/*` -> `OrderDetail` / `OrderWithDetails` / `OrderLineMetrics` -> `OrderDashboardDTO` -> page `BODashboard`.

## Exemple global
```js
const data = await loadDashboardData()
const filtered = filterDashboardRowsByStatus(data.dashboardRows, 5)
const totals = sumDashboardRowsTotals(filtered)
```
