import React from 'react'

export const MapDemo7 = () => {

    let watches = [
        {
            id: 1,
            brand: "Patek Philippe",
            modname: "Nautilus 5711/1A",
            type: "Luxury Sports Watch",
            movement: "Automatic",
            caseSize: "40mm",
            material: "Stainless Steel",
            waterRes: "120m",
            price: "3,00,00,000+"
        },
        {
            id: 2,
            brand: "Audemars Piguet (AP)",
            modname: "Royal Oak 15500ST",
            type: "Luxury Sports Watch",
            movement: "Automatic",
            caseSize: "41mm",
            material: "Stainless Steel",
            waterRes: "50m",
            price: "2,50,00,000+"
        },
        {
            id: 3,
            brand: "Richard Mille",
            modname: "RM 011 Felipe Massa",
            type: "Luxury Sports Chronograph",
            movement: "Automatic",
            caseSize: "50mm",
            material: "Titanium / Carbon (Variant)",
            waterRes: "50m",
            price: "8,00,00,000+"
        },
        {
            id: 4,
            brand: "Rolex",
            modname: "Cosmograph Daytona",
            type: "Luxury Chronograph",
            movement: "Automatic",
            caseSize: "40mm",
            material: "Oystersteel / Gold (Variant)",
            waterRes: "100m",
            price: "1,50,00,000+"
        },
        {
            id: 5,
            brand: "Vacheron Constantin",
            modname: "Overseas 4500V",
            type: "Luxury Sports Watch",
            movement: "Automatic",
            caseSize: "41mm",
            material: "Stainless Steel",
            waterRes: "150m",
            price: "2,00,00,000+"
        },
        {
            id: 6,
            brand: "Cartier",
            modname: "Santos de Cartier",
            type: "Luxury Dress/Sports Watch",
            movement: "Automatic",
            caseSize: "39.8mm",
            material: "Stainless Steel",
            waterRes: "100m",
            price: "8,00,000+"
        },
        {
            id: 7,
            brand: "Omega",
            modname: "Speedmaster Moonwatch Professional",
            type: "Chronograph",
            movement: "Manual (Hand-winding)",
            caseSize: "42mm",
            material: "Stainless Steel",
            waterRes: "50m",
            price: "6,50,000+"
        }
    ];


    return (
        <div className='page'>
            <h1 className='page-title'>Watches</h1>

            <div className="table-wrapper">
                <table className='data-table'>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Brand</th>
                        <th>Model Name</th>
                        <th>Type</th>
                        <th>Movement</th>
                        <th>Case Size</th>
                        <th>Material</th>
                        <th>Water Resistance</th>
                        <th>Price (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        watches.map((watch) => {

                            const m = parseInt(watch.waterRes);
                            const movement = watch.movement;

                            return <tr>
                                <td>{watch.id}</td>
                                <td>{watch.brand}</td>
                                <td>{watch.modname}</td>
                                <td>{watch.type}</td>
                                <td className={`${movement !== "Automatic" ? "cell-danger" : ""}`}>{watch.movement}</td>
                                <td>{watch.caseSize}</td>
                                <td>{watch.material}</td>
                                <td className= {`${ m > 100 ? "cell-success" : "" }`}>{watch.waterRes}</td>
                                <td>{watch.price}</td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
            </div>
        </div>
    )
}
