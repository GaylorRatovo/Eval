import { useEffect, useMemo, useState } from "react"
import orderService from "../backend/services/OderService"
import cartService from "../backend/services/CartService.js"
import FOOrderRow from "../components/FOOrderRow"
import useLocalStorage from "../hooks/useLocalStorage.jsx"
import { formatDateInput } from "../backend/utils/utils.js"

/**
 * Récupère les commandes enrichies d'un client via `OderService`.
 *
 * Paramètres:
 * - `customerId` (number): identifiant du client.
 *
 * Type de résultat:
 * - Promise<Array<object>>. Liste des commandes enrichies.
 *
 * Ce que fait la fonction:
 * - Interroge le service de commandes pour obtenir les lignes liées au client.
 *
 * Règles métier:
 * - Les commandes affichées doivent appartenir au client courant.
 *
 * Fonctionnement:
 * - La récupération est déléguée au service métier.
 *
 * Exemple d'utilisation:
 * - Input: `await getOrdersByCustomer(3)`
 * - Output attendu: tableau de commandes du client 3.
 */
const getOrdersByCustomer = async (customerId) => {
    return await orderService.getOrderRowsByCustomer(customerId)
}

/**
 * Récupère les paniers sans commande pour un client et les enrichit pour affichage.
 *
 * Paramètres:
 * - `customerId` (number): identifiant du client.
 *
 * Type de résultat:
 * - Promise<Array<object>>. Liste des paniers enrichis.
 *
 * Ce que fait la fonction:
 * - Charge les paniers non encore transformés en commande.
 * - Les enrichit avant affichage dans le tableau.
 *
 * Règles métier:
 * - Seuls les paniers sans commande doivent apparaître dans cette section.
 *
 * Fonctionnement:
 * - Le service panier récupère les données brutes puis les transforme pour l'UI.
 *
 * Exemple d'utilisation:
 * - Input: `await getCartsByCustomer(3)`
 * - Output attendu: tableaux des paniers ouverts du client 3.
 */
const getCartsByCustomer = async (customerId) => {
    const rawCarts = await cartService.getCartWithoutOrderByCustomer(customerId)
    return await cartService.enrichCarts(rawCarts)
}

/**
 * Page FrontOffice affichant les commandes et les paniers du client courant.
 *
 * Paramètres:
 * - Aucun.
 *
 * Type de résultat:
 * - JSX.Element. Rend deux tableaux distincts avec les actions associées.
 *
 * Ce que fait la fonction:
 * - Charge les commandes et les paniers du client connecté.
 * - Propose la duplication d'une commande ou la transformation d'un panier en commande.
 *
 * Règles métier:
 * - Les données affichées sont limitées au client courant.
 * - Un panier sans commande peut être converti en commande.
 * - Une commande peut être dupliquée avec un multiplicateur et une date de mise à jour.
 *
 * Fonctionnement:
 * - Les données sont chargées au montage puis rafraîchies après une action.
 * - L'état d'édition conserve l'élément sélectionné et les paramètres d'action.
 *
 * Exemple d'utilisation:
 * - Input: `<FOOrderList />`
 * - Output attendu: une liste de commandes et une liste de paniers sans commande.
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
     * Génère un handler `onChange` pour les contrôles d'édition des listes.
     *
     * Paramètres:
     * - `id` (number): identifiant de la ligne ciblée.
     * - `isCart` (boolean): indique si la ligne appartient à la section paniers.
     *
     * Type de résultat:
     * - function(event). Retourne un handler qui met à jour `edit`.
     *
     * Ce que fait la fonction:
     * - Enregistre l'élément actif et la valeur du champ modifié.
     *
     * Règles métier:
     * - Un seul élément peut être édité visuellement à la fois.
     *
     * Fonctionnement:
     * - Le champ cible dépend de la section `order` ou `cart`.
     * - L'état `edit` reçoit l'identifiant et la valeur saisie.
     *
     * Exemple d'utilisation:
     * - Input: `handleChange(5, false)`
     * - Output attendu: un handler qui met à jour l'édition de la commande 5.
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
     * Duplique le panier lié à une commande.
     *
     * Paramètres:
     * - `orderId` (number): identifiant de la commande à dupliquer.
     *
     * Type de résultat:
     * - Promise<void>.
     *
     * Ce que fait la fonction:
     * - Lance la duplication en appliquant le multiplicateur et la date choisis.
     *
     * Règles métier:
     * - La duplication utilise les paramètres actuellement saisis dans `edit`.
     *
     * Fonctionnement:
     * - Le service commandes est appelé avec l'identifiant de commande et les paramètres d'édition.
     *
     * Exemple d'utilisation:
     * - Input: `handleClick(12)`
     * - Output attendu: création d'un panier dupliqué à partir de la commande 12.
     */
    const handleClick = async (orderId) => {
        try {
            await orderService.duplicateCart(orderId, edit?.multiplicateur ?? 1, edit?.dateUpdate || formatDateInput(new Date()))
        } catch (error) {
            console.log("Erreur lors de la duplication du panier de la commande", error)
        }
    }

    /**
     * Transforme un panier sans commande en commande.
     *
     * Paramètres:
     * - `cartId` (number): identifiant du panier à convertir.
     *
     * Type de résultat:
     * - Promise<void>. Rafraîchit les listes `orders` et `carts`.
     *
     * Ce que fait la fonction:
     * - Crée la commande à partir du panier sélectionné.
     * - Recharge ensuite les données pour refléter l'état final.
     *
     * Règles métier:
     * - Le panier converti doit appartenir au client courant.
     * - La date de commande peut être saisie ou générée automatiquement.
     *
     * Fonctionnement:
     * - La date est choisie à partir de l'édition courante si elle existe.
     * - Après création, les deux listes sont rechargées.
     *
     * Exemple d'utilisation:
     * - Input: `handleCommanderClick(9)`
     * - Output attendu: le panier 9 devient une commande et disparaît de la liste des paniers ouverts.
     */
    const handleCommanderClick = async (cartId) => {
        try {
            const commandDate = edit?.cartId === cartId
                ? (edit?.cartDateOrder || formatDateInput(new Date()))
                : formatDateInput(new Date())

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
        /**
         * Charge les commandes et paniers de l'utilisateur courant.
         *
         * Paramètres:
         * - Aucun.
         *
         * Type de résultat:
         * - Promise<void>.
         *
         * Ce que fait la fonction:
         * - Récupère les commandes et paniers ouverts du client.
         * - Met à jour les deux tableaux affichés par la page.
         *
         * Règles métier:
         * - Les listes doivent toujours refléter le client connecté.
         *
         * Fonctionnement:
         * - Les deux requêtes sont exécutées en parallèle puis injectées dans l'état local.
         *
         * Exemple d'utilisation:
         * - Input: ouverture de la page.
         * - Output attendu: commandes et paniers visibles pour le client courant.
         */
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

    const cartRows = useMemo(
        () => (carts || []).map((cart) => ({
            ...cart,
            customerName: user?.firstname && user?.lastname
                ? `${user.firstname} ${user.lastname}`
                : "Panier (sans commande)",
            totalPaid: Number(cart?.totals?.totalTtc ?? 0),
            orderStateName: "En attente de commande",
        })),
        [carts, user],
    )

    return (
        <>
            <h1>Liste de tous les commandes</h1>

            {isLoading ? (
                <p>Chargements des clients</p>
            ) : (
                <FOOrderRow
                    title="Commandes"
                    rows={orders}
                    edit={edit}
                    multiplicateur={1}
                    onChange={handleChange}
                    onClick={handleClick}
                    actionMode="order"
                />
            )}

            <h2>Mes paniers sans commande</h2>

            {isLoading ? (
                <p>Chargements des paniers</p>
            ) : (
                <FOOrderRow
                    title="Paniers"
                    rows={cartRows}
                    edit={edit}
                    onChange={handleChange}
                    onClick={handleCommanderClick}
                    actionMode="cart"
                />
            )}
        </>
    )
}

export default FOOrderList
