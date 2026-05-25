import { useEffect } from "react";

/**
 * Ligne de tableau panier FrontOffice.
 * Regles metier: auto-selectionne la premiere declinaison si aucune n'est definie; quantite >= 1 et <= stock si connu.
 * Parametres: row, index, callbacks d'action, formatPrice.
 * Retour: JSX ligne <tr>.
 */
function FOCartRow({ row, index, onOptionChange, onQuantityChange, onDelete, formatPrice }) {
    const options = row?.options ?? [];
    const selectedOptionId = Number(row?.selectedOptionId || 0);

    useEffect(() => {
        // Etape 1: initialiser la declinaison par defaut si besoin.
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

    /** Calcule le prix TTC affiche de la ligne selon declinaison. */
    const getRowDisplayedPrice = (rowValue) => {
        const selectedId = Number(rowValue?.selectedOptionId || 0);
        const selected = (rowValue?.options || []).find((value) => Number(value.id) === selectedId);
        const impact = selected ? Number(selected.priceImpact || 0) : 0;
        const base = Number(rowValue?.baseTtcPrice || 0);
        const taxRate = Number(rowValue?.taxRate || 0);
        return base + impact * (1 + taxRate / 100);
    };

    /** Calcule le total TTC de la ligne (prix * quantite). */
    const getRowLineTotal = (rowValue) => {
        const price = getRowDisplayedPrice(rowValue);
        const qty = Number(rowValue?.quantity || 0);
        return price * qty;
    };

    /** Handler changement declinaison. */
    const handleChange = (event) => {
        const nextId = Number(event.target.value || 0);
        if (typeof onOptionChange === "function") {
            onOptionChange(index, nextId, row?.cartRowIndex);
        }
    };

    /** Handler decrement quantite. */
    const handleDecrease = () => {
        const current = Number(row?.quantity || 1);
        const nextQty = Math.max(1, current - 1);
        if (typeof onQuantityChange === "function") {
            onQuantityChange(index, nextQty, row?.cartRowIndex);
        }
    };

    /** Handler increment quantite avec borne stock. */
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
            <td>{row.productName || ""}</td>
            <td>{row.productReference || ""}</td>
            <td>
                {row.productImageURL ? (
                    <img
                        src={row.productImageURL}
                        alt={row.productImageURL}
                        width="120"
                        className="rounded"
                    />
                ) : (
                    "-"
                )}
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
                    "Sans declinaison"
                )}
            </td>
            <td>{row.stockQuantity ?? "-"}</td>
            <td>{formatPrice(getRowDisplayedPrice(row))}</td>
            <td>
                <div className="input-group input-group-sm">
                    <button className="btn btn-outline-secondary" type="button" onClick={handleDecrease}>-</button>
                    <input className="form-control text-center" type="number" value={row.quantity} readOnly min={1} />
                    <button className="btn btn-outline-secondary" type="button" onClick={handleIncrease}>+</button>
                </div>
            </td>
            <td>{formatPrice(getRowLineTotal(row))}</td>
            <td>
                <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => onDelete?.(index, row?.cartRowIndex)}>
                    Supprimer
                </button>
            </td>
        </tr>
    );
}

export default FOCartRow;
