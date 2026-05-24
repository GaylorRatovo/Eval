import ProductOption from '../../entities/ProductOption.js'
import ProductOptionValue from '../../entities/ProductOptionValue.js'
import Combination from '../../entities/Combination.js'
import StockAvailable from '../../entities/StockAvailable.js'
import StockMvt from '../../entities/StockMvt.js'
import { checkCSVHeader, parseCSV } from '../../utils/csv.js'
import { convertTTCtoHT, formatDateTime, normalizeNumber, roundDecimal } from '../../utils/utils.js'

const FILE2_HEADER = ['reference', 'specificité', 'karazany', 'stock_initial', 'prix_vente_ttc']

/** Ajoute une entree succes dans les resultats. */
const pushSuccess = (collection, payload) => {
	collection.push({
		...payload,
		status: 'success',
	})
}

/** Ajoute une entree erreur detaillee dans les resultats. */
const pushError = (collection, errors, payload, label, error) => {
	collection.push({
		...payload,
		status: 'error',
		error: error?.message ?? 'Erreur inconnue',
	})
	errors.push(`${label}: ${error?.message ?? 'Erreur inconnue'}`)
}

/** Parse et valide le CSV du fichier 2. */
export const parseFile2CSV = async (file) => {
	const text = await file.text()
	checkCSVHeader(text, FILE2_HEADER)
	return parseCSV(text)
}

/** Extrait la liste des groupes d'attributs uniques. */
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

/** Extrait les valeurs d'attributs groupees par groupe. */
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

/** Construit une entite ProductOption. */
export const buildAttributeGroupEntity = (groupName) => {
	const option = new ProductOption('', false)
	option.groupType = 'select'
	option.position = 0
	option.name = groupName
	option.publicName = groupName
	option.isColorGroup = 0
	return option
}

/** Construit une entite ProductOptionValue. */
export const buildAttributeValueEntity = (valueName, groupId) => {
	const optionValue = new ProductOptionValue('', false)
	optionValue.idAttributeGroup = groupId
	optionValue.position = 0
	optionValue.name = valueName
	optionValue.color = ''
	return optionValue
}

/** Construit une entite Combination. */
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

/** Construit les maps produits/prix depuis les resultats fichier 1. */
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

/** Cree les groupes d'attributs et retourne groupName -> groupId. */
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

/** Cree les valeurs d'attributs et retourne "group:value" -> valueId. */
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

/** Retourne la quantite numerique d'un stock_available. */
const getStockQuantity = (stock) => Number(stock?.quantity) || 0

/** Cree un mouvement de stock trace (entree/sortie) pour un delta. */
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

/** Synchronise stock_available vers une quantite cible et ecrit un mouvement si delta non nul. */
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

/** Extrait le contexte metier d'une ligne CSV declinaison/stock. */
const getRowContext = (row) => {
	return {
		reference: row.reference?.trim() ?? '',
		groupName: row['specificité']?.trim() ?? '',
		valueName: row.karazany?.trim() ?? '',
		stockInitial: Math.max(0, Math.trunc(normalizeNumber(row.stock_initial?.trim() ?? '0'))),
		prixVenteTtc: row.prix_vente_ttc?.trim() ?? '',
	}
}

/** Cree une combinaison pour une ligne import. */
const createCombinationForRow = async ({ idProduct, reference, valueName, attributeId, priceImpact }) => {
	const savedCombination = await buildCombinationEntity(
		idProduct,
		`${reference}-${valueName}`,
		attributeId,
		priceImpact,
	).save()

	return savedCombination.id ?? 0
}

/** Calcule l'impact prix HT d'une declinaison. */
const getPriceImpact = (prixVenteTtc, sourcePrice) => {
	if (!prixVenteTtc) {
		return 0
	}

	const declinationPriceHT = convertTTCtoHT(prixVenteTtc, sourcePrice.taxRate)
	return declinationPriceHT - sourcePrice.priceHT
}

/** Traite une ligne complete (combinaison + stock). */
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

/** Traite toutes les lignes du CSV et cree combinaisons/stocks. */
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

/** Construit le resume quantitatif du fichier 2. */
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
 * Execute l'import complet du fichier 2.
 * Regles metier: creer d'abord groupes/valeurs, puis combinaisons et stock.
 * Parametres: csvFile, file1Results, onProgress.
 * Retour: Promise<results>.
 */
export const importFile2 = async (csvFile, file1Results, onProgress = () => {}) => {
	// Etape 1: initialiser les conteneurs de resultat.
	const results = {
		attributeGroups: [],
		attributes: [],
		combinations: [],
		stocks: [],
		errors: [],
		summary: {},
	}

	// Etape 2: parser le CSV et verifier presence de donnees.
	onProgress?.({ step: 'parsing', message: 'Parsing du CSV fichier 2...' })
	const csvData = await parseFile2CSV(csvFile)

	if (!csvData || csvData.length === 0) {
		throw new Error('Fichier CSV vide')
	}

	// Etape 3: construire referentiels d'entrees (produits/prix) depuis fichier 1.
	const { productMap, priceMap } = buildProductMap(file1Results)

	// Etape 4: creer attributs puis combinaisons/stocks.
	onProgress?.({ step: 'attributeGroups', message: 'Creation des groupes d\'attributs...' })
	const groups = extractAttributeGroups(csvData)
	const groupMap = await createAttributeGroups(groups, results)

	onProgress?.({ step: 'attributes', message: 'Creation des attributs...' })
	const attributesByGroup = extractAttributesByGroup(csvData)
	const attributeValueMap = await createAttributeValues(attributesByGroup, groupMap, results)

	onProgress?.({ step: 'combinations', message: 'Creation des declinaisons et mise a jour du stock...' })
	await createCombinationsAndStocks(csvData, productMap, priceMap, attributeValueMap, results, onProgress)

	// Etape 5: calculer resume final et retourner resultats.
	results.summary = buildSummary(results)
	onProgress?.({ step: 'complete', message: 'Import fichier 2 termine!' })

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