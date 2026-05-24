import { parseFile1CSV } from './importFile1.js'
import { parseFile2CSV } from './importFile2.js'
import { parseFile3CSV } from './importFile3.js'
import { parseAchatField } from '../../utils/csv.js'
import { normalizeNumber, validateOrderStatusStrict } from '../../utils/utils.js'

const ALLOW_UNKNOWN_COLUMNS = false

const FILE_RULES = {
	file1: {
		label: 'Fichier 1',
		parser: parseFile1CSV,
		allowedColumns: ['date_availability_produit', 'nom', 'reference', 'prix_ttc', 'taxe', 'categorie', 'prix_achat'],
	},
	file2: {
		label: 'Fichier 2',
		parser: parseFile2CSV,
		allowedColumns: ['reference', 'specificité', 'karazany', 'stock_initial', 'prix_vente_ttc'],
	},
	file3: {
		label: 'Fichier 3',
		parser: parseFile3CSV,
		allowedColumns: ['date', 'nom', 'email', 'pwd', 'adresse', 'achat', 'etat'],
	},
}

/** Normalise un nom de colonne/champ pour comparaison robuste. */
const normalizeName = (value) => (value || '')
	.toString()
	.trim()
	.toLowerCase()
	.normalize('NFD')
	.replace(/[\u0300-\u036f]/g, '')
	.replace(/[^a-z0-9]+/g, '')

const ddmmyyyyToDate = (dateString) => {
	if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString.trim())) {
		return null
	}
	const [day, month, year] = dateString.trim().split('/').map(Number)
	return new Date(year, month - 1, day)
}

/** Formate un objet Date au format DD/MM/YYYY. */
const formatDDMMYYYY = (date) => {
	if (!date) return ''
	const d = String(date.getDate()).padStart(2, '0')
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const y = date.getFullYear()
	return `${d}/${m}/${y}`
}

/** Parse une valeur numerique avec normalisation locale. */
const parseNumericValue = (value) => {
	return normalizeNumber(value)
}

/** Verifie strictement le format d'une date DD/MM/YYYY. */
const isValidDDMMYYYY = (value) => {
	if (!value) {
		return true
	}

	const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
	if (!match) {
		return false
	}

	const day = Number.parseInt(match[1], 10)
	const month = Number.parseInt(match[2], 10)
	const year = Number.parseInt(match[3], 10)
	const date = new Date(year, month - 1, day)

	return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** Indique si un champ appartient a la liste des champs montant. */
const isAmountField = (fieldName, amountFields = []) => {
	const normalizedField = normalizeName(fieldName)
	return amountFields.some((field) => normalizeName(field) === normalizedField)
}

/**
 * Valide les en-tetes d'un CSV selon une liste blanche.
 * Parametres: rows, fileLabel, allowedColumns, errors.
 * Retour: void (remplit errors).
 */
const validateColumns = (rows, fileLabel, allowedColumns, errors) => {
	if (ALLOW_UNKNOWN_COLUMNS) {
		return
	}

	const allowed = new Set(allowedColumns.map((col) => col.trim().toLowerCase()))
	const headers = Object.keys(rows?.[0] || {})

	headers.forEach((header) => {
		const normalizedHeader = header.trim().toLowerCase()
		if (!allowed.has(normalizedHeader)) {
			errors.push({
				file: fileLabel,
				line: '-',
				field: header,
				value: header,
				rule: 'Nom de colonne conforme (avec accents requis)',
				message: `Colonne non reconnue: "${header}". Colonnes acceptées: ${allowedColumns.join(', ')}`,
			})
		}
	})
}

/**
 * Valide les lignes d'un CSV (dates + montants).
 * Regles metier: dates au format DD/MM/YYYY, montants numeriques non negatifs.
 * Parametres: rows, fileLabel, errors, options.
 * Retour: void (remplit errors).
 */
const validateRows = (rows, fileLabel, errors, options = {}) => {
	// Etape 1: extraire les regles de validation dependantes du fichier.
	const dateField = options.dateField || null
	const amountFields = options.amountFields || []

	// Etape 2: parcourir chaque ligne et appliquer les controles.
	rows.forEach((row, index) => {
		if (dateField && Object.hasOwn(row, dateField)) {
			const dateValue = row[dateField]
			if (!isValidDDMMYYYY(dateValue)) {
				errors.push({
					file: fileLabel,
					line: index + 2,
					field: dateField,
					value: dateValue,
					rule: 'Format de date différent de DD/MM/YYYY',
					message: `Date invalide: ${dateValue}`,
				})
			}
		}

		amountFields.forEach((fieldName) => {
			if (!Object.hasOwn(row, fieldName)) {
				return
			}

			const value = row[fieldName]
			const numericValue = parseNumericValue(value)
			if (numericValue === null) {
				return
			}

			if (Number.isNaN(numericValue)) {
				errors.push({
					file: fileLabel,
					line: index + 2,
					field: fieldName,
					value,
					rule: 'Montant positif',
					message: `Montant invalide: ${value}`,
				})
				return
			}

			if (numericValue < 0) {
				errors.push({
					file: fileLabel,
					line: index + 2,
					field: fieldName,
					value,
					rule: 'Montant positif',
					message: `Montant negatif: ${value}`,
				})
			}
		})
	})
}

/**
 * Controle de coherence: disponibilite produit vs date de commande.
 * Retour: void (remplit errors).
 */
const validateAvailabilityVsOrderDates = (rows1, rows3, errors) => {
	if (!rows1 || !rows3 || rows1.length === 0 || rows3.length === 0) {
		return
	}

	const availabilityDates = rows1
		.map((row) => ({ date: ddmmyyyyToDate(row.date_availability_produit), row }))
		.filter((item) => item.date !== null)

	const orderDates = rows3
		.map((row) => ({ date: ddmmyyyyToDate(row.date), row }))
		.filter((item) => item.date !== null)

	if (availabilityDates.length === 0 || orderDates.length === 0) {
		return
	}

	const minOrderDate = new Date(Math.min(...orderDates.map((item) => item.date.getTime())))

	availabilityDates.forEach((item) => {
		if (item.date > minOrderDate) {
			const row1Index = rows1.indexOf(item.row)
			errors.push({
				file: 'Fichier 1',
				line: row1Index + 2,
				field: 'date_availability_produit',
				value: item.row.date_availability_produit,
				rule: 'Date disponibilité < date commande',
				message: `Date de disponibilité (${item.row.date_availability_produit}) doit être avant la date de commande la plus ancienne (${formatDDMMYYYY(minOrderDate)})`,
			})
		}
	})
}

const VALID_ORDER_STATUSES = new Set(['dans le panier', '', 'paiement accepté', 'livré', 'annulé'])

/**
 * Valide strictement les statuts de commande autorises.
 * Retour: void (remplit errors).
 */
const validateOrderStatuses = (rows3, errors) => {
	if (!rows3 || rows3.length === 0) {
		return
	}

	rows3.forEach((row, index) => {
		const etat = (row.etat || '').trim()
		try {
			validateOrderStatusStrict(etat)
		} catch (error) {
			errors.push({
				file: 'Fichier 3',
				line: index + 2,
				field: 'etat',
				value: etat,
				rule: 'État valide (strict)',
				message: error?.message ?? `État non valide: "${etat}". États acceptés: "" (vide), "paiement accepté", "livré", "annulé"`,
			})
		}
	})
}

/**
 * Controle de coherence stock initial vs quantites commandees.
 * Retour: void (remplit errors).
 */
const validateStockVsOrders = (rows2, rows3, errors) => {
	if (!rows2 || !rows3 || rows2.length === 0 || rows3.length === 0) {
		return
	}

	const toStockKey = (reference, specificity) => `${(reference || '').toString().trim()}|${(specificity || '').toString().trim()}`

	const stockMap = new Map()
	rows2.forEach((row) => {
		const key = toStockKey(row.reference, row.karazany || '')
		const stock = parseNumericValue(row.stock_initial)
		const currentStock = stockMap.get(key) || 0
		const normalizedStock = stock !== null && stock > 0 ? stock : 0
		stockMap.set(key, currentStock + normalizedStock)
	})

	rows3.forEach((row, row3Index) => {
		const orderItems = parseAchatField(row.achat)

		orderItems.forEach((item) => {
			const key = toStockKey(item.reference, item.variante || '')
			const requiredStock = item.quantity
			const availableStock = stockMap.get(key) || 0

			if (requiredStock > availableStock) {
				errors.push({
					file: 'Fichier 3',
					line: row3Index + 2,
					field: 'achat',
					value: row.achat,
					rule: 'Stock suffisant',
					message: `Référence ${item.reference} (${item.variante || 'sans spécificité'}): ${requiredStock} demandé mais seulement ${availableStock} en stock`,
				})
				return
			}

			stockMap.set(key, availableStock - requiredStock)
		})
	})
}

/**
 * Valide un seul fichier CSV selon sa regle associee.
 * Parametres: { file, fileKey, errors, options }.
 * Retour: Promise<Array> lignes parsees (ou vide).
 */
const validateSingleCsvFile = async ({ file, fileKey, errors, options = {} }) => {
	if (!file) {
		return []
	}

	const rule = FILE_RULES[fileKey]
	if (!rule) {
		return []
	}

	const rows = await rule.parser(file)

	if (!rows || rows.length === 0) {
		errors.push({
			file: rule.label,
			line: '-',
			field: '-',
			value: '-',
			rule: 'Fichier vide',
			message: 'Aucune ligne CSV trouvée',
		})
		return rows || []
	}

	validateColumns(rows, rule.label, rule.allowedColumns, errors)
	validateRows(rows, rule.label, errors, options)

	return rows
}

/**
 * Valide tout un lot d'import (file1/file2/file3).
 * Regles metier: schema CSV strict + controles metiers de base (statut commandes).
 * Parametres: { productFile, declinaisonFile, ordersFile }.
 * Retour: Promise<{valid:boolean, errors:Array}>.
 */
export const validateImportBatch = async ({ productFile, declinaisonFile, ordersFile } = {}) => {
	// Etape 1: valider chaque fichier independamment.
	const errors = []

	const rows1 = await validateSingleCsvFile({ file: productFile, fileKey: 'file1', errors, options: { dateField: 'date_availability_produit', amountFields: ['prix_ttc', 'prix_achat', 'taxe'] } })
	const rows2 = await validateSingleCsvFile({ file: declinaisonFile, fileKey: 'file2', errors, options: { amountFields: ['stock_initial', 'prix_vente_ttc'] } })
	const rows3 = await validateSingleCsvFile({ file: ordersFile, fileKey: 'file3', errors, options: { dateField: 'date', amountFields: [] } })

	// Etape 2: executer les controles inter-fichiers retenus actuellement.
	// validateAvailabilityVsOrderDates(rows1, rows3, errors)
	validateOrderStatuses(rows3, errors)
	// validateStockVsOrders(rows2, rows3, errors)

	// Etape 3: retourner le verdict global de validation.
	return {
		valid: errors.length === 0,
		errors,
	}
}
