import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiArrowRight, FiCheckCircle, FiLock, FiShield } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getRoleHomePath } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/auth.css';
import { getErrorMessage } from '../../utils/helpers';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const user = await login(values);
      toast.success('Welcome back!');
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pnf-auth-layout">
      <div className="pnf-auth-bg" />
      
      <div className="pnf-auth-glass-card wide">
        <section className="pnf-auth-brand-side">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3rem' }}>
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#a5b4fc)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 900, boxShadow: '0 4px 14px rgba(99,102,241,0.5)' }}>P</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
              Post<span style={{ color: '#818cf8' }}>N</span>Find
            </span>
          </Link>

          <h1 className="pnf-auth-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome Back</h1>
          <p className="pnf-auth-subtitle" style={{ fontSize: '1rem' }}>Manage your lost items, evidence, and payouts with intelligent lifecycle tracking.</p>

          <div style={{ marginTop: '1rem' }}>
            <div className="pnf-auth-feature">
              <div className="pnf-auth-feature-icon"><FiShield /></div>
              <div>
                <p className="pnf-auth-feature-title">Secure & Transparent</p>
                <p className="pnf-auth-feature-desc">All tracking steps are recorded and secure.</p>
              </div>
            </div>
            <div className="pnf-auth-feature">
              <div className="pnf-auth-feature-icon"><FiCheckCircle /></div>
              <div>
                <p className="pnf-auth-feature-title">Role-based Access</p>
                <p className="pnf-auth-feature-desc">Smart dashboards tailored for Owners, Finders, and Admin.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pnf-auth-form-side">
          <h2 className="pnf-auth-title">Sign in</h2>
          <p className="pnf-auth-subtitle">Welcome back! Please enter your details.</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="pnf-auth-input-group">
              <label htmlFor="email" className="pnf-auth-label">Email</label>
              <input
                id="email"
                type="email"
                className={`pnf-auth-input ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <span className="pnf-auth-error-msg">{errors.email.message}</span>}
            </div>

            <div className="pnf-auth-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label htmlFor="password" style={{ margin: 0 }} className="pnf-auth-label">Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.75rem' }} className="pnf-auth-link">Forgot password?</Link>
              </div>
              <input
                id="password"
                type="password"
                className={`pnf-auth-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <span className="pnf-auth-error-msg">{errors.password.message}</span>}
            </div>

            <button type="submit" className="pnf-auth-btn" disabled={loading}>
              <FiLock style={{ opacity: 0.8 }} />
              {loading ? 'Signing in...' : 'Sign in to dashboard'}
            </button>
          </form>

          <div className="pnf-auth-footer">
            Don't have an account? <Link to="/register" className="pnf-auth-link" style={{ marginLeft: '0.2rem' }}>Sign up <FiArrowRight style={{ display: 'inline', verticalAlign: 'middle' }} /></Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
