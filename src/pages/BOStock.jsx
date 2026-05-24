import BOStockUpdate from "../components/BOStockUpdate.jsx";
import BOStockEvolution from "../components/BOStockEvolution.jsx";
import {useState} from "react";

/**
 * Page BackOffice de gestion de stock.
 * Regles metier: une combinaison est definie par (productId, productAttributeId).
 * Methode: partage l'etat entre le panneau de mise a jour et le panneau d'evolution.
 * Parametres: aucun.
 * Retour: JSX de la page stock.
 */
function BOStock() {
    // combination: productId (combination[0]) + productAttributeId (combination[1])
    const [combination, setCombination] = useState([])
    // les produits avec détails qui sera passé entre les composants pour éviter les requêtes à chaque appel
    const [productDetails, setProductDetails] = useState([])

    return <div>
        <section>
            <BOStockUpdate setCombination={setCombination} setProductDetails={setProductDetails}/>
        </section>
        <section>
            <BOStockEvolution combination={combination} productDetails={productDetails}/>
        </section>
    </div>
}

export default BOStock;
