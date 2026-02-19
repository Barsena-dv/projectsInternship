import axios from 'axios'
import React from 'react'
import { useForm } from 'react-hook-form'
import "../../assets/Form.css"

export const Api4 = () => {
    const{register,handleSubmit,formState:{errors}} = useForm();
        //post(url,obj)

    const validation = {
        name:{
            required:{
                value:true,
                message:"Name is required",
            },
            minLength:{
                value:2,
                message:"Name is too short",
            },
            maxLength:{
                value:20,
                message:"Name is too long",
            }
        },
        email:{
            required:{
                value:true,
                message:"email is repuired",
            },
            pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter the valid email**",
            },
        },
        password:{
            required:{
                value:true,
                message:"password is repuired",
            },
            pattern:{
                value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])\S{8,30}$/,
                message: "password is not valid"
            },
        },
        age:{
            required:{
                value:true,
                message:"Age is required",
            },
            min:{
                value:15,
                message:"Age is too young",
            },
            max:{
                value:60,
                message:"Age is too old",
            }
        }
    }
    const submitHandler = async(data)=>{
        try {
            const res = await axios.post("https://node5.onrender.com/user/user/", data)
            console.log(res)
            console.log(res.data)
        } catch (err) {
            console.log(err)
            alert("error while adding user")
        }
    };
    return (
        <div className="page">
            <div className="form-card">
                <h1 className="title">Add the Details</h1>
            <form onSubmit={handleSubmit(submitHandler)}>

                    <div className="form-group">
                        <label>Name</label>
                        <input type="text" placeholder="Enter your Name" autoComplete="name"
                            {...register("name", validation.name)} />
                        {errors.name && (<p className="danger">{errors.name.message}</p>)}
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" placeholder="Enter your email" autoComplete="email"
                            {...register("email", validation.email)} />
                        {errors.email && (<p className="danger">{errors.email.message}</p>)}
                    </div>

                    <div className="form-group">
                        <label>Age</label>
                        <input type="number" placeholder="Enter your age" {...register("age", validation.age)} />
                        {errors.age && (<p className="danger">{errors.age.message}</p>)}
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" autoComplete="new-password"
                            placeholder="Enter password" {...register("password", validation.password)} />
                        {errors.password && (<p className="danger">{errors.password.message}</p>)}
                    </div>

                    <div className="form-group">
                        <label style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                            <input type="checkbox" {...register("isActive")} defaultChecked={false} />Is Active
                        </label>
                    </div>
                        <input type="submit" className="submit-btn" />
                


            </form>
            </div>



        </div>
    )
}
