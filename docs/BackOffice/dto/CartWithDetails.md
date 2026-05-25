# CartWithDetails

## Rôle
Enrichir un panier brut avec les informations produit utiles au checkout et au rendu visuel.

## Méthodes
### `fromCart(cart)`
Construit une instance à partir d'un panier brut.

### `getCartRowDetailsForRow(cartRow)`
Charge le produit, l'image, la déclinaison et le prix TTC d'une ligne.

### `enrich()`
Transforme toutes les lignes du panier en lignes enrichies et calcule les totaux.

### `toJSON()`
Retourne une structure simplifiée avec `id`, `customerId`, `dateAdd`, `totals` et `cartRows`.

## Exemple
```js
const cartWithDetails = await CartWithDetails.fromCart(cart).enrich()
```
