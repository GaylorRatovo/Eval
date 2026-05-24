# BODashboard

## 1. Présentation générale
- Rôle : Afficher des indicateurs commerciaux journaliers (commandes et paniers) et permettre le filtrage par dates et statut.
- Problème métier : Donner une vue synthétique des ventes et des paniers non convertis pour le suivi quotidien.
- Contexte d'utilisation : Utilisé par un administrateur BackOffice pour suivre l'activité commerciale.
- Utilisateurs : Administrateurs / responsables ventes.

## 2. Fonctionnement utilisateur
1. L'utilisateur ouvre la page `BODashboard`.
2. Les données (commandes, paniers, états de commande) sont chargées via `loadDashboardData()`.
3. L'utilisateur sélectionne un intervalle de dates et/ou un statut de commande.
4. Les tableaux et totaux se mettent à jour automatiquement.
5. L'utilisateur peut réinitialiser les filtres.

## 3. Flux de données
Utilisateur
    ↓
Page React `BODashboard.jsx`
    ↓
Hooks `useEffect`, `useMemo`
    ↓
Service `DashboardService.loadDashboardData()`
    ↓
DTO / Entities: `Order`, `OrderDetail`, `OrderState`, `Cart`
    ↓
(Backend PrestaShop via classes `entities/*`)

Paramètres transmis : filtres `dateMin`, `dateMax`, `statusId`.
Réponses reçues : tableaux `dashboardRows`, `cartDashboardRows`, liste `orderStates`.
Transformations : agrégation journalière, somme des totaux HT/TTC.

## 4. Logique métier
- Quoi : Agréger et filtrer commandes et paniers pour afficher indicateurs journaliers et totaux.
- Comment : `loadDashboardData()` récupère commandes, produits, catégories et paniers; fonctions utilitaires calculent totaux et agrègent par jour.
- Pourquoi : Permettre un suivi rapide de la performance commerciale.
- Quand : Au chargement de la page et à chaque modification des filtres.
- Prérequis : Accès aux données PrestaShop (orders, carts, order_states).
- Conséquences : Affichage de tableaux synthétiques et possibilité d'investigation via composants.

Vérifications métier : filtrage par état (exclusion d'états annulés côté service), conversion TTC→HT lors du calcul.

## 5. Explication du code
- Composant : `BODashboard.jsx` — gère l'état (loading, error, filtres), appelle `loadDashboardData` et calcule les agrégations.
- Hooks : `useEffect` (chargement initial), `useMemo` (calculs dérivés pour performance).
- Services : `DashboardService` — collecte données via `entities/*`, construit DTOs `OrderDashboardDTO`.
- DTO : `OrderDashboardDTO`, `OrderLineMetrics` — servent à normaliser les lignes du dashboard.
- Utilitaires : `dashboardUtils.formatAmount`, `getOrderStateLabel` pour affichage.

## 6. Analogies simples
Comme un tableau de bord de magasin : nombre de tickets (commandes), chiffre d'affaires HT/TTC, et paniers en attente.

## 7. Exemples concrets
- Filtrer du 2026-05-01 au 2026-05-15 et statut "Livré" → afficher les totaux et courbes journalières correspondantes.

## 8. Relations avec PrestaShop
- Ressources : `orders`, `order_details`, `order_states`, `carts`, `products`.
- Endpoints/Opérations : lecture via wrappers `entities/*` (`getAll`, `getBy`, `getById`).
- Impact : lecture seule (aucune modification effectuée depuis cette page).

## 9. Dépendances
- `BODashboardTable` (composant d'affichage)
- `DashboardService` (fonctions de calcul et agrégation)
- DTOs : `OrderDashboardDTO`, `OrderLineMetrics`

## 10. Résumé
- Résumé métier : Vue synthétique des ventes et des paniers pour suivi.
- Résumé technique : Charge les données via `DashboardService`, calcule agrégations et rend `BODashboardTable`.
- Points importants : Calculs TTC→HT, exclusion d'états annulés, performance via `useMemo`.
