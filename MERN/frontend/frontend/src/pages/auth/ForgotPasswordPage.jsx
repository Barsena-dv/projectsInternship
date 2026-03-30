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
    <div className="auth-modern-layout pnf-dark-scrollbar">
      {/* Cinematic Glows */}
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-modern-card reveal">
        <header className="auth-modern-header">
          <div className="auth-brand-pill">
            <FiMail className="text-white" size={24} />
          </div>
          <h1 className="auth-modern-title">Forgot identity key?</h1>
          <p className="auth-modern-subtitle">
            Enter your security identifier and we'll send instructions to recover your encryption key.
          </p>
        </header>

        {success ? (
          <div className="text-center">
            <p className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
              A recovery link has been dispatched to your registry email. Please verify your inbox.
            </p>
            <Link to="/login" className="auth-submit-btn no-underline">
              <FiArrowLeft /> Back to Signature Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="auth-input-container">
              <label htmlFor="email" className="auth-input-label">Security Identifier (Email)</label>
              <input
                id="email"
                type="email"
                className={`auth-input-field ${errors.email ? 'error' : ''}`}
                placeholder="operator@postnfind.com"
                {...register('email', { required: 'Identifier is required' })}
              />
              {errors.email && <p className="auth-error-text">{errors.email.message}</p>}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Dispatching...
                </span>
              ) : (
                <>
                  <FiSend size={18} />
                  Recover Access Key
                </>
              )}
            </button>

            <div className="text-center mt-8">
              <Link to="/login" className="auth-footer-link text-sm inline-flex items-center gap-2">
                <FiArrowLeft /> Return to Portal Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
