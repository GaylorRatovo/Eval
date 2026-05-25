# executeImport

## Rôle
Orchestrer tout le pipeline d'import : validation, import du catalogue, import des déclinaisons, import des commandes et import des images.

## Paramètres
- `productFile`: CSV produits, obligatoire.
- `declinaisonFile`: CSV déclinaisons.
- `ordersFile`: CSV commandes.
- `imageZipFile`: ZIP d'images.
- `doImport`: booléen qui contrôle l'import des images.
- `onProgress`: callback de progression.

## Fonctionnement
1. Valide les fichiers avec `validateImportBatch`.
2. Lance `importFile1`.
3. Lance `importFile2` si le CSV déclinaisons est présent.
4. Lance `importFile3` si le CSV commandes est présent.
5. Lance `importFile4` si le ZIP images est présent et que `doImport` est faux.
6. En cas d'erreur, tente une réinitialisation complète via `deleteAll`.

## Exemple
```js
await executeImport({ productFile, declinaisonFile, ordersFile, imageZipFile, doImport: false })
```
