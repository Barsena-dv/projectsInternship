import React from 'react'
import { TableComponent } from './TableComponent';

export const MapDemo8 = () => {

    let bikes = [
        {
            id: 1,
            brand: "Triumph",
            modname: "Rocket 3 R",
            engine: "2458cc Inline-3",
            power: "167 HP",
            torque: "221 Nm",
            tspeed: "225+ km/h (Approx)",
            type: "Power Cruiser",
            price: "22,00,000+"
        },
        {
            id: 2,
            brand: "Indian",
            modname: "Indian Scout Bobber",
            engine: "1133cc V-Twin",
            power: "100 HP (Approx)",
            torque: "97 Nm",
            tspeed: "190+ km/h (Approx)",
            type: "Cruiser",
            price: "17,00,000+"
        },
        {
            id: 3,
            brand: "Harley-Davidson",
            modname: "Harley-Davidson Fat Boy 114",
            engine: "1868cc V-Twin (Milwaukee-Eight 114)",
            power: "94 HP (Approx)",
            torque: "155 Nm",
            tspeed: "180+ km/h (Approx)",
            type: "Cruiser",
            price: "25,00,000+"
        },
        {
            id: 4,
            brand: "Yamaha",
            modname: "YZF-R1",
            engine: "998cc Inline-4",
            power: "200 HP",
            torque: "113 Nm",
            tspeed: "299 km/h (Approx)",
            type: "Superbike",
            price: "20,00,000+"
        },
        {
            id: 5,
            brand: "BMW",
            modname: "BMW S 1000 RR",
            engine: "999cc Inline-4",
            power: "210 HP",
            torque: "113 Nm",
            tspeed: "303 km/h (Approx)",
            type: "Superbike",
            price: "21,00,000+"
        },
        {
            id: 6,
            brand: "Suzuki",
            modname: "Hayabusa",
            engine: "1340cc Inline-4",
            power: "190 HP",
            torque: "150 Nm",
            tspeed: "299 km/h (Limited)",
            type: "Hyper Sport / Sport Tourer",
            price: "17,00,000+"
        },
        {
            id: 7,
            brand: "Kawasaki",
            modname: "Ninja H2",
            engine: "998cc Supercharged Inline-4",
            power: "231 HP",
            torque: "141 Nm",
            tspeed: "350+ km/h (Approx)",
            type: "Hyperbike",
            price: "80,00,000+"
        }
    ];

    const columns = [
        { key: "id", label: "Id" },
        { key: "brand", label: "Brand" },
        { key: "modname", label: "Model" },
        { key: "type", label: "Type" },
        { key: "power", label: "Power" },
        { key: "tspeed", label: "Top Speed" },
        { key: "price", label: "Price" }
    ];

    const rules = {
        power: (v) => parseInt(v) < 200 ? "cell-success" : "",
        tspeed: (v) => parseInt(v) > 300 ? "cell-danger" : ""
    };

    return <TableComponent title="Bikes" columns={columns} data={bikes} rules={rules} />;
    // return (
    //     <div className='page'>
    //         <h1 className='page-title'>Bikes</h1>

    //         <div className="table-wrapper">
    //             <table className='data-table'>
    //                 <thead>
    //                     <tr style={{ backgroundColor: "gray" }}>
    //                         <th>Id</th>
    //                         <th>Brand</th>
    //                         <th>Model Name</th>
    //                         <th>Type</th>
    //                         <th>Engine</th>
    //                         <th>Power</th>
    //                         <th>Torque</th>
    //                         <th>Top Speed</th>
    //                         <th>Price (₹)</th>
    //                     </tr>
    //                 </thead>
    //                 <tbody>
    //                     {
    //                         bikes.map((bike) => {

    //                             const power = parseInt(bike.power);
    //                             const speed = parseInt(bike.tspeed);

    //                             return <tr>
    //                                 <td>{bike.id}</td>
    //                                 <td>{bike.brand}</td>
    //                                 <td>{bike.modname}</td>
    //                                 <td>{bike.type}</td>
    //                                 <td>{bike.engine}</td>
    //                                 <td className= {`${power < 200 ? "cell-success" : ""}`}>{bike.power}</td>
    //                                 <td>{bike.torque}</td>
    //                                 <td className= {`${speed > 300 ? "cell-danger" : ""}`}>{bike.tspeed}</td>
    //                                 <td>{bike.price}</td>
    //                             </tr>
    //                         })
    //                     }
    //                 </tbody>
    //             </table>
    //         </div>
    //     </div>
    // )
}
