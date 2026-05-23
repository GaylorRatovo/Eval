import { useEffect, useMemo, useState } from "react"
import Product from "../backend/entities/Product"
import Category from "../backend/entities/Category"
import Order from "../backend/entities/Order"
import OrderDetail from "../backend/entities/OrderDetail"
import ProductWithCombinations from "../backend/dto/ProductWithCombinations.js"
import OrderLineMetrics from "../backend/dto/OrderLineMetrics.js"
import OrderCategoryMetrics from "../backend/dto/OrderCategoryMetrics.js"
import OrderWithDetails from "../backend/dto/OrderWithDetails.js"
import StockMvt from "../backend/entities/StockMvt.js";
import StockProductAvailability from "../backend/dto/StockProductAvailability.js";
import StockAvailable from "../backend/entities/StockAvailable.js";
import StockCategoryAvailability from "../backend/dto/StockCategoryAvailability.js";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import {toInt} from "../backend/utils/utils.js";

function BOStatistic() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [mvtStock, setMvtStock] = useState([])
    const [stockAvailables, setStockAvailables] = useState([])
    const [productsWithDecl, setproductsWithDecl] = useState([])
    const [categories, setCategories] = useState([])
    const [orders, setOrders] = useState([])
    const [orderCategoryMetrics, setOrderCategoryMetrics] = useState([])
    const [orderCategoryMetricsFromStock, setOrderCategoryMetricsFromStock] = useState([])
    const [stockCategoryMetrics, setStockCategoryMetrics] = useState([])
    const [baseOrderGroups, setBaseOrderGroups] = useState([])
    const [dateMin,setDateMin] = useState("")
    const [dateMax, setDateMax] = useState("")

	useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                setError("")

                //Recuperer les produits, categories, commandes(non annulées) et details des commandes
                const categories = await new Category({}, false).getExclApi([1,2]) // Exclude root category
                const products = await new Product({}, false).getAll()
                const mvtStock = await new StockMvt().getAll()
                const stockAvailables = await new StockAvailable({}, false).getAll()

                const productsWithDecl = await ProductWithCombinations.listFromProductsWithCategories(products, categories)

                const orders = await new Order({}, false).getByNot("currentState",6)
                const orderIds = orders.map(order => order.id)
                const orderDetailsRaw = await new OrderDetail({}, false).getBy("orderId",[...orderIds])

                //Ito izy mbola ilay list mbola tsy mbola groupé par produit sy category, fa mbola ligne par ligne, izay ahitana ny details rehetra, izay ahafahana manao filtre par date
                //Ito no alefa amin'ny groupByProductAndCombination raha par produit ny alea
                const orderGroups = OrderWithDetails.groupOrdersWithDetails(orders, orderDetailsRaw)
                const orderLineMetrics = OrderLineMetrics.listFromOrderGroups(orderGroups, productsWithDecl)

                //Ito izy efa regroupé par categorie
                const orderCategoryMetrics = OrderCategoryMetrics.groupByCategoryFromProductLines(orderLineMetrics)
                const orderLineMetricsFromStock = OrderLineMetrics.listFromProductsWithStockMovements(
                    orderGroups,
                    productsWithDecl,
                    mvtStock,
                    stockAvailables
                )
                const orderCategoryMetricsFromStock = OrderCategoryMetrics.groupByCategoryFromTotals(
                    orderLineMetricsFromStock
                )
                const stockAvailabilityMetrics = StockProductAvailability.listFromProductsAndStockData(
                    mvtStock,
                    orderGroups,
                    productsWithDecl,
                    stockAvailables
                )
                const stockCategoryMetrics = StockCategoryAvailability.groupByCategory(stockAvailabilityMetrics)

                setproductsWithDecl(productsWithDecl)
                setCategories(categories)
                setOrders(orders)
                setOrderCategoryMetrics(orderCategoryMetrics)
                setOrderCategoryMetricsFromStock(orderCategoryMetricsFromStock)
                setStockCategoryMetrics(stockCategoryMetrics)
                setMvtStock(mvtStock)
                setStockAvailables(stockAvailables)
                setBaseOrderGroups(orderGroups)
            } catch (err) {
                setError(err?.message || "Erreur lors du chargement")
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    const formatNumber = (value) => Number(value ?? 0).toFixed(2)

    const columns = useMemo(() => [
        {
            header: "Categorie",
            accessorFn: (row) => row?.category?.name || row?.category?.slug || "Aucune",
        },
        {
            header: "Qte",
            accessorFn: (row) => Number(row?.quantity ?? 0),
            Cell: ({ cell }) => formatNumber(cell.getValue()),
        },
        {
            header: "Vente total",
            accessorFn: (row) => Number(row?.totalVente ?? 0),
            Cell: ({ cell }) => formatNumber(cell.getValue()),
        },
        {
            header: "Achat total",
            accessorFn: (row) => Number(row?.totalAchat ?? 0),
            Cell: ({ cell }) => formatNumber(cell.getValue()),
        },
        {
            header: "Benefice",
            accessorFn: (row) => Number(row?.benefice ?? 0),
            Cell: ({ cell }) => formatNumber(cell.getValue()),
        },
    ], [])

    const table = useMaterialReactTable({
        columns,
        data: orderCategoryMetrics,
    })

    const stockCostTable = useMaterialReactTable({
        columns,
        data: orderCategoryMetricsFromStock,
    })

    const stockColumns = useMemo(() => [
        {
            header: "Categorie",
            accessorFn: (row) => row?.category?.name || row?.category?.slug || "Aucune",
        },
        {
            header: "Qte physique",
            accessorFn: (row) => Number(row?.physicalQuantity ?? 0),
            Cell: ({ cell }) => toInt(cell.getValue()),
        },
        {
            header: "Qte reserve",
            accessorFn: (row) => Number(row?.reservedQuantity ?? 0),
            Cell: ({ cell }) => toInt(cell.getValue()),
        },
        {
            header: "Qte dispo",
            accessorFn: (row) => Number(row?.availableQuantity ?? 0),
            Cell: ({ cell }) => toInt(cell.getValue()),
        },
    ], [])

    const stockTable = useMaterialReactTable({
        columns: stockColumns,
        data: stockCategoryMetrics,
    })

    useEffect(() => {
        console.log("dateMin: ", dateMin)
        console.log("dateMax: ", dateMax)
        const orderFiltered = OrderWithDetails.filterGroupsByDate(baseOrderGroups, dateMin, dateMax)
        const mvtFiltered = StockMvt.filterByDateRange(mvtStock, dateMin, dateMax)
        const mvtFilteredWithoutMin = StockMvt.filterByDateRange(mvtStock, null, dateMax)

        const orderLineMetrics = OrderLineMetrics.listFromOrderGroups(orderFiltered, productsWithDecl)
        const orderCategoryMetrics = OrderCategoryMetrics.groupByCategoryFromProductLines(orderLineMetrics)

        const orderLineMetricsFromStock = OrderLineMetrics.listFromProductsWithStockMovements(
            orderFiltered,
            productsWithDecl,
            mvtFiltered,
            stockAvailables
        )
        const orderCategoryMetricsFromStock = OrderCategoryMetrics.groupByCategoryFromTotals(
            orderLineMetricsFromStock
        )

        const stockAvailabilityMetrics = StockProductAvailability.listFromProductsAndStockData(
            mvtFilteredWithoutMin,
            orderFiltered,
            productsWithDecl,
            stockAvailables
        )
        
        const stockCategoryMetrics = StockCategoryAvailability.groupByCategory(stockAvailabilityMetrics)

        setOrderCategoryMetrics(orderCategoryMetrics)
        setOrderCategoryMetricsFromStock(orderCategoryMetricsFromStock)
        setStockCategoryMetrics(stockCategoryMetrics)
    }, [dateMin, dateMax, baseOrderGroups, productsWithDecl, mvtStock, stockAvailables]);

    const resetDateFilter = () => {
        setDateMin("");
        setDateMax("");
    }

	return (
		<div>
			<h1>Statistiques</h1>

			{loading && <p>Chargement...</p>}
			{!loading && error && <p>{error}</p>}

			{!loading && !error && (
				<div>
                    <div>
                        <div>
                            date min
                            <input
                                type="date"
                                value={dateMin}
                                onChange={(event)=> setDateMin(event.target.value)}
                            />
                        </div>

                        <div>
                            date max
                            <input
                                type="date"
                                value={dateMax}
                                onChange={(event)=> setDateMax(event.target.value)}
                            />
                        </div>

                        <button onClick={resetDateFilter}>
                            Reset filtre date
                        </button>
                    </div>
                    <MaterialReactTable table={table} />

                    <h3>Commande par categorie (cout depuis mouvements)</h3>
                    <MaterialReactTable table={stockCostTable} />

                    <h3>Disponibilite Stock</h3>
                    <MaterialReactTable table={stockTable} />
				</div>
			)}
		</div>
	)
}

export default BOStatistic
