import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import CartService from "../backend/services/CartService.js";
import Cart from "../backend/entities/Cart.js";
import Product from "../backend/entities/Product.js";
import CartWithDetails from "../backend/dto/CartWithDetails.js";
import OderService from "../backend/services/OderService.js";
import FOCartRow from "../components/FOCartRow.jsx";
import useLocalStorage from "../hooks/useLocalStorage.jsx";

/**
 * Page FrontOffice d'affichage et de manipulation du panier utilisateur.
 *
 * Paramètres:
 * - Aucun. Le composant s'appuie sur le panier backend et le contexte utilisateur en localStorage.
 *
 * Type de résultat:
 * - JSX.Element. Rend le tableau du panier, les totaux et l'action de commande.
 *
 * Ce que fait la fonction:
 * - Charge le dernier panier actif du client connecté.
 * - Enrichit chaque ligne avec les données produit, les déclinaisons, le stock et les prix.
 * - Permet de modifier les options, la quantité, de supprimer une ligne et de lancer le checkout.
 *
 * Règles métier:
 * - Le panier affiché est le dernier panier actif du client courant.
 * - Un client invité est redirigé vers le checkout invité pour finaliser la commande.
 * - La quantité saisie est bornée par le stock disponible quand le stock est connu.
 * - La commande n'est créée que si un utilisateur identifié est présent.
 *
 * Fonctionnement:
 * - Le composant récupère les données du panier dans `useEffect`.
 * - Les lignes sont enrichies avec les données produit nécessaires à l'affichage.
 * - Les handlers locaux synchronisent l'état React avec la persistance backend.
 *
 * Exemple d'utilisation:
 * - Input: `<FOCart />`
 * - Output attendu: un tableau de panier avec actions de modification et bouton "Commander".
 */
function FOCart() {
    const [cart, setCart] = useState(null);
    const [rowDetails, setRowDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [user] = useLocalStorage("user", null);
    const [isGuest] = useLocalStorage("isGuest", false);

    const navigate = useNavigate();

    const totals = useMemo(() => (
        CartService.getCartTotals({
            cartRows: rowDetails
        })
    ), [rowDetails]);

    /**
     * Formate un prix numérique avec 2 décimales ou renvoie '-' si la valeur est invalide.
     *
     * Paramètres:
     * - `value` (number|string): valeur à formater.
     *
     * Type de résultat:
     * - string. Exemple: `12.5` devient `12.50`.
     *
     * Ce que fait la fonction:
     * - Convertit la valeur en nombre.
     * - Retourne un affichage stable pour les cellules de prix.
     *
     * Règles métier:
     * - Toute valeur non numérique est affichée comme non disponible.
     *
     * Fonctionnement:
     * - La conversion se fait avec `Number`.
     * - Si le résultat n'est pas fini, la fonction retourne `-`.
     *
     * Exemple d'utilisation:
     * - Input: `formatPrice(12.5)`
     * - Output attendu: `"12.50"`
     */
    const formatPrice = (value) => {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return "-";
        }
        return number.toFixed(2);
    };

    /**
     * Construit une clé stable pour une ligne de panier utilisée comme `key` React.
     *
     * Paramètres:
     * - `row` (object): ligne de panier.
     * - `index` (number): index courant dans la liste.
     *
     * Type de résultat:
     * - string. Identifiant composite basé sur le produit et l'index.
     *
     * Ce que fait la fonction:
     * - Combine l'identifiant produit et l'index pour éviter les collisions de rendu.
     *
     * Règles métier:
     * - La clé doit rester déterministe pendant un même rendu.
     *
     * Fonctionnement:
     * - La chaîne est construite avec `productId-index`.
     *
     * Exemple d'utilisation:
     * - Input: `getRowKey({ productId: 7 }, 2)`
     * - Output attendu: `"7-2"`
     */
    const getRowKey = (row, index) => {
        return `${row.productId}-${index}`;
    };

    /**
     * Met à jour localement une ligne enrichie de `rowDetails`.
     *
     * Paramètres:
     * - `rowIndex` (number): index de la ligne à modifier.
     * - `values` (object): propriétés à fusionner sur la ligne.
     *
     * Type de résultat:
     * - void. Met à jour l'état React uniquement.
     *
     * Ce que fait la fonction:
     * - Remplace une ligne ciblée par une copie fusionnée avec les nouvelles valeurs.
     *
     * Règles métier:
     * - Les autres lignes du panier ne doivent pas être modifiées.
     *
     * Fonctionnement:
     * - Le tableau est recréé avec `map`.
     * - Seule la ligne à l'index demandé reçoit les nouveaux champs.
     *
     * Exemple d'utilisation:
     * - Input: `updateRow(0, { quantity: 3 })`
     * - Output attendu: la première ligne de `rowDetails` passe à quantité 3.
     */
    const updateRow = (rowIndex, values) => {
        setRowDetails(prev =>
            prev.map((row, index) =>
                index === rowIndex ? {...row, ...values} : row
            )
        );
    };

    /**
     * Persiste en backend la nouvelle liste de lignes de panier.
     *
     * Paramètres:
     * - `nextCartRows` (Array): lignes à sauvegarder.
     *
     * Type de résultat:
     * - Promise<void>. Met à jour l'état `cart` avec l'entité retournée par le backend.
     *
     * Ce que fait la fonction:
     * - Reconstruit une entité `Cart` à partir du panier courant.
     * - Lance la mise à jour distante.
     * - Réinjecte la version sauvegardée dans l'état local.
     *
     * Règles métier:
     * - La source de vérité reste le backend après la sauvegarde.
     * - Les données envoyées doivent représenter la nouvelle structure complète des lignes.
     *
     * Fonctionnement:
     * - La fonction clone le panier courant avec les nouvelles lignes.
     * - Elle appelle `update()` sur l'entité puis remplace l'état local avec la réponse.
     *
     * Exemple d'utilisation:
     * - Input: `persistCartRows([{ productId: 1, quantity: 2 }])`
     * - Output attendu: le panier local est remplacé par la version mise à jour.
     */
    const persistCartRows = async (nextCartRows) => {
        try {
            const nextCart = Cart.fromData({
                ...cart,
                cartRows: nextCartRows,
            });

            setCart(nextCart);

            const updated = await nextCart.update();
            setCart(updated);

        } catch (error) {
            console.error("Error updating cart:", error);
        }
    };

    /**
     * Met à jour une ligne côté `Cart` persistant et lance la sauvegarde.
     *
     * Paramètres:
     * - `cartRowIndex` (number): index de la ligne dans `cart.cartRows`.
     * - `values` (object): champs à fusionner sur la ligne.
     *
     * Type de résultat:
     * - void. La persistance est déléguée à `persistCartRows`.
     *
     * Ce que fait la fonction:
     * - Recalcule la liste complète des lignes du panier.
     * - Envoie le résultat à la couche de persistance.
     *
     * Règles métier:
     * - Seule la ligne ciblée doit changer.
     * - Les valeurs de la ligne doivent rester compatibles avec le modèle de panier.
     *
     * Fonctionnement:
     * - Le tableau des lignes est reconstruit par copie.
     * - La ligne ciblée reçoit la fusion de `values`.
     *
     * Exemple d'utilisation:
     * - Input: `updateCartRow(0, { quantity: 4 })`
     * - Output attendu: la ligne persistée est mise à jour avec la nouvelle quantité.
     */
    const updateCartRow = (cartRowIndex, values) => {
        const nextRows = cart.cartRows.map((row, index) =>
            index === cartRowIndex
                ? {...row, ...values}
                : row
        );

        persistCartRows(nextRows);
    };

    /**
     * Gère le changement de déclinaison d'une ligne de panier.
     *
     * Paramètres:
     * - `rowIndex` (number): index dans `rowDetails`.
     * - `nextId` (number): identifiant de la nouvelle déclinaison.
     * - `cartRowIndex` (number): index côté `cart.cartRows`.
     *
     * Type de résultat:
     * - Promise<void>. Met à jour la ligne locale, la ligne persistée et recharge le stock.
     *
     * Ce que fait la fonction:
     * - Synchronise la nouvelle option choisie dans l'UI et dans le panier backend.
     * - Recharge ensuite le stock pour la variante sélectionnée.
     *
     * Règles métier:
     * - Le stock affiché doit correspondre à la déclinaison sélectionnée.
     * - La ligne persistée doit garder le même produit mais changer d'attribut.
     *
     * Fonctionnement:
     * - La ligne locale est mise à jour immédiatement.
     * - La version persistée reçoit le nouvel attribut.
     * - Le stock est récupéré à partir de `CartService`.
     *
     * Exemple d'utilisation:
     * - Input: `handleOptionChange(0, 12, 0)`
     * - Output attendu: la première ligne passe sur l'option 12 et son stock est rechargé.
     */
    const handleOptionChange = async (rowIndex, nextId, cartRowIndex) => {
        updateRow(rowIndex, {
            selectedOptionId: nextId
        });

        updateCartRow(cartRowIndex, {
            productAttributeId: nextId
        });

        try {
            const productId = rowDetails[rowIndex].productId;

            const stockQuantity =
                await CartService.getStockForProductAttribute(
                    productId,
                    nextId
                );

            updateRow(rowIndex, {stockQuantity});

        } catch (error) {
            console.error("Error stock:", error);
        }
    };

    /**
     * Gère la modification de quantité d'une ligne de panier.
     *
     * Paramètres:
     * - `rowIndex` (number): index dans `rowDetails`.
     * - `nextQty` (number): quantité demandée.
     * - `cartRowIndex` (number): index côté `cart.cartRows`.
     *
     * Type de résultat:
     * - void.
     *
     * Ce que fait la fonction:
     * - Force une quantité minimale de 1.
     * - Limite la quantité au stock disponible quand celui-ci est connu.
     * - Synchronise l'état local et le panier persistant.
     *
     * Règles métier:
     * - Une ligne ne peut jamais descendre sous 1 unité.
     * - Si le stock est connu et positif, la quantité ne peut pas le dépasser.
     *
     * Fonctionnement:
     * - La quantité est normalisée puis transmise aux fonctions de mise à jour.
     *
     * Exemple d'utilisation:
     * - Input: `handleQuantityChange(0, 99, 0)` avec stock 5
     * - Output attendu: quantité bloquée à 5.
     */
    const handleQuantityChange = (rowIndex, nextQty, cartRowIndex) => {
        const stock = Number(rowDetails[rowIndex].stockQuantity);
        const rawQty = Math.max(1, Number(nextQty));
        const quantity = stock > 0 ? Math.min(rawQty, stock) : rawQty;

        updateRow(rowIndex, {quantity});
        updateCartRow(cartRowIndex, {quantity});
    };

    /**
     * Supprime une ligne du panier via `CartService.deleteItems`.
     *
     * Paramètres:
     * - `rowIndex` (number): index de la ligne à supprimer.
     *
     * Type de résultat:
     * - Promise<void>. Met à jour `cart` et `rowDetails`.
     *
     * Ce que fait la fonction:
     * - Demande la suppression de la ligne au backend.
     * - Retire la ligne de l'affichage local si la suppression réussit.
     *
     * Règles métier:
     * - Si le backend renvoie un panier vide ou nul, l'état local doit refléter l'absence de panier.
     *
     * Fonctionnement:
     * - La suppression est déléguée à `CartService`.
     * - La réponse pilote ensuite l'actualisation locale.
     *
     * Exemple d'utilisation:
     * - Input: `handleDeleteRow(1)`
     * - Output attendu: la deuxième ligne disparaît du panier affiché.
     */
    const handleDeleteRow = async (rowIndex) => {
        try {
            const updated = await CartService.deleteItems(
                cart,
                rowIndex
            );

            if (!updated) {
                setCart(null);
                return;
            }

            setCart(updated);

            setRowDetails(prev =>
                prev.filter((_, index) =>
                    index !== rowIndex
                )
            );

        } catch (error) {
            console.error(
                "Error deleting row:",
                error
            );
        }
    };

    /**
     * Lance le processus de checkout du panier.
     *
     * Paramètres:
     * - Aucun.
     *
     * Type de résultat:
     * - Promise<void>.
     *
     * Ce que fait la fonction:
     * - Redirige un invité vers le checkout dédié.
     * - Sinon crée une commande à partir du panier courant.
     * - Informe l'utilisateur du succès ou de l'échec.
     *
     * Règles métier:
     * - Un invité ne peut pas valider directement une commande depuis cette page.
     * - Une commande ne peut être créée que si un utilisateur identifié est disponible.
     *
     * Fonctionnement:
     * - Le comportement dépend du flag `isGuest`.
     * - La création de commande est déléguée à `OderService`.
     *
     * Exemple d'utilisation:
     * - Input: clic sur "Commander"
     * - Output attendu: redirection vers `/fo/checkout` pour un invité, ou création de commande pour un client connecté.
     */
    const handleCheckout = async () => {
        if (isGuest) {
            navigate("/fo/checkout");
            return;
        }

        try {
            const result =
                await OderService.createOrderFromCart(cart, user.id, new Date(),0);
            console.log(result);
            alert(
                "Commande créée avec succès !"
            );
        } catch (error) {
            console.error(error);
            alert(
                "Erreur lors de la création."
            );
        }
    };

    useEffect(() => {
        /**
         * Charge et enrichit le panier courant depuis le backend.
         *
         * Paramètres:
         * - Aucun.
         *
         * Type de résultat:
         * - Promise<void>. Met à jour `cart`, `rowDetails` et `isLoading`.
         *
         * Ce que fait la fonction:
         * - Récupère le dernier panier actif du client.
         * - Vérifie que le panier est encore actif.
         * - Enrichit les lignes avec les données produit, prix, stock et déclinaisons.
         *
         * Règles métier:
         * - Si l'utilisateur n'a pas d'identifiant, aucun panier ne doit être chargé.
         * - Les lignes enrichies doivent correspondre à des produits réels et à leurs attributs.
         *
         * Fonctionnement:
         * - Le panier est lu puis validé côté backend.
         * - Les produits sont chargés, mis en cache localement et fusionnés avec les lignes du panier.
         *
         * Exemple d'utilisation:
         * - Input: chargement du composant pour un client connecté.
         * - Output attendu: un panier enrichi prêt à l'affichage.
         */
        const loadDatas = async () => {
            try {
                setIsLoading(true);
                if (!user.id) {
                    setCart(null);
                    return;
                }
                const customerCart = await CartService.getLastCartByCustomer(user.id);
                if (!customerCart) {
                    setCart(null);
                    return;
                }
                const isActive =
                    await CartService.isCartActive(
                        customerCart.id
                    );
                if (!isActive) {
                    setCart(null);
                    return;
                }

                const enriched = await CartWithDetails
                    .fromCart(customerCart)
                    .enrich();

                const enrichedByKey = new Map();
                for (const enrichedRow of enriched.enrichedRows ?? []) {
                    const key = `${enrichedRow.productId}:${enrichedRow.productAttributeId}`;
                    if (!enrichedByKey.has(key)) {
                        enrichedByKey.set(key, enrichedRow);
                    }
                }

                const productCache = new Map();
                /**
                 * Récupère un produit en cache ou depuis le backend.
                 *
                 * Paramètres:
                 * - `productId` (number): identifiant du produit à charger.
                 *
                 * Type de résultat:
                 * - Promise<Product|null>. Retourne le produit trouvé ou `null`.
                 *
                 * Ce que fait la fonction:
                 * - Évite de recharger plusieurs fois le même produit pendant l'enrichissement.
                 *
                 * Règles métier:
                 * - Un produit déjà chargé doit être réutilisé pendant la même passe.
                 *
                 * Fonctionnement:
                 * - Un `Map` local sert de cache temporaire.
                 *
                 * Exemple d'utilisation:
                 * - Input: `getProduct(15)`
                 * - Output attendu: l'entité produit 15.
                 */
                const getProduct = async (productId) => {
                    if (productCache.has(productId)) {
                        return productCache.get(productId);
                    }
                    const product = await new Product({}, false).getById(productId);
                    productCache.set(productId, product);
                    return product;
                };

                const cartRows = customerCart.cartRows ?? [];
                const rows = (await Promise.all(
                    cartRows.map(async (row, index) => {
                        const productId = Number(row?.productId);
                        const attributeId = Number(row?.productAttributeId || 0);
                        const key = `${productId}:${attributeId}`;
                        const enrichedRow = enrichedByKey.get(key);
                        if (!enrichedRow || !productId) {
                            return null;
                        }

                        const product = await getProduct(productId);
                        if (!product) {
                            return null;
                        }

                        const stockQuantity = await CartService.getStockForProductAttribute(
                            productId,
                            attributeId
                        );

                        const declinaisons = await product.getDeclinaisons();
                        const values = declinaisons?.values || [];

                        // Extract image URL properly if it's an object
                        let imageUrl = enrichedRow.imageUrl;
                        if (typeof imageUrl === 'object' && imageUrl?.url) {
                            imageUrl = imageUrl.url;
                        } else if (typeof imageUrl === 'object') {
                            imageUrl = null; // Skip if still an object
                        }

                        return {
                            productId,
                            productName: enrichedRow.productName,
                            productReference: product.reference,
                            productImageURL: imageUrl,
                            quantity: row?.quantity,
                            baseTtcPrice: await product.getTtcPrice(),
                            taxRate: await product.getTax(),
                            options: values.map(value => ({
                                id: value.id,
                                label: value.label,
                                priceImpact: value.priceImpact
                            })),
                            selectedOptionId: attributeId,
                            stockQuantity,
                            cartRowIndex: index
                        };
                    })
                ))
                    .filter(Boolean);

                setCart(customerCart);
                setRowDetails(rows);

            } catch (error) {
                console.error(error);
                setCart(null);
                setRowDetails([]);

            } finally {
                setIsLoading(false);
            }
        };

        loadDatas();

    }, [user.id]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement du panier...</span>
                </div>
            </div>
        );
    }

    if (!cart || rowDetails.length === 0) {
        return (
            <div>
                <nav aria-label="breadcrumb" className="mb-4">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <a href="/fo/products" className="text-decoration-none">Produits</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Panier</li>
                    </ol>
                </nav>
                
                <div className="text-center py-5">
                    <i className="bx bx-cart-alt" style={{ fontSize: "64px", color: "var(--bs-body-color-rgb)" }}></i>
                    <h4 className="mt-3 mb-2">Votre panier est vide</h4>
                    <p className="text-body-secondary mb-4">Découvrez nos produits et commencez vos achats</p>
                    <a href="/fo/products" className="btn btn-primary">
                        <i className="bx bx-arrow-back me-2"></i>
                        Continuer mes achats
                    </a>
                </div>
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
                    <li className="breadcrumb-item active" aria-current="page">Panier</li>
                </ol>
            </nav>

            {/* En-tête */}
            <div className="mb-4">
                <h2 className="fw-bold mb-1">Mon panier</h2>
                <p className="text-body-secondary">
                    {rowDetails.length} article{rowDetails.length > 1 ? "s" : ""} dans votre panier
                </p>
            </div>

            <div className="row g-4">
                {/* Tableau du panier */}
                <div className="col-12 col-lg-8">
                    <div className="card border-0" style={{ boxShadow: "0 2px 12px rgba(67, 89, 113, 0.08)" }}>
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Produit</th>
                                        <th>Prix unitaire</th>
                                        <th>Quantité</th>
                                        <th>Total</th>
                                        <th style={{ width: "80px" }}>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rowDetails.map((row, index) => (
                                        <FOCartRow
                                            key={getRowKey(row, index)}
                                            row={row}
                                            index={index}
                                            onOptionChange={handleOptionChange}
                                            onQuantityChange={handleQuantityChange}
                                            onDelete={handleDeleteRow}
                                            formatPrice={formatPrice}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bouton continuer mes achats */}
                    <div className="mt-3">
                        <a href="/fo/products" className="btn btn-outline-secondary btn-sm">
                            <i className="bx bx-arrow-back me-2"></i>
                            Continuer mes achats
                        </a>
                    </div>
                </div>

                {/* Résumé du panier (Sticky) */}
                <div className="col-12 col-lg-4">
                    <div 
                        className="card border-0" 
                        style={{
                            boxShadow: "0 2px 12px rgba(67, 89, 113, 0.08)",
                            position: "sticky",
                            top: "20px"
                        }}
                    >
                        <div className="card-body">
                            <h6 className="card-title fw-bold mb-3">
                                <i className="bx bx-receipt me-2"></i>
                                Résumé
                            </h6>

                            {/* Détails des totaux */}
                            <div className="space-y-3">
                                <div className="d-flex justify-content-between align-items-center pb-3">
                                    <span className="text-body-secondary">Sous-total</span>
                                    <span className="fw-bold">{formatPrice(totals.totalHt)} €</span>
                                </div>

                                <div className="d-flex justify-content-between align-items-center pb-3 border-bottom">
                                    <span className="text-body-secondary">Estimation des taxes</span>
                                    <span className="fw-bold">
                                        {formatPrice(totals.totalTtc - totals.totalHt)} €
                                    </span>
                                </div>

                                <div className="d-flex justify-content-between align-items-center pb-3">
                                    <span className="text-body-secondary">Livraison</span>
                                    <span className="badge bg-label-success">Gratuite</span>
                                </div>

                                <div className="d-flex justify-content-between align-items-center py-3 border-top border-bottom">
                                    <strong>Total TTC</strong>
                                    <h5 className="text-primary fw-bold mb-0">
                                        {formatPrice(totals.totalTtc)} €
                                    </h5>
                                </div>
                            </div>

                            {/* Bouton de paiement */}
                            <button 
                                className="btn btn-primary w-100 mt-3"
                                onClick={handleCheckout}
                            >
                                <i className="bx bx-right-arrow-alt me-2"></i>
                                Procéder au paiement
                            </button>

                            {/* Info supplémentaires */}
                            <div className="mt-3 pt-3 border-top">
                                <p className="small text-body-secondary mb-2">
                                    <i className="bx bx-check-circle text-success me-2"></i>
                                    Paiement sécurisé
                                </p>
                                <p className="small text-body-secondary mb-0">
                                    <i className="bx bx-lock-alt text-info me-2"></i>
                                    Données cryptées
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Codes de réduction */}
                    <div className="card border-0 mt-3" style={{ boxShadow: "0 2px 12px rgba(67, 89, 113, 0.08)" }}>
                        <div className="card-body">
                            <h6 className="card-title fw-bold mb-3">
                                <i className="bx bx-tag me-2"></i>
                                Code promo
                            </h6>
                            <div className="input-group input-group-sm">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Entrez votre code..."
                                    disabled
                                />
                                <button className="btn btn-outline-secondary" type="button" disabled>
                                    <i className="bx bx-check"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FOCart;