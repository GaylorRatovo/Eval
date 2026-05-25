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
		<div className="d-flex flex-column gap-4">
			<div>
				<h4 className="mb-1">Dashboard</h4>
				<p className="text-muted mb-0">Vue globale des commandes et paniers.</p>
			</div>

			{loading && <p className="text-muted">Chargement...</p>}
			{!loading && error && <div className="alert alert-danger" role="alert">{error}</div>}

			{!loading && !error && (
				<>
					<div className="row g-3">
						<div className="col-md-4">
							<div className="card">
								<div className="card-body">
									<div className="text-muted">Nombre de commandes</div>
									<h4 className="mb-0">{ordersCount}</h4>
								</div>
							</div>
						</div>
						<div className="col-md-4">
							<div className="card">
								<div className="card-body">
									<div className="text-muted">Total HT commandes</div>
									<h4 className="mb-0">{formatAmount(totals.totalHT)}</h4>
								</div>
							</div>
						</div>
						<div className="col-md-4">
							<div className="card">
								<div className="card-body">
									<div className="text-muted">Total TTC commandes</div>
									<h4 className="mb-0">{formatAmount(totals.totalTTC)}</h4>
								</div>
							</div>
						</div>
					</div>

					<div className="row g-3">
						<div className="col-md-4">
							<div className="card">
								<div className="card-body">
									<div className="text-muted">Paniers sans commande</div>
									<h4 className="mb-0">{cartCount}</h4>
								</div>
							</div>
						</div>
						<div className="col-md-4">
							<div className="card">
								<div className="card-body">
									<div className="text-muted">Total HT paniers</div>
									<h4 className="mb-0">{formatAmount(cartTotals.totalHT)}</h4>
								</div>
							</div>
						</div>
						<div className="col-md-4">
							<div className="card">
								<div className="card-body">
									<div className="text-muted">Total TTC paniers</div>
									<h4 className="mb-0">{formatAmount(cartTotals.totalTTC)}</h4>
								</div>
							</div>
						</div>
					</div>

					<div className="card">
						<div className="card-body">
							<div className="row g-3 align-items-end">
								<div className="col-md-3">
									<label className="form-label">Date min</label>
									<input className="form-control" type="date" value={dateMin} onChange={(event) => setDateMin(event.target.value)} />
								</div>
								<div className="col-md-3">
									<label className="form-label">Date max</label>
									<input className="form-control" type="date" value={dateMax} onChange={(event) => setDateMax(event.target.value)} />
								</div>
								<div className="col-md-4">
									<label className="form-label">Status</label>
									<select className="form-select" value={statusId} onChange={(event) => setStatusId(event.target.value)}>
										<option value="all">Tous les statuts</option>
										{orderStates.map((state) => (
											<option key={state.id} value={state.id}>
												{getOrderStateLabel(state)}
											</option>
										))}
									</select>
								</div>
								<div className="col-md-2">
									<button className="btn btn-outline-secondary w-100" type="button" onClick={resetFilters}>Reset filtres</button>
								</div>
							</div>
						</div>
					</div>

					<div className="card">
						<div className="card-header">
							<h6 className="mb-0">Commandes journalieres</h6>
						</div>
						<div className="card-body">
							<BODashboardTable rows={dailyRows} />
						</div>
					</div>

					<div className="card">
						<div className="card-header">
							<h6 className="mb-0">Paniers journaliers</h6>
						</div>
						<div className="card-body">
							<BODashboardTable rows={cartDailyRows} countHeader="Paniers" countKey="cartsCount" />
						</div>
					</div>
				</>
			)}
		</div>
	)
}

export default BODashboard