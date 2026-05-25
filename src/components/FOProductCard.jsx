import Product from "../backend/entities/Product.js"

/**
 * Carte produit FO simple.
 * Regles metier: fallback stock via associations si quantity non expose.
 * Parametres: product.
 * Retour: JSX carte produit.
 */
function FOProductCard({product}) {
    const stockDispo = product.quantity ?? product.associations?.stockAvailables?.[0]?.quantity ?? 0

    return (
        <div className="card h-100">
            <div className="card-body">
                <h5 className="mb-1">{Product.pickLang(product.name)}</h5>
                <p className="text-muted mb-2">Price TE: {product.price}$</p>
                <span className="badge bg-label-success">Stock {stockDispo}</span>
            </div>
        </div>
    )
}

export default FOProductCard;