import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import CartService from "../backend/services/CartService.js"
import Cart from "../backend/entities/Cart.js";
import Product from "../backend/entities/Product.js";
import OderService from "../backend/services/OderService.js";
import FOCartRow from "../components/FOCartRow.jsx";
import useLocalStorage from "../hooks/useLocalStorage.jsx";

function FOCart() { 
    const [cart, setCart] = useState(null);
    const [rowDetails, setRowDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user] = useLocalStorage("user", null);
    const [isGuest] = useLocalStorage("isGuest", false);
    const [totals, setTotals] = useState({ totalHt: 0, totalTtc: 0 });
    const navigate = useNavigate();

    const formatPrice = (value) => {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return "-";
        }
        return number.toFixed(2);
    };

    useEffect(() => {
        const cartLike = {
            cartRows: rowDetails.map((row) => {
                const selectedId = Number(row?.selectedOptionId || 0);
                const selected = (row?.options || []).find(
                    (value) => Number(value.id) === selectedId,
                );
                return {
                    quantity: row?.quantity ?? 0,
                    baseTtcPrice: row?.baseTtcPrice ?? 0,
                    taxRate: row?.taxRate ?? 0,
                    selectedOptionImpact: selected ? selected.priceImpact : 0,
                };
            }),
        };

        setTotals(CartService.getCartTotals(cartLike));
    }, [rowDetails]);

    const getRowKey = (row, index) => {
        return `${row.productId ?? "row"}-${index}`;
    };

    const persistCartRows = async (nextCartRows) => {
        if (!cart) {
            return;
        }

        cart.cartRows = nextCartRows ?? [];
        setCart(cart);

        try {
            const updated = await cart.update();
            setCart(updated);
        } catch (error) {
            console.error("Error updating cart: ", error);
        }
    };

    const handleOptionChange = (rowIndex, nextId, cartRowIndex) => {
        const currentProductId = rowDetails[rowIndex]?.productId;

        setRowDetails((prev) => {
            const nextRows = [];
            for (const [idx, item] of prev.entries()) {
                if (idx === rowIndex) {
                    nextRows.push({ ...item, selectedOptionId: nextId });
                    continue;
                }
                nextRows.push(item);
            }
            return nextRows;
        });

        const nextCartRows = [];
        const currentRows = cart?.cartRows ?? [];
        for (const [idx, row] of currentRows.entries()) {
            if (idx === cartRowIndex) {
                nextCartRows.push({
                    ...row,
                    productAttributeId: nextId,
                    addressDeliveryId: row?.addressDeliveryId ?? cart?.addressDeliveryId ?? 0,
                    customizationId: row?.customizationId ?? 0,
                });
                continue;
            }
            nextCartRows.push(row);
        }
        persistCartRows(nextCartRows);

        if (currentProductId) {
            CartService.getStockForProductAttribute(currentProductId, nextId)
                .then((stockQuantity) => {
                    setRowDetails((prev) => {
                        const nextRows = [];
                        for (const [idx, item] of prev.entries()) {
                            if (idx === rowIndex) {
                                nextRows.push({ ...item, stockQuantity });
                                continue;
                            }
                            nextRows.push(item);
                        }
                        return nextRows;
                    });
                })
                .catch((error) => {
                    console.error("Error fetching stock: ", error);
                });
        }
    };

    const handleQuantityChange = (rowIndex, nextQty, cartRowIndex) => {
        const stock = Number(rowDetails[rowIndex]?.stockQuantity ?? 0);
        const rawQty = Math.max(1, Number(nextQty) || 1);
        const safeQty = stock > 0 ? Math.min(rawQty, stock) : rawQty;

        setRowDetails((prev) => {
            const nextRows = [];
            for (const [idx, item] of prev.entries()) {
                if (idx === rowIndex) {
                    nextRows.push({ ...item, quantity: safeQty });
                    continue;
                }
                nextRows.push(item);
            }
            return nextRows;
        });

        const nextCartRows = [];
        const currentRows = cart?.cartRows ?? [];
        for (const [idx, row] of currentRows.entries()) {
            if (idx === cartRowIndex) {
                nextCartRows.push({
                    ...row,
                    quantity: safeQty,
                    addressDeliveryId: row?.addressDeliveryId ?? cart?.addressDeliveryId ?? 0,
                    customizationId: row?.customizationId ?? 0,
                });
                continue;
            }
            nextCartRows.push(row);
        }
        persistCartRows(nextCartRows);
    };

    const handleDeleteRow = async (rowIndex) => {
        if (!cart) {
            return;
        }

        setRowDetails((prev) => {
            const nextRows = [...prev];
            nextRows.splice(rowIndex, 1);
            return nextRows;
        });

        try {
            const updated = await CartService.deleteItems(cart, rowIndex);
            if (!updated) {
                setCart(null);
                return;
            }
            setCart(updated);
        } catch (error) {
            console.error("Error deleting cart row: ", error);
        }
    };

    const handleCheckout = () => {
        if (isGuest) {
            navigate("/fo/checkout");
            return;
        }
        const dateNow = new Date();
        OderService.createOrderFromCart(cart, user.id, dateNow, 0).then((res) => {
            alert("Commande créée avec succès !");
            console.log("Order creation response: ", res);
        }).catch((error) => {
            console.error("Error creating order: ", error);
            alert("Erreur lors de la création de la commande.");
        });
    }

    useEffect(() => {
        const loadDatas = async () => {
            try {
                setIsLoading(true);
                setRowDetails([]);

                if (!user?.id) {
                    setCart(null);
                    return;
                }

                const customerCart = await CartService.getLastCartByCustomer(user.id);
                if (!customerCart) {
                    setCart(null);
                    return;
                }

                const isActive = await CartService.isCartActive(customerCart.id);
                if (!isActive) {
                    setCart(null);
                    return;
                }

                const rows = [];
                const cartRows = customerCart.cartRows ?? [];
                for (const [rowIndex, row] of cartRows.entries()) {
                    const item = await CartService.getCartRowDetails(row);
                    if (!item) {
                        continue;
                    }

                    const baseTtcPrice = await item.product.getTtcPrice();
                    const taxRate = await item.product.getTax();
                    const declinaisons = await item.product.getDeclinaisons();
                    const values = declinaisons?.values || [];
                    const options = values.map((value) => ({
                        id: value?.id ?? null,
                        label: value?.label ?? "",
                        priceImpact: value?.priceImpact ?? 0,
                    }));

                    rows.push({
                        productId: item.product?.id ?? null,
                        productName: Product.pickLang(item.product?.name),
                        productReference: item.product?.reference ?? "",
                        productImageURL: item.productImageURL,
                        quantity: item.quantity,
                        baseTtcPrice,
                        taxRate,
                        options,
                        selectedOptionId: Number(row.productAttributeId || 0),
                        stockQuantity: item.stockQuantity,
                        cartRowIndex: rowIndex,
                    });
                }

                setCart(customerCart);
                setRowDetails(rows);
            } catch (error) {
                console.error("Error loading cart: ", error);
                setCart(null);
                setRowDetails([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadDatas();
    }, [user?.id]);

    if (isLoading) {
        return <p>chargement du panier...</p>;
    }

    if (!cart) {
        return <p>pas de panier</p>;
    }

    return <>
        <h1>Panier : {cart.id}</h1>
        {rowDetails.length === 0 ? (
            <p>panier vide</p>
        ) : (
            <>
                <table>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Reference</th>
                            <th>Image</th>
                            <th>Declinaison</th>
                            <th>Stock</th>
                            <th>Prix TTC</th>
                            <th>Quantite</th>
                            <th>Total ligne</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rowDetails.map((row, index) => (
                            <FOCartRow
                                key={getRowKey(row, index)}
                                row={row}
                                index={index}
                                onOptionChange={handleOptionChange}
                                onQuantityChange={handleQuantityChange}
                                onDelete={handleDeleteRow}
                                formatPrice={formatPrice}
                            />
                        ))}
                    </tbody>
                </table>
                <p>Total HT : {formatPrice(totals.totalHt)}</p>
                <p>Total TTC : {formatPrice(totals.totalTtc)}</p>
                <button onClick={handleCheckout}>Commander</button>
            </>
        )}
    </>
}
export default FOCart;