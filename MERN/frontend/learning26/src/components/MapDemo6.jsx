import React from 'react'
import "../assets/table.css"

export const MapDemo6 = () => {

    let cars = [
        {
            id: 1,
            brand: "Buggati",
            modname: "La voiture noire",
            power: "1500 HP",
            tspeed: "420km/h(Expected)",
            type: "Luxury Hypercar",
            price: "100,00,00,000+"
        },
        {
            id: 2,
            brand: "Toyota",
            modname: "GR Supra (A90/A91)",
            power: "382 HP",
            tspeed: "250km/h (Electronically Limited)",
            type: "Sports Car(Coupe)",
            price: "1,00,00,000+"
        },
        {
            id: 3,
            brand: "Pagani Automobili",
            modname: "Huayra",
            power: "730 HP",
            tspeed: "370km/h",
            type: "Hypercar(Coupe/Roadster depending upon variant)",
            price: "20,00,00,000+"
        },
        {
            id: 4,
            brand: "Koenigsegg",
            modname: "Agera",
            power: "960 HP",
            tspeed: "447km/h",
            type: "Hypercar",
            price: "45,00,00,000+"
        },
        {
            id: 5,
            brand: "Hennessy Performance Engineering",
            modname: "Venom GT",
            power: "1244 HP",
            tspeed: "435.31km/h",
            type: "Hypercar",
            price: "11,00,75,280+"
        },
        {
            id: 6,
            brand: "Rolls-Royce Motor Cars",
            modname: "Droptail - La Rose Noire",
            power: "593 HP",
            tspeed: "250km/h",
            type: "Ultra-luxury Coachbuilt Roadster",
            price: "250,00,00,000+"
        }
    ]

    return (
        <div className="page">
            <h1 className="page-title">Cars</h1>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Brand</th>
                            <th>Model Name</th>
                            <th>Type</th>
                            <th>Power</th>
                            <th>Top Speed</th>
                            <th>Price (₹)</th>
                        </tr>
                    </thead>

                    <tbody>
                        {cars.map((car) => {
                            const hp = parseInt(car.power);
                            const speed = parseInt(car.tspeed);

                            return (
                                <tr key={car.id}>
                                    <td>{car.id}</td>
                                    <td>{car.brand}</td>
                                    <td>{car.modname}</td>
                                    <td>{car.type}</td>

                                    <td className={`${hp < 600 ? "cell-success" : ""}`}>
                                        {car.power}
                                    </td>

                                    <td className={speed > 400 && "cell-danger"}>
                                        {car.tspeed}
                                    </td>

                                    <td>{car.price}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
