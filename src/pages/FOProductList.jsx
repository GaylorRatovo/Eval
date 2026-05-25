import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import Product from "../backend/entities/Product.js";

/**
 * Page catalogue FrontOffice.
 * Regles metier: affiche les produits avec image principale, stock total et badge metier.
 * Methode: charge tous les produits puis enrichit chaque produit (images, quantity, badge).
 * Parametres: aucun.
 * Retour: JSX tableau catalogue.
 */
function FOProductList() {
    const [products, setProducts] = useState([]);
    const [, setIsLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState({});
    const [badges, setBadges] = useState({});

    const navigate = useNavigate();

    /**
     * Navigue vers la page detail produit.
     */
    const handlePreview = (productId) => {
        navigate(`/fo/product/preview/${productId}`);
    }

    useEffect(() => {
        // Etape 1: charger la liste brute des produits.
        const loadProducts = async () => {
            setIsLoading(true);
            try {
                const product = new Product({}, false);
                const productList = await product.getAll();
                setProducts(productList);

                // Etape 2: enrichir chaque produit pour l'affichage catalogue.
                const nextImageUrls = {};
                const nextBadges = {};
                for (const item of productList) {
                    const images = await item.getImages();
                    nextImageUrls[item.id] = images[0] || "";
                    item.quantity = await item.getQuantity();
                    nextBadges[item.id] = await item.getBadge();
                }
                // Etape 3: hydrater les etats d'affichage.
                setImageUrls(nextImageUrls);
                setBadges(nextBadges);
                setProducts([...productList]);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching products:", error);
                setIsLoading(false);
            }
        };

        loadProducts();
    }, []);

    const getBadgeClass = (badge) => {
        if (!badge?.label) {
            return "product-badge product-badge-new";
        }
        const label = badge.label.toLowerCase();
        if (label.includes("new") || label.includes("nouveau")) {
            return "product-badge product-badge-new";
        }
        if (label.includes("hot") || label.includes("promo")) {
            return "product-badge product-badge-hot";
        }
        return "product-badge product-badge-new";
    };

    return (
        <div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                    <h4 className="mb-1">Catalogue</h4>
                    <p className="text-muted mb-0">Decouvrez nos produits et leurs disponibilites.</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary" type="button">Trier</button>
                    <button className="btn btn-primary" type="button">Nouveautes</button>
                </div>
            </div>

            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                {products.map((product) => {
                    const badge = badges[product.id];
                    const rawPrice = Number(product?.price ?? 0);
                    const priceLabel = Number.isFinite(rawPrice) ? rawPrice.toFixed(2) : "-";
                    return (
                        <div className="col" key={product.id}>
                            <div className="card h-100 product-card">
                                <div className="product-card-media">
                                    {badge ? (
                                        <span className={getBadgeClass(badge)}>
                                            <span className="product-badge-icon">★</span>
                                            {badge.label}
                                        </span>
                                    ) : null}
                                    {imageUrls[product.id] ? (
                                        <img
                                            src={imageUrls[product.id]}
                                            alt={product.name?.[0]?.value || "product"}
                                        />
                                    ) : (
                                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                            Pas d'image
                                        </div>
                                    )}
                                </div>
                                <div className="card-body">
                                    <p className="product-card-brand">Ref. {product.reference}</p>
                                    <h5 className="product-card-title">
                                        {product.name?.[0]?.value}
                                    </h5>
                                    <div className="product-card-price">{priceLabel} €</div>
                                    <div className="product-card-meta">
                                        <span>Stock: {product.quantity ?? "-"}</span>
                                        <span>Disponible immediatement</span>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mt-3">
                                        <button className="btn btn-primary" onClick={() => handlePreview(product.id)}>
                                            Voir le produit
                                        </button>
                                        <button className="btn btn-outline-secondary" type="button">
                                            Favoris
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default FOProductList;