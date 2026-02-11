import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import "../../assets/Form.css"

export const FormTask2 = () => {
    const { register, handleSubmit } = useForm();
    const [carData, setcarData] = useState({});
    const [isSubmited, setisSubmited] = useState(false);

    const submityHandler = (data) => {
        console.log(data);
        setcarData(data);
        setisSubmited(true);
    }

    return (
        <div className="page">
            <div className="form-card">
                <h1 className="title">Car Registration</h1>

                <form onSubmit={handleSubmit(submityHandler)} className="form">

                    <div className="form-group">
                        <label>Car Model with Company Name: </label>
                        <input type="text" placeholder='Enter the details' {...register("name")} />
                    </div>

                    <div className="form-group">
                        <label>Car Number: </label>
                        <input type="text" {...register("number")} />
                    </div>

                    <div className="form-group">
                        <label>Registration Date</label>
                        <input type="date" {...register("rd")} />
                    </div>

                    <div className="form-group">
                        <label>Type: </label>
                        <div className="radio-group">
                            <label><input type="radio" value="suv" {...register("type")} /> SUV</label>
                            <label><input type="radio" value="hedgeback" {...register("type")} /> Hedge Back</label>
                            <label><input type="radio" value="sedan" {...register("type")} /> Sedan</label>
                            <label><input type="radio" value="sports" {...register("type")} /> Sports</label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Fuel Type</label>
                        <select {...register("fuelType")}>
                            <option value="">Select Fuel</option>
                            <option value="Petrol">Petrol</option>
                            <option value="Diesel">Diesel</option>
                            <option value="CNG">CNG</option>
                            <option value="Electric">Electric</option>
                            <option value="Hybrid">Hybrid</option>
                        </select>
                    </div>


                    <div className="form-group">
                        <label>Transmission</label>
                        <select {...register("transmission")}>
                            <option value="">Select Transmission</option>
                            <option value="Manual">Manual</option>
                            <option value="Automatic">Automatic</option>
                            <option value="AMT">AMT</option>
                            <option value="CVT">CVT</option>
                            <option value="DCT">DCT</option>
                        </select>
                    </div>


                    <button type="submit" className="submit-btn">Submit</button>
                </form>
            </div>

            {isSubmited && (
                <div className="result-card">
                    <h3>Details</h3>
                    <p><b>Name:</b> {carData.name}</p>
                    <p><b>Number:</b> {carData.number}</p>
                    <p><b>Registraion Date:</b> {carData.rd}</p>
                    <p><b>Type:</b> {carData.type}</p>
                    <p><b>Fuel Type:</b> {carData.fuelType}</p>
                    <p><b>Transmission:</b> {carData.transmission}</p>
                </div>
            )}
        </div>

    )
}
