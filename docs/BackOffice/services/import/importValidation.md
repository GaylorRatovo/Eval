# importValidation

## Rôle
Vérifier les fichiers CSV avant toute écriture en base.

## Fonctions
### `validateImportBatch({ productFile, declinaisonFile, ordersFile } = {})`
Valide chaque fichier, vérifie les colonnes attendues, le format des dates et la cohérence métier minimale.

### Fonctions internes utiles
- `validateSingleCsvFile`
- `validateColumns`
- `validateRows`
- `validateOrderStatuses`
- `validateAvailabilityVsOrderDates`
- `validateStockVsOrders`

## Règles contrôlées
- présence du fichier produits
- format de date `DD/MM/YYYY`
- montants positifs
- états de commande acceptés
- colonnes reconnues

## Exemple
```js
const result = await validateImportBatch({ productFile, ordersFile })
if (!result.valid) {
  console.log(result.errors)
}
```
