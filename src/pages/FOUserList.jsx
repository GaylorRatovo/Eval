import {useEffect, useState} from "react";
import Customer from "../backend/entities/Customer.js";
import FOUserRow from "../components/FOUserRow.jsx";
import useLocalStorage from "../hooks/useLocalStorage.jsx";
import CustomerService from "../backend/services/CustomerService.js";
import {Link, useNavigate} from "react-router-dom";

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

    return (
        <div className="row g-4">
            <div className="col-lg-4">
                <div className="card h-100">
                    <div className="card-body">
                        <h4 className="mb-2">Bienvenue sur Sneat Shop</h4>
                        <p className="text-muted">
                            Choisissez un compte client pour continuer vos achats ou passez en mode invite.
                        </p>

                        <div className="d-grid gap-2">
                            <button className="btn btn-primary" type="button" onClick={() => connectGuest()}>
                                Continuer en invite
                            </button>
                            <Link className="btn btn-outline-secondary" to="/">
                                Aller au BackOffice
                            </Link>
                        </div>

                        <hr />

                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-label-primary">Acces rapide</span>
                            <span className="text-muted">Catalogue, panier, commandes</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-lg-8">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h5 className="mb-0">Se connecter avec un client</h5>
                        <span className="badge bg-label-secondary">{customers.length} comptes</span>
                    </div>
                    <div className="card-body">
                        {isLoading ? (
                            <p className="text-muted">Chargements des clients</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
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
                                        {customers.map(customer => (
                                            <FOUserRow
                                                key={customer.id}
                                                customer={customer}
                                                onClick={() => connectCustomer(customer)}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FOUserList;