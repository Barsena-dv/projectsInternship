import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiCheckCircle, FiMail, FiRefreshCw } from 'react-icons/fi';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../services/api';
import '../../styles/auth.css';
import { getErrorMessage } from '../../utils/helpers';

const VerifyFinderEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const [sending, setSending] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      email: defaultEmail,
      otpCode: '',
    },
  });

  const emailValue = watch('email');

  const onSubmit = async (values) => {
    try {
      setSending(true);
      await authApi.verifyFinderEmailOtp(values.email, values.otpCode);
      toast.success('Finder email verified. You can now sign in and wait for admin approval.');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const resendOtp = async () => {
    try {
      if (!emailValue) {
        toast.error('Enter your email first.');
        return;
      }
      setSending(true);
      await authApi.resendFinderEmailOtp(emailValue);
      toast.success('A new verification code has been sent.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-modern-layout pnf-dark-scrollbar">
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-modern-card reveal max-w-130">
        <header className="auth-modern-header">
          <span className="auth-brand-pill bg-sky-500 shadow-sky-500/20">
            <FiMail className="text-white" size={22} />
          </span>
          <h1 className="auth-modern-title">Verify Finder Email</h1>
          <p className="auth-modern-subtitle">
            Enter the 6-digit code sent to your email. SMS OTP is intentionally disabled to keep this system free and maintainable.
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-input-container">
            <label htmlFor="email" className="auth-input-label">Finder Email</label>
            <input
              id="email"
              type="email"
              className={`auth-input-field ${errors.email ? 'error' : ''}`}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email ? <p className="auth-error-text">{errors.email.message}</p> : null}
          </div>

          <div className="auth-input-container">
            <label htmlFor="otpCode" className="auth-input-label">Verification Code</label>
            <input
              id="otpCode"
              className={`auth-input-field ${errors.otpCode ? 'error' : ''}`}
              maxLength={6}
              placeholder="123456"
              {...register('otpCode', {
                required: 'OTP code is required',
                minLength: { value: 6, message: 'OTP must be 6 digits' },
              })}
            />
            {errors.otpCode ? <p className="auth-error-text">{errors.otpCode.message}</p> : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <button type="submit" className="auth-submit-btn" disabled={sending}>
              <FiCheckCircle size={16} /> Verify Email
            </button>
            <button
              type="button"
              className="auth-submit-btn bg-slate-700/70! hover:bg-slate-600!"
              onClick={resendOtp}
              disabled={sending}
            >
              <FiRefreshCw size={16} /> Resend OTP
            </button>
          </div>
        </form>

        <footer className="auth-footer">
          <Link to="/login" className="auth-footer-link">Back to login</Link>
        </footer>
      </div>
    </div>
  );
};

export default VerifyFinderEmailPage;
