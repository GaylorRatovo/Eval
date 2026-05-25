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
        return <p>Chargement...</p>;
    }

    if (!cart) {
        return <p>Pas de panier</p>;
    }

    return (
        <div>
            <h1>Finaliser la commande</h1>

            {error ? <p>{error}</p> : null}

            <div>
                <button type="button" onClick={() => setMode("login")}>Se connecter</button>
                <button type="button" onClick={() => setMode("register")}>Inserer les infos</button>
            </div>

            {mode === "login" ? (
                <div>
                    <h2>Choisir un client</h2>
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
            ) : (
                <form onSubmit={handleFormSubmit}>
                    <h2>Informations client</h2>
                    <input type="text" placeholder="Firstname" value={form.firstname} onChange={handleFormChange("firstname")} />
                    <input type="text" placeholder="Lastname" value={form.lastname} onChange={handleFormChange("lastname")} />
                    <input type="email" placeholder="Email" value={form.email} onChange={handleFormChange("email")} />
                    <input type="text" placeholder="Password" value={form.password} onChange={handleFormChange("password")} />
                    <input type="text" placeholder="Adresse" value={form.address1} onChange={handleFormChange("address1")} />
                    <input type="text" placeholder="Code postal" value={form.postcode} onChange={handleFormChange("postcode")} />
                    <input type="text" placeholder="Ville" value={form.city} onChange={handleFormChange("city")} />
                    <button type="submit" disabled={isSubmitting}>Creer compte</button>
                </form>
            )}

            {!isGuest ? (
                <div>
                    <button type="button" onClick={handleConfirmOrder}>
                        Effectuer la commande
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export default FOGuestCheckout;
