import Product from "../backend/entities/Product.js"

/**
 * Carte FrontOffice d'un produit.
 *
 * Paramètres:
 * - `product` (object): produit à afficher.
 *
 * Type de résultat:
 * - JSX.Element. Rend le nom, le prix et le stock du produit.
 *
 * Ce que fait la fonction:
 * - Présente les informations essentielles d'un produit dans une carte compacte.
 *
 * Règles métier:
 * - Le stock affiché provient soit du produit enrichi, soit de l'association stock disponible.
 *
 * Fonctionnement:
 * - Le nom est rendu dans la langue prioritaire via `Product.pickLang`.
 * - Le stock est calculé avec une valeur de repli si nécessaire.
 *
 * Exemple d'utilisation:
 * - Input: `<FOProductCard product={product} />`
 * - Output attendu: une carte avec nom, prix et stock disponible.
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