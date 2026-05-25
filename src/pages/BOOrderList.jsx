import { useEffect, useState } from "react";
import orderService from "../backend/services/OderService"
import BOOrderRow from "../components/BOOrderRow";
import { formatDateInput } from "../backend/utils/utils"

/**
 * Page BackOffice: liste et modification des commandes.
 *
 * Paramètres: aucun.
 * Retour: JSX — table des commandes avec contrôles d'état.
 *
 * Règles métier:
 * - Utilise `orderService.updateOrderState` pour appliquer les transitions autorisées.
 * - Affiche un message récapitulatif après action.
 */
function BOOrderList() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [actionResult, setActionResult] = useState(null);
    const [edit, setEdit] = useState({
        orderId: null,
        orderStateId: "",
        dateUpdate: "",
    });

    /**
     * Gère les changements des champs d'édition pour une commande spécifique.
     *
     * Paramètres: `orderId` (number) — identifiant de la commande.
     * Retour: function — handler d'événement `onChange`.
     */
    const handleChange = (orderId) => (e) => {
        const { name, value } = e.target;

        setEdit((prev) => ({
            ...prev,
            orderId,
            [name]: value,
        }));
    };

    /**
     * Applique la modification d'état demandée pour une commande.
     *
     * Paramètres: `orderId` (number).
     * Retour: Promise<void> — met à jour `actionResult`.
     */
    const handleClick = async (orderId) => {
        const currentOrder = orders.find((order) => Number(order.id) === Number(orderId))
        const newStateId = edit.orderStateId || currentOrder?.currentState || ""
        const dateUpdate = edit.dateUpdate || formatDateInput(currentOrder?.dateUpd) || formatDateInput(currentOrder?.dateAdd)

        try {
            const result = await orderService.updateOrderState(orderId, newStateId, dateUpdate);
            setActionResult(result);
        } catch (error) {
            console.log("Erreur lors de la modification de l'état de la commande", error);
            setActionResult({
                success: false,
                orderId,
                orderStateId: newStateId,
                error: error?.message || "Erreur inconnue",
            });
        }

        console.log(
            "Modifier la commande " +
                orderId +
                " à l'état " +
                (newStateId ?? "") +
                " avec la date " +
                (dateUpdate ?? "")
        );
    };

    useEffect(()=>{
        const loadOrders = async () =>{
            setIsLoading(true);
            try {
                const data = await orderService.getOrderRows();
                setOrders(data);
                setIsLoading(false);
            } catch (error) {
                console.log('Erreur lors de la recuperation des commandes', error);
            }
        }
        loadOrders();
    },[]);
    

    return(
        <div>
            {/* En-tete */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="fw-bold mb-1">Commandes</h1>
                    <p className="text-body-secondary mb-0">Suivi et mise a jour des commandes</p>
                </div>
            </div>

            {/* Message d'action */}
            {actionResult && (
                <div
                    className={`alert ${actionResult.success ? "alert-success" : "alert-danger"}`}
                    role="alert"
                >
                    {actionResult.success ? (
                        <>
                            <i className="bx bx-check-circle me-2"></i>
                            Commande {actionResult.orderId} mise a jour avec succes a l'etat {actionResult.orderStateId}. Dernier historique : {actionResult.orderHistory ? `ID ${actionResult.orderHistory.id} a ${actionResult.orderHistory.dateAdd}` : "Aucun historique trouve"}.
                        </>
                    ) : (
                        <>
                            <i className="bx bx-error-circle me-2"></i>
                            Erreur lors de la mise a jour de la commande {actionResult.orderId} : {actionResult.error}
                        </>
                    )}
                </div>
            )}

            {/* Table des commandes */}
            {isLoading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            ) : (
                <div className="card border-0 shadow-sm">
                    <div className="card-body">
                        <BOOrderRow
                            title="Commandes"
                            rows={orders}
                            edit={edit}
                            onChange={handleChange}
                            onClick={handleClick}
                        />
                    </div>
                </div>
            )}
        </div>
    )

}
export default BOOrderList;