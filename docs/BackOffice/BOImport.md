# BOImport

## 1. Présentation générale
- Rôle : Importer en masse des produits, déclinaisons, commandes/clients et images via fichiers CSV/ZIP.
- Problème métier : Faciliter la mise à jour initiale ou massive du catalogue et des commandes.
- Utilisateurs : Administrateurs, intégrateurs.

## 2. Fonctionnement utilisateur
1. L'utilisateur télécharge les fichiers CSV/ZIP requis (produits obligatoire).
2. L'utilisateur choisit d'activer ou non l'import des images (`doImport`).
3. Il clique sur «Importer» : `executeImport()` lance d'abord `validateImportBatch()`.
4. Si la validation échoue, l'import est interrompu et les erreurs (fichier, ligne, message) sont affichées.
5. Si la validation réussit, la séquence `importFile1 -> importFile2 -> importFile3 -> importFile4` est exécutée selon les fichiers fournis.
6. Le résultat détaillé (ou l'erreur) est affiché en JSON.

## 3. Flux de données
Utilisateur
    ↓
`BOImport.jsx` (fichiers uploadés, option `doImport`)
    ↓
Service `executeImport()`
    ↓
`importValidation.validateImportBatch()`
    ↓
`importFile1..4` (selon présence des fichiers)
    ↓
Services d'import: parsing CSV, création d'entités (`Product`, `Combination`, `Customer`, `Order`), mise à jour images.

## 4. Logique métier
- Quoi : Transformer des fichiers CSV/ZIP en objets PrestaShop (produits, déclinaisons, clients, commandes, images).
- Comment : `executeImport` orchestre l'appel des 4 scripts d'import (fichiers séparés pour chaque type).
- Pourquoi : Automatiser des opérations manuelles lourdes.
- Quand : À la demande via interface BackOffice.

Vérifications métier : Le fichier produits est obligatoire ; la validation CSV est stricte (schéma + règles métier de base) avant toute écriture ; erreurs détaillées remontées par ligne.

## 5. Explication du code
- Composant : `BOImport.jsx` — formulaire d'upload et gestion d'état d'import.
- Services : `executeImport.js`, `importValidation.js`, `importFile1..4.js` — validation + import orchestré.
- DTO/Entities : `Product`, `Combination`, `Customer`, `Order` sont impliqués lors de la création.

## 6. Analogies
Comme recevoir un lot de factures/bon de livraison et les saisir automatiquement dans l'ERP.

## 7. Exemples concrets
- Importer un CSV produits + CSV déclinaisons : produit créé, déclinaisons et stocks initialisés.
- Importer un CSV commandes : clients et commandes créés si inexistants.

## 8. Relations avec PrestaShop
- Ressources : `products`, `combinations`, `stock_availables`, `customers`, `orders`, `images`.
- Endpoints : utilisation des wrappers `entities/*` pour créer les ressources via l'API PrestaShop.

## 9. Dépendances
- `executeImport.js`, `importFile1.js`..`importFile4.js`, services `ProductService`/entities.

## 10. Résumé
- Résumé métier : Import massif et automatisé de données métiers.
- Résumé technique : `executeImport` valide d'abord les fichiers puis orchestre les importateurs spécialisés ; attention à la cohérence inter-fichiers et aux doublons.
