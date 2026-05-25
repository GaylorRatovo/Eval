# FOCartRow

## Rôle
Rendre une ligne de panier avec déclinaison, quantité, prix ligne et suppression.

## Propriétés
- `row`: données enrichies de la ligne.
- `index`: index affiché et transmis aux callbacks.
- `onOptionChange`: changement de déclinaison.
- `onQuantityChange`: changement de quantité.
- `onDelete`: suppression de ligne.
- `formatPrice`: formatage des montants.

## Comportement
- Sélectionne automatiquement la première déclinaison si aucune n'est définie.
- Calcule le prix affiché à partir du TTC de base et de l'impact de prix.
- Calcule le total de ligne avec la quantité actuelle.

## Résumé
Ligne de panier interactive, responsable des actions unitaires sur un produit.
# FOCartRow

## Rôle
Afficher une ligne du panier avec image, déclinaison, stock, prix, quantité et suppression.

## Fonctions internes
### `getRowDisplayedPrice(rowValue)`
Calcule le prix TTC affiché en tenant compte de l'impact de la déclinaison et de la TVA.

### `getRowLineTotal(rowValue)`
Multiplie le prix affiché par la quantité.

### `handleChange(event)`
Déclenche le changement de déclinaison.

### `handleDecrease()` / `handleIncrease()`
Ajustent la quantité dans les limites du stock.

## Exemple
```jsx
<FOCartRow row={row} index={0} onOptionChange={fn} onQuantityChange={fn} onDelete={fn} formatPrice={formatPrice} />
```
