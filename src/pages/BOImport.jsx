import {useState} from "react";
import executeImport from "../backend/services/import/executeImport.js";

/**
 * Page d'import BackOffice (produits, declinaisons, commandes, images).
 * Regles metier: le fichier produits est obligatoire pour initialiser le referentiel.
 * Methode: collecte les fichiers utilisateur puis appelle l'orchestrateur d'import.
 * Parametres: aucun.
 * Retour: JSX du formulaire d'import et resultat.
 */
function BOImport() {
    const [productFile, setProductFile] = useState(null)
    const [declinaisonFile, setDeclinaisonFile] = useState(null)
    const [ordersFile, setOrdersFile] = useState(null)
    const [imageZipFile, setImageZipFile] = useState(null)
    const [importResult, setImportResult] = useState(null)
    const [importError, setImportError] = useState(null)
    const [isImporting, setIsImporting] = useState(false)
    const [doImport, setDoImport] = useState(false)

	/**
	 * Soumet le lot d'import.
	 * Regles metier: nettoie l'etat precedent, execute la sequence, remonte erreurs explicites.
	 * Parametres: event (submit du formulaire).
	 * Retour: Promise<void>.
	 */
    const handleSubmit = async (event) => {
		// Etape 1: bloquer le comportement navigateur et reinitialiser les retours precedent.
        event.preventDefault()
        setImportError(null)
        setImportResult(null)
        setIsImporting(true)

        try {
			// Etape 2: lancer l'import orchestre avec callback de progression.
            const result = await executeImport({
                productFile,
                declinaisonFile,
                ordersFile,
                imageZipFile,
                doImport,
                onProgress: (progress) => console.log(progress),
            })

			// Etape 3: exposer le resultat brut pour analyse detaillee.
            setImportResult(result)
        } catch (error) {
			// Etape 4: afficher une erreur utilisateur comprehensible.
            setImportError(error?.message ?? 'Erreur inconnue')
        } finally {
			// Etape 5: remettre l'interface en mode normal.
            setIsImporting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>
                    <span>Produits</span>
                    <input
                        type={"file"}
                        placeholder={"Produits"}
                        accept={".csv"}
                        onChange={(event) => setProductFile(event.target.files?.[0] ?? null)}
                    />
                </label>
                {productFile && <p>{productFile.name}</p>}
                <label>
                    <span>Déclinaisons & Stock initiaux</span>
                    <input
                        type={"file"}
                        placeholder={"Produits"}
                        accept={".csv"}
                        onChange={(event) => setDeclinaisonFile(event.target.files?.[0] ?? null)}
                    />
                </label>
                {declinaisonFile && <p>{declinaisonFile.name}</p>}
                <label>
                    <span>Clients & Commandes</span>
                    <input
                        type={"file"}
                        placeholder={"Produits"}
                        accept={".csv"}
                        onChange={(event) => setOrdersFile(event.target.files?.[0] ?? null)}
                    />
                </label>
                {ordersFile && <p>{ordersFile.name}</p>}
                <label>
                    <span>Images</span>
                    <input type="checkbox"
                        checked={doImport}
                        onChange={(event) => setDoImport(event.target.checked)}
                    />
                    <input
                        type={"file"}
                        placeholder={"Produits"}
                        accept={".zip"}
                        onChange={(event) => setImageZipFile(event.target.files?.[0] ?? null)}
                    />
                </label>
                {imageZipFile && <p>{imageZipFile.name}</p>}
                <button type={"submit"} disabled={isImporting}>
                    {isImporting ? 'Import en cours...' : 'Importer'}
                </button>
            </div>

            {importError && <p>{importError}</p>}
            {importResult && <pre>{JSON.stringify(importResult, null, 2)}</pre>}
        </form>
    )
}

export default BOImport;