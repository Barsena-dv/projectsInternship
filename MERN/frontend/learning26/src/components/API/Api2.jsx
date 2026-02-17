import axios from 'axios'
import React, { useState } from 'react'
import { TableComponent } from '../TableComponent';

export const Api2 = () => {

    const [data, setdata] = useState([]);

    const getProducts = async ()=>{
        const response = await axios.get("https://dummyjson.com/products");
        console.log(response.data);
        console.log(response.data.products);
        setdata(response.data.products)
    }

    const columns = [
        { key:"id", label:"ID" },
        { key:"availabilityStatus", label:"Status" },
        { key:"brand", label:"Brand" },
        { key:"category", label:"Category" },
        { key:"returnPolicy", label:"Policy" },
        { key:"stock", label:"Stock" },
        { key:"price", label:"Price (₹)" }
    ];
    return (
        <div>
            <div style={{textAlign:"center"}}>
                <h1>Api2</h1>
            <button onClick={()=>{getProducts()}}>GET</button>
            </div>
        <TableComponent title="Products" columns={columns} data={data} />
        </div>
        
    )
}
