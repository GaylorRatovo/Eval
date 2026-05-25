import {useEffect, useState} from "react";
import Customer from "../backend/entities/Customer.js";
import FOUserRow from "../components/FOUserRow.jsx";
import useLocalStorage from "../hooks/useLocalStorage.jsx";
import CustomerService from "../backend/services/CustomerService.js";
import {Link ,useNavigate} from "react-router-dom";

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

    return (
        <div className="min-vh-100 d-flex align-items-center py-4" style={{ backgroundColor: "#f8f9fa" }}>
            <div className="container">
                <div className="row justify-content-center">
                    {/* Colonne gauche - Présentation */}
                    <div className="col-12 col-md-5 d-flex flex-column justify-content-center mb-4 mb-md-0">
                        <div className="mb-4">
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <i className="bx bxs-shopping-bags" style={{ fontSize: "48px", color: "var(--bs-primary)" }}></i>
                                <h1 className="fw-bold mb-0">EvalShop</h1>
                            </div>
                            <p className="text-body-secondary h6 mb-0">
                                Votre destination préférée pour les meilleurs achats en ligne
                            </p>
                        </div>

                        <div className="mt-5">
                            <div className="d-flex align-items-start gap-3 mb-4">
                                <i className="bx bx-check-circle text-success fs-5 mt-1 flex-shrink-0"></i>
                                <div>
                                    <h6 className="fw-bold mb-1">Livraison rapide</h6>
                                    <p className="text-body-secondary small mb-0">Livraison en 2-3 jours ouvrés</p>
                                </div>
                            </div>

                            <div className="d-flex align-items-start gap-3 mb-4">
                                <i className="bx bx-shield text-primary fs-5 mt-1 flex-shrink-0"></i>
                                <div>
                                    <h6 className="fw-bold mb-1">Paiement sécurisé</h6>
                                    <p className="text-body-secondary small mb-0">Transactions 100% sécurisées</p>
                                </div>
                            </div>

                            <div className="d-flex align-items-start gap-3">
                                <i className="bx bx-smile text-warning fs-5 mt-1 flex-shrink-0"></i>
                                <div>
                                    <h6 className="fw-bold mb-1">Satisfait ou remboursé</h6>
                                    <p className="text-body-secondary small mb-0">30 jours pour changer d'avis</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Colonne droite - Formulaire de connexion */}
                    <div className="col-12 col-md-5">
                        <div className="card border-0" style={{ boxShadow: "0 2px 12px rgba(67, 89, 113, 0.08)" }}>
                            <div className="card-body p-4 p-md-5">
                                <h3 className="card-title fw-bold mb-1">Connectez-vous</h3>
                                <p className="text-body-secondary mb-4">Accédez à votre compte ou continuez en tant qu'invité</p>

                                {/* Bouton Connexion Anonyme */}
                                <button 
                                    type="button"
                                    className="btn btn-outline-primary w-100 mb-3"
                                    onClick={() => connectGuest()}
                                >
                                    <i className="bx bx-user-check me-2"></i>
                                    Continuer en tant qu'invité
                                </button>

                                <Link to="/" className="btn btn-outline-secondary w-100 mb-4">
                                    <i className="bx bx-log-in me-2"></i>
                                    Aller au backOffice
                                </Link>

                                {/* Divider */}
                                <div className="d-flex align-items-center my-4">
                                    <div className="flex-grow-1 border-top"></div>
                                    <div className="px-2 text-body-secondary small">OU</div>
                                    <div className="flex-grow-1 border-top"></div>
                                </div>

                                {/* Liste des clients */}
                                {isLoading ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm mb-2" role="status">
                                            <span className="visually-hidden">Chargement...</span>
                                        </div>
                                        <p className="text-body-secondary small mb-0">Chargement des clients...</p>
                                    </div>
                                ) : customers.length > 0 ? (
                                    <div>
                                        <label className="form-label fw-bold small mb-2">Sélectionner un client</label>
                                        <div className="d-flex flex-column gap-2">
                                            {customers.map((customer) => (
                                                <button
                                                    key={customer.id}
                                                    type="button"
                                                    className="btn btn-light text-start border"
                                                    onClick={() => connectCustomer(customer)}
                                                    style={{
                                                        padding: "12px 16px",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = "var(--bs-primary)";
                                                        e.currentTarget.style.backgroundColor = "#f0f4ff";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = "#e0e0e0";
                                                        e.currentTarget.style.backgroundColor = "white";
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center w-100">
                                                        <div>
                                                            <h6 className="mb-1 fw-bold">
                                                                {customer.firstname || "Client"} {customer.lastname || ""}
                                                            </h6>
                                                            <p className="mb-0 text-body-secondary small">
                                                                {customer.email}
                                                            </p>
                                                        </div>
                                                        <i className="bx bx-right-arrow-alt text-primary"></i>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="alert alert-info mb-0">
                                        <i className="bx bx-info-circle me-2"></i>
                                        <small>Aucun client disponible</small>
                                    </div>
                                )}

                                {/* Lien supplémentaire */}
                                <p className="text-center text-body-secondary small mt-4 mb-0">
                                    Première visite ? 
                                    <a href="#" className="text-decoration-none ms-2">
                                        Créer un compte
                                    </a>
                                </p>
                            </div>
                        </div>

                        {/* Informations de sécurité */}
                        <div className="text-center mt-4">
                            <p className="text-body-secondary small mb-0">
                                <i className="bx bx-lock-alt me-1"></i>
                                Vos données sont sécurisées et cryptées
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FOUserList;