import React from 'react'
import { TableComponent } from './TableComponent';

export const MapDemo10 = () => {

    let ships = [
        {
            id: 1,
            brand: "Royal Caribbean",
            shipname: "Icon of the Seas",
            type: "Luxury Mega Cruise Ship",
            capacity: "7600 people",
            length: "365m",
            decks: "20 decks",
            highlights: "Largest & most modern mega cruise ship",
            shipPrice: "₹160,000,000,000+ (approx)"
        },
        {
            id: 2,
            brand: "Royal Caribbean",
            shipname: "Wonder of the Seas",
            type: "Luxury Mega Cruise Ship",
            capacity: "6988 people",
            length: "362m",
            decks: "18 decks",
            highlights: "World-class suites, Central Park at sea",
            shipPrice: "₹110,000,000,000+ (approx)"
        },
        {
            id: 3,
            brand: "MSC Cruises",
            shipname: "MSC World Europa",
            type: "Luxury Mega Cruise Ship",
            capacity: "6700 people",
            length: "333m",
            decks: "22 decks",
            highlights: "Ultra modern design + luxury yacht club",
            shipPrice: "₹95,000,000,000+ (approx)"
        },
        {
            id: 4,
            brand: "Disney Cruise Line",
            shipname: "Disney Wish",
            type: "Luxury Family Mega Cruise Ship",
            capacity: "4000 people",
            length: "341m",
            decks: "15 decks",
            highlights: "Disney premium luxury entertainment + suites",
            shipPrice: "₹110,000,000,000+ (approx)"
        },
        {
            id: 5,
            brand: "Norwegian Cruise Line",
            shipname: "Norwegian Prima",
            type: "Luxury Cruise Ship",
            capacity: "3215 people",
            length: "295m",
            decks: "20 decks",
            highlights: "Premium luxury + infinity pools + high-end design",
            shipPrice: "₹80,000,000,000+ (approx)"
        },
        {
            id: 6,
            brand: "Cunard",
            shipname: "Queen Mary 2",
            type: "Luxury Ocean Liner",
            capacity: "2695 people",
            length: "345m",
            decks: "13 decks",
            highlights: "Royal-class luxury transatlantic ocean liner",
            shipPrice: "₹60,000,000,000+ (approx)"
        },
        {
            id: 7,
            brand: "Regent Seven Seas Cruises",
            shipname: "Seven Seas Grandeur",
            type: "Ultra-Luxury All-Suite Cruise Ship",
            capacity: "746 people",
            length: "224m",
            decks: "10 decks",
            highlights: "All-suite, ultra premium interiors, butler luxury",
            shipPrice: "₹58,000,000,000+ (approx)"
        },
        {
            id: 8,
            brand: "The World Residences at Sea",
            shipname: "The World",
            type: "Residential Luxury Cruise Ship",
            capacity: "200 people",
            length: "196m",
            decks: "12 decks",
            highlights: "Billionaire-level residential ship (apartments onboard)",
            shipPrice: "₹40,000,000,000+ (approx)"
        }
    ];

    const columns = [
        { key: "id", label: "Id" },
        { key: "brand", label: "Company" },
        { key: "shipname", label: "Ship Name" },
        { key: "capacity", label: "Capacity" },
        { key: "length", label: "Length" },
        { key: "decks", label: "Decks" },
        { key: "shipPrice", label: "Price" }
    ];

    const rules = {
        capacity: (v) => parseInt(v) < 6000 ? "cell-warning" : "",
        length: (v) => parseInt(v) < 300 ? "cell-danger" : "",
        decks: (v) => parseInt(v) >= 20 ? "cell-success" : ""
    };

    return <TableComponent title="Ships" columns={columns} data={ships} rules={rules} />;
    // return (
    //     <div className='page'>
    //         <h1 className='page-title'>Ships</h1>
    //         <div className="table-wrapper">
    //             <table className='data-table'>
    //                 <thead>
    //                     <tr style={{ backgroundColor: "gray" }}>
    //                         <th>Id</th>
    //                         <th>Company Name</th>
    //                         <th>Ship Name</th>
    //                         <th>Type</th>
    //                         <th>Capacity</th>
    //                         <th>Length</th>
    //                         <th>Decks</th>
    //                         <th>High Lights</th>
    //                         <th>Price (₹)</th>
    //                     </tr>
    //                 </thead>
    //                 <tbody>
    //                     {
    //                         ships.map((ship) => {
    //                             const cap = parseInt(ship.capacity);
    //                             const length = parseInt(ship.length);
    //                             const decks = parseInt(ship.decks);

    //                             return <tr>
    //                                 <td>{ship.id}</td>
    //                                 <td>{ship.brand}</td>
    //                                 <td>{ship.shipname}</td>
    //                                 <td>{ship.type}</td>
    //                                 <td className={`${cap < 6000 ? "cell-warning" : ""}`}>{ship.capacity}</td>
    //                                 <td className={`${length < 300 ? "cell-danger" : ""}`}>{ship.length}</td>
    //                                 <td className={`${decks >= 20 ? "cell-success" : ""}`}>{ship.decks}</td>
    //                                 <td>{ship.highlights}</td>
    //                                 <td>{ship.shipPrice}</td>
    //                             </tr>
    //                         })
    //                     }
    //                 </tbody>
    //             </table>
    //         </div>
    //     </div>
    // )
}
