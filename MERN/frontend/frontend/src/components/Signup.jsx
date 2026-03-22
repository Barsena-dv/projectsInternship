import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowRight, FiCheckCircle, FiUserPlus } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const {
        register,
        getValues,
        handleSubmit,
        formState: { errors },
    } = useForm({
        mode: "onTouched",
    });

    const onSubmit = async (formValues) => {
        try {
            setLoading(true);

            const payload = {
                fullName: formValues.fullName,
                email: formValues.email,
                phone: formValues.phone,
                role: formValues.role,
                password: formValues.password,
            };

            const response = await axios.post("/api/auth/register", payload);
            toast.success(response.data?.message ?? "Account created successfully");
            navigate("/");
        } catch (error) {
            const message = error.response?.data?.message ?? "Registration failed";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="mesh-backdrop flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
            <div className="surface-panel reveal-in w-full max-w-6xl overflow-hidden rounded-3xl">
                <div className="grid min-h-190 md:grid-cols-[0.94fr_1.06fr]">
                    <div className="relative hidden bg-[linear-gradient(145deg,#08213f_0%,#0f4cad_55%,#0f766e_100%)] p-10 text-white md:flex md:flex-col md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                                <FiUserPlus className="h-4 w-4" />
                                Create Account
                            </div>

                            <h1 className="mt-8 max-w-sm text-4xl font-bold leading-tight">
                                Start your
                                <br />
                                trusted recovery flow.
                            </h1>

                            <p className="mt-5 max-w-sm text-sm text-blue-100/90">
                                Join as an owner or finder and manage every step from request to verification in one
                                secure dashboard.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-blue-50">
                                <div className="inline-flex items-center gap-2">
                                    <FiCheckCircle className="h-4 w-4 text-emerald-300" />
                                    Verified evidence pipeline
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-blue-50">
                                <div className="inline-flex items-center gap-2">
                                    <FiCheckCircle className="h-4 w-4 text-emerald-300" />
                                    Role-specific dashboards and workflows
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center bg-white p-6 sm:p-10">
                        <div className="w-full">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Join PostNFind</p>
                            <h2 className="mt-3 text-3xl font-bold text-slate-900">Create your account</h2>
                            <p className="mt-2 text-sm text-slate-600">Fill in your details to continue.</p>

                            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-4 md:grid-cols-2" noValidate>
                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                                    Full Name
                                    <input
                                        type="text"
                                        placeholder="Dhruv Patel"
                                        {...register("fullName", {
                                            required: "Full name is required",
                                            minLength: {
                                                value: 2,
                                                message: "Enter at least 2 characters",
                                            },
                                        })}
                                        className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
                                    />
                                    {errors.fullName ? (
                                        <span className="text-xs text-red-600">{errors.fullName.message}</span>
                                    ) : null}
                                </label>

                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                                    Email
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "Please enter a valid email",
                                            },
                                        })}
                                        className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
                                    />
                                    {errors.email ? <span className="text-xs text-red-600">{errors.email.message}</span> : null}
                                </label>

                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Phone Number
                                    <input
                                        type="tel"
                                        placeholder="9876543210"
                                        {...register("phone", {
                                            required: "Phone number is required",
                                            pattern: {
                                                value: /^[6-9]{1}[0-9]{9}$/,
                                                message: "Please enter a valid 10 digit phone",
                                            },
                                        })}
                                        className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
                                    />
                                    {errors.phone ? <span className="text-xs text-red-600">{errors.phone.message}</span> : null}
                                </label>

                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Role
                                    <select
                                        {...register("role", {
                                            required: "Please select account type",
                                        })}
                                        className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
                                    >
                                        <option value="">Select role</option>
                                        <option value="owner">Owner</option>
                                        <option value="finder">Finder</option>
                                    </select>
                                    {errors.role ? <span className="text-xs text-red-600">{errors.role.message}</span> : null}
                                </label>

                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Password
                                    <input
                                        type="password"
                                        {...register("password", {
                                            required: "Password is required",
                                            pattern: {
                                                value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])\S{8,30}$/,
                                                message: "Use 8+ chars with uppercase, number and symbol",
                                            },
                                        })}
                                        className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
                                    />
                                    {errors.password ? (
                                        <span className="text-xs text-red-600">{errors.password.message}</span>
                                    ) : null}
                                </label>

                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Confirm Password
                                    <input
                                        type="password"
                                        {...register("confirmPassword", {
                                            required: "Please confirm password",
                                            validate: (value) =>
                                                value === getValues("password") || "Confirm password does not match",
                                        })}
                                        className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
                                    />
                                    {errors.confirmPassword ? (
                                        <span className="text-xs text-red-600">{errors.confirmPassword.message}</span>
                                    ) : null}
                                </label>

                                <label className="md:col-span-2 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
                                    <input
                                        type="checkbox"
                                        {...register("agreement", {
                                            required: "Please accept terms and conditions",
                                        })}
                                        className="mt-0.5 accent-blue-600"
                                    />
                                    <span>I agree to PostNFind terms, privacy and secure escrow workflow policy.</span>
                                </label>
                                {errors.agreement ? (
                                    <span className="md:col-span-2 text-xs text-red-600">{errors.agreement.message}</span>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {loading ? "Creating account..." : "Create Account"}
                                    {!loading ? <FiArrowRight className="h-4 w-4" /> : null}
                                </button>
                            </form>

                            <p className="mt-6 text-sm text-slate-600">
                                Already have an account?{" "}
                                <Link to="/" className="font-semibold text-blue-700 hover:text-blue-800 hover:underline">
                                    Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};