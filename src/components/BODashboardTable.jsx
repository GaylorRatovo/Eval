/* eslint-disable react/prop-types */

import { useMemo } from "react"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"

/**
 * Formate un montant numérique en chaîne avec 2 décimales.
 *
 * Paramètres: `value` (number|string).
 * Retour: string.
 */
const formatAmount = (value) => Number(value ?? 0).toFixed(2)

/**
 * Composant tableau réutilisable pour le dashboard (commandes / paniers journaliers).
 *
 * Paramètres:
 * - `rows` (Array): lignes du tableau.
 * - `countHeader` (string): libellé colonne compte.
 * - `countKey` (string): clé pour le compteur dans les lignes.
 *
 * Retour: JSX.
 */
function BODashboardTable({ rows = [], countHeader = "Commandes", countKey = "ordersCount" }) {
	const columns = useMemo(
		() => [
			{
				header: "Jour",
				accessorKey: "day",
			},
			{
				header: countHeader,
				accessorKey: countKey,
			},
			{
				header: "Total HT",
				accessorKey: "totalHT",
				Cell: ({ cell }) => formatAmount(cell.getValue()),
			},
			{
				header: "Total TTC",
				accessorKey: "totalTTC",
				Cell: ({ cell }) => formatAmount(cell.getValue()),
			},
		],
		[],
	)

	const table = useMaterialReactTable({
		columns,
		data: rows,
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

	return <MaterialReactTable table={table} />
}

export default BODashboardTable