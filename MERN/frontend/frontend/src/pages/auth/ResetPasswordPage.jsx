import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiCheckCircle, FiLock } from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../services/api';
import '../../styles/auth.css';
import { getErrorMessage } from '../../utils/helpers';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: { password: '', confirmPassword: '' } });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const password = watch('password');

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await authApi.resetPassword(token, values.password);
      setSuccess(true);
      toast.success('Password successfully reset!');
      setTimeout(() => navigate('/login'), 3000);
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
            {success ? <FiCheckCircle color="#34d399" /> : <FiLock />}
          </div>
          <h1 className="pnf-auth-title" style={{ fontSize: '1.75rem' }}>Set new password</h1>
          <p className="pnf-auth-subtitle" style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            Your new password must be at least 6 characters.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#34d399', fontSize: '0.95rem', fontWeight: 500, background: 'rgba(52,211,153,0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(52,211,153,0.2)', marginBottom: '1.5rem' }}>
              Your password has been successfully reset. Redirecting to login...
            </p>
            <Link to="/login" className="pnf-auth-btn" style={{ textDecoration: 'none' }}>
              Go to login now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="pnf-auth-input-group">
              <label htmlFor="password" className="pnf-auth-label">New Password</label>
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
              <label htmlFor="confirmPassword" className="pnf-auth-label">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className={`pnf-auth-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="••••••••"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: (val) => val === password || 'Passwords do not match' 
                })}
              />
              {errors.confirmPassword && <span className="pnf-auth-error-msg">{errors.confirmPassword.message}</span>}
            </div>

            <button type="submit" className="pnf-auth-btn" disabled={loading} style={{ marginTop: '1.5rem' }}>
              <FiLock style={{ opacity: 0.8 }} />
              {loading ? 'Saving...' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
