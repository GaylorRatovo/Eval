import { formatDateTime } from "../backend/utils/utils"

function BOOderRow({order, edit = null, currentStateId = "", currentDateUpdate = "", onChange, onClick}) {
    const totalPaid = Number(order.totalPaid ?? 0)

    return (
        <tr>
            <td>{order.id ?? "N/A"}</td>
            <td>{order.customerName ?? "N/A"}</td>
            <td>{formatDateTime(order.dateAdd) || "N/A"}</td>
            <td>{Number.isFinite(totalPaid) ? totalPaid.toFixed(2) : "N/A"}</td>
            <td>{order.orderStateName ?? "N/A"}</td>
            <td>
                <select name="orderStateId" id="" onChange={onChange} value={edit?.orderStateId ?? currentStateId}>
                    <option value="">Sélectionner un état</option>
                    <option value="5">Livré</option>
                    <option value="6">Annulé</option>
                </select>
            </td>
            <td>
                <input type="date" name="dateUpdate" onChange={onChange} value={edit?.dateUpdate ?? currentDateUpdate} />  
                <button type={"button"} onClick={onClick}>
                    Modifier            
                </button>
            </td>
        </tr>
    )
}

export default BOOderRow;
