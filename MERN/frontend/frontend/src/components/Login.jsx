import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowRight, FiCheckCircle, FiSearch, FiShield } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const roleRouteMap = {
    owner: "/owner",
    finder: "/finder",
    admin: "/admin",
};

export const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        mode: "onTouched",
    });

    const onSubmit = async (formValues) => {
        try {
            setLoading(true);
            const response = await axios.post("/api/auth/login", formValues);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("role", response.data.data.role);
            localStorage.setItem(
                "pnf-profile",
                JSON.stringify({
                    fullName: response.data?.data?.fullName ?? "",
                    email: response.data?.data?.email ?? formValues.email ?? "",
                    phone: response.data?.data?.phone ?? "",
                    avatar: response.data?.data?.profileImage ?? response.data?.data?.avatar ?? "",
                }),
            );

            const normalizedRole = String(response.data.data.role ?? "").toLowerCase();
            const redirectPath = roleRouteMap[normalizedRole];

            if (!redirectPath) {
                toast.error("Invalid account role");
                return;
            }

            toast.success("Welcome back");
            navigate(redirectPath);
        } catch (error) {
            const message = error.response?.data?.message ?? "Login failed";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="mesh-backdrop flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
            <div className="surface-panel reveal-in w-full max-w-6xl overflow-hidden rounded-3xl">
                <div className="grid min-h-170 md:grid-cols-[1.08fr_0.92fr]">
                    <div className="relative hidden bg-[linear-gradient(135deg,#0f1f3a_0%,#123e9d_55%,#0f766e_100%)] p-10 text-white md:flex md:flex-col md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                                <FiShield className="h-4 w-4" />
                                PostNFind Secure Access
                            </div>

                            <h1 className="mt-8 max-w-md text-4xl font-bold leading-tight">
                                Recover smarter,
                                <br />
                                verify faster.
                            </h1>

                            <p className="mt-5 max-w-md text-sm text-blue-100/90">
                                Continue your recovery journey with protected payments, tracked assignments, and
                                evidence-first verification.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                                <FiCheckCircle className="h-4 w-4 text-emerald-300" />
                                <span className="text-sm text-blue-50">Escrow-backed trust and payout handling</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                                <FiSearch className="h-4 w-4 text-cyan-300" />
                                <span className="text-sm text-blue-50">Finder-owner workflows with full visibility</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center bg-white p-6 sm:p-10">
                        <div className="w-full max-w-md">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Welcome Back</p>
                            <h2 className="mt-3 text-3xl font-bold text-slate-900">Sign in to your account</h2>
                            <p className="mt-2 text-sm text-slate-600">
                                Enter your credentials to open your owner, finder, or admin workspace.
                            </p>

                            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Email Address
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        {...register("email", {
                                            required: "Email is required",
                                        })}
                                        className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
                                    />
                                    {errors.email ? <span className="text-xs text-red-600">{errors.email.message}</span> : null}
                                </label>

                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Password
                                    <input
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        {...register("password", {
                                            required: "Password is required",
                                        })}
                                        className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white"
                                    />
                                    {errors.password ? (
                                        <span className="text-xs text-red-600">{errors.password.message}</span>
                                    ) : null}
                                </label>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {loading ? "Authenticating..." : "Sign In"}
                                    {!loading ? <FiArrowRight className="h-4 w-4" /> : null}
                                </button>
                            </form>

                            <p className="mt-6 text-sm text-slate-600">
                                New to PostNFind?{" "}
                                <Link to="/signup" className="font-semibold text-blue-700 hover:text-blue-800 hover:underline">
                                    Create your account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};