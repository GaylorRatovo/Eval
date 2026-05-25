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
 * Page BackOffice: Dashboard synthétique des commandes et paniers.
 *
 * Paramètres: aucun.
 * Retour: JSX — indicateurs et tableaux agrégés.
 *
 * Règles métier:
 * - Charge les données via `loadDashboardData`.
 * - Permet filtrage par date et par état de commande.
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
		const load = async () => {
			try {
				setLoading(true)
				setError("")

				const data = await loadDashboardData()
				setDashboardRows(data.dashboardRows ?? [])
				setCartDashboardRows(data.cartDashboardRows ?? [])
				setOrderStates((data.orderStates ?? []).filter((state) => Number(state?.id) !== 6))
			} catch (err) {
				setError(err?.message || "Erreur lors du chargement du dashboard")
			} finally {
				setLoading(false)
			}
		}

		load()
	}, [])

	const filteredRows = useMemo(() => {
		const byDate = filterDashboardRowsByDates(dashboardRows, dateMin, dateMax)
		return filterDashboardRowsByStatus(byDate, statusId)
	}, [dashboardRows, dateMin, dateMax, statusId])

	const dailyRows = useMemo(() => aggregateDashboardRowsByDay(filteredRows), [filteredRows])
	const totals = useMemo(() => sumDashboardRowsTotals(filteredRows), [filteredRows])
	const ordersCount = useMemo(() => countDashboardRows(filteredRows), [filteredRows])

	const filteredCartRows = useMemo(() => {
		return filterDashboardRowsByDates(cartDashboardRows, dateMin, dateMax)
	}, [cartDashboardRows, dateMin, dateMax])

	const cartDailyRows = useMemo(() => aggregateCartDashboardRowsByDay(filteredCartRows), [filteredCartRows])
	const cartTotals = useMemo(() => sumCartDashboardRowsTotals(filteredCartRows), [filteredCartRows])
	const cartCount = useMemo(() => countDashboardRows(filteredCartRows), [filteredCartRows])

	const resetFilters = () => {
		setDateMin("")
		setDateMax("")
		setStatusId("all")
	}

	return (
		<div>
			{/* En-tete */}
			<div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
				<div>
					<h1 className="fw-bold mb-1">Dashboard</h1>
					<p className="text-body-secondary mb-0">Vue d'ensemble des commandes et paniers</p>
				</div>
			</div>

			{loading && (
				<div className="d-flex justify-content-center align-items-center py-5">
					<div className="spinner-border" role="status">
						<span className="visually-hidden">Chargement...</span>
					</div>
				</div>
			)}

			{!loading && error && (
				<div className="alert alert-danger" role="alert">
					<i className="bx bx-error-circle me-2"></i>
					{error}
				</div>
			)}

			{!loading && !error && (
				<div className="row g-4">
					{/* Filtres */}
					<div className="col-12">
						<div className="card border-0 shadow-sm">
							<div className="card-body">
								<div className="row g-3 align-items-end">
									<div className="col-12 col-md-3">
										<label className="form-label small fw-bold">Date min</label>
										<input
											type="date"
											className="form-control"
											value={dateMin}
											onChange={(event) => setDateMin(event.target.value)}
										/>
									</div>
									<div className="col-12 col-md-3">
										<label className="form-label small fw-bold">Date max</label>
										<input
											type="date"
											className="form-control"
											value={dateMax}
											onChange={(event) => setDateMax(event.target.value)}
										/>
									</div>
									<div className="col-12 col-md-4">
										<label className="form-label small fw-bold">Statut</label>
										<select
											className="form-select"
											value={statusId}
											onChange={(event) => setStatusId(event.target.value)}
										>
											<option value="all">Tous les statuts</option>
											{orderStates.map((state) => (
												<option key={state.id} value={state.id}>
													{getOrderStateLabel(state)}
												</option>
											))}
										</select>
									</div>
									<div className="col-12 col-md-2">
										<button type="button" className="btn btn-outline-secondary w-100" onClick={resetFilters}>
											<i className="bx bx-reset me-2"></i>
											Reset filtres
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* KPIs commandes */}
					<div className="col-12">
						<div className="row g-3">
							<div className="col-12 col-md-4">
								<div className="card border-0 shadow-sm">
									<div className="card-body">
										<p className="text-body-secondary mb-1">Nombre de commandes</p>
										<h4 className="fw-bold mb-0">{ordersCount}</h4>
									</div>
								</div>
							</div>
							<div className="col-12 col-md-4">
								<div className="card border-0 shadow-sm">
									<div className="card-body">
										<p className="text-body-secondary mb-1">Total HT commandes</p>
										<h4 className="fw-bold mb-0">{formatAmount(totals.totalHT)}</h4>
									</div>
								</div>
							</div>
							<div className="col-12 col-md-4">
								<div className="card border-0 shadow-sm">
									<div className="card-body">
										<p className="text-body-secondary mb-1">Total TTC commandes</p>
										<h4 className="fw-bold mb-0">{formatAmount(totals.totalTTC)}</h4>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* KPIs paniers */}
					<div className="col-12">
						<div className="row g-3">
							<div className="col-12 col-md-4">
								<div className="card border-0 shadow-sm">
									<div className="card-body">
										<p className="text-body-secondary mb-1">Paniers sans commande</p>
										<h4 className="fw-bold mb-0">{cartCount}</h4>
									</div>
								</div>
							</div>
							<div className="col-12 col-md-4">
								<div className="card border-0 shadow-sm">
									<div className="card-body">
										<p className="text-body-secondary mb-1">Total HT paniers</p>
										<h4 className="fw-bold mb-0">{formatAmount(cartTotals.totalHT)}</h4>
									</div>
								</div>
							</div>
							<div className="col-12 col-md-4">
								<div className="card border-0 shadow-sm">
									<div className="card-body">
										<p className="text-body-secondary mb-1">Total TTC paniers</p>
										<h4 className="fw-bold mb-0">{formatAmount(cartTotals.totalTTC)}</h4>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Tableaux */}
					<div className="col-12">
						<div className="card border-0 shadow-sm">
							<div className="card-body">
								<h5 className="fw-bold mb-3">Commandes journalieres</h5>
								<BODashboardTable rows={dailyRows} />
							</div>
						</div>
					</div>

					<div className="col-12">
						<div className="card border-0 shadow-sm">
							<div className="card-body">
								<h5 className="fw-bold mb-3">Paniers journalieres</h5>
								<BODashboardTable rows={cartDailyRows} countHeader="Paniers" countKey="cartsCount" />
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default BODashboard