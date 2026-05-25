import { useEffect, useMemo, useRef } from "react"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { formatDateInput, formatDateTime } from "../backend/utils/utils"

/**
 * Validation factice pour les `propTypes` du composant.
 *
 * Paramètres:
 * - Aucun.
 *
 * Type de résultat:
 * - null.
 *
 * Ce que fait la fonction:
 * - Sert de validateur neutre lorsque les props ne sont pas contraintes strictement.
 *
 * Règles métier:
 * - Aucune validation métier, uniquement un placeholder pour la configuration des propTypes.
 *
 * Fonctionnement:
 * - Retourne toujours `null`.
 *
 * Exemple d'utilisation:
 * - Input: `noopValidator()`
 * - Output attendu: `null`.
 */
const noopValidator = () => null

/**
 * Cellule d'action pour une commande ou un panier dans le tableau FrontOffice.
 *
 * Paramètres:
 * - `cell` (object): cellule Material React Table.
 * - `table` (object): instance de table.
 *
 * Type de résultat:
 * - JSX.Element. Rend les contrôles d'édition et l'action de validation.
 *
 * Ce que fait la fonction:
 * - Affiche soit l'action de duplication de commande, soit l'action de conversion d'un panier en commande.
 *
 * Règles métier:
 * - Le mode d'action dépend de `actionMode`.
 * - La ligne sélectionnée reçoit les champs d'édition correspondant à la section active.
 *
 * Fonctionnement:
 * - Les refs passées via `meta` permettent de garder des handlers stables.
 *
 * Exemple d'utilisation:
 * - Input: une cellule de la colonne ACTION.
 * - Output attendu: boutons et champs adaptés au contexte.
 */
function OrderActionCell({ cell, table }) {
    const meta = table?.options?.meta ?? {}
    const row = cell.row
    const rowId = Number(row.original?.id ?? 0)
    const edit = meta.editRef?.current ?? null
    const actionMode = meta.actionModeRef?.current ?? "order"
    const isCartMode = actionMode === "cart"
    const isSelected = isCartMode ? Number(edit?.cartId ?? 0) === rowId : Number(edit?.orderId ?? 0) === rowId
    const baseDate = formatDateInput(row.original?.dateAdd)

    if (isCartMode) {
        const dateValue = isSelected ? (edit?.cartDateOrder || baseDate) : baseDate

        return (
            <div className="d-grid gap-2">
                {/* Date de commande pour la conversion du panier */}
                <input
                    type="date"
                    name="cartDateOrder"
                    className="form-control form-control-sm"
                    onChange={meta.onChangeRef?.current?.(rowId, true)}
                    value={dateValue}
                />
                <button className="btn btn-primary btn-sm" type="button" onClick={() => meta.onClickRef?.current?.(rowId)}>
                    Commander
                </button>
            </div>
        )
    }

    const dateValue = isSelected ? (edit?.dateUpdate || baseDate) : baseDate
    const multiplicateur = meta.multiplicateurRef?.current ?? 1
    const multiplicateurValue = isSelected ? (edit?.multiplicateur ?? multiplicateur) : multiplicateur

    return (
        <div className="d-grid gap-2">
            {/* Multiplicateur pour duplication */}
            <input
                type="number"
                name="multiplicateur"
                className="form-control form-control-sm"
                onChange={meta.onChangeRef?.current?.(rowId, false)}
                value={multiplicateurValue}
            />
            {/* Date de duplication */}
            <input
                type="date"
                name="dateUpdate"
                className="form-control form-control-sm"
                onChange={meta.onChangeRef?.current?.(rowId, false)}
                value={dateValue}
            />
            <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => meta.onClickRef?.current?.(rowId)}>
                Dupliquer la commande
            </button>
        </div>
    )
}

/**
 * Tableau FrontOffice pour afficher les commandes et paniers.
 *
 * Paramètres:
 * - `rows` (Array): données à afficher.
 * - `edit` (object|null): état d'édition courant.
 * - `multiplicateur` (number): multiplicateur utilisé pour la duplication.
 * - `onChange` (function): handler de changement des champs d'édition.
 * - `onClick` (function): handler d'action principale.
 * - `actionMode` (string): mode `order` ou `cart`.
 * - `title` (string): titre de la section.
 *
 * Type de résultat:
 * - JSX.Element. Rend une section avec table paginée.
 *
 * Ce que fait la fonction:
 * - Affiche les lignes enrichies avec pagination.
 * - Rend l'action adaptée au mode actif.
 *
 * Règles métier:
 * - Les lignes nulles ou falsy sont filtrées.
 * - Le comportement de la cellule d'action dépend du mode courant.
 *
 * Fonctionnement:
 * - Les props sont stockées dans des refs pour éviter les fermetures obsolètes.
 * - La table Material React Table est configurée avec les colonnes métier.
 *
 * Exemple d'utilisation:
 * - Input: `<FOOrderRow rows={orders} actionMode="order" />`
 * - Output attendu: tableau de commandes avec actions d'édition.
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
    /**
     * Nettoie les données reçues pour la table.
     *
     * Paramètres:
     * - Aucun, dépend de `rows`.
     *
     * Type de résultat:
     * - Array.
     *
     * Ce que fait la fonction:
     * - Supprime les valeurs falsy et garantit un tableau exploitable.
     *
     * Règles métier:
     * - La table ne doit recevoir que des lignes valides.
     *
     * Fonctionnement:
     * - Le tableau est filtré dans un `useMemo`.
     *
     * Exemple d'utilisation:
     * - Input: `rows = [null, { id: 1 }]`
     * - Output attendu: `[{ id: 1 }]`.
     */
    const safeRows = useMemo(() => (Array.isArray(rows) ? rows.filter(Boolean) : []), [rows])
    const editRef = useRef(edit)
    const onChangeRef = useRef(onChange)
    const onClickRef = useRef(onClick)
    const actionModeRef = useRef(actionMode)
    const multiplicateurRef = useRef(multiplicateur)

    useEffect(() => {
        editRef.current = edit
    }, [edit])

    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    useEffect(() => {
        onClickRef.current = onClick
    }, [onClick])

    useEffect(() => {
        actionModeRef.current = actionMode
    }, [actionMode])

    useEffect(() => {
        multiplicateurRef.current = multiplicateur
    }, [multiplicateur])

    const tableMeta = useMemo(
        () => ({
            editRef,
            onChangeRef,
            onClickRef,
            actionModeRef,
            multiplicateurRef,
        }),
        [],
    )

    /**
     * Définit les colonnes métier du tableau.
     *
     * Paramètres:
     * - Aucun.
     *
     * Type de résultat:
     * - Array de définitions de colonnes.
     *
     * Ce que fait la fonction:
     * - Décrit les colonnes affichées dans la table.
     *
     * Règles métier:
     * - Les colonnes doivent rester alignées avec la structure des commandes et paniers.
     *
     * Fonctionnement:
     * - Les colonnes sont construites une seule fois avec `useMemo`.
     *
     * Exemple d'utilisation:
     * - Input: rendu du composant.
     * - Output attendu: configuration des colonnes pour Material React Table.
     */
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

    const table = useMaterialReactTable({
        columns,
        data: safeRows,
        meta: tableMeta,
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
