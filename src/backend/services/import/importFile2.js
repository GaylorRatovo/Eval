import ProductOption from '../../entities/ProductOption.js'
import ProductOptionValue from '../../entities/ProductOptionValue.js'
import Combination from '../../entities/Combination.js'
import StockAvailable from '../../entities/StockAvailable.js'
import StockMvt from '../../entities/StockMvt.js'
import { checkCSVHeader, parseCSV } from '../../utils/csv.js'
import { convertTTCtoHT, formatDateTime, normalizeNumber, roundDecimal } from '../../utils/utils.js'

const FILE2_HEADER = ['reference', 'specificité', 'karazany', 'stock_initial', 'prix_vente_ttc']

const pushSuccess = (collection, payload) => {
	collection.push({
		...payload,
		status: 'success',
	})
}

const pushError = (collection, errors, payload, label, error) => {
	collection.push({
		...payload,
		status: 'error',
		error: error?.message ?? 'Erreur inconnue',
	})
	errors.push(`${label}: ${error?.message ?? 'Erreur inconnue'}`)
}

/**
 * Parse le fichier CSV des déclinaisons (fichier 2) et vérifie l'en-tête.
 *
 * Paramètres:
 * - `file` (File): objet File.
 *
 * Retour: Promise<Array<object>> — lignes CSV parsées.
 */
export const parseFile2CSV = async (file) => {
	const text = await file.text()
	checkCSVHeader(text, FILE2_HEADER)
	return parseCSV(text)
}

/**
 * Extrait les noms de groupes d'attributs depuis le CSV.
 *
 * Paramètres:
 * - `csvData` (Array): lignes CSV.
 *
 * Retour: Array<string> — noms de groupes uniques.
 */
export const extractAttributeGroups = (csvData) => {
	const groups = new Set()
	for (const row of csvData) {
		const groupName = row['specificité']?.trim() ?? ''
		if (groupName) {
			groups.add(groupName)
		}
	}
	return Array.from(groups)
}

/**
 * Construit une map groupe -> Set(valeurs) des attributs.
 *
 * Paramètres:
 * - `csvData` (Array): lignes CSV.
 *
 * Retour: Map<string,Set<string>>.
 */
export const extractAttributesByGroup = (csvData) => {
	const byGroup = new Map()
	for (const row of csvData) {
		const groupName = row['specificité']?.trim() ?? ''
		const valueName = row.karazany?.trim() ?? ''
		if (!groupName || !valueName) {
			continue
		}
		if (!byGroup.has(groupName)) {
			byGroup.set(groupName, new Set())
		}
		byGroup.get(groupName).add(valueName)
	}
	return byGroup
}

/**
 * Construit une instance `ProductOption` pour un groupe d'attribut.
 *
 * Paramètres:
 * - `groupName` (string): nom du groupe.
 *
 * Retour: ProductOption.
 */
export const buildAttributeGroupEntity = (groupName) => {
	const option = new ProductOption('', false)
	option.groupType = 'select'
	option.position = 0
	option.name = groupName
	option.publicName = groupName
	option.isColorGroup = 0
	return option
}

/**
 * Construit une instance `ProductOptionValue` pour une valeur d'attribut.
 *
 * Paramètres:
 * - `valueName` (string): nom de la valeur.
 * - `groupId` (number): id du groupe d'attribut.
 *
 * Retour: ProductOptionValue.
 */
export const buildAttributeValueEntity = (valueName, groupId) => {
	const optionValue = new ProductOptionValue('', false)
	optionValue.idAttributeGroup = groupId
	optionValue.position = 0
	optionValue.name = valueName
	optionValue.color = ''
	return optionValue
}

/**
 * Construit une instance `Combination` (déclinaison) pour un produit.
 *
 * Paramètres:
 * - `idProduct` (number): id du produit.
 * - `reference` (string): référence produit.
 * - `attributeId` (number): id de la valeur d'attribut.
 * - `priceImpact` (number): impact prix HT sur la déclinaison.
 *
 * Retour: Combination.
 */
export const buildCombinationEntity = (idProduct, reference, attributeId, priceImpact) => {
	const combination = new Combination('', false)
	combination.productId = idProduct
	combination.reference = reference
	combination.priceImpact = roundDecimal(priceImpact)
	combination.minimalQuantity = 1
	combination.optionValueIds = [attributeId]
	combination.availableDate = '0000-00-00'
	return combination
}

/**
 * Construit deux maps utiles: reference -> {id, availableDate} et reference -> price info.
 *
 * Paramètres:
 * - `file1Results` (object): résultat de l'import fichier1.
 *
 * Retour: { productMap: Map, priceMap: Map }.
 */
export const buildProductMap = (file1Results) => {
	const productMap = new Map()
	const priceMap = new Map()
	for (const product of file1Results?.products ?? []) {
		if (product?.status !== 'success') {
			continue
		}
		const reference = String(product.reference ?? '').trim()
		if (!reference || product.id == null) {
			continue
		}
		productMap.set(reference, {
			id: product.id,
			availableDate: product.availableDate ?? null,
		})
		priceMap.set(reference, {
			priceHT: Number(product.priceHT ?? 0),
			taxRate: Number(product.taxRate ?? 0),
		})
	}

	return { productMap, priceMap }
}

/**
 * Crée en base les groupes d'attributs et retourne une map nom->id.
 *
 * Paramètres:
 * - `groups` (Array<string>). - `results` (object) accumulateur.
 *
 * Retour: Promise<Map>.
 */
export const createAttributeGroups = async (groups, results) => {
	const groupMap = new Map()
	for (const groupName of groups) {
		try {
			const saved = await buildAttributeGroupEntity(groupName).save()
			const groupId = saved.id ?? null
			groupMap.set(groupName, groupId)
			pushSuccess(results.attributeGroups, { name: groupName, id: groupId })
		} catch (error) {
			pushError(results.attributeGroups, results.errors, { name: groupName }, `Groupe d'attribut '${groupName}'`, error)
		}
	}
	return groupMap
}

/**
 * Crée en base les valeurs d'attribut pour chaque groupe.
 *
 * Paramètres:
 * - `attributesByGroup` (Map): group -> Set(values).
 * - `groupMap` (Map): group -> id.
 * - `results` (object): accumulateur.
 *
 * Retour: Promise<Map> mapping `group:value` -> id.
 */
export const createAttributeValues = async (attributesByGroup, groupMap, results) => {
	const valueMap = new Map()
	for (const [groupName, values] of attributesByGroup.entries()) {
		const groupId = groupMap.get(groupName)
		if (!groupId) {
			results.errors.push(`Groupe d'attribut '${groupName}' non trouve`)
			continue
		}
		for (const valueName of values.values()) {
			try {
				const saved = await buildAttributeValueEntity(valueName, groupId).save()
				const valueId = saved.id ?? null
				valueMap.set(`${groupName}:${valueName}`, valueId)
				pushSuccess(results.attributes, {
					group: groupName,
					value: valueName,
					id: valueId,
				})
			} catch (error) {
				pushError(
					results.attributes,
					results.errors,
					{ group: groupName, value: valueName },
					`Attribut '${groupName}:${valueName}'`,
					error,
				)
			}
		}
	}

	return valueMap
}

/**
 * Retourne la quantité depuis une entité `stock`.
 *
 * Paramètres:
 * - `stock` (object|null).
 *
 * Retour: number.
 */
const getStockQuantity = (stock) => Number(stock?.quantity) || 0

/**
 * Crée une entrée `StockMvt` pour un mouvement de stock.
 *
 * Paramètres:
 * - `stockId` (number), `idProduct` (number), `idProductAttribute` (number), `delta` (number), `moveDate` (Date|string).
 *
 * Retour: Promise<object> — entité mouvement sauvegardée.
 */
const createStockMovement = async ({ stockId, idProduct, idProductAttribute, delta, moveDate }) => {
	const movement = new StockMvt({}, false)
	movement.idStock = stockId
	movement.idProduct = idProduct
	movement.idProductAttribute = idProductAttribute
	movement.idWarehouse = 0
	movement.idCurrency = 0
	movement.managementType = ''
	movement.idEmployee = 1
	movement.idStockMvtReason = delta > 0 ? 1 : 2
	movement.idOrder = 0
	movement.idSupplyOrder = 0
	movement.productName = ''
	movement.ean13 = ''
	movement.upc = ''
	movement.reference = ''
	movement.mpn = ''
	movement.physicalQuantity = Math.abs(delta)
	movement.sign = delta > 0 ? 1 : -1
	movement.lastWa = 0
	movement.currentWa = 0
	movement.priceTe = 0
	movement.dateAdd = formatDateTime(moveDate ?? new Date())

	return movement.save()
}

/**
 * Synchronise la quantité en base pour une combinaison produit/déclinaison.
 *
 * Paramètres:
 * - `idProduct`, `idProductAttribute`, `desiredQuantity`, `moveDate`.
 *
 * Retour: Promise<object> — { idProduct, idProductAttribute, quantity }.
 */
const syncStockQuantity = async ({ idProduct, idProductAttribute, desiredQuantity, moveDate }) => {
	const stockApi = new StockAvailable({}, false)
	const existing = await stockApi.getByProductAndAttribute(idProduct, idProductAttribute)
	if (!existing) {
		throw new Error(
			`Stock_available non trouve pour idProduct=${idProduct}, idProductAttribute=${idProductAttribute}`,
		)
	}

	const currentQuantity = getStockQuantity(existing)
	const delta = desiredQuantity - currentQuantity

	if (delta !== 0) {
		await createStockMovement({
			stockId: existing.id,
			idProduct,
			idProductAttribute,
			delta,
			moveDate,
		})

		const stockEntity = StockAvailable.fromData(existing)
		stockEntity.quantity = desiredQuantity
		stockEntity.productId = stockEntity.idProduct ?? idProduct
		stockEntity.productAttributeId = stockEntity.idProductAttribute ?? idProductAttribute
		stockEntity.shopId = stockEntity.idShop ?? 1
		stockEntity.shopGroupId = stockEntity.idShopGroup ?? 1
		stockEntity.dependsOnStock = stockEntity.dependsOnStock ?? 0
		stockEntity.outOfStock = stockEntity.outOfStock ?? 2

		await stockEntity.update()
	}

	return {
		idProduct,
		idProductAttribute,
		quantity: desiredQuantity,
	}
}

/**
 * Extrait un contexte lisible depuis une ligne CSV (référence, groupe, valeur, stock, prix).
 *
 * Paramètres:
 * - `row` (object): ligne CSV.
 *
 * Retour: object.
 */
const getRowContext = (row) => {
	return {
		reference: row.reference?.trim() ?? '',
		groupName: row['specificité']?.trim() ?? '',
		valueName: row.karazany?.trim() ?? '',
		stockInitial: Math.max(0, Math.trunc(normalizeNumber(row.stock_initial?.trim() ?? '0'))),
		prixVenteTtc: row.prix_vente_ttc?.trim() ?? '',
	}
}

/**
 * Crée une `Combination` pour une ligne de déclinaison et retourne son id.
 *
 * Paramètres:
 * - `{ idProduct, reference, valueName, attributeId, priceImpact }`.
 *
 * Retour: Promise<number> — id de la combinaison créée.
 */
const createCombinationForRow = async ({ idProduct, reference, valueName, attributeId, priceImpact }) => {
	const savedCombination = await buildCombinationEntity(
		idProduct,
		`${reference}-${valueName}`,
		attributeId,
		priceImpact,
	).save()

	return savedCombination.id ?? 0
}

/**
 * Calcule l'impact prix HT d'une déclinaison par rapport au prix source.
 *
 * Paramètres:
 * - `prixVenteTtc` (string|number) valeur TTC fournie.
 * - `sourcePrice` (object) contenant `priceHT` et `taxRate`.
 *
 * Retour: number — impact HT.
 */
const getPriceImpact = (prixVenteTtc, sourcePrice) => {
	if (!prixVenteTtc) {
		return 0
	}

	const declinationPriceHT = convertTTCtoHT(prixVenteTtc, sourcePrice.taxRate)
	return declinationPriceHT - sourcePrice.priceHT
}

/**
 * Traite une ligne du fichier 2: crée combinaison, synchronise stock et rapporte le résultat.
 *
 * Paramètres:
 * - `{ row, productMap, priceMap, attributeValueMap, results }`.
 *
 * Retour: Promise<object|null> — entrée de stock créée ou `null` si ligne ignorée.
 */
const processRow = async ({ row, productMap, priceMap, attributeValueMap, results }) => {
	const { reference, groupName, valueName, stockInitial, prixVenteTtc } = getRowContext(row)

	if (!reference) {
		return null
	}

	const productEntry = productMap.get(reference)
	const idProduct = productEntry?.id
	if (!idProduct) {
		throw new Error(`Produit '${reference}' du fichier 1 non trouve`)
	}

	let idProductAttribute = 0

	if (groupName && valueName) {
		const attributeKey = `${groupName}:${valueName}`
		const attributeId = attributeValueMap.get(attributeKey)
		if (!attributeId) {
			throw new Error(`Attribut '${attributeKey}' non trouve`)
		}

		const sourcePrice = priceMap.get(reference) ?? { priceHT: 0, taxRate: 0 }
		const priceImpact = getPriceImpact(prixVenteTtc, sourcePrice)

		idProductAttribute = await createCombinationForRow({
			idProduct,
			reference,
			valueName,
			attributeId,
			priceImpact,
		})

		pushSuccess(results.combinations, {
			product: reference,
			attribute: attributeKey,
			id: idProductAttribute,
			priceImpact: roundDecimal(priceImpact),
		})
	}

	const stockEntry = await syncStockQuantity({
		idProduct,
		idProductAttribute,
		desiredQuantity: stockInitial,
		moveDate: productEntry?.availableDate ?? null,
	})
	pushSuccess(results.stocks, {
		reference,
		...stockEntry,
	})

	return stockEntry
}

/**
 * Parcourt les lignes du fichier 2 et crée les combinaisons + mouvements de stock correspondants.
 *
 * Paramètres:
 * - `csvData` (Array), `productMap` (Map), `priceMap` (Map), `attributeValueMap` (Map), `results` (object), `onProgress` (function).
 *
 * Retour: Promise<void>.
 */
export const createCombinationsAndStocks = async (csvData, productMap, priceMap, attributeValueMap, results, onProgress) => {
	for (let idx = 0; idx < csvData.length; idx++) {
		try {
			const row = csvData[idx]
			const processed = await processRow({ row, productMap, priceMap, attributeValueMap, results })
			if (!processed) {
				continue
			}

			onProgress?.({
				step: 'combinations',
				message: `Creation des declinaisons et stocks... (${idx + 1}/${csvData.length})`,
				progress: ((idx + 1) / csvData.length) * 100,
			})
		} catch (error) {
			const reference = csvData[idx]?.reference?.trim() ?? ''
			pushError(results.stocks, results.errors, { reference }, `Ligne '${reference}'`, error)
		}
	}
}

/**
 * Construit un résumé des opérations du fichier 2.
 *
 * Paramètres:
 * - `results` (object): accumulateur rempli pendant l'import.
 *
 * Retour: object — statistiques.
 */
export const buildSummary = (results) => {
	return {
		totalAttributeGroups: results.attributeGroups.length,
		successAttributeGroups: results.attributeGroups.filter((item) => item.status === 'success').length,
		totalAttributes: results.attributes.length,
		successAttributes: results.attributes.filter((item) => item.status === 'success').length,
		totalCombinations: results.combinations.length,
		successCombinations: results.combinations.filter((item) => item.status === 'success').length,
		totalStocks: results.stocks.length,
		successStocks: results.stocks.filter((item) => item.status === 'success').length,
		totalErrors: results.errors.length,
	}
}

/**
 * Exécute l'import du fichier 2 (attributs, combinaisons, stocks).
 *
 * Paramètres:
 * - `csvFile` (File), `file1Results` (object), `onProgress` (function).
 *
 * Retour: Promise<object> — résultat détaillé.
 */
export const importFile2 = async (csvFile, file1Results, onProgress = () => {}) => {
	const results = {
		attributeGroups: [],
		attributes: [],
		combinations: [],
		stocks: [],
		errors: [],
		summary: {},
	}

	onProgress?.({ step: 'parsing', message: 'Parsing du CSV fichier 2...' })
	const csvData = await parseFile2CSV(csvFile)

	if (!csvData || csvData.length === 0) {
		throw new Error('Fichier CSV vide')
	}

	const { productMap, priceMap } = buildProductMap(file1Results)

	onProgress?.({ step: 'attributeGroups', message: 'Creation des groupes d\'attributs...' })
	const groups = extractAttributeGroups(csvData)
	const groupMap = await createAttributeGroups(groups, results)

	onProgress?.({ step: 'attributes', message: 'Creation des attributs...' })
	const attributesByGroup = extractAttributesByGroup(csvData)
	const attributeValueMap = await createAttributeValues(attributesByGroup, groupMap, results)

	onProgress?.({ step: 'combinations', message: 'Creation des declinaisons et mise a jour du stock...' })
	await createCombinationsAndStocks(csvData, productMap, priceMap, attributeValueMap, results, onProgress)

	results.summary = buildSummary(results)
	onProgress?.({ step: 'complete', message: 'Import fichier 2 termine!' })

	// Si des erreurs ont été accumulées, relancer une exception pour déclencher le reset
	if (results.errors.length > 0) {
		const errorSummary = results.errors.join('\n')
		throw new Error(`Erreurs lors de l'import fichier 2 (attributs/combinaisons):\n${errorSummary}`)
	}

	return results
}

const importFile2Service = {
	parseFile2CSV,
	extractAttributeGroups,
	extractAttributesByGroup,
	buildAttributeGroupEntity,
	buildAttributeValueEntity,
	buildCombinationEntity,
	buildProductMap,
	createAttributeGroups,
	createAttributeValues,
	createCombinationsAndStocks,
	buildSummary,
	importFile2,
}

export default importFile2Service