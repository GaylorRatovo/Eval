import {useEffect, useState} from "react";
import Customer from "../backend/entities/Customer.js";
import FOUserRow from "../components/FOUserRow.jsx";
import useLocalStorage from "../hooks/useLocalStorage.jsx";
import CustomerService from "../backend/services/CustomerService.js";
import {useNavigate} from "react-router-dom";

/**
 * Page FrontOffice de sélection et connexion d'un client.
 *
 * Paramètres:
 * - Aucun.
 *
 * Type de résultat:
 * - JSX.Element. Rend une liste de clients et une option de connexion anonyme.
 *
 * Ce que fait la fonction:
 * - Charge les clients sélectionnables.
 * - Permet de se connecter comme client existant ou comme invité.
 *
 * Règles métier:
 * - Les clients anonymes sont exclus de la liste.
 * - La connexion anonyme utilise l'identifiant réservé du client anonyme.
 *
 * Fonctionnement:
 * - La liste est chargée au montage.
 * - Les boutons mettent à jour le contexte utilisateur dans le stockage local.
 *
 * Exemple d'utilisation:
 * - Input: `<FOUserList />`
 * - Output attendu: table de clients et bouton de connexion anonyme.
 */
function FOUserList() {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useLocalStorage("user", null);
    const [isGuest, setIsGuest] = useLocalStorage("isGuest", false);
    const navigate = useNavigate();

    const ANONYMOUS_CUSTOMER_ID = [1,2];

    useEffect(() => {
        /**
         * Charge la liste des clients en excluant les clients anonymes.
         *
         * Paramètres:
         * - Aucun.
         *
         * Type de résultat:
         * - Promise<void>. Met à jour `customers`.
         *
         * Ce que fait la fonction:
         * - Récupère les clients depuis le backend.
         * - Les stocke dans l'état local pour affichage.
         *
         * Règles métier:
         * - Les identifiants anonymes ne doivent jamais être proposés à la connexion classique.
         *
         * Fonctionnement:
         * - Le service client est interrogé puis la réponse alimente la table.
         *
         * Exemple d'utilisation:
         * - Input: ouverture de la page.
         * - Output attendu: liste des clients affichables.
         */
        async function loadCustomers() {
            setIsLoading(true);

            try {
                const customer = new Customer({}, false);
                const data = await customer.getExclApi(ANONYMOUS_CUSTOMER_ID);

                setCustomers(data);
                setIsLoading(false);
            } catch (error) {
                console.error("ERROS WHILE FETCHING CUSTOMERS: " + error)
                return null;
            }
        }

        loadCustomers();
    }, []);

    /**
     * Connecte l'application en tant que client sélectionné.
     *
     * Paramètres:
     * - `customer` (object): client choisi.
     *
     * Type de résultat:
     * - void.
     *
     * Ce que fait la fonction:
     * - Met à jour l'utilisateur courant.
     * - Désactive le mode invité.
     * - Redirige vers la liste des produits.
     *
     * Règles métier:
     * - La connexion classique doit sortir du mode invité.
     *
     * Fonctionnement:
     * - L'état local est mis à jour puis la navigation se fait vers le front office produit.
     *
     * Exemple d'utilisation:
     * - Input: clic sur "Se connecter" pour un client donné.
     * - Output attendu: stockage du client et navigation vers `/fo/products`.
     */
    const connectCustomer = (customer) => {
        setUser(customer);
        setIsGuest(false);
        navigate('/fo/products')
    }
    
    /**
     * Connecte l'application en mode invité.
     *
     * Paramètres:
     * - Aucun.
     *
     * Type de résultat:
     * - void.
     *
     * Ce que fait la fonction:
     * - Stocke l'identifiant anonyme comme utilisateur courant.
     * - Active le mode invité.
     * - Redirige vers la liste des produits.
     *
     * Règles métier:
     * - Le mode invité doit être explicitement enregistré dans le stockage local.
     *
     * Fonctionnement:
     * - Le client anonyme est enregistré puis la navigation est déclenchée.
     *
     * Exemple d'utilisation:
     * - Input: clic sur "Connexion anonyme".
     * - Output attendu: `isGuest` passe à `true` et l'utilisateur arrive sur `/fo/products`.
     */
    const connectGuest = () => {
        setUser({id: CustomerService.ANONYMOUS_ID});
        setIsGuest(true);
        navigate('/fo/products')
    }

    return <>
        <h1>Se connecter avec un client</h1>
        <button type={"button"} onClick={() => connectGuest()}>
            Connexion anonyme
        </button>
        {isLoading ? (<p>Chargements des clients</p>) : (
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Firstname</th>
                    <th>Lastname</th>
                    <th>Email</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody>
                {
                    customers.map(customer =>
                        <FOUserRow
                            key={customer.id}
                            customer={customer}
                            onClick={() => connectCustomer(customer)}
                        />)
                }
                </tbody>
            </table>)
        }
    </>
}

export default FOUserList;