/**
 * Ligne utilisateur FO pour selection de connexion.
 * Parametres: customer, onClick.
 * Retour: JSX ligne de tableau.
 */
function FOUserRow({customer, onClick}) {

    return <tr>
        <td>{customer.id}</td>
        <td>{customer.firstname}</td>
        <td>{customer.lastname}</td>
        <td>{customer.email}</td>
        <td>
            <button className="btn btn-sm btn-primary" type={"button"} onClick={onClick}>
                Se connecter
            </button>
        </td>
    </tr>
}

export default FOUserRow;