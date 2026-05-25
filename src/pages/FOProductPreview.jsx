import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Product from "../backend/entities/Product.js";
import CartService from "../backend/services/CartService.js";

/**
 * Page detail d'un produit FrontOffice.
 * Regles metier: la quantite est bornee par stock, et l'ajout panier exige un client connecte.
 * Methode: charge produit + declinaisons + prix + stock, puis ajoute au panier.
 * Parametres: aucun (id recupere depuis route).
 * Retour: JSX detail produit.
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
    const [stockQuantity, setStockQuantity] = useState(null);
    const [badge, setBadge] = useState(null);

    /**
     * Change la declinaison selectionnee et recharge le stock associe.
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
     * Ajoute la configuration produit courante au panier client.
     * Regles metier: idCustomer obligatoire, attribute 0 si pas de declinaison.
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
     * Calcule le prix TTC affiche en fonction de la declinaison.
     */
    const getDisplayedPrice = (baseTtc, taxRate, declinaison) => {
        const impactPrice = declinaison ? Number(declinaison.priceImpact || 0) : 0;
        const safeBase = Number.isFinite(Number(baseTtc)) ? Number(baseTtc) : 0;
        const safeTax = Number.isFinite(Number(taxRate)) ? Number(taxRate) : 0;
        return safeBase + impactPrice * (1 + safeTax / 100);
    };

    const displayedPrice = getDisplayedPrice(ttcPrice, tax, selectedDeclinaison);

    useEffect(() => {
        // Etape 1: charger toutes les informations necessaires a la fiche produit.
        const loadProduct = async () => {
            setIsLoading(true);

            try {
                const productObject = new Product({}, false);

                // Etape 2: recuperer badge, image, taxes et prix TTC.
                const productData = await productObject.getById(id);
                setProduct(productData);

                const badgeData = await productData.getBadge();
                setBadge(badgeData);

                const images = await productData.getImages();
                setImageUrl(images[0] || "");

                const taxRate = await productData.getTax();
                setTax(taxRate);

                const ttcPrice = await productData.getTtcPrice();
                setTtcPrice(ttcPrice);
                // Etape 3: charger declinaisons puis stock de la declinaison active.
                const data = await productData.getDeclinaisons();
                setDeclinaisons(data);
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
        return <h1>Chargement...</h1>;
    if (!product) 
        return <h1>Produit introuvable</h1>;

    return (
        <div className="row g-4">
            <div className="col-lg-6">
                <div className="card h-100">
                    <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h4 className="mb-0">{product.name?.[0]?.value}</h4>
                            {badge ? (
                                <span className="badge bg-label-primary">{badge.label}</span>
                            ) : null}
                        </div>

                        <div className="ratio ratio-4x3 rounded overflow-hidden bg-label-secondary">
                            {imageUrl ? (
                                <img src={imageUrl} alt={product.name?.[0]?.value || "product"} />
                            ) : (
                                <div className="d-flex align-items-center justify-content-center text-muted">
                                    Pas d'image
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-lg-6">
                <div className="card h-100">
                    <div className="card-body">
                        <p className="text-muted mb-1">Reference {product.reference}</p>
                        <h3 className="text-primary mb-3">{displayedPrice.toFixed(2)} TTC</h3>

                        <div className="d-flex align-items-center gap-3 mb-4">
                            <span className="badge bg-label-success">Stock {stockQuantity ?? "-"}</span>
                            <span className="text-muted">Livraison 48h</span>
                        </div>

                        {declinaisons?.values?.length ? (
                            <div className="mb-4">
                                <label className="form-label">Declinaison</label>
                                <select
                                    name="option"
                                    className="form-select"
                                    onChange={handleDeclinaisonChange}
                                    value={selectedDeclinaison?.id ?? declinaisons.values[0]?.id}
                                >
                                    {declinaisons.values.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.label || ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        <div className="mb-4">
                            <label className="form-label">Quantite</label>
                            <div className="input-group">
                                <button className="btn btn-outline-secondary" type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                                <input className="form-control text-center" type="number" value={quantity} readOnly min={1} />
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => {
                                        const stock = Number(stockQuantity ?? 0);
                                        const next = quantity + 1;
                                        setQuantity(stock > 0 ? Math.min(next, stock) : next);
                                    }}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                            <button className="btn btn-primary" onClick={handleAjouterPanier}>
                                Ajouter au panier
                            </button>
                            <button className="btn btn-outline-secondary" type="button">
                                Ajouter aux favoris
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FOProductPreview;