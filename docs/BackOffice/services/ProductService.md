# ProductService

## Rôle
Lire les produits et les regrouper avec les stocks, puis proposer des filtres de catalogue côté FrontOffice et BackOffice.

## Fonctions
### `fetchProductWithStock()`
Charge les produits, leurs stocks globaux et leurs déclinaisons, puis retourne une structure exploitable par `BOStockUpdate`.

### `filterProductsByPrice(products, minPrice = 0, maxPrice = 0)`
Filtre les produits selon une plage de prix TTC.

### `filterProductsByCategory(products, categoryId)`
Conserve les produits appartenant à une catégorie donnée.

### `filterProductsByName(products, name = "")`
Filtre les produits sur le nom affiché.

### `filterProducts({ products, minPrice = 0, maxPrice = 0, categoryId = null, name = "" })`
Compose les trois filtres précédents.

## Exemple
```js
const filtered = filterProducts({ products, name: 'chaise', minPrice: 20, maxPrice: 100 })
```
