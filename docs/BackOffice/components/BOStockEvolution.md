# BOStockEvolution

## Rôle
Afficher l'évolution journalière d'un produit ou d'une déclinaison avec filtrage par période.

## Fonctionnement
- Reçoit `combination` et `productDetails` du parent.
- Appelle `getDailyMovement` à chaque changement de sélection.
- Filtre les lignes selon `dateFrom` et `dateTo`.

## Exemple
```jsx
<BOStockEvolution combination={combination} productDetails={productDetails} />
```
