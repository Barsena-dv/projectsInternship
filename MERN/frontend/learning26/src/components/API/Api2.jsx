import axios from 'axios';
import { useState } from 'react';
import "../../assets/table.css";
import { TableComponent } from '../TableComponent';

export const Api2 = () => {

    const [data, setdata] = useState([]);

    const getProducts = async () => {
        const response = await axios.get("https://dummyjson.com/products");
        console.log(response.data);
        console.log(response.data.products);
        setdata(response.data.products)
    }

    const columns = [
        { key: "id", label: "ID" },
        { key: "availabilityStatus", label: "Status" },
        { key: "brand", label: "Brand" },
        { key: "category", label: "Category" },
        { key: "returnPolicy", label: "Policy" },
        { key: "stock", label: "Stock" },
        { key: "price", label: "Price (₹)" }
    ];

    return (
        <div>
            <div className="api-page-header">
                <h1>Products API</h1>
                <p>Fetch product data from the DummyJSON API</p>
                <button className="btn-fetch" onClick={() => { getProducts() }}>GET Products</button>
            </div>
            <TableComponent title="Products" columns={columns} data={data} />
        </div>
    )
}
