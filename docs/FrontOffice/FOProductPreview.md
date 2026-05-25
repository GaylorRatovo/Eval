# FOProductPreview

## Rôle
Afficher la fiche produit détaillée avec image, badge, déclinaisons, stock et ajout au panier.

## Comportement
- Lit l'identifiant produit depuis `useParams()`.
- Charge le produit via `Product.getById(id)`.
- Récupère le badge, la première image, la taxe, le prix TTC et les déclinaisons.
- Initialise la première déclinaison disponible et son stock associé.
- Empêche l'ajout au panier si aucun client n'est connecté.

## Ajout au panier
- Le client est lu depuis `localStorage`.
- L'ajout utilise `CartService.addProductToCart(idCustomer, product.id, idProductAttribute, quantity, 1)`.
- Si une déclinaison est choisie, son identifiant est transmis.
- Un message d'erreur est affiché si l'opération échoue.

## Calcul du prix
Le prix affiché est basé sur le TTC produit, auquel s'ajoute l'impact de prix de la déclinaison avec la taxe appliquée.

## Dépendances
- `src/backend/entities/Product.js`
- `src/backend/services/CartService.js`

## Voir aussi
- [FOCart](FOCart.md)

## Résumé
Fiche produit complète avec sélection de déclinaison, quantité bornée par le stock et ajout au panier.
# FOProductPreview

## Présentation générale
`FOProductPreview.jsx` affiche un produit en détail et permet de choisir une déclinaison, de régler la quantité et d'ajouter le produit au panier.

## Fonctionnement utilisateur
1. La page charge le produit par son identifiant.
2. Elle récupère les images, le prix TTC, le taux de taxe, les déclinaisons, le stock et le badge.
3. La sélection d'une déclinaison relit le stock correspondant.
4. L'utilisateur ajuste la quantité.
5. Le bouton d'ajout au panier appelle `CartService.addProductToCart`.

## Flux de données
Utilisateur
	↓
`FOProductPreview.jsx`
	↓
`Product.getById()` puis `getImages`, `getTax`, `getTtcPrice`, `getDeclinaisons`, `getBadge`
	↓
`CartService.getStockForProductAttribute`
	↓
`CartService.addProductToCart`

## Logique métier
Le prix affiché est recalculé selon l'impact de la déclinaison. La quantité ne peut pas dépasser le stock courant si celui-ci est connu. Un utilisateur non connecté est empêché d'ajouter au panier.

## Exemples concrets
- Choisir une couleur différente met à jour le stock et le prix affiché.
- Ajouter deux unités d'une déclinaison au panier crée une ligne avec l'attribut sélectionné.

## Relations avec PrestaShop
Ressources utilisées : `products`, `combinations`, `stock_availables`, `images`.

## Dépendances
- `src/backend/entities/Product.js`
- `src/backend/services/CartService.js`

## Voir aussi
- [FOProductList](FOProductList.md)

## Résumé
Fiche produit interactive avec configuration de variante et ajout au panier contrôlé par le stock.
