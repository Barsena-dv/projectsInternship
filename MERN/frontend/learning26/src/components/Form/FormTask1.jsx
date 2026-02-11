import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import "../../assets/Form.css"

export const FormTask1 = () => {

    const {register,handleSubmit} = useForm();
    const [userData, setuserData] = useState({});
    const [isSubmited, setisSubmited] = useState(false);

    const submityHandler = (data) => {
        console.log(data);
        setuserData(data);
        setisSubmited(true);
    }

    return (
        <div className="page">
            <div className="form-card">
                <h1 className="title">Student Registration</h1>

                <form onSubmit={handleSubmit(submityHandler)} className="form">

                    <div className="form-group">
                        <label>Student Name</label>
                        <input type="text" placeholder='Enter Name' {...register("name")} />
                    </div>

                    <div className="form-group">
                        <label>Standard</label>
                        <input type="number" {...register("standard")}/>
                    </div>

                    <div className="form-group">
                        <label>Date of Birth</label>
                        <input type="date" {...register("dob")} />
                    </div>

                    <div className="form-group">
                        <label>Gender</label>
                        <div className="radio-group">
                            <label><input type="radio" value="male" {...register("gender")} /> Male</label>
                            <label><input type="radio" value="female" {...register("gender")} /> Female</label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Course</label>
                        <select {...register("course")}>
                            <option value="B.E.">B.E.</option>
                            <option value="B.Arch.">B.Arch.</option>
                            <option value="B.Pharma.">B.Pharma.</option>
                            <option value="B.B.A">B.B.A</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Department</label>
                        <select {...register("dept")}>
                            <option value="IT">Information Technology</option>
                            <option value="CE">Computer Engineering</option>
                            <option value="ADS">Architecture Design & Studio</option>
                            <option value="pharmaceutics">Pharmaceutics</option>
                            <option value="marketing">Marketing</option>
                            <option value="finance">Finance</option>
                        </select>
                    </div>

                    <button type="submit" className="submit-btn">Submit</button>
                </form>
            </div>

            {isSubmited && (
                <div className="result-card">
                    <h3>Details</h3>
                    <p><b>Name:</b> {userData.name}</p>
                    <p><b>Standard:</b> {userData.standard}</p>
                    <p><b>DOB:</b> {userData.dob}</p>
                    <p><b>Gender:</b> {userData.gender}</p>
                    <p><b>Course:</b> {userData.course}</p>
                    <p><b>Department:</b> {userData.dept}</p>
                </div>
            )}
        </div>
    )
}
