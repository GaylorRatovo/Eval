import Product from "../entities/Product.js";
import StockAvailable from "../entities/StockAvailable.js";
import Combination from "../entities/Combination.js";
import ProductOptionValue from "../entities/ProductOptionValue.js";

/**
 * Récupère tous les produits avec leurs informations de stock et déclinaisons.
 * OPTIMISÉ: Batch queries avec getAll() et indexing via Maps au lieu de requêtes individuelles.
 *
 * Paramètres: aucun.
 * Retour: Promise<Array> — chaque élément contient { product, totalQuantity, declinations }.
 *
 * Règles métier:
 * - Récupère tous les stocks, combinations, options en parallèle (3 requêtes au lieu de 1500+)
 * - Crée des Maps pour les lookups O(1) au lieu de requêtes séquentielles
 */
export async function fetchProductWithStock() {
    const productApi = new Product({}, false);
    const stockApi = new StockAvailable({}, false);
    const combinationApi = new Combination({}, false);
    const optionValueApi = new ProductOptionValue({}, false);

    const products = await productApi.getAll();

    // OPTIMISATION: Paralléliser les 3 requêtes au lieu de faire ~1500+ requêtes en boucle
    const [allStocks, allCombinations, allOptionValues] = await Promise.all([
        stockApi.getAll(),
        combinationApi.getAll(),
        optionValueApi.getAll()
    ]);

    // OPTIMISATION: Indexer avec Maps pour lookups O(1) au lieu de boucles
    const stockMap = new Map(allStocks.map(s => [Number(s.id), s]));
    const combinationMap = new Map(allCombinations.map(c => [Number(c.id), c]));
    const optionValueMap = new Map(allOptionValues.map(o => [Number(o.id), o]));

    const result = [];

    for (const product of products) {
        const entries = product.associations?.stockAvailables ?? [];
        let totalQuantity = 0;
        const declinations = [];

        for (const entry of entries) {
            const stock = stockMap.get(Number(entry.id));
            if (!stock) continue;

            const quantity = Number(stock.quantity) || 0;
            const combinationId = Number(entry.idProductAttribute);

            if (combinationId === 0) {
                // stock global du produit
                totalQuantity = quantity;
            } else {
                // stock d'une déclinaison
                const combination = combinationMap.get(combinationId);
                if (!combination) continue;

                const nameParts = [];
                for (const optionValueId of combination.optionValueIds || []) {
                    const optionValue = optionValueMap.get(Number(optionValueId));
                    if (optionValue) {
                        const label = Product.pickLang(optionValue.name, 1);
                        if (label) {
                            nameParts.push(label);
                        }
                    }
                }

                declinations.push({
                    stockAvailableId: stock.id,
                    combinationId: combinationId,
                    name: nameParts.join(" - "),
                    quantity: quantity,
                });
            }
        }

        result.push({
            product: product,
            totalQuantity: totalQuantity,
            declinations: declinations,
        });
    }

    return result;
}

/**
 * Filtre une liste de produits par fourchette de prix.
 *
 * Paramètres:
 * - `products` (Array): liste de produits possédant `priceTtc` ou `price`.
 * - `minPrice` (number): valeur minimale (>=0).
 * - `maxPrice` (number): valeur maximale (>=0).
 *
 * Retour: Array — produits filtrés.
 */
export function filterProductsByPrice(products, minPrice = 0, maxPrice = 0) {
    const priceMin = Math.max(0, Number(minPrice) || 0);
    const priceMax = Math.max(0, Number(maxPrice) || 0);

    return products.filter((product) => {
        const price = Number(product.priceTtc ?? product.price) || 0;

        if (priceMin > 0 && price < priceMin) {
            return false;
        }

        if (priceMax > 0 && price > priceMax) {
            return false;
        }

        return true;
    });
}

/**
 * Filtre une liste de produits par catégorie (id ou catégorie par défaut).
 *
 * Paramètres:
 * - `products` (Array): produits avec `idCategoryDefault` ou `associations.categories`.
 * - `categoryId` (string|number): identifiant cible.
 *
 * Retour: Array — produits appartenant à la catégorie.
 */
export function filterProductsByCategory(products, categoryId) {
    const targetId = String(categoryId);
    return products.filter((product) => {
        if (product.idCategoryDefault != null && String(product.idCategoryDefault) === targetId) {
            return true;
        }

        const categories = product.associations?.categories || [];

        for (const category of categories) {
            const id = category?.id ?? category;
            if (String(id) === targetId) {
                return true;
            }
        }
        return false;
    });
}

/**
 * Filtre une liste de produits par nom (recherche insensible à la casse).
 *
 * Paramètres:
 * - `products` (Array): liste de produits.
 * - `name` (string): chaîne recherchée.
 *
 * Retour: Array — produits correspondants.
 */
export function filterProductsByName(products, name = "") {
    return products.filter((product) => {
        const productName = Product.pickLang(product.name);

        if (productName.toLowerCase().includes(name.toLowerCase())) {
            return true;
        }
        return false;
    });
}

/**
 * Filtre combiné des produits par nom, catégorie et fourchette de prix.
 *
 * Paramètres:
 * - `products` (Array): liste de produits.
 * - `minPrice`, `maxPrice`, `categoryId`, `name` — critères de filtrage.
 *
 * Retour: Array — produits filtrés.
 */
export function filterProducts({products, minPrice = 0, maxPrice = 0, categoryId = null, name = ""}) {
    let filtered = Array.isArray(products) ? products : [];

    if (name) {
        filtered = filterProductsByName(filtered, name);
    }

    if (categoryId) {
        filtered = filterProductsByCategory(filtered, categoryId);
    }

    if (Number(minPrice) > 0 || Number(maxPrice) > 0) {
        filtered = filterProductsByPrice(filtered, minPrice, maxPrice);
    }

    return filtered;
}