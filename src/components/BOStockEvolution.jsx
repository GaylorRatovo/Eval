import {useEffect} from "react";
import {getDailyMovement} from "../backend/services/StockMvtService.js";

function BOStockEvolution({combination}) {
    const productId = combination[0];
    const productAttributeId = combination[1];

    useEffect(() => {
        const loadMovements = async () => {
            try {
                const movements = await getDailyMovement(productId, productAttributeId);
                return movements;
            } catch (error) {
                console.log("ERREUR LORS DE LA RECUPERATION DES MOUVEMENTS: " + error)
            }
        }

        loadMovements().then(r => console.log(r))
    }, [productId, productAttributeId]);

    return <div>
        <header>
            <h5>{productId} et {productAttributeId}</h5>
        </header>
    </div>
}

export default BOStockEvolution;