import { useEffect, useState } from "react"
import orderService from "../backend/services/OderService"
import cartService from "../backend/services/CartService.js"
import FOOrderRow from "../components/FOOrderRow"
import useLocalStorage from "../hooks/useLocalStorage.jsx"
import { formatDateInput } from "../backend/utils/utils.js"

/** Recupere les commandes d'un client. */
const getOrdersByCustomer = async (customerId) => {
    return await orderService.getOrderRowsByCustomer(customerId)
}

/** Recupere et enrichit les paniers sans commande d'un client. */
const getCartsByCustomer = async (customerId) => {
    const rawCarts = await cartService.getCartWithoutOrderByCustomer(customerId)
    return await cartService.enrichCarts(rawCarts)
}

/**
 * Page FrontOffice de consultation commandes + paniers en attente.
 * Regles metier: permet duplication depuis commande existante et conversion directe panier->commande.
 * Methode: charge les deux listes en parallele et reutilise `FOOrderRow` en deux modes d'action.
 * Parametres: aucun.
 * Retour: JSX des tableaux commandes et paniers.
 */
function FOOrderList() {
    const [orders, setOrders] = useState([])
    const [carts, setCarts] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [user] = useLocalStorage("user", null)
    const [edit, setEdit] = useState({
        orderId: null,
        cartId: null,
        multiplicateur: 1,
        dateUpdate: "",
        cartDateOrder: "",
    })

    /**
     * Met a jour l'etat d'edition (commande ou panier).
     */
    const handleChange = (id, isCart = false) => (event) => {
        const { name, value } = event.target

        setEdit((prev) => ({
            ...prev,
            [isCart ? "cartId" : "orderId"]: id,
            [name]: value,
        }))
    }

    /**
     * Duplique le panier d'une commande existante.
     */
    const handleClick = async (orderId) => {
        try {
            await orderService.duplicateCart(orderId, edit?.multiplicateur ?? 1, edit?.dateUpdate || formatDateInput(new Date()))
        } catch (error) {
            console.log("Erreur lors de la duplication du panier de la commande", error)
        }
    }

    /**
     * Convertit un panier sans commande en nouvelle commande.
     * Regles metier: date configurable par ligne panier.
     */
    const handleCommanderClick = async (cartId) => {
        // Etape 1: calculer la date effective de commande.
        try {
            const commandDate = edit?.cartId === cartId
                ? (edit?.cartDateOrder || formatDateInput(new Date()))
                : formatDateInput(new Date())

            // Etape 2: creer la commande puis recharger les listes.
            await orderService.createOrderFromCartId(cartId, user?.id || 0, commandDate)

            const userId = user?.id || 0
            const [nextOrders, nextCarts] = await Promise.all([
                getOrdersByCustomer(userId),
                getCartsByCustomer(userId),
            ])

            setOrders(nextOrders)
            setCarts(nextCarts)
            setEdit({ orderId: null, multiplicateur: 1, dateUpdate: "", cartId: null, cartDateOrder: "" })
        } catch (error) {
            console.error("Erreur création commande depuis panier", error)
        }
    }

    useEffect(() => {
        // Etape 3: chargement initial commandes + paniers sans commande.
        const loadAll = async () => {
            setIsLoading(true)
            try {
                const userId = user?.id || 0
                const [nextOrders, nextCarts] = await Promise.all([
                    getOrdersByCustomer(userId),
                    getCartsByCustomer(userId),
                ])

                setOrders(nextOrders)
                setCarts(nextCarts)
            } catch (error) {
                console.log("Erreur lors de la recuperation des donnees", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadAll()
    }, [user?.id])

    // Etape 4: projeter les paniers en lignes compatibles avec `FOOrderRow`.
    const cartRows = (carts || []).map((cart) => ({
        ...cart,
        customerName: user?.firstname && user?.lastname
            ? `${user.firstname} ${user.lastname}`
            : "Panier (sans commande)",
        totalPaid: Number(cart?.totals?.totalTtc ?? 0),
        orderStateName: "En attente de commande",
    }))

    return (
        <div className="d-flex flex-column gap-4">
            <div>
                <h4 className="mb-1">Mes commandes</h4>
                <p className="text-muted mb-0">Consultez l'historique et vos paniers en attente.</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h6 className="mb-0">Commandes</h6>
                </div>
                <div className="card-body">
                    {isLoading ? (
                        <p className="text-muted">Chargements des clients</p>
                    ) : (
                        <FOOrderRow
                            title=""
                            rows={orders}
                            edit={edit}
                            multiplicateur={1}
                            onChange={handleChange}
                            onClick={handleClick}
                            actionMode="order"
                        />
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h6 className="mb-0">Paniers sans commande</h6>
                </div>
                <div className="card-body">
                    {isLoading ? (
                        <p className="text-muted">Chargements des paniers</p>
                    ) : (
                        <FOOrderRow
                            title=""
                            rows={cartRows}
                            edit={edit}
                            onChange={handleChange}
                            onClick={handleCommanderClick}
                            actionMode="cart"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default FOOrderList
