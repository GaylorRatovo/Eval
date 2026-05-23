import {useEffect, useState} from "react";
import orderService from "../backend/services/OderService"
import FOOrderRow from "../components/FOOrderRow";
import useLocalStorage from "../hooks/useLocalStorage.jsx";
import { formatDateInput } from "../backend/utils/utils.js";

function FOOrderList() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [user] = useLocalStorage("user", null);
    const [edit, setEdit] = useState({
        orderId: null,
        multiplicateur: 1,
        dateUpdate: "",
    });

    const handleChange = (orderId) => (e) => {
        const { name, value } = e.target;

        setEdit((prev) => ({
            ...prev,
            orderId,
            [name]: value,
        }));
    };

    const handleClick = async (orderId) => {

        try {
            const duplicateResult = await orderService.duplicateCart(orderId, edit?.multiplicateur ?? 1, edit?.dateUpdate || formatDateInput(new Date()));
        } catch (error) {
            console.log("Erreur lors de la duplication du panier de la commande", error);
        }
        console.log(
            "Modifier la commande " +
                orderId +
                " multiplier " +
                (edit?.multiplicateur ?? "") +
                " avec la date " +
                (edit?.dateUpdate || formatDateInput(new Date()))
        );
    };

    useEffect(()=>{
        const loadOrders = async () =>{
            setIsLoading(true);
            try {
                let userId = 0;
                if (user) {
                    userId = user.id;
                }
                const data = await orderService.getOrderRowsByCustomer(userId);
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
           
            {isLoading ? (<p>Chargements des clients</p>) : (
                <table>
                    <thead>
                    <tr>
                        <th>REFERENCE</th>
                        <th>NOM</th>
                        <th>DATE</th>
                        <th>TOTAL</th>
                        <th>ETAT ACTUEL</th>
                        <th>ACTION</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        orders.map((order) => {
                            const isEditing = edit.orderId === order.id;
                            return <FOOrderRow
                                key={order.id}
                                order={order}
                                edit={isEditing ? edit : null}
                                multiplicateur= {1}
                                currentDateUpdate={formatDateInput(order.dateAdd)}
                                onChange={handleChange(order.id)}
                                onClick={() => handleClick(order.id)}
                            />;
                        })
                    }
                    </tbody>
                </table>)
            }
        </>
    )

}
export default FOOrderList;