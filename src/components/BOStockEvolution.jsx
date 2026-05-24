import {useEffect, useMemo, useState} from "react";
import {getDailyMovement} from "../backend/services/StockMvtService.js";
import {MaterialReactTable, useMaterialReactTable} from "material-react-table";

/**
 * Panneau d'evolution de stock par jour.
 * Regles metier: calcule entrees/sorties/net/final + reservations pour le couple produit-declinaison choisi.
 * Methode: charge les mouvements agreges puis filtre par intervalle de dates.
 * Parametres: combination [productId, productAttributeId], productDetails.
 * Retour: JSX tableau d'evolution.
 */
function BOStockEvolution({combination, productDetails}) {
    const [productsData, setProductsData] = useState([])
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const productId = combination[0];
    const productAttributeId = combination[1];

    // Etape 1: charger l'historique journalier selon la combinaison selectionnee.
    useEffect(() => {
        const loadMovements = async () => {
            try {
                const data = await getDailyMovement(productId, productAttributeId, productDetails);
                setProductsData(data)
            } catch (error) {
                console.log("ERREUR LORS DE LA RECUPERATION DES MOUVEMENTS: " + error)
            }
        }

        loadMovements().then(r => console.log(r))
    }, [productId, productAttributeId, productDetails]);

    // Etape 2: filtrer les lignes entre bornes inclusives (format YYYY-MM-DD).
    const filteredData = useMemo(() => {
        return productsData.filter((row) => {
            if (dateFrom && row.date < dateFrom) return false
            if (dateTo && row.date > dateTo) return false
            return true
        })
    }, [productsData, dateFrom, dateTo]);

    // Etape 3: definir les colonnes metiers de suivi stock.
    const columns = useMemo(() => [
        {
            header: "Date",
            accessorFn: (row) => row.date,
        },
        {
            header: "Entrant",
            accessorFn: (row) => row.totalIn
        },
        {
            header: "Sortant",
            accessorFn: (row) => row.totalOut
        },
        {
            header: "Net",
            accessorFn: (row) => row.net
        },
        {
            header: "Stock physique en fin de journée",
            accessorFn: (row) => row.final
        },
        {
            header: "Réservé ce jour",
            accessorFn: (row) => row.reservedDaily
        },
        {
            header: "Cumul réservé",
            accessorFn: (row) => row.reserved ?? 0
        },
        {
            header: "Stock réel restant",
            accessorFn: (row) => row.remaining ?? 0
        }
    ], [])

    // Etape 4: initialiser la table material react.
    const table = useMaterialReactTable({
        columns,
        data: filteredData
    })

    // Etape 5: rendre filtres de date et tableau d'evolution.
    return <div>
        <header>
            <h4>Evolution de stock</h4>
            <div>
                <label>
                    Du
                    <input
                        type={"date"}
                        value={dateFrom}
                        max={dateTo || undefined}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                </label>
                <label>
                    Au
                    <input
                        type={"date"}
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </label>
            </div>
            <MaterialReactTable table={table} />
        </header>
    </div>
}

export default BOStockEvolution;