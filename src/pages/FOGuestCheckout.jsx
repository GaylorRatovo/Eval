import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage.jsx";
import CartService from "../backend/services/CartService.js";
import Customer from "../backend/entities/Customer.js";
import OderService from "../backend/services/OderService.js";
import CustomerService from "../backend/services/CustomerService.js";
import FOUserRow from "../components/FOUserRow.jsx";

/**
 * Page FrontOffice de checkout invité et de création de compte depuis le panier.
 *
 * Paramètres:
 * - Aucun. Le composant utilise l'utilisateur courant, le panier actif et un formulaire local.
 *
 * Type de résultat:
 * - JSX.Element. Rend soit une liste de clients à sélectionner, soit un formulaire d'inscription.
 *
 * Ce que fait la fonction:
 * - Gère le parcours invité jusqu'à la validation de la commande.
 * - Permet soit de lier un client existant au panier, soit d'en créer un nouveau.
 *
 * Règles métier:
 * - La page n'est accessible que pour un utilisateur marqué invité.
 * - Les clients anonymes sont exclus de la sélection.
 * - Tous les champs du formulaire sont obligatoires avant création du compte.
 * - La commande n'est confirmée que si le panier et le client existent.
 *
 * Fonctionnement:
 * - Le composant vérifie d'abord les flags de session et redirige si nécessaire.
 * - Il charge le panier actif puis les clients filtrés.
 * - Les handlers gèrent la connexion, l'inscription et la confirmation de commande.
 *
 * Exemple d'utilisation:
 * - Input: un utilisateur connecté en mode invité avec un panier actif.
 * - Output attendu: écran de finalisation permettant de se connecter à un client ou de créer un compte.
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

    const ANONYMOUS_CUSTOMER_ID = [1,2];

    const navigate = useNavigate();

    useEffect(() => {
        if (!user?.id) {
            navigate("/fo");
            return;
        }
        if (!isGuest) {
            navigate("/fo/cart");
            return;
        }

        /**
         * Charge le dernier panier actif du client courant.
         *
         * Paramètres:
         * - Aucun.
         *
         * Type de résultat:
         * - Promise<void>. Met à jour `cart` et `isLoading`.
         *
         * Ce que fait la fonction:
         * - Récupère le dernier panier du client.
         * - Vérifie qu'il est actif avant de l'afficher.
         *
         * Règles métier:
         * - Sans panier actif, l'utilisateur ne peut pas finaliser la commande.
         *
         * Fonctionnement:
         * - Appel au service panier puis contrôle de l'état actif.
         *
         * Exemple d'utilisation:
         * - Input: composant chargé pour un client invité ayant un panier actif.
         * - Output attendu: `cart` rempli avec le panier courant.
         */
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
        /**
         * Charge la liste de clients filtrée pour la sélection lors de la connexion invitée.
         *
         * Paramètres:
         * - Aucun.
         *
         * Type de résultat:
         * - Promise<void>. Met à jour `customers`.
         *
         * Ce que fait la fonction:
         * - Récupère les clients depuis l'API.
         * - Exclut les clients anonymes et les comptes invités.
         *
         * Règles métier:
         * - La liste proposée doit contenir uniquement de vrais clients sélectionnables.
         *
         * Fonctionnement:
         * - Les données sont récupérées puis filtrées avant d'être stockées localement.
         *
         * Exemple d'utilisation:
         * - Input: mode `login` activé.
         * - Output attendu: une table de clients valides pour la connexion.
         */
        const loadCustomers = async () => {
            try {
                const customerApi = new Customer({}, false);
                const data = await customerApi.getExclApi(ANONYMOUS_CUSTOMER_ID);
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
     * Connecte un client existant au panier via `CustomerService.connectCustomerToCart`.
     *
     * Paramètres:
     * - `customer` (object): client sélectionné.
     *
     * Type de résultat:
     * - Promise<void>. Met à jour `cart`, `user` et `isGuest`.
     *
     * Ce que fait la fonction:
     * - Associe le panier courant au client choisi.
     * - Désactive le mode invité après connexion.
     *
     * Règles métier:
     * - Un client valide doit être fourni.
     * - L'opération ne peut pas être relancée pendant une soumission déjà en cours.
     *
     * Fonctionnement:
     * - Le service de connexion renvoie la nouvelle structure panier + client.
     * - Les états locaux sont mis à jour avec cette réponse.
     *
     * Exemple d'utilisation:
     * - Input: `handleLoginCustomer(customer)`
     * - Output attendu: `user` devient le client choisi et `isGuest` passe à `false`.
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
     * Génère un handler de mise à jour d'un champ du formulaire d'inscription.
     *
     * Paramètres:
     * - `field` (string): nom du champ à mettre à jour.
     *
     * Type de résultat:
     * - function(event). Retourne un handler qui met à jour `form`.
     *
     * Ce que fait la fonction:
     * - Produit une fonction de saisie réutilisable pour les champs du formulaire.
     *
     * Règles métier:
     * - Le champ ciblé doit correspondre à une propriété existante de l'état du formulaire.
     *
     * Fonctionnement:
     * - Le handler copie le formulaire actuel puis remplace la valeur du champ ciblé.
     *
     * Exemple d'utilisation:
     * - Input: `handleFormChange("email")`
     * - Output attendu: un handler qui met à jour `form.email`.
     */
    const handleFormChange = (field) => (event) => {
        setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    /**
     * Soumet le formulaire d'enregistrement du client invité et crée le compte avec l'adresse.
     *
     * Paramètres:
     * - `event` (SubmitEvent): événement de soumission du formulaire.
     *
     * Type de résultat:
     * - Promise<void>. Met à jour `cart`, `user`, `isGuest` ou `error`.
     *
     * Ce que fait la fonction:
     * - Valide la présence de tous les champs requis.
     * - Vérifie qu'un panier est bien disponible.
     * - Délègue la création du client et de l'adresse au service métier.
     *
     * Règles métier:
     * - Tous les champs sont obligatoires.
     * - Un panier doit exister pour créer le compte depuis le checkout.
     *
     * Fonctionnement:
     * - Le formulaire est bloqué par `preventDefault()`.
     * - Les données sont envoyées à `CustomerService.registerCustomerForCart`.
     *
     * Exemple d'utilisation:
     * - Input: soumission du formulaire avec prénom, nom, email, mot de passe et adresse valides.
     * - Output attendu: création du client, association au panier et sortie du mode invité.
     */
    const handleFormSubmit = async (event) => {
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
     * Confirme la commande pour le client courant en créant une commande.
     *
     * Paramètres:
     * - Aucun.
     *
     * Type de résultat:
     * - Promise<void> via `OderService.createOrderFromCart`.
     *
     * Ce que fait la fonction:
     * - Vérifie la présence du panier et du client.
     * - Crée la commande et redirige vers la liste des commandes.
     *
     * Règles métier:
     * - La commande ne peut être confirmée que pour un client identifié.
     * - Sans panier ou sans client, la validation est refusée.
     *
     * Fonctionnement:
     * - La date courante est utilisée pour la création de commande.
     * - Le service métier est appelé puis les retours succès ou erreur sont affichés.
     *
     * Exemple d'utilisation:
     * - Input: clic sur le bouton de confirmation après connexion.
     * - Output attendu: commande créée puis navigation vers `/fo/orders`.
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
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    if (!cart) {
        return (
            <div className="alert alert-danger" role="alert">
                <i className="bx bx-error-circle me-2"></i>
                Aucun panier trouvé. Veuillez ajouter des produits à votre panier.
            </div>
        );
    }

    return (
        <div>
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <a href="/fo/products" className="text-decoration-none">Produits</a>
                    </li>
                    <li className="breadcrumb-item">
                        <a href="/fo/cart" className="text-decoration-none">Panier</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">Finaliser la commande</li>
                </ol>
            </nav>

            {/* En-tête */}
            <div className="mb-4">
                <h2 className="fw-bold mb-1">Finaliser votre commande</h2>
                <p className="text-body-secondary">
                    Sélectionnez ou créez votre compte pour continuer
                </p>
            </div>

            {/* Message d'erreur */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bx bx-error-circle me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                </div>
            )}

            {/* Toggles Mode */}
            <div className="btn-group mb-4" role="group">
                <button 
                    type="button"
                    className={`btn ${mode === "login" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setMode("login")}
                >
                    <i className="bx bx-log-in me-2"></i>
                    Se connecter
                </button>
                <button 
                    type="button"
                    className={`btn ${mode === "register" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setMode("register")}
                >
                    <i className="bx bx-user-plus me-2"></i>
                    Créer un compte
                </button>
            </div>

            <div className="row g-4">
                {/* Contenu principal */}
                <div className="col-12 col-lg-8">
                    {mode === "login" ? (
                        <div className="card border-0" style={{ boxShadow: "0 2px 12px rgba(67, 89, 113, 0.08)" }}>
                            <div className="card-body p-4">
                                <h5 className="card-title fw-bold mb-4">
                                    <i className="bx bx-user me-2"></i>
                                    Sélectionner un client existant
                                </h5>

                                {customers.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Nom</th>
                                                    <th>Email</th>
                                                    <th style={{ width: "100px" }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customers.map((customer) => (
                                                    <tr key={customer.id}>
                                                        <td className="fw-bold">
                                                            {customer.firstname} {customer.lastname}
                                                        </td>
                                                        <td>{customer.email}</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => handleLoginCustomer(customer)}
                                                                disabled={isSubmitting}
                                                            >
                                                                <i className="bx bx-check me-1"></i>
                                                                Choisir
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info mb-0">
                                        <i className="bx bx-info-circle me-2"></i>
                                        Aucun client disponible. Créez un nouveau compte ci-contre.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card border-0" style={{ boxShadow: "0 2px 12px rgba(67, 89, 113, 0.08)" }}>
                            <div className="card-body p-4">
                                <h5 className="card-title fw-bold mb-4">
                                    <i className="bx bx-user-plus me-2"></i>
                                    Créer un nouveau compte
                                </h5>

                                <form onSubmit={handleFormSubmit}>
                                    <div className="row g-3">
                                        {/* Informations personnelles */}
                                        <div className="col-12">
                                            <h6 className="fw-bold text-body-secondary mb-3">Informations personnelles</h6>
                                        </div>

                                        <div className="col-12 col-sm-6">
                                            <label htmlFor="firstname" className="form-label">Prénom</label>
                                            <input 
                                                id="firstname"
                                                type="text" 
                                                className="form-control" 
                                                placeholder="Jean" 
                                                value={form.firstname} 
                                                onChange={handleFormChange("firstname")}
                                                required
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6">
                                            <label htmlFor="lastname" className="form-label">Nom</label>
                                            <input 
                                                id="lastname"
                                                type="text" 
                                                className="form-control" 
                                                placeholder="Dupont" 
                                                value={form.lastname} 
                                                onChange={handleFormChange("lastname")}
                                                required
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label htmlFor="email" className="form-label">Email</label>
                                            <input 
                                                id="email"
                                                type="email" 
                                                className="form-control" 
                                                placeholder="jean@example.com" 
                                                value={form.email} 
                                                onChange={handleFormChange("email")}
                                                required
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label htmlFor="password" className="form-label">Mot de passe</label>
                                            <input 
                                                id="password"
                                                type="password" 
                                                className="form-control" 
                                                placeholder="••••••••" 
                                                value={form.password} 
                                                onChange={handleFormChange("password")}
                                                required
                                            />
                                        </div>

                                        {/* Adresse */}
                                        <div className="col-12">
                                            <h6 className="fw-bold text-body-secondary mb-3 mt-2">Adresse de livraison</h6>
                                        </div>

                                        <div className="col-12">
                                            <label htmlFor="address1" className="form-label">Adresse</label>
                                            <input 
                                                id="address1"
                                                type="text" 
                                                className="form-control" 
                                                placeholder="15 Rue du Commerce" 
                                                value={form.address1} 
                                                onChange={handleFormChange("address1")}
                                                required
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6">
                                            <label htmlFor="postcode" className="form-label">Code postal</label>
                                            <input 
                                                id="postcode"
                                                type="text" 
                                                className="form-control" 
                                                placeholder="75001" 
                                                value={form.postcode} 
                                                onChange={handleFormChange("postcode")}
                                                required
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6">
                                            <label htmlFor="city" className="form-label">Ville</label>
                                            <input 
                                                id="city"
                                                type="text" 
                                                className="form-control" 
                                                placeholder="Paris" 
                                                value={form.city} 
                                                onChange={handleFormChange("city")}
                                                required
                                            />
                                        </div>

                                        <div className="col-12">
                                            <button 
                                                type="submit" 
                                                className="btn btn-primary w-100"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Création en cours...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bx bx-user-plus me-2"></i>
                                                        Créer mon compte
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                {/* Récapitulatif du panier */}
                <div className="col-12 col-lg-4">
                    <div 
                        className="card border-0 position-sticky" 
                        style={{
                            boxShadow: "0 2px 12px rgba(67, 89, 113, 0.08)",
                            top: "20px"
                        }}
                    >
                        <div className="card-body">
                            <h6 className="card-title fw-bold mb-3">
                                <i className="bx bx-receipt me-2"></i>
                                Récapitulatif de la commande
                            </h6>

                            <div className="mb-3">
                                <p className="text-body-secondary small mb-1">
                                    Panier ID: <span className="fw-bold">{cart.id}</span>
                                </p>
                                <p className="text-body-secondary small mb-0">
                                    Articles: <span className="fw-bold">{cart.cartRows?.length || 0}</span>
                                </p>
                            </div>

                            <div className="d-flex justify-content-between align-items-center py-3 border-top border-bottom mb-3">
                                <strong>Total TTC</strong>
                                <h5 className="text-primary fw-bold mb-0">
                                    À calculer
                                </h5>
                            </div>

                            {!isGuest && (
                                <button 
                                    type="button"
                                    className="btn btn-success w-100 mb-2"
                                    onClick={handleConfirmOrder}
                                >
                                    <i className="bx bx-check-circle me-2"></i>
                                    Confirmer la commande
                                </button>
                            )}

                            <button 
                                type="button"
                                className="btn btn-outline-secondary w-100"
                                onClick={() => window.history.back()}
                            >
                                <i className="bx bx-arrow-back me-2"></i>
                                Retour au panier
                            </button>

                            <p className="text-body-secondary small text-center mt-3 mb-0">
                                <i className="bx bx-lock-alt text-success me-1"></i>
                                Paiement sécurisé
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FOGuestCheckout;
