import React from 'react'
import { useForm } from 'react-hook-form'
import { data } from 'react-router-dom';
import "../../assets/Form.css"

export const Validation1 = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();

    const validationSchema = {

        nameValidator: {
            required: {
                value: true,
                message: "Please enter the name*",
            },
            min: {
                value: 2,
                message: "Name could be atleast or more than 2 characters**",
            },
            max: {
                value: 30,
                message: "Name could not be more than 20 characters**",
            }
        },
        emailValidator: {
            required: {
                value: true,
                message: "Please enter the email*",
            },
            pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter the valid email**",
            },
            min: {
                value: 6,
                message: "Email is too short for registration***",
            },
            max: {
                value: 30,
                message: "Email is too long for the validaiton***",
            },
        },
        ageValidator: {
            required: {
                value: true,
                message: "Please enter the age*",
            },
            min: {
                value: 8,
                message: "Age should me atleast or above 8years**",
            },
            max: {
                value: 25,
                message: "Age should me atmost or below 25years**",
            }
        },
        genderValidator: {
            required: {
                value: true,
                message: "Please select the gender of the student*"
            }
        },
        courseValidator: {
            required: {
                value: true,
                message: "Please select a course"
            }
        }
    }

    const submitHandler = (data) => {
        alert("Form Submitted...");
        console.log(data);
    }
    return (
        <div className="page">
            <div className="form-card">
                <h1 className="title">Student Registration</h1>
                <form onSubmit={handleSubmit(submitHandler)}>
                    <div className="form-group">
                        <label>Student Name: </label>
                        <input type="text" {...register("name", validationSchema.nameValidator)} />
                        {errors.name?.message}
                    </div>
                    <div className="form-group">
                        <label>Email: </label>
                        <input type="email" {...register("email", validationSchema.emailValidator)} />
                        {errors.email?.message}
                    </div>
                    <div className="form-group">
                        <label>Age: </label>
                        <input type="number" {...register("age", validationSchema.ageValidator)} />
                        {errors.age?.message}
                    </div>
                    <div className="form-group">
                        <label>Gender: </label>
                        <input type="radio" value="Male" {...register("gender", validationSchema.genderValidator)} />
                        <input type="radio" value="Female" {...register("gender", validationSchema.genderValidator)} />
                        {errors.gender?.message}
                    </div>
                    <div className="form-group">
                        <label>Course</label>
                        <select {...register("course", validationSchema.courseValidator)}>
                            <option value="">Select a Course</option>
                            <option value="B.E.">B.E.</option>
                            <option value="B.Arch.">B.Arch.</option>
                            <option value="B.Pharma.">B.Pharma.</option>
                            <option value="B.B.A">B.B.A</option>
                        </select>
                        {errors.course?.message}
                    </div>
                    <input type="submit" className='submit-btn' />
                </form>
            </div>
        </div>
    )
}
