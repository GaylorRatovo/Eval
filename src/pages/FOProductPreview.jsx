import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Product from "../backend/entities/Product.js";
import CartService from "../backend/services/CartService.js";

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
    const [stockQuantity, setStockQuantity] = useState(null);
    const [badge, setBadge] = useState(null);

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
                setImageUrl(images[0] || "");

                const taxRate = await productData.getTax();
                setTax(taxRate);

                const ttcPrice = await productData.getTtcPrice();
                setTtcPrice(ttcPrice);
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
        <>
            <h1>Apperçu du produit : {id}</h1>

            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={imageUrl}
                    width="160"
                />
            ) : (
                <p>no image</p>
            )}

            <h2>name : {product.name?.[0]?.value}</h2>
            {badge ? (
                <h2 style={{ color: badge.color }}>{badge.label}</h2>
            ) : null}
            <h2>reference : {product.reference}</h2>
            <h2>price TTC : {displayedPrice.toFixed(2)}</h2>
            <h2>stock : {stockQuantity ?? "-"}</h2>

            {declinaisons?.values?.length ? (
                <>
                    <h2>Declinaison :</h2>

                    <select
                        name="option"
                        onChange={handleDeclinaisonChange}
                        value={selectedDeclinaison?.id ?? declinaisons.values[0]?.id}
                    >
                        {declinaisons.values.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.label || ""}
                            </option>
                        ))}
                    </select>
                </>
            ) : null}

            <h2>
                <p>Quantite : </p>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <input type="number" value={quantity} readOnly min={1} />
                <button
                    onClick={() => {
                        const stock = Number(stockQuantity ?? 0);
                        const next = quantity + 1;
                        setQuantity(stock > 0 ? Math.min(next, stock) : next);
                    }}
                >
                    +
                </button>
            </h2>

            <button onClick={handleAjouterPanier}>
                Ajouter au panier
            </button>
        </>
    );
}

export default FOProductPreview;