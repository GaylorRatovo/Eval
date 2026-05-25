# importFile4

## Rôle
Importer les images produit depuis un ZIP ou une liste de fichiers image.

## Fonctions
- `extractImagesFromZip`
- `resolveImageFiles`
- `uploadProductImage`
- `importFile4`
- `parseFile4CSV` (placeholder)
- `importImage` (alias)

## Exemple
```js
await importFile4(imageZipFile, file1Results, onProgress)
```

## Point métier
Le nom du fichier image sert de référence produit. Une image `ABC123.jpg` est associée au produit de référence `ABC123`.
