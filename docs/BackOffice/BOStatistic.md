# BOStatistic

## 1. Présentation générale
- Rôle : Fournir des statistiques détaillées (ventes par catégorie, disponibilité stock, coûts) avec filtres par date.
- Problème métier : Aider à la prise de décision (achat, promotions, réapprovisionnement).
- Utilisateurs : Responsables analytique, stock, achat.

## 2. Fonctionnement utilisateur
1. La page charge produits, catégories, mouvements de stock et commandes.
2. L'utilisateur ajuste `dateMin` / `dateMax` pour filtrer.
3. Les métriques sont recalculées via `useMemo` (pas via rechargement API).
4. Plusieurs tableaux MaterialReactTable affichent : ventes par catégorie, coût depuis mouvements, disponibilité stock.
5. Des totaux en pied de colonnes sont affichés pour les KPI principaux.

## 3. Flux de données
Utilisateur
    ↓
`BOStatistic.jsx` (date filters)
    ↓
Entities/DTOs : `Product`, `Category`, `Order`, `OrderDetail`, `StockMvt`, `StockAvailable`, `ProductWithCombinations`, `OrderWithDetails`, `OrderLineMetrics`, `OrderCategoryMetrics`, `StockProductAvailability`.
    ↓
Transformations : filtrage par date, groupBy, calculs (vente, achat, bénéfice, quantités physiques/réservées/disponibles), agrégations de totaux.

## 4. Logique métier
- Quoi : Croiser commandes, produits et mouvements de stock pour produire des métriques par catégorie.
- Comment : Lecture massive via entities, transformation en DTOs, agrégation et groupBy.
- Pourquoi : Mesurer performances et risques stock.
- Quand : Au chargement et à tout changement des dates.

Vérifications métier : exclusion d'états annulés sur les commandes; conversion et formatage des nombres.

## 5. Explication du code
- Composant : `BOStatistic.jsx` — orchestration des lectures et calculs, rendu via `MaterialReactTable`.
- Hooks : `useEffect` (chargement initial), `useMemo` (filtres + métriques + colonnes + totaux), `useState` (états de données).
- DTO/Entities : nombreux DTOs pour structurer les données et faciliter les agrégations.

## 6. Analogies
Comme un tableau de bord financier par département qui croise ventes, coûts et stock disponible.

## 7. Exemples concrets
- Filtrer un mois → afficher ventes totales par catégorie et comparer avec coûts pour estimer bénéfice.

## 8. Relations avec PrestaShop
- Ressources : `products`, `categories`, `orders`, `order_details`, `stock_movements`, `stock_availables`.
- Endpoints : lecture intensive via les wrappers `entities/*`.

## 9. Dépendances
- DTOs: `OrderLineMetrics`, `OrderCategoryMetrics`, `StockProductAvailability`, `StockCategoryAvailability`.
- Entities: `Product`, `Category`, `Order`, `StockMvt`, `StockAvailable`.

## 10. Résumé
- Résumé métier : Outil d'analyse pour ventes et disponibilité stock par catégorie.
- Résumé technique : Charge une base de données locale en mémoire puis recalcule toutes les vues analytiques avec `useMemo` à chaque changement de filtre date.
