# BOReset

## 1. Présentation générale
- Rôle : Interface pour supprimer en masse des ressources PrestaShop (utilisé pour réinitialiser un environnement de test).
- Problème métier : Rapide nettoyage d'une boutique de développement/test.
- Utilisateurs : Développeurs, intégrateurs, administrateurs de test.

## 2. Fonctionnement utilisateur
1. L'utilisateur coche les ressources à supprimer (liste `RESOURCES_TO_RESET`).
2. Il peut sélectionner/désélectionner tout.
3. En cliquant sur «Valider», `deleteAll(selected)` appelle l'API pour effacer les ressources sélectionnées.

## 3. Flux de données
Utilisateur
    ↓
`BOReset.jsx` (Set `selected`)
    ↓
Service `Reset.deleteAll(selected)`
    ↓
Utilitaire `api.deleteAll(resource, protectedIds)` exécute les suppressions via l'API.

## 4. Logique métier
- Quoi : Supprimer des collections d'objets dans un ordre défini (order property dans `RESOURCES_TO_RESET`).
- Comment : `deleteAll` itère et appelle `api.deleteAll` pour chaque ressource, en respectant `PROTECTED_IDS`.
- Pourquoi : Remise à zéro d'un environnement de test.
- Quand : À la demande explicite de l'utilisateur.

Vérifications métier : liste `PROTECTED_IDS` pour empêcher la suppression d'IDs critiques (ex : catégories racines, client admin).

## 5. Explication du code
- Composant : `BOReset.jsx` — affichage des ressources, sélection et confirmation.
- Services : `Reset.js` — liste `RESOURCES_TO_RESET`, `PROTECTED_IDS`, et `deleteAll`.
- Utilitaires : `api.deleteAll` pour effectuer la suppression côté backend/API.

## 6. Analogies
Comme un bouton de réinitialisation d'une base de données de test qui efface des tables choisies.

## 7. Exemples concrets
- Sélectionner `orders`, `order_histories`, `order_details` → Valider → La boutique de test est vidée des commandes.

## 8. Relations avec PrestaShop
- Ressources : `orders`, `order_details`, `customers`, `products`, `stock_movements`, `categories`, etc.
- Endpoints : suppression en masse via `api.deleteAll` (wrapper autour des appels API REST/ORM).

## 9. Dépendances
- `Reset.js`, `api` utilitaire, `RESOURCES_TO_RESET`.

## 10. Résumé
- Résumé métier : Outil de nettoyage d'environnement.
- Résumé technique : Supprime des ressources en respectant des IDs protégés ; dangereux en production.
