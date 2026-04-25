import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiShield } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getRoleHomePath } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import useScrollReveal from '../../hooks/useScrollReveal';
import '../../styles/auth.css';
import { getErrorMessage } from '../../utils/helpers';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  useScrollReveal();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const user = await login(values);
      if (user.role === 'finder' && !user.isEmailVerified) {
        toast.info('Complete finder email OTP verification first.');
        navigate(`/verify-finder-email?email=${encodeURIComponent(user.email || values.email)}`, { replace: true });
        return;
      }
      toast.success('Access granted. Synchronizing session...');
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modern-layout pnf-dark-scrollbar">
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-modern-card">
        <header className="auth-modern-header">
          <Link to="/" className="auth-brand-pill">
            <FiShield className="text-white" size={24} />
          </Link>
          <h1 className="auth-modern-title">Welcome Back</h1>
          <p className="auth-modern-subtitle">
            Sign in to manage requests, track assignments, and communicate securely.
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-input-container">
            <label htmlFor="email" className="auth-input-label">Email Address</label>
            <input
              id="email"
              type="email"
              className={`auth-input-field ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              {...register('email', { 
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
              })}
            />
            {errors.email && <p className="auth-error-text">{errors.email.message}</p>}
          </div>

          <div className="auth-input-container">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" title="password" className="auth-input-label mb-0">Password</label>
              <Link to="/forgot-password" title="forgot-password" className="auth-forgot-link">Forgot password?</Link>
            </div>
            <div className="auth-password-wrap">
              <input
                id="password"
                title="password"
                type={showPassword ? 'text' : 'password'}
                className={`auth-input-field ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {errors.password && <p className="auth-error-text">{errors.password.message}</p>}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <>
                <FiLock size={16} />
                Sign In
              </>
            )}
          </button>
        </form>

        <footer className="auth-footer">
          New to PostNFind? 
          <Link to="/register" className="auth-footer-link ml-2">
            Create your account <FiArrowRight className="inline ml-1" />
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
