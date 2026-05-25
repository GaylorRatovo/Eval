# BOImport

## Présentation générale
La page `BOImport.jsx` sert à importer en masse le catalogue, les déclinaisons, les clients, les commandes et les images à partir de fichiers CSV et ZIP. Le fichier produits est obligatoire, les autres sont optionnels selon le flux d'import voulu.

## Fonctionnement utilisateur
1. L'utilisateur sélectionne un CSV produits.
2. Il peut ajouter un CSV déclinaisons, un CSV commandes et un ZIP d'images.
3. Il active ou non l'option d'import des images.
4. `handleSubmit` appelle `executeImport`.
5. `executeImport` valide les fichiers, lance les importeurs spécialisés, puis renvoie un résumé.
6. En cas d'erreur, le message détaillé est affiché et la base est réinitialisée par le script d'import.

## Flux de données
Utilisateur
    ↓
`BOImport.jsx`
    ↓
`executeImport()`
    ↓
`validateImportBatch()`
    ↓
`importFile1`, `importFile2`, `importFile3`, `importFile4`
    ↓
Création ou mise à jour d'entités PrestaShop : `Product`, `Combination`, `Customer`, `Address`, `Cart`, `Order`, `StockAvailable`, `StockMvt`

## Logique métier
L'import est pensé comme une chaîne transactionnelle logique. `file1` construit d'abord les catégories, taxes et produits. `file2` ajoute les attributs, combinaisons et stocks initiaux. `file3` crée ou réutilise les clients, adresses, paniers et commandes. `file4` rattache les images produits.

La validation vérifie le schéma CSV, certaines contraintes de format et les états de commande acceptés avant toute écriture.

## Explication du code
Le composant garde l'état des fichiers, gère le chargement et affiche le résultat brut en JSON. Le service `executeImport` orchestre le pipeline d'import et déclenche un reset en cas d'échec. Les modules `importFile1..4` isolent chaque responsabilité métier.

Fonctions importantes : `executeImport`, `validateImportBatch`, `importFile1`, `importFile2`, `importFile3`, `importFile4`.

## Analogies simples
Comme une chaîne de montage : on vérifie d'abord les pièces, puis on assemble le catalogue, les variantes, les commandes et enfin les images.

## Exemples concrets
- Importer seulement `file1.csv` crée catégories, taxes et produits.
- Ajouter `file2.csv` ajoute les déclinaisons et les stocks initiaux associés.
- Fournir un ZIP d'images relie automatiquement chaque image au produit portant le même nom de référence.

## Relations avec PrestaShop
Ressources utilisées : `products`, `combinations`, `stock_availables`, `stock_movements`, `customers`, `addresses`, `carts`, `orders`, `images`, `taxes`, `tax_rules`, `tax_rule_groups`, `categories`.

## Dépendances
- `src/backend/services/import/executeImport.js`
- `src/backend/services/import/importValidation.js`
- `src/backend/services/import/importFile1.js`
- `src/backend/services/import/importFile2.js`
- `src/backend/services/import/importFile3.js`
- `src/backend/services/import/importFile4.js`

## Voir aussi
- [executeImport](services/import/executeImport.md)
- [importValidation](services/import/importValidation.md)

## Résumé
Page d'import massivement orchestrée, avec validation préalable stricte et réinitialisation automatique en cas d'échec.
