# BOStockUpdate

## Rôle
Afficher les produits et déclinaisons, saisir une quantité de mouvement, puis mettre à jour `stock_available` et `stock_mvt`.

## Fonctionnement
- Charge les produits enrichis avec leurs stocks via `fetchProductWithStock`.
- Transforme les déclinaisons en sous-lignes.
- Crée un mouvement de stock avant de mettre à jour le stock courant.
- Réinitialise la saisie après succès.

## Exemple
```jsx
<BOStockUpdate setCombination={setCombination} setProductDetails={setProductDetails} />
```
