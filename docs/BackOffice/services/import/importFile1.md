# importFile1

## Rôle
Importer le premier CSV : catégories, taxes, groupes de règles de taxe, règles de taxe et produits.

## Fonctions
- `parseFile1CSV`
- `extractCategories`
- `extractTaxes`
- `buildCategoryEntity`
- `buildTaxEntity`
- `buildTaxRuleGroupEntity`
- `buildTaxRuleEntity`
- `buildProductEntity`
- `createCategories`
- `createTaxes`
- `createTaxRulesGroups`
- `createTaxRules`
- `createProducts`
- `buildSummary`
- `importFile1`

## Exemple
```js
const result = await importFile1(productFile, onProgress)
```

## Point métier
Cette étape prépare le socle du catalogue avant toute déclinaison ou commande.
