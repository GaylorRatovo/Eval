import api from "../utils/api";
import Customer from "../entities/Customer";
import Order from "../entities/Order"
import Cart from "../entities/Cart"
import Product from "../entities/Product";
import StockAvailable from "../entities/StockAvailable";
import { ensureLocalDateTime } from "../utils/utils"
import { toJSONList } from "../xml/cartXML";
import { toJSONList as toOrderJSONList } from "../xml/orderXML";
import CartWithDetails from "../dto/CartWithDetails.js";

// Constants 
const CURRENCY_ID = 1; // Euro
const LANGUAGE_ID = 1;
const SHOP_GROUP_ID = 1;
const SHOP_ID = 1;
const DEFAULT_CARRIER_ID = 1;
const RECYCLABLE = 0;
const GIFT = 0;
const MOBILE_THEME = 0;
const ALLOW_SEPARATED_PACKAGE = 0;

const buildDeliveryOption = (addressId, carrierId = DEFAULT_CARRIER_ID) => {
    if (!addressId || !carrierId) {
        return "";
    }
    return JSON.stringify({
        [addressId]: `${carrierId},`,
    });
};



/**
 * Vérifie si un panier est encore actif (aucune commande liée).
 *
 * Paramètres:
 * - `idCart` (number|string): identifiant du panier à vérifier.
 *
 * Retour: Promise<boolean> — `true` si aucun ordre lié (panier actif), `false` sinon.
 *
 * Règles métier:
 * - Interroge l'API `orders` pour vérifier l'absence d'une commande liée à `id_cart`.
 * - Considère le panier inactif si une commande existe pour ce panier.
 *
 * Exemple:
 * await isCartActive(12)
 * => true
 */
const isCartActive = async (idCart) => {
    const orderApi = new Order({}, false);
    // const xml = orderApi.getBy("id_cart",idCart);
    const xml = await api.get(`${orderApi.endpoint}?display=full&filter[id_cart]=[${idCart}]`);
    const orders = toOrderJSONList(xml);
    return orders.length === 0;
}

/**
 * Récupère le dernier panier d'un client (le plus récent) au format `Cart`.
 *
 * Paramètres:
 * - `idCustomer` (number|string): identifiant du client.
 *
 * Retour: Promise<Cart|null> — l'objet `Cart` le plus récent ou `null` si aucun panier.
 *
 * Règles métier:
 * - Trie par date (date_add/dateAdd) et retourne le plus récent.
 * - Retourne `null` si aucun panier trouvé.
 *
 * Exemple d'utilisation:
 * const cart = await getLastCartByCustomer(3)
 * // cart || null
 */
const getLastCartByCustomer = async (idCustomer) => {
    const cartApi = new Cart({}, false);

        const response = await api.get(
            `${cartApi.endpoint}?display=full&filter[id_customer]=[${idCustomer}]`
        );

    // const response = await cartApi.getBy("id_customer", idCustomer);

    const carts = toJSONList(response);

    if (carts.length === 0) {
        return null;
    }

    carts.sort((a, b) => {
        const aDate = a?.date_add ?? a?.dateAdd ?? "";
        const bDate = b?.date_add ?? b?.dateAdd ?? "";
        return new Date(bDate) - new Date(aDate);
    });

    const latestCart = Cart.fromData(carts[0]);
    console.log("Latest cart:", latestCart);
    return latestCart;
};


/**
 * Crée un nouveau panier pour un client ou renvoie le panier actif existant.
 *
 * Paramètres:
 * - `idCustomer` (number): identifiant du client.
 * - `date` (Date|string): date de création (par défaut now).
 * - `initialRows` (Array): lignes initiales à pré-remplir dans le panier.
 *
 * Retour: Promise<{cart: Cart, isNew: boolean}> — le panier et un flag indiquant s'il a été créé.
 *
 * Règles métier:
 * - Si un panier actif existe, le retourne sans créer.
 * - Si le client n'a pas d'adresse, lance une erreur.
 * - Initialise les `deliveryOption` et valeurs PrestaShop standards.
 *
 * Exemple:
 * await createOrUpdateCart(5, new Date(), [{ productId: 1, quantity: 2 }])
 */
const createOrUpdateCart  = async (idCustomer, date = new Date(), initialRows = []) => {    

    const dateUsed = ensureLocalDateTime(date)

    const customerApi = new Customer({}, false);

    const customer = await customerApi.getById(idCustomer);
    const address = await customer.getAddress();
    
    const customerCart = await getLastCartByCustomer(idCustomer);
    if (customerCart && await isCartActive(customerCart.id)) {
        return { cart: customerCart, isNew: false };
    }

    if (!address?.length) {
        throw new Error(`No address found for customer ${idCustomer}`);
    }

    const deliveryOption = buildDeliveryOption(address[0].id, DEFAULT_CARRIER_ID);

    const seededRows = Array.isArray(initialRows)
        ? initialRows.map((row) => ({
            ...row,
            addressDeliveryId: row?.addressDeliveryId || address[0].id,
        }))
        : [];

    const newCart = new Cart({
        customerId: idCustomer,
        idGuest: 0,
        addressDeliveryId: address[0].id,
        addressInvoiceId: address[0].id,
        currencyId: CURRENCY_ID,
        langId: LANGUAGE_ID,
        carrierId: DEFAULT_CARRIER_ID,
        shopId: SHOP_ID,
        shopGroupId: SHOP_GROUP_ID,
        secureKey: customer?.secureKey ?? "",
        recyclable: RECYCLABLE,
        gift: GIFT,
        deliveryOption,
        mobileTheme: MOBILE_THEME,
        allowSeperatedPackage: ALLOW_SEPARATED_PACKAGE,
        dateAdd: dateUsed,
        dateUpd: dateUsed,
        cartRows: seededRows,
    });

    const savedCart = await newCart.save();
    return { cart: savedCart, isNew: true };

}

/**
 * Supprime une ligne du panier et persiste le changement.
 *
 * Paramètres:
 * - `cart` (Cart): instance du panier.
 * - `rowIndex` (number): index de la ligne à supprimer.
 *
 * Retour: Promise<Cart|null> — panier mis à jour ou `null` si le panier devient vide.
 *
 * Règles métier:
 * - Si l'index est invalide, renvoie le panier inchangé.
 * - Si après suppression le panier est vide, supprime le panier via `cart.delete()`.
 *
 * Exemple:
 * const next = await deleteItems(cart, 0)
 */
const deleteItems = async (cart, rowIndex) => {
    const rows = cart?.cartRows ?? [];
    const index = Number(rowIndex);
    if (!Number.isInteger(index) || index < 0 || index >= rows.length) {
        return cart;
    }

    const nextRows = rows.filter((_, idx) => idx !== index);
    if (nextRows.length === 0) {
        await cart.delete();
        return null;
    }

    cart.cartRows = nextRows;
    await cart.update();
    return cart;
}

/**
 * Ajoute un produit (avec éventuelle déclinaison) au panier d'un client.
 *
 * Paramètres:
 * - `idCustomer` (number): identifiant du client.
 * - `idProduct` (number): identifiant du produit.
 * - `idProductAttribute` (number): identifiant de la déclinaison (0 si aucune).
 * - `quantity` (number): quantité souhaitée.
 * - `multiplicateur` (number): facteur multiplicatif appliqué à la quantité.
 *
 * Retour: Promise<Cart> — le panier mis à jour.
 *
 * Règles métier:
 * - La quantité est tronquée à un entier >= 1 et multipliée par `multiplicateur`.
 * - Si aucun panier actif, crée un panier via `createOrUpdateCart`.
 *
 * Exemple:
 * await addProductToCart(3, 12, 0, 2)
 */
const addProductToCart = async (idCustomer, idProduct, idProductAttribute, quantity, multiplicateur = 1) => {
    const factor = Number(multiplicateur) || 1;
    const safeQty = Math.max(1, Math.trunc((Number(quantity) || 0) * factor));

    const cartRow = {
        productId: idProduct,
        productAttributeId: idProductAttribute,
        quantity: safeQty,
        addressDeliveryId: 0,
    };

    const { cart, isNew } = await createOrUpdateCart(idCustomer, new Date(), [cartRow]);
    if (isNew) {
        return cart;
    }

    cartRow.addressDeliveryId = cart.addressDeliveryId;
    cart.cartRows = [...(cart.cartRows ?? []), cartRow];
    await cart.update();
    return cart;
}

/**
 * Duplique un panier en réinjectant ses lignes (utile pour tests/duplication).
 * OPTIMISÉ: Parallélise les ajouts avec Promise.all() au lieu de séquentiels.
 *
 * Paramètres:
 * - `cart` (Cart): panier source.
 * - `multiplicateur` (number): facteur appliqué aux quantités.
 * - `dateUpdate` (Date|string): date associée (non utilisée ici pour la création).
 *
 * Retour: Promise<void> — résout quand l'opération est terminée.
 *
 * Règles métier:
 * - Pour chaque ligne, appelle `addProductToCart` en multipliant la quantité.
 * - OPTIMISATION: Utilise Promise.all() pour paralléliser au lieu de boucle séquentielle.
 */
const duplicateCart = async(cart, multiplicateur, dateUpdate) => {
    // OPTIMISATION: Paralléliser tous les ajouts au lieu de sequential await
    await Promise.all(
        (cart.cartRows || []).map(row => 
            addProductToCart(
                cart.customerId, 
                row.productId, 
                row.productAttributeId, 
                Number(row.quantity) * multiplicateur
            )
        )
    )
}

/**
 * Récupère l'entité `Product` associée à une ligne de panier.
 *
 * Paramètres:
 * - `cartRow` (object): ligne du panier contenant `productId`.
 *
 * Retour: Promise<Product|null> — instance `Product` ou `null` si introuvable.
 *
 * Exemple:
 * const product = await getProductForRow({ productId: 12 })
 */
const getProductForRow = async (cartRow) => {
    if (!cartRow) {
        return null;
    }

    const productId = Number(cartRow.productId || 0);
    if (!productId) {
        return null;
    }

    const productApi = new Product({}, false);
    return await productApi.getById(productId);
}

/**
 * Récupère la quantité disponible pour un produit / attribut.
 *
 * Paramètres:
 * - `productId` (number): id du produit.
 * - `productAttributeId` (number): id de la déclinaison (0 si non renseigné).
 *
 * Retour: Promise<number> — quantité disponible (>=0).
 */
const getStockForProductAttribute = async (productId, productAttributeId = 0) => {
    const stockApi = new StockAvailable({}, false);
    const stock = await stockApi.getByProductAndAttribute(productId, productAttributeId);
    return Number(stock?.quantity ?? 0);
}

/**
 * Enrichit une ligne de panier avec détails produit, image, déclinaison et stock.
 *
 * Paramètres:
 * - `cartRow` (object): ligne du panier ({ productId, productAttributeId, quantity, ... }).
 *
 * Retour: Promise<object|null> — objet enrichi ou `null` si produit introuvable.
 *
 * Exemple de sortie:
 * {
 *   product, productImageURL, declinaison, priceTtc, stockQuantity, quantity
 * }
 */
const getCartRowDetails = async (cartRow) => {
    if (!cartRow) {
        return null;
    }

    const product = await getProductForRow(cartRow);
    if (!product) {
        return null;
    }

    const attributeId = Number(cartRow.productAttributeId || 0);
    
    // OPTIMISATION: Paralléliser les 3 requêtes indépendantes
    const [declinaisonDetails, stockQuantity, images] = await Promise.all([
        product.getDeclinaisonDetails(attributeId),
        getStockForProductAttribute(product.id, attributeId),
        product.getImages()
    ]);

    const productImageURL = declinaisonDetails.imageUrl || images[0] || "";

    return {
        product,
        productImageURL,
        declinaison: declinaisonDetails.declinaison,
        priceTtc: declinaisonDetails.priceTtc,
        stockQuantity,
        quantity: cartRow.quantity,
    };
}

/**
 * Met à jour un panier pour l'associer à un client et une adresse.
 *
 * Paramètres:
 * - `cart` (Cart): panier à mettre à jour.
 * - `customer` (Customer): client cible.
 * - `address` (Address): adresse de livraison/facturation.
 *
 * Retour: Promise<Cart> — panier mis à jour.
 *
 * Règles métier:
 * - Vérifie la présence de `cart.id`, `customer.id` et `address.id`.
 * - Met `idGuest` à 0 et met à jour `deliveryOption`.
 */
const updateCartForCustomer = async (cart, customer, address) => {
    if (!cart?.id) {
        throw new Error("Cart not found");
    }
    if (!customer?.id) {
        throw new Error("Customer not found");
    }
    if (!address?.id) {
        throw new Error("Address not found");
    }

    const nextRows = (cart.cartRows ?? []).map((row) => ({
        ...row,
        addressDeliveryId: row?.addressDeliveryId || address.id,
    }));

    cart.customerId = customer.id;
    cart.idGuest = 0;
    cart.addressDeliveryId = address.id;
    cart.addressInvoiceId = address.id;
    cart.secureKey = customer.secureKey ?? customer.secure_key ?? "";
    cart.deliveryOption = buildDeliveryOption(address.id, cart.carrierId || DEFAULT_CARRIER_ID);
    cart.cartRows = nextRows;

    return await cart.update();
}

/**
 * Calcule les totaux HT et TTC d'un panier à partir de ses lignes.
 *
 * Paramètres:
 * - `cart` (Cart|object): panier contenant `cartRows`.
 *
 * Retour: { totalHt: number, totalTtc: number }
 *
 * Règles métier:
 * - Pour chaque ligne, calcule le prix TTC affiché en tenant compte de l'impact
 *   de l'option sélectionnée et du taux de taxe. Agrège par quantité.
 */
const getCartTotals = (cart) => {
    const rows = cart?.cartRows ?? [];
    let totalHt = 0;
    let totalTtc = 0;

    for (const row of rows) {
        const qty = Number(row?.quantity || 0);
        const baseTtc = Number(row?.baseTtcPrice || 0);
        const taxRate = Number(row?.taxRate || 0);
        const divisor = 1 + taxRate / 100;

        // Determiner l'impact de la declinaison selectionnee.
        const selectedId = Number(row?.selectedOptionId || 0);
        const options = Array.isArray(row?.options) ? row.options : [];
        const selected = options.find((value) => Number(value.id) === selectedId);
        const impact = Number(selected?.priceImpact ?? row?.selectedOptionImpact ?? 0);
        const baseHt = divisor ? baseTtc / divisor : 0;

        totalHt += (baseHt + impact) * qty;
        totalTtc += (baseTtc + impact * divisor) * qty;
    }

    return { totalHt, totalTtc };
}

/**
 * Récupère les paniers qui ne sont associés à aucune commande.
 *
 * Retour: Promise<Array<Cart>> — liste de paniers sans commande.
 */
const getCartsWithoutOrder = async () => {
    const orderApi = new Order({}, false);
    const cartApi = new Cart({}, false);
    const orders = await orderApi.getAll();
    const cartIds = [...new Set(
        orders
            .map((order) => Number(order?.cartId))
            .filter((cartId) => Number.isFinite(cartId) && cartId > 0)
    )];

    return await cartApi.getExclApi(cartIds);
}

/**
 * Filtre les paniers sans commande par client.
 *
 * Paramètres:
 * - `customerId` (number): identifiant du client.
 *
 * Retour: Promise<Array<Cart>> — paniers du client sans commande.
 */
const getCartWithoutOrderByCustomer = async (customerId) => {
    const cartsWithoutOrder = await getCartsWithoutOrder();
    return (cartsWithoutOrder || []).filter(cart => Number(cart?.customerId) === Number(customerId));
}

/**
 * Enrichit une liste de paniers via `CartWithDetails.enrich()`.
 *
 * Paramètres:
 * - `carts` (Array): liste de paniers bruts.
 *
 * Retour: Promise<Array> — paniers enrichis (silencieusement ignore les erreurs par ligne).
 */
const enrichCarts = async (carts = []) => {
    const detailed = [];
    for (const cart of carts ?? []) {
        try {
            const enumerated = CartWithDetails.fromCart(cart);
            const enriched = await enumerated.enrich();
            detailed.push(enriched);
        } catch (err) {
            console.warn('Failed to enrich cart:', err);
        }
    }
    return detailed;
}

export default {
    isCartActive,
    getLastCartByCustomer,
    createOrUpdateCart,
    deleteItems,
    addProductToCart,
    getCartRowDetails,
    getStockForProductAttribute,
    updateCartForCustomer,
    getCartTotals,
    getCartsWithoutOrder,
    duplicateCart,
    getCartWithoutOrderByCustomer,
    enrichCarts,
}
