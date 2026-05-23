import StockMvt from "../entities/StockMvt.js";

// Extrait la date (YYYY-MM-DD) d'un dateAdd Prestashop au format "YYYY-MM-DD HH:MM:SS"
const toDayKey = (dateAdd) => {
    if (!dateAdd) return null
    const str = String(dateAdd)
    return str.length >= 10 ? str.slice(0, 10) : null
}

// Retourne l'historique des mouvements de stock d'un produit/déclinaison, agrégé par jour
export async function getDailyMovement(idProduct, idProductAttribute) {
    const mvt = new StockMvt({}, false);
    const movements = await mvt.getAllByProductAndAttribute(idProduct, idProductAttribute);

    // Regroupement des mouvements par date
    const byDay = new Map()

    for (const m of movements) {
        const day = toDayKey(m.dateAdd)
        if (!day) continue

        const quantity = Number(m.physicalQuantity) || 0
        const sign = Number(m.sign) || 0

        // Récupère le bucket du jour ou on initialise un nouveau
        const bucket = byDay.get(day) ?? {
            date: day,
            totalIn: 0,
            totalOut: 0,
            net: 0,
            count: 0,
            movements: [],
        }

        // sign = 1 : entrée de stock, sign = -1 : sortie de stock
        if (sign > 0) bucket.totalIn += quantity
        else if (sign < 0) bucket.totalOut += quantity

        bucket.net += sign * quantity
        bucket.count += 1
        bucket.movements.push(m)

        byDay.set(day, bucket)
    }

    // Tri chronologique ascendant (ancien -> récent)
    return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date))
}