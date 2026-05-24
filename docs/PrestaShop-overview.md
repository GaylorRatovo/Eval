# PrestaShop — Vue d'ensemble pour le projet

## Objectif
Expliquer les concepts PrestaShop utilisés par le projet : produits, déclinaisons (combinations), stock, commandes, catégories et cycle de vie des données.

## Produits
- Entité principale : `products`.
- Deux types courants : produits simples et produits avec déclinaisons (combinations).
- Chaque produit contient prix TTC et infos fiscales ; conversion TTC→HT se fait côté services utilitaires.

## Déclinaisons (combinations)
- Représentées par `combinations` et liées à `product_attribute`.
- Chaque combinaison a un `product_attribute_id` et peut changer le prix, référence et stock.
- Utilisées pour les stocks fins (par couleur/taille...).

## Stock
- `stock_availables` : table de disponibilité par produit/déclinaison; champs clés : `quantity`.
- `stock_movements` : historique des entrées/sorties de stock; sert au calcul des quantités physiques et réservées.
- Mise à jour : via services / entités `StockAvailable`, `StockMvt`.

## Commandes
- Ressources : `orders`, `order_details`, `order_histories`, `order_payments`.
- Cycle typique : création → paiement → décrément stock → préparation → expédition.
- Etats : représentés par `order_states` et historiés via `order_histories`.

## Catégories
- Hiérarchie parent/enfant; racine(s) protégées (IDs 1,2).
- Association produit→catégorie utilisée pour rapports et filtrages.

## Clients & paniers
- `customers` et `addresses` pour gestion client.
- `carts` : paniers non convertis sont listés et analysés séparément.

## Endpoints / Opérations utilisées
- Lecture : `getAll`, `getBy`, `getById` via wrappers `entities/*`.
- Création/Modification : `save()` sur objets `Order`, `Cart`, `MyOrderState`, etc.
- Suppression : via utilitaire `api.deleteAll(resource, protectedIds)` (attention aux `PROTECTED_IDS`).

## Impact métier
- Les opérations dans le BackOffice lisent, ajoutent ou modifient ces ressources pour maintenir la boutique.
- Les imports peuvent créer en masse `products`, `combinations`, `customers`, et `orders`.
- Les resets peuvent supprimer massivement des ressources (utilisé en environnement de test uniquement).

## Bonnes pratiques / Risques
- Ne PAS utiliser `BOReset` en production — listes `PROTECTED_IDS` sont partielles.
- Authentification de `BOLogin` est un prototype; remplacer par un vrai système d'auth.
- Les imports doivent gérer les duplications et validations avant création.
