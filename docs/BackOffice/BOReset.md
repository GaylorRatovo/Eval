# BOReset

## Présentation générale
`BOReset.jsx` permet de supprimer en masse des ressources PrestaShop pour remettre à zéro un environnement de test ou de démonstration. C'est un outil de maintenance, pas une fonctionnalité métier classique.

## Fonctionnement utilisateur
1. L'utilisateur coche les ressources à supprimer.
2. Il peut tout sélectionner ou tout désélectionner.
3. `deleteAll(selected)` est appelé au clic sur `Valider`.
4. Les suppressions sont réalisées dans l'ordre défini dans `RESOURCES_TO_RESET`.

## Flux de données
Utilisateur
    ↓
`BOReset.jsx`
    ↓
`deleteAll(selected)`
    ↓
`api.deleteAll(resource, protectedIds)`
    ↓
Suppression des collections PrestaShop avec exclusions des IDs protégés

## Logique métier
Le composant transforme la liste des ressources à supprimer en `Set`, puis applique un tri métier pour conserver l'ordre de nettoyage. La protection des IDs critiques empêche la suppression d'objets nécessaires au fonctionnement minimal de la boutique.

## Explication du code
`useMemo` prépare une map ordonnée des ressources. `toggleItem` ajoute ou retire une ressource du `Set`. `toggleAll` bascule entre aucune sélection et toute la liste. `doDelete` appelle le service de suppression.

Fonctions et constantes : `RESOURCES_TO_RESET`, `PROTECTED_IDS`, `deleteAll`.

## Analogies simples
Comme vider un atelier en retirant les outils rangés sur une liste, tout en laissant en place les équipements indispensables.

## Exemples concrets
- Supprimer `orders`, `order_details` et `order_histories` pour repartir sur une boutique de test vide.

## Relations avec PrestaShop
Ressources possibles : `orders`, `order_details`, `customers`, `addresses`, `products`, `categories`, `stock_movements`, `images`, `taxes`, `tax_rules`, `tax_rule_groups`.

## Dépendances
- `src/backend/services/Reset.js`
- `src/backend/utils/api.js`

## Voir aussi
- [Reset](services/Reset.md)

## Résumé
Outil dangereux mais utile pour les environnements de test, avec une protection explicite des données critiques.
