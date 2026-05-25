# FOProductList

## Rôle
Afficher le catalogue FrontOffice avec image, badge, référence, prix TTC, catégorie et stock total.

## Comportement
- Charge tous les produits au montage via `Product.getAll()`.
- Enrichit chaque produit avec `getImages()`, `getQuantity()`, `getBadge()`, `getTtcPrice()` et `getCategory()`.
- Charge les catégories avec `Category.getExcl([1, 2])`.
- Filtre côté client par nom, prix min, prix max et catégorie via `filterProducts()`.
- Ouvre la fiche détaillée avec `navigate('/fo/product/preview/:id')`.

## Données préparées
- `products`: liste enrichie des produits.
- `categories`: catégories sélectionnables.
- `imageUrls`: première image par produit.
- `badges`: badge par produit.

## Points métier
- Le filtrage est entièrement local, sans nouvel appel réseau.
- Les catégories vides sont exclues de la liste déroulante.
- Le prix affiché est le TTC, arrondi à deux décimales.

## Dépendances
- `src/backend/entities/Product.js`
- `src/backend/entities/Category.js`
- `src/backend/services/ProductService.js`

## Voir aussi
- [FOProductPreview](FOProductPreview.md)

## Résumé
Catalogue filtrable, enrichi à l’ouverture puis consultable vers la fiche produit.
