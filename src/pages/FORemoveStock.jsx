import {useNavigate} from "react-router-dom";
import {useEffect, useMemo, useRef, useState} from "react";
import Category from "../backend/entities/Category.js";
import Product from "../backend/entities/Product.js";
import {addStockByCategory, removeStockByCategory} from "../backend/services/RemoveStock.js";

function FORemoveStock() {
    const navigate = useNavigate();
    const [categories,setCategories] = useState([]);
    const [category1Id, setCategory1Id] = useState();
    const [category2Id, setCategory2Id] = useState();
    const [quantite1, setQuantity1] = useState(0);
    const [quantite2, setQuantity2] = useState(0);
    const [limit, setLimit] = useState(0);
    const [tenaNiala, setTenaNiala] = useState(0);
    const [tokonyNiala, setTokonyNiala] = useState(0);
    const [tableauNiala, setTableauNiala] = useState([]);

    const [tenaNiampy, setTenaNiampy] = useState(0);
    const [tokonyNiampy, setTokonyNiampy] = useState(0);

    const [category1, setCategory1] = useState(null);
    const [category2, setCategory2] = useState(null);

    const elementRef = useRef(null);
    const [mitotra,setMipotra] =useState(false);

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

    const handleValide = async () => {
        const {tokonyHiala , tenaNiala ,tableauNiala} = await removeStockByCategory(category1Id,quantite1);
        const {tokonyNiampy , tenaNiampy} = await addStockByCategory(category2Id,quantite2,limit);
        setTokonyNiala(tokonyHiala);
        setTenaNiala(tenaNiala);
        setTableauNiala(tableauNiala);
        setTokonyNiampy(tokonyNiampy);
        setTenaNiampy(tenaNiampy)
        console.log("tokonyNiala: "+tokonyHiala);
        console.log("tenaNiala: "+tenaNiala);
        console.log("tableau Niala: "+tableauNiala);
        console.log("tokonyNiampy :"+tokonyNiampy);
        console.log("tenaNiampy :"+tenaNiampy);
    }

    const handleChange1 = (e) =>
    {
        setCategory1Id(e.target.value)
        //console.log(String(e.target.value))
        let c1 = null;
        for (const ca of categories){
            //console.log("ca avant:"+ca.id);
            if (ca.id == e.target.value){
                c1 = ca;
                //console.log("ca :", ca.id);
            }
        }
        console.log("c1 :"+ c1.name);
        setCategory1(c1.name);
    }

    const handleChange2 = (e) =>
    {
        setCategory2Id(e.target.value)
        let c2 = null;
        for (const ca of categories){
            if (ca.id == e.target.value){
                c2 = ca;
            }
        }
        console.log("c2 :"+c2.name);
        setCategory2(c2.name);
    }

    const handleElementRef = () => {
        if(mitotra){
            setMipotra(false);
            elementRef.current.style.display = "none";
        }
        else{
            elementRef.current.style.display = "block";
            setMipotra(true);
        }
    }

    return (<>
        <div>
            Formulaire retirer:
            Categorie a retirer
            <select
                id="category1"
                className="form-select form-select-sm"
                value={category1Id}
                onChange={handleChange1}
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
                    onChange={(e) => setQuantity1(e.target.value)}
                    min="0"
                />
            </div>

            Categorie a ajouter
            <select
                id="category2"
                className="form-select form-select-sm"
                value={category2Id}
                onChange={handleChange2}
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
                    onChange={(e) => setQuantity2(e.target.value)}
                    min="0"
                />
            </div>

            <div className="col-12 col-md-2">
                <label htmlFor="filterMinPrice" className="form-label fw-bold small mb-2">
                    Limite
                </label>
                <input
                    id="filterMinPrice"
                    type="number"
                    onChange={(e) => setLimit(e.target.value)}
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

            <p>Reduire : {category1}</p>
            <p onClick={handleElementRef} style={{backgroundColor: "yellow"}} >
                Total niala : {tenaNiala}
            </p>
            <div ref={elementRef} style={{display: "none"}}>
                <p>Tableau any niala</p>
                <br/>
                <table style={{border: "solid black 1px"}}>
                    <thead>
                    <tr>
                        <th style={{border: "solid black 1px"}}>
                            Produit
                        </th>
                        <th style={{border: "solid black 1px"}}>
                            IdProductAttribute
                        </th>
                        <th style={{border: "solid black 1px"}}>
                            Quantite retire
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {tableauNiala.map((item, index) => (
                        <tr key={`${item.product.id}-${item.product.idStock}-${index}`}>
                            <td style={{border: "solid black 1px"}}>{Product.pickLang(item.product.name)}</td>
                            <td style={{border: "solid black 1px"}}>{item.idProductAttribute}</td>
                            <td style={{border: "solid black 1px"}}>{item.niala}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

            </div>
            <br/>
            <p>
                Total tokony niala : {tokonyNiala}
            </p>

            <p>Ajouter : {category2}</p>
            <p>
                Total niampy : {tenaNiampy}
            </p>
            <p>
                Total tokony niampy : {tokonyNiampy}
            </p>
        </div>
    </>)
}

export default FORemoveStock;