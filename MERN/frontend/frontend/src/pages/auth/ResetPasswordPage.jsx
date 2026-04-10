import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiCheckCircle, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    <div className="auth-modern-layout pnf-dark-scrollbar">
      {/* Cinematic Glows */}
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-modern-card">
        <header className="auth-modern-header">
          <div className="auth-brand-pill">
            {success ? <FiCheckCircle className="text-white" size={24} /> : <FiLock className="text-white" size={24} />}
          </div>
          <h1 className="auth-modern-title">Set New Password</h1>
          <p className="auth-modern-subtitle">
            Create a new password for your account. Must be at least 6 characters.
          </p>
        </header>

        {success ? (
          <div className="text-center">
            <p className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-6">
              Password updated successfully! Redirecting to login...
            </p>
            <Link to="/login" className="auth-submit-btn no-underline">
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="auth-input-container">
              <label htmlFor="password" title="password" className="auth-input-label">New Password</label>
              <div className="auth-password-wrap">
                <input
                  id="password"
                  title="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`auth-input-field ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                />
                <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(p => !p)} tabIndex={-1} aria-label="Toggle password">
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.password && <p className="auth-error-text">{errors.password.message}</p>}
            </div>

            <div className="auth-input-container">
              <label htmlFor="confirmPassword" title="confirmPassword" className="auth-input-label">Confirm Password</label>
              <div className="auth-password-wrap">
                <input
                  id="confirmPassword"
                  title="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className={`auth-input-field ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="••••••••"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: (val) => val === password || 'Passwords do not match' 
                  })}
                />
                <button type="button" className="auth-password-toggle" onClick={() => setShowConfirm(p => !p)} tabIndex={-1} aria-label="Toggle confirm password">
                  {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="auth-error-text">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                <>
                  <FiLock size={18} />
                  Reset Password
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
