# BODashboard

## Présentation générale
La page `BODashboard.jsx` affiche les indicateurs quotidiens du BackOffice : nombre de commandes, total HT/TTC, nombre de paniers sans commande, et vue journalière des volumes. Elle sert à suivre l'activité commerciale sans modifier les données.

## Fonctionnement utilisateur
1. L'utilisateur ouvre la page.
2. `useEffect` déclenche `loadDashboardData()`.
3. Les commandes, paniers et états de commande sont chargés une seule fois.
4. Les filtres `dateMin`, `dateMax` et `statusId` recalculent instantanément les tableaux.
5. Le bouton de réinitialisation remet les filtres à l'état initial.

## Flux de données
Utilisateur
    ↓
`BODashboard.jsx`
    ↓
`DashboardService.loadDashboardData()`
    ↓
Entities et DTOs : `Category`, `Product`, `Order`, `OrderDetail`, `OrderState`, `Cart`, `OrderDashboardDTO`, `OrderLineMetrics`
    ↓
Agrégations locales : `filterDashboardRowsByDates`, `filterDashboardRowsByStatus`, `aggregateDashboardRowsByDay`, `sumDashboardRowsTotals`

Paramètres transmis : dates de filtre et statut sélectionné.
Résultats affichés : totaux agrégés, lignes journalières, paniers journaliers.

## Logique métier
`loadDashboardData()` exclut les commandes annulées, récupère les paniers sans commande, puis transforme les données brutes en lignes exploitables par l'interface. Les calculs sont dérivés côté client pour éviter de recharger l'API à chaque filtre.

Cette page ne fait aucune écriture. Elle ne sert qu'à lire, agréger et présenter les données.

## Explication du code
`useEffect` charge les données au montage. `useMemo` évite de recalculer les agrégations tant que les entrées n'ont pas changé. `BODashboardTable` rend les tableaux réutilisables, avec un comptage configurable pour les commandes ou les paniers.

Fonctions utilisées : `loadDashboardData`, `filterDashboardRowsByDates`, `filterDashboardRowsByStatus`, `aggregateDashboardRowsByDay`, `aggregateCartDashboardRowsByDay`, `sumDashboardRowsTotals`, `sumCartDashboardRowsTotals`, `countDashboardRows`.

## Analogies simples
Comme le tableau de bord d'un magasin : le nombre de tickets, le chiffre d'affaires, et les paniers restés au stade de brouillon.

## Exemples concrets
- Filtrer du `2026-05-01` au `2026-05-15` avec le statut `Livré` affiche uniquement les commandes livrées sur la période.
- Réinitialiser les filtres remet immédiatement tous les totaux globaux.

## Relations avec PrestaShop
Ressources utilisées : `orders`, `order_details`, `order_states`, `carts`, `products`, `categories`.
La page consomme uniquement les lectures exposées par les entités du projet.

## Dépendances
- `src/backend/services/DashboardService.js`
- `src/components/BODashboardTable.jsx`
- `src/backend/utils/dashboardUtils.js`

## Voir aussi
- [DashboardService](services/DashboardService.md)
- [BODashboardTable](components/BODashboardTable.md)

## Résumé
Page d'analyse commerciale en lecture seule, centrée sur les agrégations journalières et les filtres de consultation.
