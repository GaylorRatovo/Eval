import Customer from "../entities/Customer";
import Order from "../entities/Order"
import OrderHistory from "../entities/OrderHistory";
import MyOrderState from "../entities/MyOrderState";
import OrderState from "../entities/OrderState";
import OrderPayload from "../dto/OrderPayload";
import StockAvailable from "../entities/StockAvailable";
import { ensureLocalDateTime } from "../utils/utils"
import Cart from "../entities/Cart";
import CartService from "./CartService";

// order_state default ids
const PAIEMENT_A_DISTANCE_ACCEPTE_ID = 11
const LIVRE_ID = 5
const ANONYMOUS_ID = 1
const ANNULE_ID = 6

// order param defaults
const VALID_FLAG = 0
const CONVERSION_RATE = 1.000000
const TOTAL_DISCOUNTS = 0.000000
const TOTAL_DISCOUNTS_TAX_INCL = 0.000000
const TOTAL_DISCOUNTS_TAX_EXCL = 0.000000

// payement defaults
const PAYMENT_MODULE = "ps_cashondelivery"
const PAYMENT_LABEL = "Cash on delivery"

// livraison defaults
const SHIPPING_MODULE = "ps_carrier"
const SHIPPING_LABEL = "My carrier"

// default attributes for order creation
const LANGUAGE_ID = 1
const SHOP_ID = 1
const SHOP_GROUP_ID = 1
const CUSTOMER_GROUP_ID = 1
const COUNTRY_ID = 8
const STATE_ID = 0
const ADDRESS_ALIAS = "Checkout"

/**
 * Verifie la disponibilite stock pour les lignes d'un panier.
 * Regles metier: quantite minimum 1, prise en compte du multiplicateur de duplication.
 * Parametres: cartRows (Array), multiplicateur (number).
 * Retour: Promise<Array<{productId,productAttributeId,requested,available}>> erreurs de stock.
 */
const checkCartStock = async (cartRows = [], multiplicateur = 1) => {
    const stockApi = new StockAvailable({}, false)
    const errors = []
    const factor = Math.max(1, Math.trunc(Number(multiplicateur || 1)))

    for (const row of cartRows ?? []) {
        // Etape 1: normaliser les ids et quantites de la ligne.
        const productId = Number(row?.productId || 0)
        const attributeId = Number(row?.productAttributeId || 0)
        const qty = Math.max(1, Math.trunc(Number(row?.quantity || 0))) * factor
        if (!productId) {
            continue
        }

        // Etape 2: charger le stock disponible pour le couple produit/attribut.
        const stock = await stockApi.getByProductAndAttribute(productId, attributeId)
        const available = Number(stock?.quantity ?? 0)
        if (qty > available) {
            errors.push({
                productId,
                productAttributeId: attributeId,
                requested: qty,
                available,
            })
        }
    }

    return errors
}

/**
 * Recupere les commandes enrichies (nom client + libelle etat).
 * Parametres: aucun.
 * Retour: Promise<Array<OrderRow>>.
 */
const getOrderRows = async () => {
    const orderClass = new Order("", false)
    const customerClass = new Customer("", false)
    const orderStateClass = new OrderState("", false);

    const [orders, customers, orderStates] = await Promise.all([
        orderClass.getAll(),
        customerClass.getAll(),
        orderStateClass.getAll(),
    ])

    // Etape 1: construire les maps d'enrichissement pour affichage.
    const customerById = new Map(
        customers.map((customer) => [Number(customer.id), `${customer.firstname} ${customer.lastname}`.trim()])
    )

    const orderStateById = new Map(
        orderStates.map((orderState) => [Number(orderState.id), orderState.name])
    )

    console.log("orderstates", orderStateById);

    // Etape 2: fusionner les informations pour chaque commande.
    return orders.map((order) => (
        {
            ...order,
            customerName: customerById.get(Number(order.customerId)) ?? "",
            orderStateName: orderStateById.get(Number(order.currentState)) ?? "",
        }
    ))
}

/**
 * Recupere les commandes d'un client enrichies pour affichage.
 * Parametres: customerId (number|string).
 * Retour: Promise<Array<OrderRow>>.
 */
const getOrderRowsByCustomer = async (customerId) => {
    const orderClass = new Order("", false)
    const customerClass = new Customer("", false)
    const orderStateClass = new OrderState("", false);

    const [orders, customers, orderStates] = await Promise.all([
        orderClass.getBy("customerId", customerId),
        customerClass.getByApi("id", customerId),
        orderStateClass.getAll(),
    ]);

    console.log("orders for customer", customerId, orders);

    // Etape 1: indexer clients et etats pour enrichissement.
    const customerById = new Map(
        customers.map((customer) => [Number(customer.id), `${customer.firstname} ${customer.lastname}`.trim()])
    );

    const orderStateById = new Map(
        orderStates.map((orderState) => [Number(orderState.id), orderState.name])
    );

    // Etape 2: projeter les commandes avec labels utiles cote UI.
    return orders.map((order) => (
        {
            ...order,
            customerName: customerById.get(Number(order.customerId)) ?? "",
            orderStateName: orderStateById.get(Number(order.currentState)) ?? "",
        }
    ))
}

/**
 * Met a jour l'etat d'une commande via creation d'un historique.
 * Regles metier: newStateId et dateUpdate obligatoires.
 * Parametres: orderId, newStateId, dateUpdate.
 * Retour: Promise<{success,orderId,orderStateId,orderHistory,rawResponse}>.
 */
const updateOrderState = async (orderId, newStateId, dateUpdate) => {

    if (!newStateId) {
        throw new Error("Missing newStateId")
    }

    if (!dateUpdate) {
        throw new Error("Missing dateUpdate")
    }

    console.log("updateOrderState", { orderId, newStateId, dateUpdate });

    try {
        // Etape 1: normaliser la date locale pour l'historique.
        const dateAdd = ensureLocalDateTime(dateUpdate)

        // Etape 2: construire et sauvegarder l'objet de transition d'etat.
        const payload = MyOrderState.fromData({
            orderId: Number(orderId),
            orderStateId: Number(newStateId),
            employeeId: 1,
            date: dateAdd,
            useExistingPayment: false,
            sendEmail: false,
        })

        const res = await payload.save()
        console.log("my_order_state response", res)

        // Etape 3: relire l'historique pour retourner la derniere entree creee.
        const orderHistoryClass = new OrderHistory("", false)
        const histories = await orderHistoryClass.getByApi("id_order", Number(orderId))

        const sortedHistories = [...(histories ?? [])].sort((a, b) => Number(b.id) - Number(a.id))
        const latest = sortedHistories.length > 0 ? sortedHistories[0] : null

        return {
            success: true,
            orderId: Number(orderId),
            orderStateId: Number(newStateId),
            orderHistory: latest,
            rawResponse: res,
        }
    } catch (err) {
        console.error("Failed to save order history:", err)
        throw err
    }
}

/**
 * Cree une ou plusieurs commandes a partir d'un panier.
 * Regles metier: verifie le stock avant creation; clone genere des commandes supplementaires.
 * Parametres: cart, customerId, date, clone.
 * Retour: Promise<Array<{cart,order}>>.
 */
const createOrderFromCart = async (cart, customerId, date, clone = 0) => {
    // Etape 1: determiner le nombre total de commandes a creer.
    const cloneCount = Math.max(0, Math.trunc(Number(clone)))
    const totalOrders = cloneCount + 1

    // Etape 2: verifier la disponibilite stock pour l'ensemble des creations.
    const stockErrors = await checkCartStock(cart.cartRows, totalOrders)

    if (stockErrors.length > 0) {
        const message = stockErrors
            .map(item =>
                `product ${item.productId} attr ${item.productAttributeId}: ${item.requested} > ${item.available}`
            )
            .join("; ")

        throw new Error(`Stock insuffisant: ${message}`)
    }

    // Etape 3: charger le client pour valider son existence puis normaliser la date.
    const customerApi = new Customer({}, false)
    await customerApi.getById(customerId)

    const dateUsed = ensureLocalDateTime(date)
    const results = []

    // Etape 4: calculer les totaux de la commande source.
    const originalTotals = await OrderPayload.computeOrderTotals(cart.cartRows)

    const commonOrderData = {
        customerId,
        dateAdd: dateUsed,
        dateUpd: dateUsed,
        currentState: PAIEMENT_A_DISTANCE_ACCEPTE_ID,
        module: PAYMENT_MODULE,
        payment: PAYMENT_LABEL,
        valid: VALID_FLAG,
        conversionRate: CONVERSION_RATE,
        totalDiscounts: TOTAL_DISCOUNTS,
        totalDiscountsTaxIncl: TOTAL_DISCOUNTS_TAX_INCL,
        totalDiscountsTaxExcl: TOTAL_DISCOUNTS_TAX_EXCL,
        totalShipping: 0,
        totalShippingTaxIncl: 0,
        totalShippingTaxExcl: 0,
        totalWrapping: 0,
        totalWrappingTaxIncl: 0,
        totalWrappingTaxExcl: 0,
    }

    // Etape 5: creer la commande originale depuis le panier courant.
    const originalPayload = OrderPayload.fromCart(cart, {
        ...commonOrderData,
        totalPaid: originalTotals.totalTtc,
        totalPaidTaxIncl: originalTotals.totalTtc,
        totalPaidTaxExcl: originalTotals.totalHt,
        totalPaidReal: originalTotals.totalTtc,
        totalProducts: originalTotals.totalHt,
        totalProductsWt: originalTotals.totalTtc,
    })

    const savedOriginalOrder =
        await Order.fromData(originalPayload).save()

    results.push({
        cart,
        order: savedOriginalOrder
    })

    // Etape 6: creer les clones (nouveau panier + nouvelle commande pour chaque clone).
    for (let i = 0; i < cloneCount; i++) {
        const newCart = new Cart({
            customerId,
            idGuest: cart.idGuest,
            addressDeliveryId: cart.addressDeliveryId,
            addressInvoiceId: cart.addressInvoiceId,
            currencyId: cart.currencyId,
            langId: cart.langId,
            carrierId: cart.carrierId,
            shopId: cart.shopId,
            shopGroupId: cart.shopGroupId,
            secureKey: cart.secureKey,
            recyclable: cart.recyclable,
            gift: cart.gift,
            giftMessage: cart.giftMessage,
            mobileTheme: cart.mobileTheme,
            deliveryOption: cart.deliveryOption,
            allowSeperatedPackage: cart.allowSeperatedPackage,
            dateAdd: dateUsed,
            dateUpd: dateUsed,
            cartRows: [...cart.cartRows],
        })

        const savedCart = await newCart.save()

        const totals = await OrderPayload.computeOrderTotals(
            savedCart.cartRows
        )

        const payload = OrderPayload.fromCart(savedCart, {
            ...commonOrderData,
            totalPaid: totals.totalTtc,
            totalPaidTaxIncl: totals.totalTtc,
            totalPaidTaxExcl: totals.totalHt,
            totalPaidReal: totals.totalTtc,
            totalProducts: totals.totalHt,
            totalProductsWt: totals.totalTtc,
        })

        const savedOrder =
            await Order.fromData(payload).save()

        results.push({
            cart: savedCart,
            order: savedOrder
        })
    }

    return results
}

/**
 * Duplique le panier d'une commande existante via CartService.
 * Parametres: orderId, multiplicateur, dateUpdate.
 * Retour: Promise<{success:boolean, cart:any, orderId:number}>.
 */
const duplicateCart = async (orderId, multiplicateur, dateUpdate) => {
    try {
        // Etape 1: retrouver la commande puis le panier associe.
        const orderClass = new Order("", false)
        const order = await orderClass.getById(Number(orderId))
        let cart = null

        if (order && order.cartId) {
            const cartClass = new Cart({}, false)
            cart = await cartClass.getById(Number(order.cartId))
        }

        // Etape 2: deleguer la duplication metier au service panier.
        CartService.duplicateCart(cart, multiplicateur, dateUpdate);

        console.log("aaaaaaaaaaaaa", cart, " a la date ", dateUpdate, " avec multiplicateur ", multiplicateur, " et orderId ", orderId);
        return { success: !!cart, cart, orderId: Number(orderId) }
    } catch (err) {
        console.error("Failed in duplicateCart:", err)
        throw err
    }
}

/**
 * Variante utilitaire: creation de commande a partir d'un cartId.
 * Parametres: cartId, customerId, date, clone.
 * Retour: Promise<Array<{cart,order}>>.
 */
const createOrderFromCartId = async (cartId, customerId, date, clone = 0) => {
    const cartClass = new Cart({}, false);
    const cart = await cartClass.getById(Number(cartId));
    if (!cart) {
        throw new Error(`Cart ${cartId} not found`);
    }
    return await createOrderFromCart(cart, customerId, date, clone);
}

export default {
    getOrderRows,
    getOrderRowsByCustomer,
    updateOrderState,
    duplicateCart,
    createOrderFromCart,
    createOrderFromCartId,
}