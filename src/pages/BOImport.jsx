import {useState} from "react";
import executeImport from "../backend/services/import/executeImport.js";

/**
 * Composant BackOffice d'import de données (produits, déclinaisons, commandes et images).
 *
 * Paramètres:
 * - Aucun. Ce composant React lit uniquement son état interne et les fichiers choisis par l'utilisateur.
 *
 * Type de résultat:
 * - JSX.Element. Rend un formulaire d'upload, les messages d'erreur et le résultat brut de l'import.
 *
 * Ce que fait la fonction:
 * - Affiche les champs de sélection des fichiers CSV et ZIP.
 * - Pilote l'état de l'import: fichiers sélectionnés, exécution en cours, erreur et résultat.
 * - Délègue l'exécution réelle à `executeImport`.
 *
 * Règles métier:
 * - Les fichiers attendus sont: produits en CSV, déclinaisons/stock initial en CSV, clients/commandes en CSV, images en ZIP.
 * - L'import réel n'est effectué que si l'option `doImport` est activée.
 * - En cas d'échec du service d'import, le message d'erreur est affiché à l'utilisateur.
 *
 * Fonctionnement:
 * - L'utilisateur sélectionne les fichiers.
 * - Au submit, `handleSubmit` appelle `executeImport` avec les fichiers et l'état `doImport`.
 * - Le composant affiche soit l'erreur, soit le résultat JSON retourné par le service.
 *
 * Exemple d'utilisation:
 * - Input: `<BOImport />`
 * - Output attendu: un formulaire permettant de choisir les fichiers et de lancer l'import.
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
     * Soumet les fichiers sélectionnés au service d'import.
     *
     * Paramètres:
     * - `event` (SubmitEvent): événement de soumission du formulaire. Il est annulé avec `preventDefault()`.
     *
     * Type de résultat:
     * - Promise<void>. La fonction ne renvoie pas de valeur exploitable et met à jour l'état du composant.
     *
     * Ce que fait la fonction:
     * - Réinitialise l'état d'erreur et le résultat précédent.
     * - Passe le composant en mode "import en cours".
     * - Appelle `executeImport` avec les fichiers choisis et l'option `doImport`.
     * - Stocke le résultat ou l'erreur selon l'issue de l'appel.
     *
     * Règles métier:
     * - Le submit ne déclenche jamais un rechargement de page.
     * - Le service d'import reçoit exactement les fichiers sélectionnés par l'utilisateur.
     * - L'import réel dépend de la valeur de `doImport`; sinon le service peut fonctionner en mode contrôle ou prévisualisation.
     *
     * Fonctionnement:
     * - L'événement de formulaire est intercepté.
     * - Les états UI sont remis à zéro pour éviter d'afficher un ancien résultat.
     * - La promesse retournée par `executeImport` pilote l'affichage du succès ou de l'échec.
     *
     * Exemple d'utilisation:
     * - Input: un événement de submit sur un formulaire contenant les fichiers produits, déclinaisons, commandes et images.
     * - Output attendu: soit `importResult` rempli avec le retour du service, soit `importError` contenant le message d'échec.
     */
    const handleSubmit = async (event) => {
        event.preventDefault()
        setImportError(null)
        setImportResult(null)
        setIsImporting(true)

        try {
            const result = await executeImport({
                productFile,
                declinaisonFile,
                ordersFile,
                imageZipFile,
                doImport,
                onProgress: (progress) => console.log(progress),
            })

            setImportResult(result)
        } catch (error) {
            setImportError(error?.message ?? 'Erreur inconnue')
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <div>
            {/* En-tete */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="fw-bold mb-1">Import de donnees</h1>
                    <p className="text-body-secondary mb-0">Importer produits, declinaisons, commandes et images</p>
                </div>
            </div>

            <div className="row g-4">
                {/* Formulaire d'import */}
                <div className="col-12 col-lg-7">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            {/* Indication visuelle de l'import */}
                            {isImporting && (
                                <div className="alert alert-info d-flex align-items-center" role="alert">
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Import en cours...
                                </div>
                            )}

                            {!isImporting && importResult && (
                                <div className="alert alert-success" role="alert">
                                    <i className="bx bx-check-circle me-2"></i>
                                    Import termine avec succes.
                                </div>
                            )}

                            {!isImporting && importError && (
                                <div className="alert alert-danger" role="alert">
                                    <i className="bx bx-error-circle me-2"></i>
                                    Import echoue. Verifiez les fichiers et reessayez.
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="d-grid gap-3">
                                {/* Produits */}
                                <div>
                                    <label className="form-label fw-bold">Produits (CSV)</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept=".csv"
                                        onChange={(event) => setProductFile(event.target.files?.[0] ?? null)}
                                    />
                                    {productFile && <p className="small text-body-secondary mt-1 mb-0">{productFile.name}</p>}
                                </div>

                                {/* Declinaisons */}
                                <div>
                                    <label className="form-label fw-bold">Declinaisons & Stock initiaux (CSV)</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept=".csv"
                                        onChange={(event) => setDeclinaisonFile(event.target.files?.[0] ?? null)}
                                    />
                                    {declinaisonFile && <p className="small text-body-secondary mt-1 mb-0">{declinaisonFile.name}</p>}
                                </div>

                                {/* Commandes */}
                                <div>
                                    <label className="form-label fw-bold">Clients & Commandes (CSV)</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept=".csv"
                                        onChange={(event) => setOrdersFile(event.target.files?.[0] ?? null)}
                                    />
                                    {ordersFile && <p className="small text-body-secondary mt-1 mb-0">{ordersFile.name}</p>}
                                </div>

                                {/* Images */}
                                <div>
                                    <label className="form-label fw-bold">Images (ZIP)</label>
                                    <div className="form-check mb-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="doImport"
                                            checked={doImport}
                                            onChange={(event) => setDoImport(event.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="doImport">
                                            Ne pas importer les images
                                        </label>
                                    </div>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept=".zip"
                                        onChange={(event) => setImageZipFile(event.target.files?.[0] ?? null)}
                                    />
                                    {imageZipFile && <p className="small text-body-secondary mt-1 mb-0">{imageZipFile.name}</p>}
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={isImporting}>
                                    {isImporting ? "Import en cours..." : "Importer"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Resultats */}
                <div className="col-12 col-lg-5">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h5 className="fw-bold mb-3">Resultat</h5>

                            {importError && (
                                <div className="alert alert-danger" role="alert">
                                    <i className="bx bx-error-circle me-2"></i>
                                    {importError}
                                </div>
                            )}

                            {!importError && !importResult && (
                                <p className="text-body-secondary mb-0">Aucun resultat a afficher.</p>
                            )}

                            {importResult && (
                                <pre className="bg-light p-3 rounded mb-0" style={{ maxHeight: "360px", overflow: "auto" }}>
                                    {JSON.stringify(importResult, null, 2)}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BOImport;