/* eslint-disable react/prop-types */

import { useMemo } from "react"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"

/**
 * Formate un montant numerique pour affichage dashboard.
 * Parametres: value (number|string|undefined).
 * Retour: string avec 2 decimales.
 */
const formatAmount = (value) => Number(value ?? 0).toFixed(2)

/**
 * Tableau reutilisable pour indicateurs journaliers BackOffice.
 * Regles metier: affiche compteur + total HT/TTC sur des lignes deja agregees par jour.
 * Parametres: rows, countHeader, countKey.
 * Retour: JSX MaterialReactTable.
 */
function BODashboardTable({ rows = [], countHeader = "Commandes", countKey = "ordersCount" }) {
	// Etape 1: definir les colonnes de rendu.
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

	// Etape 2: configurer la table (pagination + style de ligne).
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

	// Etape 3: rendre la table material.
	return <MaterialReactTable table={table} />
}

export default BODashboardTable