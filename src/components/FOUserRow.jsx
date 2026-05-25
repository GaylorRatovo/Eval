/**
 * Ligne de tableau représentant un client FrontOffice.
 *
 * Paramètres:
 * - `customer` (object): client à afficher.
 * - `onClick` (function): handler déclenché au clic sur le bouton de connexion.
 *
 * Type de résultat:
 * - JSX.Element. Rend une ligne de table avec bouton d'action.
 *
 * Ce que fait la fonction:
 * - Affiche les informations de base d'un client et l'action de connexion.
 *
 * Règles métier:
 * - Le bouton déclenche l'action de connexion du client sélectionné.
 *
 * Fonctionnement:
 * - Les champs du client sont rendus directement dans les cellules.
 *
 * Exemple d'utilisation:
 * - Input: `<FOUserRow customer={customer} onClick={handleClick} />`
 * - Output attendu: une ligne de client avec bouton "Se connecter".
 */
function FOUserRow({customer, onClick}) {

    return <tr>
        <td>{customer.id}</td>
        <td>{customer.firstname}</td>
        <td>{customer.lastname}</td>
        <td>{customer.email}</td>
        <td>
            <button type={"button"} onClick={onClick}>
                Se connecter
            </button>
        </td>
    </tr>
}

export default FOUserRow;