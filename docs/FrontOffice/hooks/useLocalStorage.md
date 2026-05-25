# useLocalStorage

## Rôle
Synchroniser un état React avec `localStorage`.

## Fonction
### `useLocalStorage(key, initialValue)`
Retourne `[value, setStoredValue]`.

## Comportement
- Lit la valeur initiale depuis `localStorage` au premier rendu.
- Désérialise via `JSON.parse()`.
- Met à jour l'état local et `localStorage` en même temps.
- Supprime la clé si la nouvelle valeur vaut `null`.

## Point important
Le hook tolère une valeur invalide en revenant sur `initialValue`.
