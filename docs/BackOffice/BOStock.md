# BOStock

## 1. Présentation générale
- Rôle : Interface pour mettre à jour le stock d'une combinaison produit/déclinaison et visualiser l'historique (évolution).
- Problème métier : Ajuster manuellement les quantités et consulter les mouvements de stock.
- Utilisateurs : Gestionnaires de stock, administrateurs BackOffice.

## 2. Fonctionnement utilisateur
1. L'utilisateur sélectionne une combinaison via `BOStockUpdate`.
2. `BOStockUpdate` transmet au parent à la fois `combination` et `productDetails`.
3. Le composant parent `BOStock` transmet ces deux données à `BOStockEvolution`.
3. L'utilisateur modifie les quantités (via `BOStockUpdate`) ou consulte l'historique (via `BOStockEvolution`).

## 3. Flux de données
Utilisateur
    ↓
`BOStock.jsx` (états `combination`, `productDetails`)
    ↓
`BOStockUpdate` (émet `setCombination` et `setProductDetails`)
    ↓
`BOStockEvolution` (lit `combination` + `productDetails`, puis appelle `StockMvtService.getDailyMovement`)

## 4. Logique métier
- Quoi : Sélectionner une combinaison (productId + productAttributeId) et afficher son historique, permettre mises à jour.
- Comment : Parent/child state lifting : `BOStockUpdate` met à jour `combination`; `BOStockEvolution` affiche les mouvements correspondant à la combinaison.
- Pourquoi : Séparer la saisie (update) et la visualisation (evolution) pour clarté UX.
- Quand : Interaction utilisateur lors d'une opération de stock.

Vérifications métier : Quantité non nulle obligatoire pour mouvement ; un mouvement (`stock_mvt`) est journalisé avant la mise à jour de `stock_available`.

## 5. Explication du code
- Composants : `BOStock.jsx` (parent), `BOStockUpdate.jsx` (formulaire de mise à jour), `BOStockEvolution.jsx` (historique).
- Hooks : `useState` pour stocker la combinaison sélectionnée.
- Services/DTO : `StockMvtService`, `StockAvailable` (présents dans le repo) pour lecture/écriture des mouvements.

## 6. Analogies
Comme choisir une référence d'un produit dans un inventaire, puis ouvrir le registre des mouvements pour voir toutes les entrées/sorties.

## 7. Exemples concrets
- Réception de 50 unités → `BOStockUpdate` crée un mouvement d'entrée → `BOStockEvolution` affiche la nouvelle ligne et la quantité physique mise à jour.

## 8. Relations avec PrestaShop
- Ressources : `stock_movements`, `stock_availables`, `products`, `combinations`.
- Endpoints : opérations de lecture/écriture via les wrappers `entities/*` et `StockMvtService`.

## 9. Dépendances
- `BOStockUpdate.jsx`, `BOStockEvolution.jsx`, `StockMvtService`.

## 10. Résumé
- Résumé métier : Outil d'administration pour gérer et suivre les stocks par combinaison.
- Résumé technique : State lifting entre update et evolution avec partage de `productDetails`; `StockMvtService` enrichit la vue avec réservations journalières/cumulées.
