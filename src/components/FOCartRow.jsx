import { useEffect } from "react";

/**
 * Ligne de tableau du panier FrontOffice.
 *
 * Paramètres:
 * - `row` (object): ligne enrichie du panier.
 * - `index` (number): index de la ligne dans le tableau.
 * - `onOptionChange` (function): handler de changement de déclinaison.
 * - `onQuantityChange` (function): handler de changement de quantité.
 * - `onDelete` (function): handler de suppression.
 * - `formatPrice` (function): fonction de formatage des prix.
 *
 * Type de résultat:
 * - JSX.Element. Rend une ligne de tableau interactive.
 *
 * Ce que fait la fonction:
 * - Affiche les informations produit, la déclinaison, le stock, le prix et les actions.
 * - Déclenche les handlers fournis par la page panier.
 *
 * Règles métier:
 * - Si aucune déclinaison n'est sélectionnée, la première option disponible est choisie automatiquement.
 * - La quantité affichée ne descend jamais sous 1.
 *
 * Fonctionnement:
 * - Le composant surveille la présence d'options et initialise la sélection si besoin.
 * - Les helpers calculent le prix unitaire et le total de ligne.
 *
 * Exemple d'utilisation:
 * - Input: `<FOCartRow row={row} index={0} onOptionChange={...} onQuantityChange={...} onDelete={...} formatPrice={...} />`
 * - Output attendu: une ligne de panier modifiable.
 */
function FOCartRow({ row, index, onOptionChange, onQuantityChange, onDelete, formatPrice }) {
    const options = row?.options ?? [];
    const selectedOptionId = Number(row?.selectedOptionId || 0);

    useEffect(() => {
        if (options.length === 0) {
            return;
        }
        if (selectedOptionId !== 0) {
            return;
        }
        const firstId = Number(options[0]?.id || 0);
        if (firstId && typeof onOptionChange === "function") {
            onOptionChange(index, firstId, row?.cartRowIndex);
        }
    }, [index, onOptionChange, options, row?.cartRowIndex, selectedOptionId]);

    /**
     * Calcule le prix unitaire affiché pour une ligne de panier.
     *
     * Paramètres:
     * - `rowValue` (object): ligne enrichie.
     *
     * Type de résultat:
     * - number.
     *
     * Ce que fait la fonction:
     * - Additionne le prix de base et l'impact de la déclinaison avec la taxe.
     *
     * Règles métier:
     * - Si aucune option n'est sélectionnée, l'impact est nul.
     *
     * Fonctionnement:
     * - Les champs numériques sont convertis avant calcul.
     *
     * Exemple d'utilisation:
     * - Input: `getRowDisplayedPrice(row)`
     * - Output attendu: prix unitaire TTC de la ligne.
     */
    const getRowDisplayedPrice = (rowValue) => {
        const selectedId = Number(rowValue?.selectedOptionId || 0);
        const selected = (rowValue?.options || []).find((value) => Number(value.id) === selectedId);
        const impact = selected ? Number(selected.priceImpact || 0) : 0;
        const base = Number(rowValue?.baseTtcPrice || 0);
        const taxRate = Number(rowValue?.taxRate || 0);
        return base + impact * (1 + taxRate / 100);
    };

    /**
     * Calcule le total TTC d'une ligne de panier.
     *
     * Paramètres:
     * - `rowValue` (object): ligne enrichie.
     *
     * Type de résultat:
     * - number.
     *
     * Ce que fait la fonction:
     * - Multiplie le prix unitaire calculé par la quantité.
     *
     * Règles métier:
     * - Le total dépend de la quantité réellement saisie.
     *
     * Fonctionnement:
     * - La fonction réutilise `getRowDisplayedPrice` puis applique la quantité.
     *
     * Exemple d'utilisation:
     * - Input: `getRowLineTotal(row)`
     * - Output attendu: total TTC de la ligne.
     */
    const getRowLineTotal = (rowValue) => {
        const price = getRowDisplayedPrice(rowValue);
        const qty = Number(rowValue?.quantity || 0);
        return price * qty;
    };

    /**
     * Gère le changement de déclinaison dans la ligne.
     *
     * Paramètres:
     * - `event` (Event): événement de changement du select.
     *
     * Type de résultat:
     * - void.
     *
     * Ce que fait la fonction:
     * - Transmet la nouvelle option au handler parent.
     *
     * Règles métier:
     * - La déclinaison choisie doit être propagée à la page panier.
     *
     * Fonctionnement:
     * - La valeur sélectionnée est convertie en nombre puis remontée.
     *
     * Exemple d'utilisation:
     * - Input: sélection d'une nouvelle déclinaison.
     * - Output attendu: la ligne panier est mise à jour.
     */
    const handleChange = (event) => {
        const nextId = Number(event.target.value || 0);
        if (typeof onOptionChange === "function") {
            onOptionChange(index, nextId, row?.cartRowIndex);
        }
    };

    /**
     * Diminue la quantité d'une unité.
     *
     * Paramètres:
     * - Aucun.
     *
     * Type de résultat:
     * - void.
     *
     * Ce que fait la fonction:
     * - Décrémente la quantité sans jamais passer sous 1.
     *
     * Règles métier:
     * - La quantité minimale autorisée est 1.
     *
     * Fonctionnement:
     * - La nouvelle quantité est recalculée puis transmise au parent.
     *
     * Exemple d'utilisation:
     * - Input: clic sur le bouton `-`.
     * - Output attendu: quantité diminuée d'une unité.
     */
    const handleDecrease = () => {
        const current = Number(row?.quantity || 1);
        const nextQty = Math.max(1, current - 1);
        if (typeof onQuantityChange === "function") {
            onQuantityChange(index, nextQty, row?.cartRowIndex);
        }
    };

    /**
     * Augmente la quantité d'une unité en respectant le stock disponible.
     *
     * Paramètres:
     * - Aucun.
     *
     * Type de résultat:
     * - void.
     *
     * Ce que fait la fonction:
     * - Incrémente la quantité et la limite au stock quand il est connu.
     *
     * Règles métier:
     * - La quantité ne peut pas dépasser le stock positif disponible.
     *
     * Fonctionnement:
     * - Le stock est lu depuis la ligne puis la nouvelle valeur est remontée au parent.
     *
     * Exemple d'utilisation:
     * - Input: clic sur le bouton `+`.
     * - Output attendu: quantité augmentée ou bloquée au stock maximum.
     */
    const handleIncrease = () => {
        const current = Number(row?.quantity || 0);
        const stock = Number(row?.stockQuantity ?? 0);
        const limited = stock > 0 ? Math.min(current + 1, stock) : current + 1;
        const nextQty = Math.max(1, limited);
        if (typeof onQuantityChange === "function") {
            onQuantityChange(index, nextQty, row?.cartRowIndex);
        }
    };

    return (
        <tr>
            <td>
                <div className="d-flex align-items-center gap-3">
                    {row.productImageURL ? (
                        <img
                            src={row.productImageURL}
                            alt={row.productName || "Produit"}
                            width="64"
                            height="64"
                            className="rounded"
                            style={{ objectFit: "cover" }}
                        />
                    ) : (
                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: "64px", height: "64px" }}>
                            <i className="bx bx-image text-body-secondary"></i>
                        </div>
                    )}

                    <div>
                        <p className="mb-1 fw-semibold">{row.productName || "Produit"}</p>
                        <p className="mb-0 small text-body-secondary">REF: {row.productReference || "-"}</p>
                    </div>
                </div>
            </td>
            <td>
                {options.length > 0 ? (
                    <select className="form-select form-select-sm" value={selectedOptionId} onChange={handleChange}>
                        {options.map((value) => (
                            <option key={value.id} value={value.id}>
                                {value.label || ""}
                            </option>
                        ))}
                    </select>
                ) : (
                    <span className="badge bg-label-secondary">Sans declinaison</span>
                )}
            </td>
            <td>
                <span className="fw-semibold">{formatPrice(getRowDisplayedPrice(row))} €</span>
            </td>
            <td>
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleDecrease}>
                        <i className="bx bx-minus"></i>
                    </button>
                    <input
                        type="number"
                        className="form-control form-control-sm text-center"
                        value={row.quantity}
                        readOnly
                        min={1}
                        style={{ width: "64px" }}
                    />
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleIncrease}>
                        <i className="bx bx-plus"></i>
                    </button>
                </div>
            </td>
            <td>
                <span className="fw-semibold">{formatPrice(getRowLineTotal(row))} €</span>
            </td>
            <td>
                <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => onDelete?.(index, row?.cartRowIndex)}>
                    <i className="bx bx-trash"></i>
                </button>
            </td>
        </tr>
    );
}

export default FOCartRow;
