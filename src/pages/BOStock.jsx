import BOStockUpdate from "../components/BOStockUpdate.jsx";
import BOStockEvolution from "../components/BOStockEvolution.jsx";
import {useState} from "react";

/**
 * Page BackOffice: interface de gestion des stocks (mise à jour + évolution).
 *
 * Paramètres: aucun.
 * Retour: JSX — compose `BOStockUpdate` et `BOStockEvolution`.
 *
 * Règles métier:
 * - Partage la sélection `combination` et `productDetails` entre composants.
 */
function BOStock() {
    // combination: productId (combination[0]) + productAttributeId (combination[1])
    const [combination, setCombination] = useState([])
    // les produits avec détails qui sera passé entre les composants pour éviter les requêtes à chaque appel
    const [productDetails, setProductDetails] = useState([])

    return (
        <div>
            {/* En-tete */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="fw-bold mb-1">Stocks</h1>
                    <p className="text-body-secondary mb-0">Mise a jour et suivi des mouvements</p>
                </div>
            </div>

            <div className="row g-4">
                {/* Mise a jour du stock */}
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h5 className="fw-bold mb-3">Mise a jour des stocks</h5>
                            <BOStockUpdate setCombination={setCombination} setProductDetails={setProductDetails}/>
                        </div>
                    </div>
                </div>

                {/* Evolution du stock */}
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h5 className="fw-bold mb-3">Evolution des stocks</h5>
                            <BOStockEvolution combination={combination} productDetails={productDetails}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BOStock;
