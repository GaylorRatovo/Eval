# ProductWithCombinations

## Rôle
Regrouper un produit avec ses catégories et déclinaisons pour les calculs de stock et de statistiques.

## Fonction principale
### `listFromProductsWithCategories(products, categories)`
Construit une liste de produits enrichis avec les données nécessaires au regroupement métier.

## Exemple
```js
const productsWithDeclinaisons = await ProductWithCombinations.listFromProductsWithCategories(products, categories)
```
