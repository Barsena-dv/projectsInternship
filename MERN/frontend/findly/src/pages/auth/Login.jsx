import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../../components/ui/Buttons';
import InputField from '../../components/ui/InputField';
import AuthLayout from '../../layouts/AuthLayout';

import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../utils/axiosInstance';

export const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axiosInstance.post('/auth/login', formData);
            if (response.data.success) {
                login(response.data);
                toast.success('Login successful');

                // Redirect based on role
                const role = response.data.user.role;
                if (role === 'ADMIN') navigate('/admin/dashboard');
                else if (role === 'FINDER') navigate('/finder/dashboard');
                else navigate('/user/dashboard');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to your account to continue"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-sm font-medium text-text-primary">Password</label>
                        <Link
                            to="/forgot-password"
                            className="text-xs font-semibold text-primary-blue hover:text-deep-indigo transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <InputField
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <PrimaryButton type="submit" fullWidth className="mt-2" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                </PrimaryButton>

                <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white/50 px-2 text-text-secondary backdrop-blur-sm">Or continue with</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-lg bg-white/50 hover:bg-gray-50 transition-all duration-200 text-sm font-semibold text-text-primary mb-2"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                </button>

                <p className="text-center text-sm text-text-secondary">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-semibold text-primary-blue hover:text-deep-indigo transition-colors underline underline-offset-4">
                        Create an account
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};
