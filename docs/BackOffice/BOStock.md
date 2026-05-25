# BOStock

## Présentation générale
`BOStock.jsx` regroupe la mise à jour de stock et la consultation de l'évolution journalière d'un produit ou d'une déclinaison. La page sépare clairement l'action d'écriture et la lecture de l'historique.

## Fonctionnement utilisateur
1. `BOStockUpdate` charge les produits et leurs stocks.
2. L'utilisateur choisit une ligne simple ou une déclinaison.
3. Il saisit une quantité, une date de mouvement et choisit ajouter ou retirer.
4. Le stock disponible est mis à jour après la création du mouvement.
5. `BOStockEvolution` reçoit la combinaison sélectionnée et affiche le détail journalier.

## Flux de données
Utilisateur
    ↓
`BOStock.jsx`
    ↓
`BOStockUpdate.jsx`
    ↓
`ProductService.fetchProductWithStock()` puis `StockAvailable` et `StockMvt`
    ↓
`BOStockEvolution.jsx`
    ↓
`StockMvtService.getDailyMovement()`

## Logique métier
La page applique du state lifting : le parent conserve la combinaison courante pour éviter de recharger les données et pour partager la même sélection entre mise à jour et historique.

Chaque changement de stock crée d'abord un mouvement `stock_mvt`, puis met à jour `stock_available`. Cela garde la trace des mouvements en plus du stock courant.

## Explication du code
Le composant parent ne fait que coordonner les deux sous-vues. `BOStockUpdate` gère la saisie et l'écriture. `BOStockEvolution` agrège les mouvements par jour et filtre la période avec `dateFrom` / `dateTo`.

Fonctions utilisées : `fetchProductWithStock`, `getDailyMovement`, `StockAvailable.getByProductAndAttribute`, `StockMvt.save`, `StockAvailable.update`.

## Analogies simples
Comme un inventaire d'entrepôt avec deux vues : la première pour entrer ou retirer des pièces, la seconde pour lire le registre historique des entrées et sorties.

## Exemples concrets
- Réception de 50 unités : la quantité est ajoutée, un mouvement journalier est créé et l'historique affiche l'entrée au bon jour.
- Retrait de 3 unités sur une déclinaison : la ligne correspondante est mise à jour sans toucher aux autres variantes.

## Relations avec PrestaShop
Ressources utilisées : `stock_movements`, `stock_availables`, `products`, `combinations`, `product_option_values`.

## Dépendances
- `src/components/BOStockUpdate.jsx`
- `src/components/BOStockEvolution.jsx`
- `src/backend/services/ProductService.js`
- `src/backend/services/StockMvtService.js`

## Voir aussi
- [BOStockUpdate](components/BOStockUpdate.md)
- [BOStockEvolution](components/BOStockEvolution.md)

## Résumé
Outil de gestion de stock centré sur un couple produit/déclinaison, avec écriture du mouvement et consultation de l'historique dans la même page.
