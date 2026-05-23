import BOStockUpdate from "../components/BOStockUpdate.jsx";
import BOStockEvolution from "../components/BOStockEvolution.jsx";
import {useState} from "react";

function BOStock() {
    // combination: productId (combination[0]) + productAttributeId (combination[0])
    const [combination, setCombination] = useState([])

    return <div>
        <section>
            <BOStockUpdate setCombination={setCombination}/>
        </section>
        <section>
            <BOStockEvolution combination={combination}/>
        </section>
    </div>
}

export default BOStock;
