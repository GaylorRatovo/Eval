# FOOrderRow

## Rôle
Afficher des commandes ou paniers dans un tableau Material React Table avec actions contextuelles.

## Comportement
- Utilise `MaterialReactTable` avec pagination.
- Affiche les colonnes référence, client, date, total, état et action.
- Adapte la cellule d'action selon `actionMode`.

## Fonctions internes
### `OrderActionCell`
- En mode `order`, permet de modifier multiplicateur et date avant duplication.
- En mode `cart`, permet de saisir une date puis de convertir le panier en commande.

## Propriétés
- `rows`: lignes à afficher.
- `edit`: état d'édition partagé.
- `multiplicateur`: valeur par défaut de duplication.
- `onChange`: callback de saisie.
- `onClick`: callback d'action.
- `actionMode`: `order` ou `cart`.
- `title`: titre affiché au-dessus du tableau.

## Résumé
Composant tableau générique pour les commandes et paniers FrontOffice.
