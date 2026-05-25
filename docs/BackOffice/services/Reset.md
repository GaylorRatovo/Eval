# Reset

## Rôle
Définir l'ordre et les protections de la suppression en masse des ressources PrestaShop.

## Constantes
### `RESOURCES_TO_RESET`
Liste ordonnée des ressources supprimables : commandes, paniers, clients, produits, taxes, images, etc.

### `PROTECTED_IDS`
Liste des identifiants à préserver pour chaque type de ressource.

## Fonction
### `deleteAll(toDelete)`
Itère sur les ressources demandées et appelle `api.deleteAll(resource, protectedIds)` pour chacune.

## Exemple
```js
await deleteAll(['orders', 'order_histories', 'order_details'])
```

## Point métier
Cette logique doit rester réservée à un environnement de test ou de réinitialisation contrôlée.
