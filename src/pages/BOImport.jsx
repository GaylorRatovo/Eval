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
        <div className="d-flex flex-column gap-4">
            <div>
                <h4 className="mb-1">Import des donnees</h4>
                <p className="text-muted mb-0">Charger les fichiers CSV et ZIP pour initialiser la base.</p>
            </div>
            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Produits</label>
                            <input
                                className="form-control"
                                type={"file"}
                                placeholder={"Produits"}
                                accept={".csv"}
                                onChange={(event) => setProductFile(event.target.files?.[0] ?? null)}
                            />
                            {productFile && <div className="form-text">{productFile.name}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Declinaisons & Stock initiaux</label>
                            <input
                                className="form-control"
                                type={"file"}
                                placeholder={"Produits"}
                                accept={".csv"}
                                onChange={(event) => setDeclinaisonFile(event.target.files?.[0] ?? null)}
                            />
                            {declinaisonFile && <div className="form-text">{declinaisonFile.name}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Clients & Commandes</label>
                            <input
                                className="form-control"
                                type={"file"}
                                placeholder={"Produits"}
                                accept={".csv"}
                                onChange={(event) => setOrdersFile(event.target.files?.[0] ?? null)}
                            />
                            {ordersFile && <div className="form-text">{ordersFile.name}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Images</label>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={doImport}
                                    onChange={(event) => setDoImport(event.target.checked)}
                                />
                                <span className="text-muted">Importer le ZIP d'images</span>
                            </div>
                            <input
                                className="form-control"
                                type={"file"}
                                placeholder={"Produits"}
                                accept={".zip"}
                                onChange={(event) => setImageZipFile(event.target.files?.[0] ?? null)}
                            />
                            {imageZipFile && <div className="form-text">{imageZipFile.name}</div>}
                        </div>
                        <div className="col-12">
                            <button className="btn btn-primary" type={"submit"} disabled={isImporting}>
                                {isImporting ? 'Import en cours...' : 'Importer'}
                            </button>
                        </div>
                    </form>

                    {importError && <div className="alert alert-danger mt-3">{importError}</div>}
                    {importResult && (
                        <pre className="mt-3 mb-0">{JSON.stringify(importResult, null, 2)}</pre>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BOImport;