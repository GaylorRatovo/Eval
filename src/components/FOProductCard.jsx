import Product from "../backend/entities/Product.js"

/**
 * Carte produit FO simple.
 * Regles metier: fallback stock via associations si quantity non expose.
 * Parametres: product.
 * Retour: JSX carte produit.
 */
function FOProductCard({product}) {
    const stockDispo = product.quantity ?? product.associations?.stockAvailables?.[0]?.quantity ?? 0

    return <div>
        <h4>{Product.pickLang(product.name)}</h4>
        <p>Price TE: {product.price}$</p>
        <p>Stock dispo: {stockDispo}</p>
    </div>
}

export default FOProductCard;