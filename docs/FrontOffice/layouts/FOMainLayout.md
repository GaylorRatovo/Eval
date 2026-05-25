# FOMainLayout

## Rôle
Fournir la navigation FrontOffice selon le mode invité, connecté ou page d'entrée.

## Comportement
- Si `isGuest` est vrai, affiche `Products`, `My cart` et `Logout`.
- Si la route est `/fo`, rend seulement l'`Outlet` d'entrée.
- Sinon, affiche `Products`, `My orders`, `My cart` et `Logout`.

## Action
### `handleLogout()`
Supprime `user` et `isGuest` du `localStorage`, puis redirige vers `/fo`.

## Résumé
Layout principal qui adapte le menu selon le statut de session FrontOffice.
