# BOStatistic

## Présentation générale
`BOStatistic.jsx` produit des statistiques avancées sur les ventes, les coûts et la disponibilité du stock par catégorie. C'est la page d'analyse la plus dense du BackOffice.

## Fonctionnement utilisateur
1. La page charge produits, catégories, commandes, détails de commande, mouvements de stock et stocks disponibles.
2. L'utilisateur choisit une plage de dates.
3. Les métriques sont recalculées localement avec `useMemo`.
4. Trois tableaux présentent les ventes par catégorie, les coûts calculés depuis les mouvements, et la disponibilité stock.
5. Les pieds de tableaux affichent les totaux.

## Flux de données
Utilisateur
    ↓
`BOStatistic.jsx`
    ↓
Entities et DTOs : `Product`, `Category`, `Order`, `OrderDetail`, `StockMvt`, `StockAvailable`, `ProductWithCombinations`, `OrderWithDetails`, `OrderLineMetrics`, `OrderCategoryMetrics`, `StockProductAvailability`, `StockCategoryAvailability`
    ↓
Agrégations locales : filtrage par date, regroupement par catégorie, calculs de bénéfice et de stock

## Logique métier
La page croise les ventes et les coûts afin d'estimer la rentabilité par catégorie. Elle ne dépend pas d'une API de statistiques dédiée : tout est reconstruit à partir des entités du projet.

Les commandes annulées sont écartées, et les valeurs sont normalisées pour éviter les erreurs de format numérique.

## Explication du code
`useEffect` charge les données brutes. `useMemo` construit les métriques dérivées. `useMaterialReactTable` transforme les tableaux de données en vues interactives. Les colonnes sont calculées avec des fonctions d'accès et des pieds de colonne pour les totaux.

Fonctions clés du fichier : filtrage des commandes par date, construction des métriques de catégorie, calcul des coûts depuis les mouvements de stock, agrégation des disponibilités.

## Analogies simples
Comme un tableau de bord de direction qui compare les ventes réelles, le coût de revient et les stocks disponibles par rayon.

## Exemples concrets
- Choisir le mois dernier permet de voir quelles catégories ont généré le plus de bénéfice.
- Comparer la colonne de coût et la colonne de vente aide à détecter les produits peu rentables.

## Relations avec PrestaShop
Ressources utilisées : `products`, `categories`, `orders`, `order_details`, `stock_movements`, `stock_availables`.

## Dépendances
- `material-react-table`
- `src/backend/dto/*`
- `src/backend/entities/*`

## Voir aussi
- [StockMvtService](services/StockMvtService.md)
- [ProductService](services/ProductService.md)

## Résumé
Page d'analyse métier avancée, entièrement reconstruite à partir des données PrestaShop et recalculée côté client.
