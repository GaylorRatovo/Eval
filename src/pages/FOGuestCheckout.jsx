import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage.jsx";
import CartService from "../backend/services/CartService.js";
import Customer from "../backend/entities/Customer.js";
import OderService from "../backend/services/OderService.js";
import CustomerService from "../backend/services/CustomerService.js";
import FOUserRow from "../components/FOUserRow.jsx";

/**
 * Page de finalisation pour utilisateur invite.
 * Regles metier: l'invite doit etre rattache a un client reel (connexion ou creation) avant commande.
 * Methode: propose mode login/register puis cree la commande depuis le panier actif.
 * Parametres: aucun.
 * Retour: JSX du tunnel de finalisation.
 */
function FOGuestCheckout() {
    const [user, setUser] = useLocalStorage("user", null);
    const [isGuest, setIsGuest] = useLocalStorage("isGuest", false);
    const [cart, setCart] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [mode, setMode] = useState("login");
    const [customers, setCustomers] = useState([]);

    const [form, setForm] = useState({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        address1: "",
        postcode: "",
        city: "",
    });

    const navigate = useNavigate();

    useEffect(() => {
        // Etape 1: proteger la route et charger le panier actif invite.
        if (!user?.id) {
            navigate("/fo");
            return;
        }
        if (!isGuest) {
            navigate("/fo/cart");
            return;
        }

        const loadCart = async () => {
            try {
                setIsLoading(true);
                const customerCart = await CartService.getLastCartByCustomer(user.id);
                if (!customerCart) {
                    setCart(null);
                    return;
                }
                const isActive = await CartService.isCartActive(customerCart.id);
                if (!isActive) {
                    setCart(null);
                    return;
                }
                setCart(customerCart);
            } catch (err) {
                console.error("Error loading cart: ", err);
                setCart(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadCart();
    }, [isGuest, navigate, user?.id]);

    useEffect(() => {
        // Etape 2: charger les clients existants seulement en mode login.
        const loadCustomers = async () => {
            try {
                const customerApi = new Customer({}, false);
                const data = await customerApi.getAllFiltered();
                const filtered = (data ?? []).filter((item) => (
                    Number(item?.isGuest ?? 0) !== 1
                    && Number(item?.id ?? 0) !== CustomerService.ANONYMOUS_ID
                ));
                setCustomers(filtered);
            } catch (err) {
                console.error("Error fetching customers: ", err);
            }
        };

        if (mode === "login") {
            loadCustomers();
        }
    }, [mode]);

    /**
     * Associe un client existant au panier invite.
     * Parametres: customer.
     * Retour: Promise<void>.
     */
    const handleLoginCustomer = async (customer) => {
        if (!customer || isSubmitting) {
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            const result = await CustomerService.connectCustomerToCart(cart, customer);
            setCart(result.cart);
            setUser(result.customer);
            setIsGuest(false);
        } catch (err) {
            console.error("Error connecting customer: ", err);
            setError("Connexion impossible");
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Met a jour un champ du formulaire register.
     */
    const handleFormChange = (field) => (event) => {
        setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    /**
     * Cree un client + adresse puis associe ce client au panier.
     * Regles metier: tous les champs obligatoires doivent etre renseignes.
     * Parametres: event submit.
     * Retour: Promise<void>.
     */
    const handleFormSubmit = async (event) => {
        // Etape 3: valider les entrees formulaire avant appel service.
        event.preventDefault();
        setError("");

        const { firstname, lastname, email, password, address1, postcode, city } = form;
        if (!firstname || !lastname || !email || !password || !address1 || !postcode || !city) {
            setError("Veuillez remplir tous les champs");
            return;
        }

        if (!cart) {
            setError("Panier introuvable");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await CustomerService.registerCustomerForCart(cart, {
                firstname,
                lastname,
                email,
                password,
                address1,
                postcode,
                city,
            });
            setCart(result.cart);
            setUser(result.customer);
            setIsGuest(false);
        } catch (err) {
            console.error("Error creating customer/address: ", err);
            setError("Erreur lors de la creation du compte");
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Confirme la commande finale depuis le panier courant.
     * Parametres: aucun.
     * Retour: void (promesse geree en then/catch).
     */
    const handleConfirmOrder = () => {
        if (!cart || !user?.id) {
            setError("Panier ou client introuvable");
            return;
        }
        const dateNow = new Date();
        OderService.createOrderFromCart(cart, user.id, dateNow, 0).then(() => {
            alert("Commande créée avec succès !");
            navigate("/fo/orders");
        }).catch((err) => {
            console.error("Error creating order: ", err);
            setError("Erreur lors de la creation de la commande");
        });
    };

    if (isLoading) {
        return <p>Chargement...</p>;
    }

    if (!cart) {
        return <p>Pas de panier</p>;
    }

    return (
        <div className="row g-4">
            <div className="col-lg-8">
                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">Finaliser la commande</h5>
                    </div>
                    <div className="card-body">
                        {error ? (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        ) : null}

                        <ul className="nav nav-pills mb-4">
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${mode === "login" ? "active" : ""}`}
                                    type="button"
                                    onClick={() => setMode("login")}
                                >
                                    Se connecter
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${mode === "register" ? "active" : ""}`}
                                    type="button"
                                    onClick={() => setMode("register")}
                                >
                                    Creer un compte
                                </button>
                            </li>
                        </ul>

                        {mode === "login" ? (
                            <div>
                                <h6 className="mb-3">Choisir un client</h6>
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
                                            {customers.map((customer) => (
                                                <FOUserRow
                                                    key={customer.id}
                                                    customer={customer}
                                                    onClick={() => handleLoginCustomer(customer)}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleFormSubmit} className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Firstname</label>
                                    <input className="form-control" type="text" value={form.firstname} onChange={handleFormChange("firstname")} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Lastname</label>
                                    <input className="form-control" type="text" value={form.lastname} onChange={handleFormChange("lastname")} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Email</label>
                                    <input className="form-control" type="email" value={form.email} onChange={handleFormChange("email")} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Password</label>
                                    <input className="form-control" type="text" value={form.password} onChange={handleFormChange("password")} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Adresse</label>
                                    <input className="form-control" type="text" value={form.address1} onChange={handleFormChange("address1")} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Code postal</label>
                                    <input className="form-control" type="text" value={form.postcode} onChange={handleFormChange("postcode")} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Ville</label>
                                    <input className="form-control" type="text" value={form.city} onChange={handleFormChange("city")} />
                                </div>
                                <div className="col-12">
                                    <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                                        Creer compte
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <div className="col-lg-4">
                <div className="card">
                    <div className="card-body">
                        <h6 className="mb-2">Panier actif</h6>
                        <p className="text-muted mb-3">Votre panier #{cart?.id}</p>
                        <ul className="list-unstyled mb-3">
                            <li className="d-flex justify-content-between mb-2">
                                <span>Statut</span>
                                <span className="badge bg-label-info">Invite</span>
                            </li>
                            <li className="d-flex justify-content-between">
                                <span>Verification</span>
                                <span className="badge bg-label-success">OK</span>
                            </li>
                        </ul>
                        {!isGuest ? (
                            <button className="btn btn-success w-100" type="button" onClick={handleConfirmOrder}>
                                Effectuer la commande
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FOGuestCheckout;
