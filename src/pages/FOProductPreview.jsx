import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Product from "../backend/entities/Product.js";
import CartService from "../backend/services/CartService.js";

const buildImageUrl = (productId, imageId) => {
    const baseUrl = import.meta.env.VITE_PRESTASHOP_BACKEND_URL || "";
    const apiKey = import.meta.env.VITE_PRESTASHOP_API_KEY;
    const url = `${baseUrl}api/images/products/${productId}/${imageId}`;
    return apiKey ? `${url}?ws_key=${apiKey}` : url;
};

/**
 * Page FrontOffice d'aperçu produit avec sélection de déclinaison et ajout au panier.
 *
 * Paramètres:
 * - Aucun en entrée directe. L'identifiant produit est lu via `useParams`.
 *
 * Type de résultat:
 * - JSX.Element. Rend l'image, le prix, le stock, les options et le bouton d'ajout.
 *
 * Ce que fait la fonction:
 * - Charge les informations détaillées du produit.
 * - Gère la sélection d'une déclinaison et la quantité.
 * - Permet l'ajout au panier pour un client connecté.
 *
 * Règles métier:
 * - Un utilisateur doit être connecté avant l'ajout au panier.
 * - La quantité ne doit pas descendre sous 1.
 * - La quantité ne doit pas dépasser le stock quand celui-ci est connu.
 *
 * Fonctionnement:
 * - Les informations produit sont chargées au montage.
 * - Les handlers recalculent l'état local et interrogent le stock au besoin.
 *
 * Exemple d'utilisation:
 * - Input: ouverture de `/fo/product/preview/12`
 * - Output attendu: fiche produit détaillée avec bouton d'ajout au panier.
 */
function FOProductPreview() {
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [declinaisons, setDeclinaisons] = useState(null);
    const [selectedDeclinaison, setSelectedDeclinaison] = useState(null);
    const [tax, setTax] = useState(0);
    const [ttcPrice, setTtcPrice] = useState(0);
    const [imageUrl, setImageUrl] = useState("");
    const [imageUrls, setImageUrls] = useState([]);
    const [stockQuantity, setStockQuantity] = useState(null);
    const [badge, setBadge] = useState(null);
    const [description, setDescription] = useState("");

    /**
     * Gère le changement de déclinaison sélectionnée.
     *
     * Paramètres:
     * - `e` (Event): événement de changement du select.
     *
     * Type de résultat:
     * - void. Met à jour `selectedDeclinaison` et recharge le stock.
     *
     * Ce que fait la fonction:
     * - Sélectionne la bonne déclinaison en fonction de l'identifiant choisi.
     * - Recharge le stock correspondant à cette variante.
     *
     * Règles métier:
     * - Le stock affiché doit toujours suivre la déclinaison active.
     *
     * Fonctionnement:
     * - La valeur du select est convertie en nombre puis recherchée dans les déclinaisons.
     *
     * Exemple d'utilisation:
     * - Input: sélection d'une option de déclinaison.
     * - Output attendu: `selectedDeclinaison` mis à jour et stock rechargé.
     */
    const handleDeclinaisonChange = (e) => {
        const selectedId = Number(e.target.value);
        const selected = declinaisons?.values?.find((v) => v.id === selectedId) || null;
        setSelectedDeclinaison(selected);

        if (product?.id) {
            CartService.getStockForProductAttribute(product.id, selectedId)
                .then((qty) => setStockQuantity(qty))
                .catch((error) => {
                    console.error("Error fetching stock: ", error);
                });
        }
    };

    /**
     * Ajoute le produit au panier du client connecté.
     *
     * Paramètres:
     * - Aucun.
     *
     * Type de résultat:
     * - Promise<void> via `CartService.addProductToCart`.
     *
     * Ce que fait la fonction:
     * - Vérifie qu'un client est connecté.
     * - Ajoute la déclinaison sélectionnée et la quantité demandée au panier.
     *
     * Règles métier:
     * - L'ajout au panier est refusé si aucun client n'est identifié.
     * - Une déclinaison choisie est transmise quand elle existe, sinon l'attribut par défaut est utilisé.
     *
     * Fonctionnement:
     * - L'utilisateur courant est lu depuis `localStorage`.
     * - Le service panier reçoit les identifiants du client, du produit, de la déclinaison et la quantité.
     *
     * Exemple d'utilisation:
     * - Input: clic sur "Ajouter au panier".
     * - Output attendu: le produit est ajouté ou une alerte indique qu'il faut se connecter.
     */
    const handleAjouterPanier = () => {
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        const idCustomer = user?.id;

        if (!idCustomer) {
            alert("Veuillez vous connecter avant d'ajouter au panier.");
            return;
        }

        const idProductAttribute = selectedDeclinaison ? selectedDeclinaison.id : 0;

        CartService.addProductToCart(
            idCustomer, 
            product.id, 
            idProductAttribute, 
            quantity, 1).then(() => {
            alert("Produit ajouté au panier !");
        }).catch((error) => {
            console.error("Error adding to cart: ", error);
            alert("Erreur lors de l'ajout au panier.");
        });
    };


    /**
     * Calcule le prix TTC affiché en tenant compte de la déclinaison et de la taxe.
     *
     * Paramètres:
     * - `baseTtc` (number): prix TTC de base.
     * - `taxRate` (number): taux de taxe.
     * - `declinaison` (object|null): option sélectionnée.
     *
     * Type de résultat:
     * - number. Prix final affiché.
     *
     * Ce que fait la fonction:
     * - Ajoute l'impact prix de la déclinaison au prix de base.
     * - Applique la taxe sur l'impact de déclinaison.
     *
     * Règles métier:
     * - Les valeurs non numériques sont ramenées à zéro.
     *
     * Fonctionnement:
     * - Le prix de base et le taux de taxe sont normalisés avant calcul.
     *
     * Exemple d'utilisation:
     * - Input: `getDisplayedPrice(10, 20, { priceImpact: 2 })`
     * - Output attendu: `12.4`.
     */
    const getDisplayedPrice = (baseTtc, taxRate, declinaison) => {
        const impactPrice = declinaison ? Number(declinaison.priceImpact || 0) : 0;
        const safeBase = Number.isFinite(Number(baseTtc)) ? Number(baseTtc) : 0;
        const safeTax = Number.isFinite(Number(taxRate)) ? Number(taxRate) : 0;
        return safeBase + impactPrice * (1 + safeTax / 100);
    };

    const displayedPrice = getDisplayedPrice(ttcPrice, tax, selectedDeclinaison);

    useEffect(() => {
        /**
         * Charge les données produit depuis l'API.
         *
         * Paramètres:
         * - Aucun.
         *
         * Type de résultat:
         * - Promise<void>. Met à jour les états liés au produit.
         *
         * Ce que fait la fonction:
         * - Charge le produit courant.
         * - Récupère les informations dérivées nécessaires au rendu.
         * - Initialise la première déclinaison et son stock si disponible.
         *
         * Règles métier:
         * - Si une déclinaison existe, la première devient la sélection par défaut.
         * - Le stock affiché doit correspondre à la déclinaison sélectionnée.
         *
         * Fonctionnement:
         * - Le produit est chargé par identifiant puis enrichi par plusieurs appels métier.
         *
         * Exemple d'utilisation:
         * - Input: montage de la page pour `id = 12`.
         * - Output attendu: fiche produit complète prête à l'affichage.
         */
        const loadProduct = async () => {
            setIsLoading(true);

            try {
                const productObject = new Product({}, false);

                
                const productData = await productObject.getById(id);
                setProduct(productData);
                
                const badgeData = await productData.getBadge();
                setBadge(badgeData);
                
                const images = await productData.getImages();
                
                const taxRate = await productData.getTax();
                setTax(taxRate);
                
                const ttcPrice = await productData.getTtcPrice();
                setTtcPrice(ttcPrice);
                const data = await productData.getDeclinaisons();
                setDeclinaisons(data);

                const descValue = Product.pickLang(productData.description) || "Description non disponible";
                setDescription(descValue);

                const declinaisonValues = data?.values ?? [];
                const declinaisonImageIds = new Set();
                for (const declinaison of declinaisonValues) {
                    const combination = await productData.getCombinationById(declinaison.id);
                    const ids = combination?.imageIds ?? [];
                    for (const imageId of ids) {
                        const numericId = Number(imageId);
                        if (Number.isFinite(numericId)) {
                            declinaisonImageIds.add(numericId);
                        }
                    }
                }

                const declinaisonImages = Array.from(declinaisonImageIds)
                    .map((imageId) => buildImageUrl(productData.id, imageId))
                    .filter(Boolean);

                const allImages = [...images, ...declinaisonImages].filter(Boolean);
                const uniqueImages = Array.from(new Set(allImages));
                setImageUrls(uniqueImages);
                setImageUrl(uniqueImages[0] || "");

                if (data?.values?.length) {
                    setSelectedDeclinaison(data.values[0]);
                    const firstId = Number(data.values[0]?.id || 0);
                    const qty = await CartService.getStockForProductAttribute(productData.id, firstId);
                    setStockQuantity(qty);
                } else {
                    const qty = await CartService.getStockForProductAttribute(productData.id, 0);
                    setStockQuantity(qty);
                }

            } catch (error) {
                console.error("Error fetching products:", error);
            }

            setIsLoading(false);
        };

        loadProduct();
    }, [id]);

    if (isLoading) 
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    if (!product) 
        return (
            <div className="alert alert-danger" role="alert">
                <i className="bx bx-error-circle me-2"></i>
                Produit introuvable
            </div>
        );

    return (
        <div className="product-preview-container">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <a href="/fo/products" className="text-decoration-none">Produits</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        {Product.pickLang(product.name) || "Produit"}
                    </li>
                </ol>
            </nav>

            <div className="row g-4">
                {/* Colonne Gauche - Image */}
                <div className="col-12 col-md-6">
                    <div 
                        className="card border-0"
                        style={{
                            position: "sticky",
                            top: "20px",
                            boxShadow: "0 2px 12px rgba(67, 89, 113, 0.08)"
                        }}
                    >
                        {/* Image principale */}
                        <div className="position-relative" style={{ paddingBottom: "100%", backgroundColor: "#f5f5f9" }}>
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={Product.pickLang(product.name) || "Product"}
                                    className="position-absolute top-0 start-0 w-100 h-100"
                                    style={{ objectFit: "cover" }}
                                />
                            ) : (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                                    <i className="bx bx-image fs-1 text-body-secondary"></i>
                                </div>
                            )}

                            {/* Badge produit */}
                            {badge && (
                                <div className="position-absolute top-0 start-0 p-3">
                                    <span 
                                        className={`product-badge ${
                                            badge.label === "HOT" ? "product-badge-hot" : "product-badge-new"
                                        }`}
                                    >
                                        <i className="bx product-badge-icon"></i>
                                        {badge.label}
                                    </span>
                                </div>
                            )}

                            {/* Badge rupture stock */}
                            {stockQuantity <= 0 && (
                                <div className="position-absolute bottom-0 start-0 end-0 p-3">
                                    <div className="alert alert-danger mb-0">
                                        <i className="bx bx-x-circle me-2"></i>
                                        Rupture de stock
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Miniatures */}
                        {imageUrls.length > 1 && (
                            <div className="d-flex flex-wrap gap-2 p-3 border-top bg-white">
                                {imageUrls.map((url, index) => (
                                    <button
                                        key={`${url}-${index}`}
                                        type="button"
                                        className="btn p-0 border-0 bg-transparent"
                                        onClick={() => setImageUrl(url)}
                                        style={{
                                            width: "64px",
                                            height: "64px",
                                            borderRadius: "8px",
                                            overflow: "hidden",
                                            border: url === imageUrl ? "2px solid var(--bs-primary)" : "1px solid #e5e7eb"
                                        }}
                                    >
                                        <img
                                            src={url}
                                            alt={`Miniature ${index + 1}`}
                                            className="w-100 h-100"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Colonne Droite - Infos et Formulaire */}
                <div className="col-12 col-md-6">
                    {/* Infos produit */}
                    <div className="mb-4">
                        <p className="text-body-secondary small mb-2">
                            <strong>Référence :</strong> {product.reference}
                        </p>

                        <h2 className="fw-bold mb-2">
                            {Product.pickLang(product.name) || "Produit"}
                        </h2>

                        {/* Prix */}
                        <div className="mb-3">
                            <h3 className="text-primary fw-bold mb-0">
                                {displayedPrice.toFixed(2)} €
                            </h3>
                            {tax > 0 && (
                                <p className="small text-body-secondary">
                                    TVA comprise ({tax}%)
                                </p>
                            )}
                        </div>

                        {/* Stock */}
                        <div className="mb-3">
                            <span className={`badge ${stockQuantity > 0 ? "bg-label-success" : "bg-label-danger"}`}>
                                <i className="bx bx-package me-1"></i>
                                {stockQuantity !== null 
                                    ? `${stockQuantity} en stock` 
                                    : "Stock indisponible"}
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-body-secondary mb-4">
                            {description}
                        </p>
                    </div>

                    {/* Formulaire d'ajout au panier */}
                    <div className="card border-0 p-4" style={{ backgroundColor: "#f8f9fa" }}>
                        {/* Déclinaisons */}
                        {declinaisons?.values?.length > 0 && (
                            <div className="mb-4">
                                <label htmlFor="declinaisonSelect" className="form-label fw-bold">
                                    <i className="bx bx-layout me-2"></i>Options disponibles
                                </label>
                                <select
                                    id="declinaisonSelect"
                                    className="form-select"
                                    onChange={handleDeclinaisonChange}
                                    value={selectedDeclinaison?.id ?? declinaisons.values[0]?.id}
                                >
                                    {declinaisons.values.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.label || `Option ${v.id}`}
                                            {v.priceImpact && ` (+${Number(v.priceImpact).toFixed(2)} €)`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Quantité */}
                        <div className="mb-4">
                            <label htmlFor="quantityInput" className="form-label fw-bold">
                                <i className="bx bx-cart me-2"></i>Quantité
                            </label>
                            <div className="d-flex gap-2 align-items-center">
                                <button 
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    type="button"
                                >
                                    <i className="bx bx-minus"></i>
                                </button>
                                <input 
                                    id="quantityInput"
                                    type="number" 
                                    className="form-control text-center" 
                                    value={quantity} 
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        const stock = Number(stockQuantity ?? 0);
                                        setQuantity(stock > 0 ? Math.max(1, Math.min(val, stock)) : Math.max(1, val));
                                    }}
                                    style={{ maxWidth: "80px" }}
                                />
                                <button 
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => {
                                        const stock = Number(stockQuantity ?? 0);
                                        const next = quantity + 1;
                                        setQuantity(stock > 0 ? Math.min(next, stock) : next);
                                    }}
                                    type="button"
                                >
                                    <i className="bx bx-plus"></i>
                                </button>
                            </div>
                        </div>

                        {/* Boutons d'action */}
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-primary flex-grow-1"
                                onClick={handleAjouterPanier}
                                disabled={stockQuantity <= 0}
                            >
                                <i className="bx bx-cart-add me-2"></i>
                                Ajouter au panier
                            </button>
                            <button 
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    // Partager le produit
                                    alert("Partagez ce produit avec vos amis !");
                                }}
                            >
                                <i className="bx bx-share-alt"></i>
                            </button>
                        </div>

                        {/* Note importante */}
                        {stockQuantity <= 0 && (
                            <div className="alert alert-warning mt-3 mb-0">
                                <i className="bx bx-info-circle me-2"></i>
                                <small>Ce produit est actuellement indisponible</small>
                            </div>
                        )}
                    </div>

                    {/* Infos supplémentaires */}
                    <div className="mt-4">
                        <div className="row g-3">
                            <div className="col-6">
                                <div className="d-flex align-items-start gap-2">
                                    <i className="bx bx-transfer fs-5 text-primary mt-1"></i>
                                    <div>
                                        <p className="fw-bold small mb-1">Retour facile</p>
                                        <p className="text-body-secondary small mb-0">30 jours pour retourner</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="d-flex align-items-start gap-2">
                                    <i className="bx bx-check-circle fs-5 text-success mt-1"></i>
                                    <div>
                                        <p className="fw-bold small mb-1">Garantie</p>
                                        <p className="text-body-secondary small mb-0">Garantie 12 mois</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="d-flex align-items-start gap-2">
                                    <i className="bx bx-truck fs-5 text-info mt-1"></i>
                                    <div>
                                        <p className="fw-bold small mb-1">Livraison</p>
                                        <p className="text-body-secondary small mb-0">2-3 jours ouvrés</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="d-flex align-items-start gap-2">
                                    <i className="bx bx-lock-alt fs-5 text-warning mt-1"></i>
                                    <div>
                                        <p className="fw-bold small mb-1">Paiement sécurisé</p>
                                        <p className="text-body-secondary small mb-0">100% sécurisé</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FOProductPreview;