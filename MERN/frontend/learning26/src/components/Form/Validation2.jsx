import React, { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

export const Validation2 = () => {

    const{register,handleSubmit,control,formState:{errors}} = useForm();

    // const pass = watch("pass");
    const pass = useWatch({
        control,
        name: "pass"
    });
    
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
        passValidator: {
            required: {
                value: true,
                message: "Please enter the password"
            },
            min: {
                value: 16,
                message: "password should be atleast of 16 character for registration***",
            },
            patter:{
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
                message: "Password must be 8+ chars and include uppercase, lowercase, number & special character"

            }
        },
        confPassValidator: {
            required: {
                value: true,
                message: "Please enter the password"
            },
            validate:{
                match: value => value === pass || "password doesnot match"
            }
        }

    }

    const submitHandler = (data) => {
        console.log(data);
    }
    return (
        <div className="page">
            <div className="form-card">
                <h1 className="title">Student Registration</h1>
                <form onSubmit={handleSubmit(submitHandler)}>
                    <div className="form-group">
                        <label>User Name: </label>
                        <input type="text" {...register("name", validationSchema.nameValidator)} />
                        {errors.name?.message}
                    </div>
                    <div className="form-group">
                        <label>Email: </label>
                        <input type="email" {...register("email", validationSchema.emailValidator)} />
                        {errors.email?.message}
                    </div>
                    <div className="form-group">
                        <label>Password: </label>
                        <input type="pasword" {...register("pass", validationSchema.passValidator)} />
                        {errors.pass?.message}
                    </div>
                    <div className="form-group">
                        <label>Confirm Password: </label>
                        <input type="pasword" {...register("confpass", validationSchema.confPassValidator)} />
                        {errors.confpass?.message}
                    </div>
                    
                    <input type="submit" className='submit-btn' />
                </form>
            </div>
        </div>
    )
}
