import { Link,useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import Product from "../backend/entities/Product.js";
import Category from "../backend/entities/Category.js";
import { filterProducts } from "../backend/services/ProductService.js";

/**
 * Page FrontOffice affichant la liste des produits avec filtres et navigation vers l'aperçu.
 *
 * Paramètres:
 * - Aucun.
 *
 * Type de résultat:
 * - JSX.Element. Rend les filtres, le tableau des produits et les actions d'aperçu.
 *
 * Ce que fait la fonction:
 * - Charge les produits et les catégories depuis le backend.
 * - Enrichit les produits avec leurs images, stock, badge, prix et catégorie.
 * - Permet de filtrer la liste avant d'ouvrir un aperçu produit.
 *
 * Règles métier:
 * - Les catégories racines sont exclues du filtre.
 * - Les produits affichés doivent rester cohérents avec les critères saisis.
 *
 * Fonctionnement:
 * - Les données sont chargées au montage.
 * - Les filtres sont appliqués localement via `useMemo`.
 *
 * Exemple d'utilisation:
 * - Input: `<FOProductList />`
 * - Output attendu: une liste filtrable de produits avec bouton d'aperçu.
 */
function FOProductList() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState({});
    const [badges, setBadges] = useState({});

    // filtres
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [categoryId, setCategoryId] = useState("");
    const [name, setName] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    // Lire la query de recherche depuis l'URL
    const queryFromUrl = new URLSearchParams(location.search).get("q") || "";
    const normalizedQuery = queryFromUrl.trim().toLowerCase();

    // Synchroniser l'état du filtre name avec la query URL
    useEffect(() => {
        setName(queryFromUrl);
    }, [queryFromUrl]);

    /**
     * Navigue vers la page d'aperçu produit.
     *
     * Paramètres:
     * - `productId` (number): identifiant du produit à consulter.
     *
     * Type de résultat:
     * - void.
     *
     * Ce que fait la fonction:
     * - Construit l'URL d'aperçu et déclenche la navigation.
     *
     * Règles métier:
     * - L'aperçu doit ouvrir le produit exact sélectionné.
     *
     * Fonctionnement:
     * - `useNavigate` est appelé avec la route paramétrée.
     *
     * Exemple d'utilisation:
     * - Input: `handlePreview(12)`
     * - Output attendu: navigation vers `/fo/product/preview/12`.
     */
    const handlePreview = (productId) => {
        navigate(`/fo/product/preview/${productId}`);
    };

    useEffect(() => {
        /**
         * Charge et enrichit la liste des produits.
         *
         * Paramètres:
         * - Aucun.
         *
         * Type de résultat:
         * - Promise<void>. Met à jour `products`, `imageUrls` et `badges`.
         *
         * Ce que fait la fonction:
         * - Récupère tous les produits.
         * - Charge les données dérivées nécessaires à l'affichage: images, stock, badge, prix et catégorie.
         *
         * Règles métier:
         * - Chaque produit affiché doit être enrichi avant rendu.
         *
         * Fonctionnement:
         * - Les données sont construites en parallèle avec `Promise.all` puis stockées dans l'état.
         *
         * Exemple d'utilisation:
         * - Input: montage de la page.
         * - Output attendu: tableau de produits prêt à filtrer.
         */
        const loadProducts = async () => {
            setIsLoading(true);
            try {
                const product = new Product({}, false);
                const productList = await product.getAll();

                const nextImageUrls = {};
                const nextBadges = {};

                const enrichedProducts = await Promise.all(
                    productList.map(async (item) => {
                        const [images, quantity, badge, priceTtc, category] = await Promise.all([
                            item.getImages(),
                            item.getQuantity(),
                            item.getBadge(),
                            item.getTtcPrice(),
                            item.getCategory(),
                        ]);

                        item.quantity = quantity;
                        item.badge = badge;
                        item.priceTtc = priceTtc;
                        item.categoryName = Product.pickLang(category?.name) || "";

                        nextImageUrls[item.id] = images[0] || "";
                        nextBadges[item.id] = badge;

                        return item;
                    })
                );

                setProducts(enrichedProducts);
                setImageUrls(nextImageUrls);
                setBadges(nextBadges);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching products:", error);
                setIsLoading(false);
            }
        };

        loadProducts();
    }, []);

    useEffect(() => {
        let isActive = true;

        /**
         * Charge les catégories utilisées par le filtre de catégories.
         *
         * Paramètres:
         * - Aucun.
         *
         * Type de résultat:
         * - Promise<void>. Met à jour `categories`.
         *
         * Ce que fait la fonction:
         * - Récupère les catégories filtrées côté backend.
         * - Ignore les catégories racines inutiles pour le front office.
         *
         * Règles métier:
         * - Une catégorie vide ou racine ne doit pas être proposée dans le filtre.
         *
         * Fonctionnement:
         * - Les catégories sont chargées séparément puis synchronisées avec le composant.
         *
         * Exemple d'utilisation:
         * - Input: montage de la page.
         * - Output attendu: liste de catégories exploitables dans le select.
         */
        const loadCategories = async () => {
            try {
                const categoryApi = new Category({}, false);
                const categoryList = await categoryApi.getExcl([1, 2]);
                if (isActive) {
                    setCategories(categoryList);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        loadCategories();

        return () => {
            isActive = false;
        };
    }, []);

    const filteredProducts = useMemo(() => {
        return filterProducts({
            products,
            minPrice,
            maxPrice,
            categoryId: categoryId || null,
            name
        });
    }, [products, minPrice, maxPrice, categoryId, name]);

    const selectableCategories = useMemo(() => {
        return categories.filter((category) => String(Product.pickLang(category?.name) ?? "").trim() !== "");
    }, [categories]);

    return (
        <div>
            {/* En-tête de la page */}
            <div className="mb-4">
                <h2 className="fw-bold mb-1">Découvrez nos produits</h2>
                <p className="text-body-secondary">
                    {normalizedQuery
                        ? `Résultats pour "${queryFromUrl}" (${filteredProducts.length})`
                        : `${filteredProducts.length} produits disponibles`}
                </p>
            </div>

            <Link to="/fo/removeStock">
                Retirer Stock
            </Link>

            {/* Barre de filtres horizontale */}
            <div className="card mb-4" style={{ border: "none", boxShadow: "0 2px 4px rgba(67, 89, 113, 0.08)" }}>
                <div className="card-body p-3">
                    <div className="row g-3 align-items-end">
                        <div className="col-12 col-md-3">
                            <label htmlFor="filterName" className="form-label fw-bold small mb-2">
                                <i className="bx bx-search me-2"></i>Nom du produit
                            </label>
                            <input
                                id="filterName"
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Rechercher..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-2">
                            <label htmlFor="filterMinPrice" className="form-label fw-bold small mb-2">
                                <i className="bx bx-euro me-2"></i>Prix min
                            </label>
                            <input
                                id="filterMinPrice"
                                type="number"
                                className="form-control form-control-sm"
                                placeholder="0"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                min="0"
                            />
                        </div>

                        <div className="col-12 col-md-2">
                            <label htmlFor="filterMaxPrice" className="form-label fw-bold small mb-2">
                                <i className="bx bx-euro me-2"></i>Prix max
                            </label>
                            <input
                                id="filterMaxPrice"
                                type="number"
                                className="form-control form-control-sm"
                                placeholder="0"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                min="0"
                            />
                        </div>

                        <div className="col-12 col-md-3">
                            <label htmlFor="filterCategory" className="form-label fw-bold small mb-2">
                                <i className="bx bx-category me-2"></i>Catégorie
                            </label>
                            <select
                                id="filterCategory"
                                className="form-select form-select-sm"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                <option value="">Toutes les catégories</option>
                                {selectableCategories.map((category, index) => (
                                    <option key={`${category.id}-${index}`} value={category.id}>
                                        {Product.pickLang(category.name)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-12 col-md-2">
                            <button
                                className="btn btn-sm btn-outline-secondary w-100"
                                onClick={() => {
                                    setName("");
                                    setMinPrice(0);
                                    setMaxPrice(0);
                                    setCategoryId("");
                                }}
                            >
                                <i className="bx bx-reset me-2"></i>Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grille de cartes produits */}
            {isLoading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="row g-4">
                    {filteredProducts.map((product, index) => (
                        <div key={`${product.id}-${index}`} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                            <div
                                className="product-card h-100 d-flex flex-column"
                                style={{ cursor: "pointer" }}
                                onClick={() => handlePreview(product.id)}
                            >
                                {/* Image du produit */}
                                <div className="product-card-media position-relative">
                                    {imageUrls[product.id] ? (
                                        <img src={imageUrls[product.id]} alt={Product.pickLang(product.name) || "Product"} />
                                    ) : (
                                        <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                                            <i className="bx bx-image fs-1 text-body-secondary"></i>
                                        </div>
                                    )}

                                    {/* Badge produit */}
                                    {badges[product.id] && (
                                        <span
                                            className={`product-badge ${
                                                badges[product.id].label === "HOT"
                                                    ? "product-badge-hot"
                                                    : "product-badge-new"
                                            }`}
                                        >
                                            <i className="bx product-badge-icon"></i>
                                            {badges[product.id].label}
                                        </span>
                                    )}

                                    {/* Badge stock */}
                                    {product.quantity <= 0 && (
                                        <span
                                            className="product-badge"
                                            style={{
                                                background: "rgba(255, 62, 29, 0.14)",
                                                color: "#ff4d49",
                                                border: "1px solid rgba(255, 77, 73, 0.25)",
                                            }}
                                        >
                                            Rupture
                                        </span>
                                    )}
                                </div>

                                {/* Corps de la carte */}
                                <div className="card-body flex-grow-1 d-flex flex-column p-3">
                                    {/* Référence produit */}
                                    <p className="product-card-brand">
                                        REF: {product.reference || "-"}
                                    </p>

                                    {/* Nom du produit */}
                                    <h6 className="product-card-title">
                                        {Product.pickLang(product.name) || "Sans titre"}
                                    </h6>

                                    {/* Catégorie */}
                                    <p className="small text-body-secondary mb-2">
                                        {product.categoryName || "Uncategorized"}
                                    </p>

                                    {/* Espaceur pour pousser le prix vers le bas */}
                                    <div className="flex-grow-1"></div>

                                    {/* Stock info */}
                                    <p className="small text-body-secondary mb-2">
                                        <i className="bx bx-package me-1"></i>
                                        Stock: <strong>{product.quantity || 0}</strong>
                                    </p>

                                    {/* Prix */}
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="product-card-price">
                                            {Number(product.priceTtc ?? product.price).toFixed(2)} €
                                        </span>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePreview(product.id);
                                            }}
                                        >
                                            <i className="bx bx-eye me-1"></i>Voir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="alert alert-info" role="alert">
                    <i className="bx bx-info-circle me-2"></i>
                    Aucun produit ne correspond à vos critères de recherche.
                </div>
            )}
        </div>
    );
}

export default FOProductList;