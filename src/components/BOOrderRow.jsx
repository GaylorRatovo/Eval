import { useMemo } from "react"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { formatDateInput, formatDateTime } from "../backend/utils/utils"

const noopValidator = () => null

/**
 * Cellule d'action pour mise a jour d'etat de commande.
 * Regles metier: propose seulement les transitions configurees (livre/annule) et une date.
 * Parametres: cell, table (meta contient edit/onChange/onClick).
 * Retour: JSX controls d'action.
 */
function OrderActionCell({ cell, table }) {
    // Etape 1: extraire les metadonnees de la table et identifier la ligne courante.
    const meta = table?.options?.meta ?? {}
    const row = cell.row
    const rowId = Number(row.original?.id ?? 0)
    const isSelected = Number(meta.edit?.orderId ?? 0) === rowId
    const currentStateId = row.original?.currentState ?? ""
    const baseDate = formatDateInput(row.original?.dateUpd || row.original?.dateAdd)

    // Etape 2: determiner les valeurs affichees (edition active ou fallback valeurs courantes).
    const dateValue = isSelected ? (meta.edit?.dateUpdate || baseDate) : baseDate

    return (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <select
                name="orderStateId"
                onChange={meta.onChange?.(rowId)}
                value={isSelected ? (meta.edit?.orderStateId ?? currentStateId) : currentStateId}
                style={{ padding: "4px" }}
            >
                <option value="">Sélectionner un état</option>
                <option value="5">Livré</option>
                <option value="6">Annulé</option>
            </select>
            <input
                type="date"
                name="dateUpdate"
                onChange={meta.onChange?.(rowId)}
                value={dateValue}
                style={{ padding: "4px" }}
            />
            <button type="button" onClick={() => meta.onClick?.(rowId)} style={{ padding: "4px 8px" }}>
                Modifier
            </button>
        </div>
    )
}

/**
 * Tableau BackOffice des commandes avec edition inline des etats.
 * Parametres: rows, edit, onChange, onClick, title.
 * Retour: JSX section + MaterialReactTable.
 */
function BOOrderRow({
    rows = [],
    edit = null,
    onChange,
    onClick,
    title = "",
}) {
    // Etape 1: securiser les donnees d'entree avant affichage.
    const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : []

    // Etape 2: definir les colonnes metier de la table commandes.
    const columns = useMemo(
        () => [
            {
                header: "REFERENCE",
                accessorKey: "id",
            },
            {
                header: "NOM",
                accessorKey: "customerName",
            },
            {
                header: "DATE",
                accessorFn: (row) => formatDateTime(row.dateAdd) || "N/A",
            },
            {
                header: "TOTAL",
                accessorFn: (row) => {
                    const total = Number(row?.totalPaid ?? 0)
                    return Number.isFinite(total) ? total.toFixed(2) : "N/A"
                },
            },
            {
                header: "ETAT ACTUEL",
                accessorKey: "orderStateName",
            },
            {
                header: "ACTION",
                Cell: OrderActionCell,
            },
        ],
        [],
    )

    // Etape 3: configurer la table avec meta callbacks pour la cellule action.
    const table = useMaterialReactTable({
        columns,
        data: safeRows,
        meta: {
            edit,
            onChange,
            onClick,
        },
        enablePagination: true,
        initialState: {
            pagination: { pageIndex: 0, pageSize: 10 },
        },
        muiTableBodyRowProps: ({ row }) => ({
            sx: {
                backgroundColor: row.index % 2 === 0 ? "#fafafa" : "#ffffff",
            },
        }),
    })

    // Etape 4: rendre le composant table.
    return (
        <section>
            {title ? <h3>{title}</h3> : null}
            <MaterialReactTable table={table} />
        </section>
    )
}

OrderActionCell.propTypes = {
    cell: noopValidator,
    table: noopValidator,
}

BOOrderRow.propTypes = {
    rows: noopValidator,
    edit: noopValidator,
    onChange: noopValidator,
    onClick: noopValidator,
    title: noopValidator,
}

export default BOOrderRow
