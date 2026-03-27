import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiArrowRight, FiCheckCircle, FiShield, FiUserPlus } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/auth.css';
import { getErrorMessage } from '../../utils/helpers';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { full_name: '', email: '', phone: '', password: '', role: 'owner' },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await authRegister(values);
      toast.success('Registration successful. Please verify your email.');
      navigate('/login');
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

          <h1 className="pnf-auth-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Create Account</h1>
          <p className="pnf-auth-subtitle" style={{ fontSize: '1rem' }}>Join the platform to securely post lost items or help find them with guaranteed payouts.</p>

          <div style={{ marginTop: '1rem' }}>
            <div className="pnf-auth-feature">
              <div className="pnf-auth-feature-icon"><FiShield /></div>
              <div>
                <p className="pnf-auth-feature-title">Finders Earn Rewards</p>
                <p className="pnf-auth-feature-desc">Get rewarded safely for returning lost items.</p>
              </div>
            </div>
            <div className="pnf-auth-feature">
              <div className="pnf-auth-feature-icon"><FiCheckCircle /></div>
              <div>
                <p className="pnf-auth-feature-title">Owners Recover Items</p>
                <p className="pnf-auth-feature-desc">Post detailed requests and track evidence easily.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pnf-auth-form-side">
          <h2 className="pnf-auth-title">Sign up</h2>
          <p className="pnf-auth-subtitle">Create your account</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="pnf-auth-input-group">
              <label htmlFor="full_name" className="pnf-auth-label">Full Name</label>
              <input
                id="full_name"
                className={`pnf-auth-input ${errors.full_name ? 'error' : ''}`}
                placeholder="John Doe"
                {...register('full_name', { required: 'Name is required' })}
              />
              {errors.full_name && <span className="pnf-auth-error-msg">{errors.full_name.message}</span>}
            </div>

            <div className="pnf-auth-input-group">
              <label htmlFor="email" className="pnf-auth-label">Email</label>
              <input
                id="email"
                type="email"
                className={`pnf-auth-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <span className="pnf-auth-error-msg">{errors.email.message}</span>}
            </div>

            <div className="pnf-auth-input-group">
              <label htmlFor="phone" className="pnf-auth-label">Phone</label>
              <input
                id="phone"
                className={`pnf-auth-input ${errors.phone ? 'error' : ''}`}
                placeholder="+1 234 567 890"
                {...register('phone', { required: 'Phone is required' })}
              />
              {errors.phone && <span className="pnf-auth-error-msg">{errors.phone.message}</span>}
            </div>

            <div className="pnf-auth-input-group">
              <label htmlFor="password" className="pnf-auth-label">Password</label>
              <input
                id="password"
                type="password"
                className={`pnf-auth-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
              />
              {errors.password && <span className="pnf-auth-error-msg">{errors.password.message}</span>}
            </div>

            <div className="pnf-auth-input-group">
              <label className="pnf-auth-label">I am a...</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '0.625rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="radio" value="owner" {...register('role')} /> Owner
                </label>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '0.625rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="radio" value="finder" {...register('role')} /> Finder
                </label>
              </div>
            </div>

            <button type="submit" className="pnf-auth-btn" disabled={loading}>
              <FiUserPlus style={{ opacity: 0.8 }} />
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <div className="pnf-auth-footer">
            Already have an account? <Link to="/login" className="pnf-auth-link" style={{ marginLeft: '0.2rem' }}>Sign in <FiArrowRight style={{ display: 'inline', verticalAlign: 'middle' }} /></Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
