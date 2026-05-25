# FOProductCard

## Rôle
Afficher une carte produit minimale avec nom, prix et stock disponible.

## Propriétés
- `product`: objet produit affiché.

## Comportement
- Affiche le nom avec `Product.pickLang()`.
- Affiche le prix `TE` du produit.
- Utilise `quantity` ou `associations.stockAvailables[0].quantity` pour le stock.

## Résumé
Composant d'affichage simple, utile pour un aperçu rapide d'un produit.
# FOProductCard

## Rôle
Afficher une carte produit simple avec nom, prix et stock disponible.

## Fonctionnement
Le composant lit le nom via `Product.pickLang(product.name)` puis affiche le stock à partir de `product.quantity` ou du premier `stockAvailable`.

## Exemple
```jsx
<FOProductCard product={product} />
```
