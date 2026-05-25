import {useEffect, useMemo, useState} from "react";
import {fetchProductWithStock} from "../backend/services/ProductService.js";
import StockAvailable from "../backend/entities/StockAvailable.js";
import StockMvt from "../backend/entities/StockMvt.js";
import {formatDateTime} from "../backend/utils/utils.js";
import {MaterialReactTable, useMaterialReactTable} from "material-react-table";

/**
 * Panneau de mise a jour des stocks BackOffice.
 * Regles metier: journaliser chaque variation dans stock_mvt puis synchroniser stock_available.
 * Methode: liste produits/declinaisons, saisit une quantite, applique ajout/retrait avec traçabilite.
 * Parametres: setCombination, setProductDetails.
 * Retour: JSX tableau editable des stocks.
 */
function BOStockUpdate({setCombination, setProductDetails}) {
    const [data, setData] = useState([])
    const [quantity, setQuantity] = useState({})
    const [dateChange, setDateChange] = useState("")

    const ID_MVT_REASON = {
        AUGMENTATION: {
            id: 1,
            sign: 1
        },
        DIMINUTION: {
            id: 2,
            sign: -1
        }
    }

    // Etape 1: charger les produits avec stocks au montage du composant.
    useEffect(() => {
        const loadProducts = async () => {
            try {
                return await fetchProductWithStock();
            } catch (error) {
                console.error("Erreur lors de la récupération des produits avec stocks: " + error)
            }
        }

        loadProducts().then(result => setData(result ?? []))
    }, []);

    // Etape 2: transformer les declinaisons en sous-lignes pour table expandable.
    const tableData = useMemo(() => {
        return data.map((row) => ({
            ...row,
            subRows: (row.declinations ?? []).map((declination) => ({
                isDeclination: true,
                parentProduct: row.product,
                declinationName: declination.name,
                quantity: declination.quantity,
                stockAvailableId: declination.stockAvailableId,
                combinationId: declination.combinationId,
            })),
        }));
    }, [data]);

    // Etape 3: definir colonnes et actions (ajouter, retirer, voir evolution).
    const columns = useMemo(() => [
        {
            header: "Produits",
            accessorFn: (row) => row.isDeclination ? "" : row.product.name[0].value,
        },
        {
            header: "Déclinaisons",
            accessorFn: (row) => row.isDeclination ? row.declinationName : "-",
        },
        {
            header: "Stock disponible",
            accessorFn: (row) => row.isDeclination ? row.quantity : row.totalQuantity,
        },
        {
            header: "Quantité",
            Cell: ({row}) => {
                const showInput = (!row.original.isDeclination && row.original.declinations.length === 0) || row.original.isDeclination;
                if (!showInput) return null;

                return (
                    <input
                        className="form-control form-control-sm"
                        type={"number"}
                        value={quantity[row.id] ?? ""}
                        onChange={(e) =>
                            setQuantity((prev) => ({
                                ...prev,
                                [row.id]: e.target.value === "" ? "" : Number(e.target.value)
                            }))
                        }
                    />
                )
            }
        },
        {
            header: "Actions",
            Cell: ({row}) => (
                <div className="d-flex flex-wrap gap-2">
                    <button className="btn btn-sm btn-primary" onClick={() => updateQuantity(row, ID_MVT_REASON.AUGMENTATION)}>
                        Ajouter
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => updateQuantity(row, ID_MVT_REASON.DIMINUTION)}>
                        Retirer
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => {
                        const isDeclination = Boolean(row.original?.isDeclination)
                        const product = isDeclination ? row.original.parentProduct : row.original.product
                        const idProductAttribute = isDeclination ? (row.original.combinationId ?? 0) : 0

                        setProductDetails(row.original)
                        setCombination([product.id, idProductAttribute])
                    }}>
                        Voir évolution
                    </button>
                </div>
            ),
        },
    ], [quantity, dateChange]);

    /**
     * Applique un mouvement de stock sur une ligne produit/declinaison.
     * Regles metier: refuse quantite nulle; cree un stock_mvt puis met a jour stock_available.
     * Parametres: row (ligne MRT), MVT_REASON ({id, sign}).
     * Retour: Promise<void>.
     */
    const updateQuantity = async (row, MVT_REASON) => {
        // Etape 1: determiner le couple cible produit/declinaison.
        const isDeclination = Boolean(row.original?.isDeclination)
        const idProduct = isDeclination ? row.original.parentProduct?.id : row.original.product?.id
        const idProductAttribute = isDeclination ? (row.original.combinationId ?? 0) : 0
        // Etape 2: lire la quantite saisie et calculer le delta signe.
        const amount = Number(quantity[row.id] ?? 0)

        if (!amount) return

        const delta = amount * MVT_REASON.sign

        try {
            // Etape 3: recuperer le stock courant pour la cle cible.
            const stockApi = new StockAvailable({}, false)
            const existing = await stockApi.getByProductAndAttribute(idProduct, idProductAttribute)

            if (!existing) {
                console.error("stock_available introuvable", {idProduct, idProductAttribute})
                return
            }

            // Etape 4: ecrire un mouvement de stock pour conserver la traçabilite metier.
            const movement = StockMvt.fromData({
                idStock: existing.id,
                idProduct,
                idProductAttribute,
                physicalQuantity: amount,
                sign: MVT_REASON.sign,
                idStockMvtReason: MVT_REASON.id,
                idEmployee: 1,
                priceTe: 0,
                dateAdd: dateChange || formatDateTime(new Date()),
            })
            await movement.save()

            // Etape 5: appliquer la quantite finale dans stock_available.
            const stockEntity = StockAvailable.fromData(existing)
            stockEntity.quantity = Number(existing.quantity ?? 0) + delta
            await stockEntity.update()

            // Etape 6: rafraichir l'affichage et nettoyer la saisie temporaire.
            const fresh = await fetchProductWithStock()
            setData(fresh ?? [])
            setQuantity((prev) => {
                const next = {...prev}
                delete next[row.id]
                return next
            })
        } catch (error) {
            console.error("Erreur lors de la mise à jour du stock:", error)
        }
    }

    // Etape 7: configurer la table expand/collapse produit -> declinaisons.
    const table = useMaterialReactTable({
        columns,
        data: tableData,
        enableExpanding: true,
        getSubRows: (row) => row.subRows,
        getRowId: (row) =>
            row.isDeclination
                ? `${row.parentProduct?.id ?? row.product?.id}:${row.combinationId ?? 0}`
                : `${row.product?.id ?? 0}:0`,
        filterFromLeafRows: true,
        paginateExpandedRows: false,
    })

    // Etape 8: rendre la zone de date puis le tableau d'edition stock.
    return <>
        <header className="mb-3">
            <h5 className="mb-1">Mise a jour des stocks</h5>
            <p className="text-muted mb-0">Ajouter ou retirer des quantites, puis suivre l'historique.</p>
        </header>
        <div className="mb-3">
            <label className="form-label">Date de changement</label>
            <input
                className="form-control"
                type={"date"}
                value={dateChange}
                onChange={(e) => setDateChange(e.target.value)}
            />
        </div>
        <MaterialReactTable table={table}/>
    </>
}

export default BOStockUpdate;