import axios from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        try{
            const response = await axios.post("https://node5.onrender.com/user/login",data);
            console.log("response...",response);
            console.log("response...",response.data);
            if(response.status === 200){
                toast.success("login success");
                navigate("/user");
            }
        }catch{
            toast.error("login failed");
        }
        
        // setLoading(true);
        // console.log(data);
        // setTimeout(() => setLoading(false), 1200);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">

            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">

                {/* LEFT PANEL */}
                <div className="bg-gradient-to-br from-[#1E40AF] to-[#2563EB] text-white p-12 flex flex-col justify-center relative">

                    <h1 className="text-4xl font-semibold leading-tight">
                        Welcome back.
                    </h1>

                    <p className="mt-6 text-blue-100 max-w-md">
                        Access your secure recovery dashboard.
                        Track assignments, manage escrow payments,
                        and communicate through verified workflows.
                    </p>

                    {/* Trust Features */}
                    <div className="mt-10 space-y-4">

                        <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
                            <span className="text-sm text-blue-100">
                                Escrow protected transactions
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                            <span className="text-sm text-blue-100">
                                Evidence-first verification
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                            <span className="text-sm text-blue-100">
                                Verified recovery agents
                            </span>
                        </div>

                    </div>

                </div>

                {/* RIGHT PANEL */}
                <div className="p-12 flex flex-col justify-center">

                    <h2 className="text-2xl font-semibold text-[#111827]">
                        Login to PostNFind
                    </h2>

                    <p className="text-gray-600 text-sm mt-2 mb-8">
                        Secure access to your account
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-[#111827] mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                {...register("email", { required: "Email is required" })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
                                placeholder="you@example.com"
                            />
                            {errors.email && (
                                <p className="text-[#DC2626] text-sm mt-1">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-[#111827] mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                {...register("password", { required: "Password is required" })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
                                placeholder="Enter your password"
                            />
                            {errors.password && (
                                <p className="text-[#DC2626] text-sm mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Remember + Forgot */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-gray-600">
                                <input type="checkbox" className="accent-[#2563EB]" />
                                Remember me
                            </label>

                            <button
                                type="button"
                                className="text-[#2563EB] hover:underline"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#2563EB] hover:bg-[#1E40AF] text-white py-3 rounded-lg font-medium transition disabled:opacity-60 cursor-pointer"
                        >
                            {loading ? "Authenticating..." : "Login"}
                        </button>

                    </form>

                    {/* Footer */}
                    <p className="text-sm text-gray-600 mt-8 text-center">
                        Not registered yet?{" "}
                        <span className="text-[#2563EB] font-medium cursor-pointer hover:underline">
                            <Link to={"/signup"}>Create an account</Link>
                        </span>
                    </p>

                </div>

            </div>
        </div>
    );
};