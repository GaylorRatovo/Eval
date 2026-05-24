import { useMemo } from "react"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { formatDateInput, formatDateTime } from "../backend/utils/utils"

const noopValidator = () => null

/**
 * Cellule d'action FO (mode commande ou mode panier).
 * Regles metier: en mode cart, permet de commander le panier; en mode order, permet duplication.
 * Parametres: cell, table (meta actionMode/edit/onChange/onClick).
 * Retour: JSX controles d'action.
 */
function OrderActionCell({ cell, table }) {
    // Etape 1: recuperer contexte de ligne et mode d'action.
    const meta = table?.options?.meta ?? {}
    const row = cell.row
    const rowId = Number(row.original?.id ?? 0)
    const isCartMode = meta.actionMode === "cart"
    const isSelected = isCartMode ? Number(meta.edit?.cartId ?? 0) === rowId : Number(meta.edit?.orderId ?? 0) === rowId
    const baseDate = formatDateInput(row.original?.dateAdd)

    // Etape 2: branchement conditionnel selon mode panier/commande.
    if (isCartMode) {
        const dateValue = isSelected ? (meta.edit?.cartDateOrder || baseDate) : baseDate

        return (
            <div>
                <input
                    type="date"
                    name="cartDateOrder"
                    onChange={meta.onChange?.(rowId, true)}
                    value={dateValue}
                />
                <button type="button" onClick={() => meta.onClick?.(rowId)}>
                    Commander
                </button>
            </div>
        )
    }

    const dateValue = isSelected ? (meta.edit?.dateUpdate || baseDate) : baseDate
    const multiplicateurValue = isSelected ? (meta.edit?.multiplicateur ?? meta.multiplicateur ?? 1) : (meta.multiplicateur ?? 1)

    return (
        <div>
            <input
                type="number"
                name="multiplicateur"
                onChange={meta.onChange?.(rowId, false)}
                value={multiplicateurValue}
            />
            <input
                type="date"
                name="dateUpdate"
                onChange={meta.onChange?.(rowId, false)}
                value={dateValue}
            />
            <button type="button" onClick={() => meta.onClick?.(rowId)}>
                Dupliquer la commande
            </button>
        </div>
    )
}

/**
 * Tableau FrontOffice reutilisable pour commandes et paniers en attente.
 * Parametres: rows, edit, multiplicateur, onChange, onClick, actionMode, title.
 * Retour: JSX section + MaterialReactTable.
 */
function FOOderRow({
    rows = [],
    edit = null,
    multiplicateur = 1,
    onChange,
    onClick,
    actionMode = "order",
    title = "",
}) {
    // Etape 1: securiser l'entree rows.
    const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : []

    // Etape 2: definir les colonnes communes.
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
                    const total = Number(row?.totalPaid ?? row?.totals?.totalTtc ?? 0)
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

    // Etape 3: configurer la table et injecter les callbacks via meta.
    const table = useMaterialReactTable({
        columns,
        data: safeRows,
        meta: {
            actionMode,
            edit,
            multiplicateur,
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

    // Etape 4: rendre le composant.
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

FOOderRow.propTypes = {
    rows: noopValidator,
    edit: noopValidator,
    multiplicateur: noopValidator,
    onChange: noopValidator,
    onClick: noopValidator,
    actionMode: noopValidator,
    title: noopValidator,
}

export default FOOderRow
