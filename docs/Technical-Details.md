# Détails techniques — DTOs, Services, Hooks, Composants

## DTOs détectés
- `src/backend/dto/StockProductAvailability.js`
- `src/backend/dto/StockCategoryAvailability.js`
- `src/backend/dto/ProductWithCombinations.js`
- `src/backend/dto/OrderWithDetails.js`
- `src/backend/dto/OrderPayload.js`
- `src/backend/dto/OrderLineMetrics.js`
- `src/backend/dto/OrderDashboardDTO.js`
- `src/backend/dto/OrderCategoryMetrics.js`

Rôle général : normaliser les structures issues des entities pour calculs, agrégations et affichage.

## Services identifiés
- `src/backend/services/DashboardService.js` — agrégations du dashboard, calculs TTC/HT, lecture carts sans commande.
- `src/backend/services/OderService.js` — lecture des commandes, création d'order depuis cart, mise à jour d'état, duplication de carts.
- `src/backend/services/Reset.js` — liste des ressources réinitialisables et suppression en masse.
- `src/backend/services/StockMvtService.js` — gestion des mouvements de stock (lecture / écriture).
- `src/backend/services/ProductService.js` — opérations produit (parsing/import & recherche).
- `src/backend/services/DashboardService.js` — (déjà listé) utilities pour dashboard.
- `src/backend/services/import/*` — `executeImport.js`, `importFile1..4.js` pour orchestrer imports CSV/ZIP.
- `src/backend/services/CartService.js`, `CustomerService.js` — services utilitaires pour paniers/clients.

## Hooks
- `src/hooks/useLocalStorage.jsx` — hook utilitaire pour stocker/récupérer dans `localStorage`.

## Entities clés (wrappers autour de l'API PrestaShop)
- `Product`, `Category`, `Order`, `OrderDetail`, `OrderState`, `OrderHistory`, `MyOrderState`, `StockAvailable`, `StockMvt`, `Cart`, `Customer`.

## Cartographie rapide
- `BODashboard.jsx` → `DashboardService` → DTO `OrderDashboardDTO`, entities `Order`, `OrderDetail`, `Cart`.
- `BOOrderList.jsx` → `OderService` → `MyOrderState` / `OrderHistory` pour persister changements d'état.
- `BOImport.jsx` → `executeImport.js` → `importFile1..4.js` → entities `Product`, `Combination`, `Customer`, `Order`.
- `BOStock.jsx` → `BOStockUpdate`/`BOStockEvolution` → `StockMvtService` / `StockAvailable`.

## Recommandations techniques
- Centraliser la gestion des erreurs dans les services (uniformiser shape { success, error }).
- Remplacer `BOLogin` par un flow d'auth réel avant toute mise en prod.
- Ajouter tests unitaires pour `importFile*` et `OderService.createOrderFromCart` (gestion stock).

