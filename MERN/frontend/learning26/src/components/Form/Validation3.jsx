import { useForm } from 'react-hook-form';

export const Validation3 = () => {
    const{register,handleSubmit,watch,formState:{errors}}=useForm({mode:"onChange"});
    
    const password = watch("password","");

    const validationSchema = {
        nameValidator:{
            required:{
                value: true,
                message: "Name is required",
            },
            minLength:{
                value: 2,
                message: "Name is too short",
            },
            maxLength:{
                value: 30,
                message: "Name is too long",
            },
        },
        ageValidator:{
            required:{
                value: true,
                message: "age is required",
            },
            min:{
                value: 15,
                message: "You are very young to be registered",
            },
            max:{
                value: 60,
                message: "You are very old to be registered",
            },
        },
        contactValidator:{
            required:{
                value: true,
                message: "Contact Number is required",
            },
            pattern:{
                value:/^[6-9]{1}[0-9]{9}$/,
                message: "Contact Number is not Valid"
            }
        },
        passwordValidator:{
            required:{
                value: true,
                message: "Password is required",
            },
            pattern:{
                value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])\S{8,30}$/,
                message: "password is not valid"
            }
        },
        confirmPasswordValidator:{
            required:{
                value: true,
                message: "Confirm Password is required",
            },
            validate:(confirmPassword)=>{
                return confirmPassword === password || "Confirm Password is not matched"
            }
        },

    }

    const checks = {
        lengthMin : password.length >= 8,
        lengthMax : password.length <= 30,
        uppercase : /[A-Z]/.test(password),
        number : /\d/.test(password),
        special : /[^A-Za-z\d]/.test(password),
        noSpace : /^\S*$/.test(password),
    }
    const submitHandler = (data)=>{
        console.log(data)
    }
    
    return (

        <div>
            <div>
                <h1></h1>
                <form onSubmit={handleSubmit(submitHandler)}>
                    <div>
                        <label>Name:</label>
                        <input type="text" {...register("name",validationSchema.nameValidator)} />
                        {errors.name?.message}
                    </div>
                    <div>
                        <label>Age:</label>
                        <input type="number" {...register("age",validationSchema.ageValidator)} />
                        {errors.age?.message}
                    </div>
                    <div>
                        <label>Contact Number:</label>
                        <input type="text" {...register("contact",validationSchema.contactValidator)} />
                        {errors.contact?.message}
                    </div>
                    <div>
                        <label>Password:</label>
                        <input type="password" {...register("password",validationSchema.passwordValidator)} />
                        <p className={checks.uppercase ? "success":"danger"}>Password must consist atleat one Capital</p>
                        <p className={checks.number ? "success":"danger"}>Password must consist atleat one Number</p>
                        <p className={checks.special ? "success":"danger"}>Password must consist atleat one Special Charater</p>
                        <p className={checks.lengthMin ? "success":"danger"}>Password must consist atleat have 8 characters</p>
                        <p className={checks.lengthMax ? "success":"danger"}>Password must consist atmost have 30 characters</p>
                        <p className={checks.noSpace ? "success":"danger"}>Password must not have any spaces</p>
                        {errors.password?.message}
                    </div>
                    <input type="submit" />
                </form>
            </div>
        </div>
    )
}
