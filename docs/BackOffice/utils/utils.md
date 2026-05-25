# utils

## Rôle
Rassembler les helpers transverses de dates, nombres, chaînes et validations.

## Fonctions principales
- `getText`
- `toInt`
- `toFloat`
- `toBool`
- `toDate`
- `isDateInRange`
- `getLanguageText`
- `buildApiFilterQuery`
- `buildMapById`
- `buildProductCombinationKey`
- `splitProductCombinationKey`
- `formatDate`
- `formatDateTime`
- `formatDateInput`
- `ensureLocalDateTime`
- `normalizeNumber`
- `roundDecimal`
- `convertTTCtoHT`
- `convertDateFormat`
- `toSlug`
- `normalizeKey`
- `ensureMd5Like`
- `normalizeStatusLabel`
- `validateOrderStatusStrict`
- `getDisplayText`

## Exemple
```js
const totalHT = convertTTCtoHT('12,50', '20')
const date = formatDateInput(new Date())
```
