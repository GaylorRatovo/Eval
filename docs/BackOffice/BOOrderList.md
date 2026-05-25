# BOOrderList

## Présentation générale
La page `BOOrderList.jsx` liste toutes les commandes et permet de modifier manuellement leur état. Elle sert à corriger ou à faire avancer un flux de commande quand une intervention humaine est nécessaire.

## Fonctionnement utilisateur
1. La page charge les commandes avec `orderService.getOrderRows()`.
2. `BOOrderRow` affiche les colonnes métier et une cellule d'action.
3. L'utilisateur choisit un état et une date.
4. Le bouton de modification appelle `orderService.updateOrderState()`.
5. Un message de succès ou d'erreur s'affiche au-dessus du tableau.

## Flux de données
Utilisateur
    ↓
`BOOrderList.jsx`
    ↓
`OderService.getOrderRows()`
    ↓
`BOOrderRow.jsx`
    ↓
`OderService.updateOrderState()`
    ↓
`MyOrderState.save()` puis historique de commande

## Logique métier
La page garde en mémoire la ligne en cours d'édition pour injecter l'état et la date dans la cellule d'action. Le service valide les transitions de statut autorisées avant d'écrire l'historique.

Cette page n'édite pas directement le texte affiché dans le tableau; elle crée une entrée métier dans PrestaShop.

## Explication du code
`useEffect` déclenche le chargement initial. `handleChange` stocke la ligne modifiée et la valeur du champ. `handleClick` construit les paramètres finaux à partir de l'état courant et appelle le service.

Fonctions utilisées : `getOrderRows`, `updateOrderState`, `formatDateInput`.

## Analogies simples
Comme un tableau de suivi des colis où l'opérateur peut forcer manuellement un changement de statut après vérification.

## Exemples concrets
- Passer une commande de `Paiement accepté` à `Livré` en saisissant une date d'expédition réelle.

## Relations avec PrestaShop
Ressources utilisées : `orders`, `order_histories`, `order_states`.

## Dépendances
- `src/backend/services/OderService.js`
- `src/components/BOOrderRow.jsx`
- `src/backend/utils/utils.js`

## Voir aussi
- [OderService](services/OderService.md)
- [BOOrderRow](components/BOOrderRow.md)

## Résumé
Liste opérationnelle des commandes avec édition inline du statut et journalisation via historique PrestaShop.
