import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiMail, FiSend } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../services/api';
import '../../styles/auth.css';
import { getErrorMessage } from '../../utils/helpers';

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { email: '' } });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(values.email);
      setSuccess(true);
      toast.success('Reset link sent to your email!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pnf-auth-layout">
      <div className="pnf-auth-bg" />
      
      <div className="pnf-auth-glass-card" style={{ maxWidth: '420px', padding: '3rem 2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: '1.5rem', margin: '0 auto 1.25rem' }}>
            <FiMail />
          </div>
          <h1 className="pnf-auth-title" style={{ fontSize: '1.75rem' }}>Forgot password?</h1>
          <p className="pnf-auth-subtitle" style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#818cf8', fontSize: '0.95rem', fontWeight: 500, background: 'rgba(99,102,241,0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '1.5rem' }}>
              We've sent an email to your inbox with a link to reset your password.
            </p>
            <Link to="/login" className="pnf-auth-btn" style={{ textDecoration: 'none' }}>
              <FiArrowLeft /> Back to log in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
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

            <button type="submit" className="pnf-auth-btn" disabled={loading} style={{ marginTop: '1.5rem' }}>
              <FiSend style={{ opacity: 0.8 }} />
              {loading ? 'Sending...' : 'Reset password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/login" className="pnf-auth-link" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FiArrowLeft /> Back to log in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
