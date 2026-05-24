# BOOrderList

## 1. Présentation générale
- Rôle : Lister toutes les commandes et permettre la modification manuelle de leur état.
- Problème métier : Gérer les statuts de commandes (mise à jour, correction manuelle).
- Utilisateurs : Equipe support / préparation / gestion des commandes.

## 2. Fonctionnement utilisateur
1. La page charge toutes les commandes via `orderService.getOrderRows()`.
2. Le tableau `BOOrderRow` affiche les commandes avec cellule d'action (état + date + bouton modifier).
3. L'utilisateur peut sélectionner une commande et définir un nouvel état et une date de mise à jour.
4. En cliquant sur action, `orderService.updateOrderState()` est appelé.
4. Le résultat de l'action (succès/erreur) est affiché.

## 3. Flux de données
Utilisateur
    ↓
`BOOrderList.jsx` (état `orders`, `edit`)
    ↓
Service `OderService.getOrderRows()` pour lecture
    ↓
`OderService.updateOrderState()` pour écrire historique (`MyOrderState`)

## 4. Logique métier
- Quoi : Permettre la mise à jour de l'état d'une commande et l'enregistrement d'un historique.
- Comment : Construction d'un payload `MyOrderState.fromData(...)` et `save()` via classes entities.
- Pourquoi : Corriger des erreurs manuelles ou avancer manuellement une commande dans le process.
- Quand : À la demande via interface backoffice.

Vérifications métier : vérifie la présence d'un `newStateId` et d'une `dateUpdate` avant de soumettre.

## 5. Explication du code
- Composant : `BOOrderList.jsx` délègue l'affichage à `BOOrderRow` (table MaterialReactTable + cellule action).
- Hooks : `useEffect` pour chargement, `useState` pour l'édition et résultats d'action.
- Services : `OderService` (lecture et mise à jour d'état).
- DTO/Entities : `Order`, `OrderHistory`, `MyOrderState`.

## 6. Analogies
Comme un responsable de centre d'appels qui met à jour manuellement le statut d'une demande client après action.

## 7. Exemples concrets
- Mettre une commande en statut "Expédié" et renseigner la date d'expédition manuelle.

## 8. Relations avec PrestaShop
- Ressources : `orders`, `order_histories`, `order_states`.
- Endpoints : lecture (`getAll`, `getBy`) et écriture (`MyOrderState.save()`).

## 9. Dépendances
- `OderService.js`, `BOOrderRow.jsx`, entities `Order`, `OrderHistory`, `MyOrderState`.

## 10. Résumé
- Résumé métier : Outil de gestion manuelle des statuts de commandes.
- Résumé technique : `BOOrderRow` expose l'édition inline, `BOOrderList` conserve l'état d'édition et `OderService.updateOrderState` persiste l'historique.
