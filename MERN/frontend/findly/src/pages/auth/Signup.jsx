import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PrimaryButton } from '../../components/ui/Buttons';
import InputField from '../../components/ui/InputField';
import AuthLayout from '../../layouts/AuthLayout';

import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../utils/axiosInstance';

export const Signup = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'USER',
        agreeToTerms: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axiosInstance.post('/auth/register', formData);
            if (response.data.success) {
                // Auto-login after signup
                login(response.data);
                toast.success('Registration successful. Welcome!');

                // Redirect based on role
                const role = response.data.user.role;
                if (role === 'FINDER') navigate('/finder/dashboard');
                else navigate('/user/dashboard');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join PostNFind to track or recover lost items"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <InputField
                    label="Full Name"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                />

                <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-primary px-1">
                        Account Type
                    </label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-200 outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10 text-text-primary appearance-none cursor-pointer"
                    >
                        <option value="USER">Lost Item Owner (User)</option>
                        <option value="FINDER">Lost Item Finder (Finder)</option>
                    </select>
                </div>

                <InputField
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <div className="flex items-start gap-2 px-1 mt-1">
                    <input
                        type="checkbox"
                        id="agreeToTerms"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-blue focus:ring-primary-blue/20 cursor-pointer"
                        required
                    />
                    <label htmlFor="agreeToTerms" className="text-xs text-text-secondary leading-normal">
                        I agree to the <Link to="/terms" className="text-primary-blue hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary-blue hover:underline">Privacy Policy</Link>
                    </label>
                </div>

                <PrimaryButton type="submit" fullWidth className="mt-2" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Get Started'}
                </PrimaryButton>

                <p className="text-center text-sm text-text-secondary mt-2">
                    Already have an account?{' '}
                    <Link to="/" className="font-semibold text-primary-blue hover:text-deep-indigo transition-colors underline underline-offset-4">
                        Sign In
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};
