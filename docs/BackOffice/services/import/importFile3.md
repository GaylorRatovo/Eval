# importFile3

## Rôle
Importer le troisième CSV : clients, adresses, paniers et commandes.

## Fonctions
- `parseFile3CSV`
- `buildCustomerPayload`
- `buildAddressPayload`
- `buildCartPayload`
- `buildOrderPayload`
- `calculateTotals`
- `processRow`
- `importFile3`

## Exemple
```js
const result = await importFile3(ordersFile, file1Results, file2Results, onProgress)
```

## Point métier
Le fichier peut créer une commande ou un simple panier selon l'état indiqué dans la colonne `etat`.
