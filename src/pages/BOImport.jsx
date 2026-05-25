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