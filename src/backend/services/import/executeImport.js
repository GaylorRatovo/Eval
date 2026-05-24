import { importFile1 } from './importFile1.js'
import { importFile2 } from './importFile2.js'
import { importFile3 } from './importFile3.js'
import { importFile4 } from './importFile4.js'
import { validateImportBatch } from './importValidation.js'

/**
 * Orchestrateur d'import BackOffice.
 * Regles metier: valider les fichiers avant import; le fichier produits est obligatoire.
 * Methode: execute file1 puis enchaine file2, file3 et file4 selon presence des fichiers.
 * Parametres: { productFile, declinaisonFile, ordersFile, imageZipFile, doImport, onProgress }.
 * Retour: Promise<object> resultat detaille par fichier (file1..file4).
 */
const executeImport = async ({ productFile, declinaisonFile, ordersFile, imageZipFile, doImport, onProgress } = {}) => {
	if (productFile) {
		// Etape 1: valider tous les CSV avant de modifier des donnees metier.
		const validationResult = await validateImportBatch({
			productFile,
			declinaisonFile,
			ordersFile,
		})

		if (!validationResult.valid) {
			// Etape 2: remonter toutes les erreurs de validation en une seule exception lisible.
			const errorMessages = validationResult.errors
				.map((err) => `${err.file} (ligne ${err.line}): ${err.message}`)
				.join('\n')
			throw new Error(`Validation échouée:\n${errorMessages}`)
		}

		// Etape 3: importer le fichier 1 (socle produits/taxes/categories).
		const file1 = await importFile1(productFile, onProgress)
		const output = { file1 }

		if (declinaisonFile) {
			// Etape 4: importer les declinaisons + stocks initiaux.
			output.file2 = await importFile2(declinaisonFile, file1, onProgress)
		}

		if (ordersFile) {
			// Etape 5: importer clients/commandes en s'appuyant sur file1 et file2.
			output.file3 = await importFile3(ordersFile, file1, output.file2 ?? { combinations: [] }, onProgress)
		}

		if (imageZipFile && !doImport) {
			// Etape 6: importer les images (condition logique actuelle conservee telle quelle).
			output.file4 = await importFile4(imageZipFile, file1, onProgress)
		}

		// Etape 7: retourner un rapport d'execution complet.
		return output
	}

	throw new Error('Le fichier produits est obligatoire')
}

export default executeImport