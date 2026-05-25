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

    return (
        <div className="d-flex flex-column gap-4">
            <div>
                <h4 className="mb-1">Stocks</h4>
                <p className="text-muted mb-0">Suivi des mouvements et mise a jour des quantites.</p>
            </div>
            <div className="card">
                <div className="card-body">
                    <BOStockUpdate setCombination={setCombination} setProductDetails={setProductDetails}/>
                </div>
            </div>
            <div className="card">
                <div className="card-body">
                    <BOStockEvolution combination={combination} productDetails={productDetails}/>
                </div>
            </div>
        </div>
    )
}

export default BOStock;
