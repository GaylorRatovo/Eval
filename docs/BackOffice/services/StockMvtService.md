# StockMvtService

## Rôle
Construire l'évolution journalière d'un stock produit/déclinaison en croisant les mouvements de stock et les réservations liées aux commandes.

## Fonctions
### `getDailyMovement(idProduct, idProductAttribute, productDetails = null)`
Point d'entrée principal. Oriente vers la version simple ou la version avec déclinaisons.

### `getDailyMovementWithoutDeclination(idProduct, idProductAttribute, productDetails = null)`
Agrège les mouvements d'un produit simple ou d'une déclinaison précise.

### `aggregateByDay(movements)`
Regroupe les mouvements bruts par jour et calcule `totalIn`, `totalOut`, `net` et `final`.

### `resolveAllowedAttrIds(idProductAttribute, productDetails)`
Détermine quels `productAttributeId` sont autorisés pour la réservation et le calcul.

### `fetchDailyReservedMap(idProduct, allowedAttrIds, movements = [])`
Calcule les deltas journaliers de stock réservé à partir des commandes en cours ou livrées.

### `enrichWithReservations(dayBuckets, dailyReservedMap)`
Fusionne les mouvements et les réservations pour ajouter `reservedDaily`, `reserved` et `remaining`.

### `getDailyMovementWithDeclinations(idProduct, idProductAttribute, productDetails = null)`
Agrège les mouvements de toutes les déclinaisons d'un produit parent.

### `fetchDeclinationsFromDb(idProduct)`
Retrouve les déclinaisons directement depuis `products.associations.stockAvailables`.

## Exemple
```js
const rows = await getDailyMovement(12, 4, productDetails)
```

## Lecture métier
La quantité restante n'est pas seulement le stock physique, elle tient compte des réservations de commandes non encore libérées.
