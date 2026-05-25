# importFile2

## Rôle
Importer le deuxième CSV : groupes d'attributs, valeurs d'attributs, combinaisons et stocks initiaux.

## Fonctions
- `parseFile2CSV`
- `extractAttributeGroups`
- `extractAttributesByGroup`
- `buildAttributeGroupEntity`
- `buildAttributeValueEntity`
- `buildCombinationEntity`
- `buildProductMap`
- `createAttributeGroups`
- `createAttributeValues`
- `createStockMovement`
- `syncStockQuantity`
- `getRowContext`
- `createCombinationForRow`
- `getPriceImpact`
- `processRow`
- `createCombinationsAndStocks`
- `buildSummary`
- `importFile2`

## Exemple
```js
const result = await importFile2(declinaisonFile, file1Results, onProgress)
```

## Point métier
Cette étape associe le stock initial à la bonne combinaison produit/attribut.
