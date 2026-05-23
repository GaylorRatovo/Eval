import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import Product from "../backend/entities/Product.js";

function FOProductList() {
    const [products, setProducts] = useState([]);
    const [, setIsLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState({});
    const [badges, setBadges] = useState({});

    const navigate = useNavigate();

    const handlePreview = (productId) => {
        navigate(`/fo/product/preview/${productId}`);
    }

    useEffect(() => {
        const loadProducts = async () => {
            setIsLoading(true);
            try {
                const product = new Product({}, false);
                const productList = await product.getAll();
                setProducts(productList);

                const nextImageUrls = {};
                const nextBadges = {};
                for (const item of productList) {
                    const images = await item.getImages();
                    nextImageUrls[item.id] = images[0] || "";
                    item.quantity = await item.getQuantity();
                    nextBadges[item.id] = await item.getBadge();
                }
                setImageUrls(nextImageUrls);
                setBadges(nextBadges);
                setProducts([...productList]);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching products:", error);
                setIsLoading(false);
            }
        };

        loadProducts();
    }, []);

    return (
        <div>
            <h1>Product List</h1>
            <table>
                <thead>
                <tr>
                    <th>image</th>
                    <th>Name</th>
                    <th>Reference</th>
                    <th>Stock total</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {products.map((product) => (
                    <tr key={product.id}>
                        <td>
                            {imageUrls[product.id] ? (
                                <img
                                    src={imageUrls[product.id]}
                                    alt={imageUrls[product.id]}
                                    width="80"
                                />
                            ) : (
                                "no image"
                            )}
                        </td>
                        <td>
                            {product.name[0].value}
                            {badges[product.id] ? (
                                <span style={{ color: badges[product.id].color }}>
                                    {` (${badges[product.id].label})`}
                                </span>
                            ) : null}
                        </td>
                        <td>{product.reference}</td>
                        <td>{product.quantity}</td>
                        <td>
                            <button onClick={() => handlePreview(product.id)}>Appercu</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default FOProductList;