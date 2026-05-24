import { useEffect, useMemo, useState } from "react"
import {
	aggregateDashboardRowsByDay,
	aggregateCartDashboardRowsByDay,
	countDashboardRows,
	filterDashboardRowsByDates,
	filterDashboardRowsByStatus,
	loadDashboardData,
	sumCartDashboardRowsTotals,
	sumDashboardRowsTotals,
} from "../backend/services/DashboardService.js"
import BODashboardTable from "../components/BODashboardTable.jsx"
import { formatAmount, getOrderStateLabel } from "../backend/utils/dashboardUtils.js"

/**
 * Affiche le tableau de bord BackOffice des commandes et paniers.
 * Regles metier: exclut les commandes annulees (etat 6) et autorise un filtrage par dates/statut.
 * Methode: charge les donnees une fois, puis calcule des vues derivees (totaux, aggregations) via useMemo.
 * Parametres: aucun (composant React de page).
 * Retour: JSX avec KPI, filtres et tableaux journaliers.
 */
function BODashboard() {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")
	const [dashboardRows, setDashboardRows] = useState([])
	const [cartDashboardRows, setCartDashboardRows] = useState([])
	const [orderStates, setOrderStates] = useState([])
	const [dateMin, setDateMin] = useState("")
	const [dateMax, setDateMax] = useState("")
	const [statusId, setStatusId] = useState("all")

	useEffect(() => {
		// Etape 1: chargement initial des donnees dashboard au montage de la page.
		const load = async () => {
			try {
				// Etape 2: initialiser l'etat de chargement et vider les erreurs precedentes.
				setLoading(true)
				setError("")

				// Etape 3: recuperer commandes, paniers et statuts depuis le service.
				const data = await loadDashboardData()
				setDashboardRows(data.dashboardRows ?? [])
				setCartDashboardRows(data.cartDashboardRows ?? [])
				// Etape 4: retirer l'etat "annule" de la liste de filtre pour rester coherent metier.
				setOrderStates((data.orderStates ?? []).filter((state) => Number(state?.id) !== 6))
			} catch (err) {
				// Etape 5: afficher un message explicite en cas d'echec.
				setError(err?.message || "Erreur lors du chargement du dashboard")
			} finally {
				// Etape 6: fin de chargement dans tous les cas.
				setLoading(false)
			}
		}

		load()
	}, [])

	// Etape 7: appliquer les filtres utilisateur (dates puis statut) sur les commandes.
	const filteredRows = useMemo(() => {
		const byDate = filterDashboardRowsByDates(dashboardRows, dateMin, dateMax)
		return filterDashboardRowsByStatus(byDate, statusId)
	}, [dashboardRows, dateMin, dateMax, statusId])

	// Etape 8: calculer les indicateurs derives commandes.
	const dailyRows = useMemo(() => aggregateDashboardRowsByDay(filteredRows), [filteredRows])
	const totals = useMemo(() => sumDashboardRowsTotals(filteredRows), [filteredRows])
	const ordersCount = useMemo(() => countDashboardRows(filteredRows), [filteredRows])

	// Etape 9: appliquer le filtrage date pour les paniers, puis calculer leurs indicateurs.
	const filteredCartRows = useMemo(() => {
		return filterDashboardRowsByDates(cartDashboardRows, dateMin, dateMax)
	}, [cartDashboardRows, dateMin, dateMax])

	const cartDailyRows = useMemo(() => aggregateCartDashboardRowsByDay(filteredCartRows), [filteredCartRows])
	const cartTotals = useMemo(() => sumCartDashboardRowsTotals(filteredCartRows), [filteredCartRows])
	const cartCount = useMemo(() => countDashboardRows(filteredCartRows), [filteredCartRows])

	/**
	 * Reinitialise les filtres visuels.
	 * Regles metier: retour a la vue globale sans contrainte.
	 * Parametres: aucun.
	 * Retour: void.
	 */
	const resetFilters = () => {
		setDateMin("")
		setDateMax("")
		setStatusId("all")
	}

	return (
		<div>
			<h1>BODashboard</h1>

			{loading && <p>Chargement...</p>}
			{!loading && error && <p>{error}</p>}

			{!loading && !error && (
				<div>
					<section>
						<div>
							<div>Nombre de commandes</div>
							<strong>{ordersCount}</strong>
						</div>
						<div>
							<div>Total HT commandes</div>
							<strong>{formatAmount(totals.totalHT)}</strong>
						</div>
						<div>
							<div>Total TTC commandes</div>
							<strong>{formatAmount(totals.totalTTC)}</strong>
						</div>
					</section>

					<section>
						<div>
							<div>Nombre de paniers sans commande</div>
							<strong>{cartCount}</strong>
						</div>
						<div>
							<div>Total HT paniers</div>
							<strong>{formatAmount(cartTotals.totalHT)}</strong>
						</div>
						<div>
							<div>Total TTC paniers</div>
							<strong>{formatAmount(cartTotals.totalTTC)}</strong>
						</div>
					</section>

					<section>
						<label>
							<div>Date min</div>
							<input type="date" value={dateMin} onChange={(event) => setDateMin(event.target.value)} />
						</label>
						<label>
							<div>Date max</div>
							<input type="date" value={dateMax} onChange={(event) => setDateMax(event.target.value)} />
						</label>
						<label>
							<div>Status</div>
							<select value={statusId} onChange={(event) => setStatusId(event.target.value)}>
								<option value="all">Tous les statuts</option>
								{orderStates.map((state) => (
									<option key={state.id} value={state.id}>
										{getOrderStateLabel(state)}
									</option>
								))}
							</select>
						</label>
						<div>
							<button type="button" onClick={resetFilters}>Reset filtres</button>
						</div>
					</section>

					<section>
						<h3>Commandes journalières</h3>
						<BODashboardTable rows={dailyRows} />
					</section>

					<section>
						<h3>Paniers journaliers</h3>
						<BODashboardTable rows={cartDailyRows} countHeader="Paniers" countKey="cartsCount" />
					</section>
				</div>
			)}
		</div>
	)
}

export default BODashboard