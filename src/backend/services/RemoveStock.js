import Product from "../entities/Product.js";
import StockAvailable from "../entities/StockAvailable.js";
import StockMvt from "../entities/StockMvt.js";
import {formatDateTime} from "../utils/utils.js";

export async function removeStockByCategory(categoryId , quantityRemove) {
    const products = await new Product({} , false).getAll();
    const productsFilter = products.filter(product => String(product.idCategoryDefault) === String(categoryId));

    let tokonyHiala = 0;
    let tenaNiala = 0;

    console.log("1");

    const stockAPI = new StockAvailable({},false)

    for(const product of productsFilter) {
        const productStocks = product.associations?.stockAvailables ?? [];
        console.log("2");
        console.log("product"+product.id);

        const haveDeclinaison = productStocks.length > 1;

        for(const productStock of productStocks) {
            const stock = await stockAPI.getById(productStock.id);
            console.log("3");
            const actual = Math.max(Number(stock.quantity),0)

            console.log("q:"+quantityRemove)
            console.log("r:"+actual);

            const toRemove = Math.min(actual , Number(quantityRemove));

            console.log("toRemove:"+toRemove);


            if(haveDeclinaison && productStock.idProductAttribute === 0) continue
            else {
                const movement = StockMvt.fromData({
                    idStock: productStock.id,
                    idProduct: product.id,
                    idProductAttribute: productStock.idProductAttribute,
                    physicalQuantity: toRemove,
                    sign: -1,
                    idStockMvtReason: 2,
                    idEmployee: 1,
                    priceTe: 0,
                    dateAdd: formatDateTime(new Date()),
                })
                await movement.save()
                const stockEntity = StockAvailable.fromData(stock)
                stockEntity.quantity = Number(actual ?? 0) - toRemove;
                await stockEntity.update()
            }

            tokonyHiala = tokonyHiala + Number(quantityRemove);
            tenaNiala = tenaNiala + Math.min(Number(stock.quantity) , Number(quantityRemove));
        }
    }

    console.log("4");
    console.log("tokony hiala :"+tokonyHiala);
    console.log("tena niala :"+tenaNiala);
    return {tokonyHiala , tenaNiala}
}