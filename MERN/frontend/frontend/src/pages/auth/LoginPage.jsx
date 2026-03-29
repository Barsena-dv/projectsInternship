import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiArrowRight, FiLock, FiShield } from 'react-icons/fi';
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

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const user = await login(values);
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
      {/* Cinematic Glows */}
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-modern-card reveal">
        <header className="auth-modern-header">
          <Link to="/" className="auth-brand-pill">
            <FiShield className="text-white" size={24} />
          </Link>
          <h1 className="auth-modern-title">Welcome Back</h1>
          <p className="auth-modern-subtitle">
            Sign in to access your discovery dashboard and manage mission parameters.
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-input-container">
            <label htmlFor="email" className="auth-input-label">Security Identifier (Email)</label>
            <input
              id="email"
              type="email"
              className={`auth-input-field ${errors.email ? 'error' : ''}`}
              placeholder="operator@postnfind.com"
              {...register('email', { 
                required: 'Identifier is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid identity format' }
              })}
            />
            {errors.email && <p className="auth-error-text">{errors.email.message}</p>}
          </div>

          <div className="auth-input-container">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" title="password" className="auth-input-label mb-0">Encryption Key</label>
              <Link to="/forgot-password" title="forgot-password" className="auth-forgot-link">Recover Key?</Link>
            </div>
            <input
              id="password"
              title="password"
              type="password"
              className={`auth-input-field ${errors.password ? 'error' : ''}`}
              placeholder="••••••••"
              {...register('password', { required: 'Security key is required' })}
            />
            {errors.password && <p className="auth-error-text">{errors.password.message}</p>}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                <FiLock size={18} />
                Sign In to Platform
              </>
            )}
          </button>
        </form>

        <footer className="auth-footer">
          New to the Registry? 
          <Link to="/register" className="auth-footer-link ml-2">
            Create Identity <FiArrowRight className="inline ml-1" />
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
