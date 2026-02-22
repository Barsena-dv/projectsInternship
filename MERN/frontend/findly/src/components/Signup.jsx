import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

export const Signup = () => {
    const [loading, setLoading] = useState(false);
    
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({mode:"all"});
    
    const password = watch("password");

    const validation = {
        name : {
            required:{
                value:true,
                message:"Full Name is Required",
            },
            minLength:{
                value: 2,
                message:"Minnimum 2 characters are required"
            }
        },
        email:{
            required:{
                value:true,
                message:"Email is required",
            },
            pattern:{
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message:"Invalid Email",
            }
        },
        phone:{
            required:{
                value: true,
                message:"Number is required",
            },
            pattern:{
                value:/^[6-9]{1}[0-9]{9}$/,
                message:"Invalid Number"
            },
        },
        accountType:{
            required:{
                value: true,
                message: "Select account type",
            }
        },
        password:{
            required:{
                value: true,
                message: "Please set passaword",
            },
            pattern:{
                value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])\S{8,30}$/,
                message: "Password should contain a Capital letter, a special character, a number should be of minimum 8 Characters of length",
            }
        },
        confirmPassword:{
            required:{
                value: true,
                message: "Please confirm your password",
            },
            validate:(confirmPassword)=>{
                return confirmPassword === password || "Confirm Password is not matched"
            },
        },
        agreement:{
            required:{
                value: true,
                message: "Please agree to the terms and conditions for creating the account"
            }
        }
    }


    const onSubmit = (data) => {
        setLoading(true);
        console.log(data);
        setTimeout(() => setLoading(false), 1200);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6 m-4">

            <div className="w-full max-w-5xl bg-white rounded-xl shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-2">

                {/* LEFT PANEL */}
                <div className="hidden md:flex bg-[#1E40AF] text-white p-10 flex-col justify-center">

                    <h1 className="text-3xl font-semibold leading-snug">
                        Create Secure Account
                    </h1>

                    <p className="mt-5 text-blue-100 text-sm leading-relaxed">
                        Join a structured escrow-based recovery platform.
                        Payments are protected. Communication is controlled.
                        Every action is logged and verified.
                    </p>

                    <div className="mt-8 space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                            Escrow-protected transactions
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                            Evidence-first workflow
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-white" />
                            Role-based dashboard access
                        </div>
                    </div>

                </div>

                {/* RIGHT PANEL */}
                <div className="p-8 flex flex-col justify-center">

                    <h2 className="text-xl font-semibold text-[#111827]">
                        Sign up to PostNFind
                    </h2>

                    <p className="text-gray-600 text-sm mt-1 mb-6">
                        Create your secure account
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-[#111827] mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                {...register("name", validation.name)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5
                focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                            />
                            {errors.name && (
                                <p className="text-[#DC2626] text-xs mt-1">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-[#111827] mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                {...register("email", validation.email)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5
                focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                            />
                            {errors.email && (
                                <p className="text-[#DC2626] text-xs mt-1">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-[#111827] mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                {...register("phone", validation.phone)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5
                focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                            />
                            {errors.phone && (
                                <p className="text-[#DC2626] text-xs mt-1">
                                    {errors.phone.message}
                                </p>
                            )}
                        </div>

                        {/* Account Type */}
                        <div>
                            <label className="block text-sm font-medium text-[#111827] mb-1">
                                Account Type
                            </label>
                            <select
                                {...register("accountType", validation.accountType)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5
                focus:ring-2 focus:ring-[#2563EB] focus:outline-none text-sm"
                            >
                                <option value="">Select account type</option>
                                <option value="owner">Lost Item Owner</option>
                                <option value="agent">Recovery Agent</option>
                            </select>
                            {errors.accountType && (
                                <p className="text-[#DC2626] text-xs mt-1">
                                    {errors.accountType.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-[#111827] mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                {...register("password", validation.password)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5
                focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                            />
                            {errors.password && (
                                <p className="text-[#DC2626] text-xs mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-[#111827] mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                {...register("confirmPassword", validation.confirmPassword)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5
                focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                            />
                            {errors.confirmPassword && (
                                <p className="text-[#DC2626] text-xs mt-1">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        {/* Agreement */}
                        <div className="flex items-start gap-2 text-xs text-gray-600">
                            <input
                                type="checkbox"
                                {...register("agreement",validation.agreement)}
                                className="mt-1 accent-[#2563EB]"
                            />
                            <span>
                                I agree to the Escrow Terms & Platform Agreement.
                            </span>
                        </div>
                        {errors.agreement && (
                            <p className="text-[#DC2626] text-xs">
                                {errors.agreement.message}
                            </p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#2563EB] hover:bg-[#1E40AF]
                text-white py-2.5 rounded-lg font-medium transition"
                        >
                            {loading ? "Creating..." : "Create Account"}
                        </button>

                    </form>

                    {/* Divider */}
                    <div className="flex items-center my-5">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="mx-3 text-xs text-gray-500">
                            or sign up with
                        </span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    {/* Google */}
                    <button className="w-full border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition">
                        Continue with Google
                    </button>

                    <p className="text-sm text-gray-600 mt-6 text-center">
                        Already have an account?{" "}
                        <Link
                            to="/"
                            className="text-[#2563EB] font-medium hover:underline"
                        >
                            Login
                        </Link>
                    </p>

                </div>

            </div>
        </div>
    );
};