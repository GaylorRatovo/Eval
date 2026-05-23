import { importFile1 } from './importFile1.js'
import { importFile2 } from './importFile2.js'
import { importFile3 } from './importFile3.js'
import { importFile4 } from './importFile4.js'

const executeImport = async ({ productFile, declinaisonFile, ordersFile, imageZipFile, doImport, onProgress } = {}) => {
	if (productFile) {
		const file1 = await importFile1(productFile, onProgress)
		const output = { file1 }

		if (declinaisonFile) {
			output.file2 = await importFile2(declinaisonFile, file1, onProgress)
		}

		if (ordersFile) {
			output.file3 = await importFile3(ordersFile, file1, output.file2 ?? { combinations: [] }, onProgress)
		}

		if (imageZipFile && !doImport) {
			output.file4 = await importFile4(imageZipFile, file1, onProgress)
		}

		return output
	}

	throw new Error('Le fichier produits est obligatoire')
}

export default executeImport