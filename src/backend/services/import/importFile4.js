import JSZip from 'jszip'

const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg']

/** Ajoute une entree succes pour une image importee. */
const pushSuccess = (collection, payload) => {
	collection.push({
		...payload,
		status: 'success',
	})
}

/** Ajoute une entree erreur detaillee pour une image en echec. */
const pushError = (collection, errors, payload, label, error) => {
	collection.push({
		...payload,
		status: 'error',
		error: error?.message ?? 'Erreur inconnue',
	})
	errors.push(`${label}: ${error?.message ?? 'Erreur inconnue'}`)
}

/** Extrait l'extension de fichier en minuscule. */
const getFileExtension = (fileName) => {
	const index = fileName.lastIndexOf('.')
	return index >= 0 ? fileName.slice(index).toLowerCase() : ''
}

/** Verifie qu'un fichier image est supporte pour import. */
const isSupportedImageFile = (fileName) => SUPPORTED_IMAGE_EXTENSIONS.includes(getFileExtension(fileName))

/** Verifie qu'un fichier correspond a une archive zip. */
const isZipFile = (file) => {
	if (!file) {
		return false
	}

	const name = (file.name || '').toLowerCase()
	return name.endsWith('.zip') || file.type === 'application/zip'
}

/** Extrait uniquement les images valides depuis une archive zip. */
const extractImagesFromZip = async (zipFile) => {
	const zip = await JSZip.loadAsync(zipFile)
	const extractedFiles = []

	for (const entry of Object.values(zip.files)) {
		if (entry.dir) {
			continue
		}

		if (entry.name.includes('/')) {
			continue
		}

		if (!isSupportedImageFile(entry.name)) {
			continue
		}

		const blob = await entry.async('blob')
		extractedFiles.push(new File([blob], entry.name, {
			type: blob.type || 'application/octet-stream',
			lastModified: zipFile.lastModified || Date.now(),
		}))
	}

	return extractedFiles
}

/** Normalise l'entree image(s) en tableau de fichiers image importables. */
const resolveImageFiles = async (imageFiles) => {
	const files = Array.isArray(imageFiles)
		? imageFiles
		: imageFiles && typeof imageFiles.length === 'number' && typeof imageFiles !== 'string'
			? Array.from(imageFiles)
			: imageFiles
				? [imageFiles]
				: []

	if (files.length === 1 && isZipFile(files[0])) {
		return extractImagesFromZip(files[0])
	}

	return files.filter((file) => isSupportedImageFile(file.name))
}

/** Upload une image vers l'endpoint PrestaShop images/products/{id}. */
const uploadProductImage = async (productId, file) => {
	const baseUrl = import.meta.env.VITE_PRESTASHOP_BACKEND_URL || ''
	const apiKey = import.meta.env.VITE_PRESTASHOP_API_KEY
	const authQuery = apiKey ? `?ws_key=${encodeURIComponent(apiKey)}` : ''
	const url = `${baseUrl}api/images/products/${productId}${authQuery}`
	const formData = new FormData()
	formData.append('image', file, file.name)

	const response = await fetch(url, {
		method: 'POST',
		body: formData,
	})

	if (!response.ok) {
		const contentType = response.headers.get('content-type')
		let errorText = `HTTP ${response.status}`

		if (contentType?.includes('application/json')) {
			try {
				const errorData = await response.json()
				errorText = errorData.message || errorData.error || errorText
			} catch {
				errorText = await response.text()
			}
		} else {
			errorText = await response.text()
		}

		throw new Error(`Upload échoué: ${errorText}`)
	}

	const contentType = response.headers.get('content-type')
	if (contentType?.includes('application/json')) {
		return await response.json()
	}

	return await response.text()
}

/**
 * Import des images produits.
 * Regles metier: nom du fichier image = reference produit; formats limites a png/jpg/jpeg.
 * Parametres: imageFiles, file1Results, onProgress.
 * Retour: Promise<results>.
 */
export const importFile4 = async (imageFiles, file1Results, onProgress = () => {}) => {
	// Etape 1: initialiser l'objet de resultat.
	const results = {
		images: [],
		errors: [],
		summary: {
			totalImages: 0,
			successImages: 0,
			totalErrors: 0,
		},
	}

	try {
		// Etape 2: valider la presence des entrees minimales.
		if (!imageFiles) {
			results.errors.push('Aucun fichier image sélectionné')
			results.summary.totalErrors = results.errors.length
			return results
		}

		if (!file1Results?.products) {
			results.errors.push('Les données du Fichier 1 (produits) sont manquantes')
			results.summary.totalErrors = results.errors.length
			return results
		}

		// Etape 3: construire le mapping reference -> productId depuis file1.
		const productsByReference = {}
		for (const product of file1Results.products) {
			if (product?.status === 'success' && product.id && product.reference) {
				productsByReference[product.reference] = product.id
			}
		}

		// Etape 4: resoudre les fichiers images effectifs (zip ou liste).
		const validImages = await resolveImageFiles(imageFiles)
		results.summary.totalImages = validImages.length

		if (validImages.length === 0) {
			results.errors.push('Aucun fichier image valide (.png/.jpg/.jpeg) trouvé')
			results.summary.totalErrors = results.errors.length
			return results
		}

		// Etape 5: uploader chaque image liee a une reference connue.
		for (let idx = 0; idx < validImages.length; idx++) {
			const file = validImages[idx]
			try {
				const fileName = file.name
				const dotIndex = fileName.lastIndexOf('.')
				const reference = dotIndex >= 0 ? fileName.substring(0, dotIndex) : fileName

				if (!reference) {
					continue
				}

				const productId = productsByReference[reference]
				if (!productId) {
					continue
				}

				await uploadProductImage(productId, file)

				onProgress?.({
					step: 'images',
					message: `Import des images... (${idx + 1}/${validImages.length})`,
					progress: ((idx + 1) / validImages.length) * 100,
				})

				pushSuccess(results.images, {
					fileName,
					reference,
					productId,
				})
				results.summary.successImages++
			} catch (error) {
				pushError(results.images, results.errors, { fileName: file.name }, `Image '${file.name}'`, error)
			}
		}

		// Etape 6: finaliser et retourner.
		results.summary.totalErrors = results.errors.length
		onProgress?.({ step: 'complete', message: 'Import Fichier 4 (Images) terminé!' })

		return results
	} catch (error) {
		// Etape 7: propager une erreur globale si un echec structurel survient.
		results.errors.push(`Erreur générale Fichier 4: ${error.message}`)
		results.summary.totalErrors = results.errors.length
		throw error
	}
}

export const parseFile4CSV = async () => []

export { importFile4 as importImage }