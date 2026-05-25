import { useEffect, useState } from "react";
import orderService from "../backend/services/OderService"
import BOOrderRow from "../components/BOOrderRow";
import { formatDateInput } from "../backend/utils/utils"

/**
 * Page BackOffice de gestion des commandes.
 * Regles metier: permet de modifier manuellement l'etat d'une commande avec date de mise a jour.
 * Methode: charge les commandes puis envoie les changements via le service metier.
 * Parametres: aucun.
 * Retour: JSX de la liste de commandes.
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
     * Met a jour l'etat local d'edition pour une commande cible.
     * Parametres: orderId (number) puis evenement de formulaire.
     * Retour: void.
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
	 * Enregistre la modification d'etat d'une commande.
	 * Regles metier: impose un etat cible et une date; fallback sur valeurs existantes de la commande.
	 * Parametres: orderId (number|string).
	 * Retour: Promise<void>.
	 */
    const handleClick = async (orderId) => {
		// Etape 1: retrouver la commande courante et calculer les valeurs effectives.
        const currentOrder = orders.find((order) => Number(order.id) === Number(orderId))
        const newStateId = edit.orderStateId || currentOrder?.currentState || ""
        const dateUpdate = edit.dateUpdate || formatDateInput(currentOrder?.dateUpd) || formatDateInput(currentOrder?.dateAdd)

        try {
			// Etape 2: appeler le service de transition d'etat et stocker le resultat.
            const result = await orderService.updateOrderState(orderId, newStateId, dateUpdate);
            setActionResult(result);
        } catch (error) {
			// Etape 3: transformer l'erreur en objet d'etat affichable a l'utilisateur.
            console.log("Erreur lors de la modification de l'état de la commande", error);
            setActionResult({
                success: false,
                orderId,
                orderStateId: newStateId,
                error: error?.message || "Erreur inconnue",
            });
        }

	// Etape 4: log de trace pour diagnostic local.
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
		// Etape 5: chargement initial de la liste des commandes BackOffice.
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
        <div className="d-flex flex-column gap-4">
            <div>
                <h4 className="mb-1">Commandes</h4>
                <p className="text-muted mb-0">Mise a jour des etats et suivi des commandes.</p>
            </div>
            {actionResult && (
                <div className={`alert ${actionResult.success ? "alert-success" : "alert-danger"}`} role="alert">
                    {actionResult.success ? (
                        <>Commande {actionResult.orderId} mise a jour avec succes a l'etat {actionResult.orderStateId}. Dernier historique : {actionResult.orderHistory ? `ID ${actionResult.orderHistory.id} a ${actionResult.orderHistory.dateAdd}` : "Aucun historique trouve"}.</>
                    ) : (
                        <>Erreur lors de la mise a jour de la commande {actionResult.orderId} : {actionResult.error}</>
                    )}
                </div>
            )}
            <div className="card">
                <div className="card-body">
                    {isLoading ? (
                        <p className="text-muted">Chargements des clients</p>
                    ) : (
                        <BOOrderRow
                            title=""
                            rows={orders}
                            edit={edit}
                            onChange={handleChange}
                            onClick={handleClick}
                        />
                    )}
                </div>
            </div>
        </div>
    )

}
export default BOOrderList;