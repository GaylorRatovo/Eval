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
        <>
            <h1>Liste de tous les commandes</h1>
            {actionResult && (
                <div style={{ marginBottom: "20px", padding: "10px", border: "1px solid", backgroundColor: actionResult.success ? "#d4edda" : "#f8d7da", color: actionResult.success ? "#155724" : "#721c24" }}>
                    {actionResult.success ? (
                        <>Commande {actionResult.orderId} mise à jour avec succès à l'état {actionResult.orderStateId}. Dernier historique : {actionResult.orderHistory ? `ID ${actionResult.orderHistory.id} à ${actionResult.orderHistory.dateAdd}` : "Aucun historique trouvé"}.</>
                    ) : (
                        <>Erreur lors de la mise à jour de la commande {actionResult.orderId} : {actionResult.error}</>
                    )}
                </div>
            )}
            {isLoading ? (<p>Chargements des clients</p>) : (
                <BOOrderRow
                    title="Commandes"
                    rows={orders}
                    edit={edit}
                    onChange={handleChange}
                    onClick={handleClick}
                />
            )}
        </>
    )

}
export default BOOrderList;