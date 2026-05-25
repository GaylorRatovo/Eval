# BODashboardTable

## Rôle
Composant de tableau réutilisable pour afficher les lignes journalières du dashboard BO.

## Propriétés
- `rows`: lignes à afficher.
- `countHeader`: libellé de la colonne de comptage.
- `countKey`: clé de comptage utilisée dans les lignes.

## Fonctionnement
Le composant construit les colonnes `Jour`, `Commandes` ou `Paniers`, `Total HT` et `Total TTC`, puis délègue le rendu à `MaterialReactTable`.

## Exemple
```jsx
<BODashboardTable rows={dailyRows} countHeader="Paniers" countKey="cartsCount" />
```
