import {useEffect, useState} from "react";
import Customer from "../backend/entities/Customer.js";
import FOUserRow from "../components/FOUserRow.jsx";
import useLocalStorage from "../hooks/useLocalStorage.jsx";
import CustomerService from "../backend/services/CustomerService.js";
import {useNavigate} from "react-router-dom";

/**
 * Page de selection d'utilisateur FrontOffice.
 * Regles metier: autorise connexion client reel ou mode anonyme (guest).
 * Methode: charge la liste clients, puis stocke le contexte user dans localStorage.
 * Parametres: aucun.
 * Retour: JSX de selection utilisateur.
 */
function FOUserList() {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useLocalStorage("user", null);
    const [isGuest, setIsGuest] = useLocalStorage("isGuest", false);
    const navigate = useNavigate();

    useEffect(() => {
        // Etape 1: charger les clients disponibles pour connexion FO.
        async function loadCustomers() {
            setIsLoading(true);

            try {
                const customer = new Customer({}, false);
                const data = await customer.getAllFiltered();

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
     * Connecte un client connu et redirige vers le catalogue.
     */
    const connectCustomer = (customer) => {
        setUser(customer);
        setIsGuest(false);
        navigate('/fo/products')
    }
    
    /**
     * Connecte en mode anonyme et redirige vers le catalogue.
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