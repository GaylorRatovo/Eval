import Product from "../entities/Product.js";
import StockAvailable from "../entities/StockAvailable.js";
import Combination from "../entities/Combination.js";
import ProductOptionValue from "../entities/ProductOptionValue.js";

export async function fetchProductWithStock() {
    const productApi = new Product({}, false);
    const stockApi = new StockAvailable({}, false);
    const combinationApi = new Combination({}, false);
    const optionValueApi = new ProductOptionValue({}, false);

    const products = await productApi.getAll();
    const result = [];

    for (const product of products) {
        const entries = product.associations?.stockAvailables ?? [];

        let totalQuantity = 0;
        const declinations = [];

        for (const entry of entries) {
            const stock = await stockApi.getById(entry.id);
            const quantity = Number(stock.quantity) || 0;
            const combinationId = Number(entry.idProductAttribute);

            if (combinationId === 0) {
                // stock global du produit
                totalQuantity = quantity;
            } else {
                // stock d'une déclinaison
                // récupérer le nom de la déclinaison via ses option values
                const combination = await combinationApi.getById(combinationId);
                const nameParts = [];

                for (const optionValueId of combination.optionValueIds) {
                    const optionValue = await optionValueApi.getById(optionValueId);
                    const label = Product.pickLang(optionValue.name, 1);
                    if (label) {
                        nameParts.push(label);
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