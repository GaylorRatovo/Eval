import {useNavigate} from "react-router-dom";
import {useEffect, useMemo, useState} from "react";
import Category from "../backend/entities/Category.js";
import Product from "../backend/entities/Product.js";
import {removeStockByCategory} from "../backend/services/RemoveStock.js";

function FORemoveStock() {
    const navigate = useNavigate();
    const [categories,setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState();
    const [quantite, setQuantity] = useState();
    const [tenaNiala, setTenaNiala] = useState(0);
    const [tokonyNiala, setTokonyNiala] = useState(0);

    useEffect(() => {

        const password = "admin123"
        const passwordInput = prompt("Mot de passe admin :");
        if (password !== passwordInput) {
            navigate("/fo/products");
        }

        const loadData = async () => {
            const categoryApi = new Category({}, false);
            const categoryList = await categoryApi.getExcl([1, 2]);
            setCategories(categoryList);
        }
        loadData();

    },[])

    const selectableCategories = useMemo(() => {
        return categories.filter((category) => String(Product.pickLang(category?.name) ?? "").trim() !== "");
    }, [categories]);

    const remove = async () => {
        return await removeStockByCategory(categoryId ,quantite);
    }

    const handleValide = async () => {
        const {tokonyHiala , tenaNiala} = await remove();
        setTokonyNiala(tokonyHiala);
        setTenaNiala(tenaNiala);
        console.log("tokonyNiala: "+tokonyHiala);
        console.log("tenaNiala: "+tenaNiala);
    }


    return (<>
        <div>
            Formulaire :
            <select
                id="filterCategory"
                className="form-select form-select-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
            >
                {selectableCategories.map((category, index) => (
                    <option key={`${category.id}-${index}`} value={category.id}>
                        {Product.pickLang(category.name)}
                    </option>
                ))}
            </select>

            <div className="col-12 col-md-2">
                <label htmlFor="filterMinPrice" className="form-label fw-bold small mb-2">
                    Quantité
                </label>
                <input
                    id="filterMinPrice"
                    type="number"
                    onChange={(e) => setQuantity(e.target.value)}
                    min="0"
                />
            </div>

            <div className="col-12 col-md-2">
                <button
                    className="btn btn-sm btn-outline-secondary w-100"
                    onClick={handleValide}
                >
                    <i className="bx bx-reset me-2"></i>valider
                </button>
            </div>
        </div>



        <div>
            <p>
                Total niala : {tenaNiala}
            </p>
            <p>
                Total tokony niala : {tokonyNiala}
            </p>
        </div>
    </>)
}

export default FORemoveStock;