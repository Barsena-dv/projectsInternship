import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiArrowRight, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import useScrollReveal from '../../hooks/useScrollReveal';
import '../../styles/auth.css';
import { getErrorMessage } from '../../utils/helpers';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  useScrollReveal();

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: { full_name: '', email: '', phone: '', password: '', role: 'owner' },
  });

  const selectedRole = watch('role');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await authRegister(values);
      if (values.role === 'finder') {
        toast.success('Finder account created. Verify your email OTP to activate.');
        navigate(`/verify-finder-email?email=${encodeURIComponent(values.email)}`);
      } else {
        toast.success('Account created successfully! Please sign in.');
        navigate('/login');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modern-layout pnf-dark-scrollbar">
      <div className="auth-glow auth-glow-1" style={{ width: '800px', height: '800px', opacity: 0.15 }} />
      <div className="auth-glow auth-glow-2" style={{ bottom: '0', right: '0', opacity: 0.1 }} />

      <div className={`auth-modern-card max-w-130 ${selectedRole === 'owner' ? 'auth-role-owner' : 'auth-role-finder'}`}>
        <header className="auth-modern-header">
          <Link to="/" className="auth-brand-pill">
            <FiUserPlus className="text-white" size={24} />
          </Link>
          <h1 className="auth-modern-title">Create Account</h1>
          <p className="auth-modern-subtitle">
            Create your profile to post recovery requests or accept finder assignments.
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Premium Segmented Role Control */}
          <div className="role-segmented-control">
            <div className="role-option">
              <input type="radio" id="role-owner" value="owner" className="role-radio" {...register('role')} />
              <label htmlFor="role-owner" className="role-label owner">I Lost Something (Owner)</label>
            </div>
            <div className="role-option">
              <input type="radio" id="role-finder" value="finder" className="role-radio" {...register('role')} />
              <label htmlFor="role-finder" className="role-label finder">I Want to Find (Finder)</label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
             <div className="auth-input-container">
               <label htmlFor="full_name" className="auth-input-label">Full Name</label>
               <input
                 id="full_name"
                 className={`auth-input-field ${errors.full_name ? 'error' : ''}`}
                 placeholder="John Doe"
                 {...register('full_name', { required: 'Full name is required' })}
               />
               {errors.full_name && <p className="auth-error-text">{errors.full_name.message}</p>}
             </div>
             
             <div className="auth-input-container">
               <label htmlFor="email" className="auth-input-label">Email Address</label>
               <input
                 id="email"
                 type="email"
                 className={`auth-input-field ${errors.email ? 'error' : ''}`}
                 placeholder="you@example.com"
                 {...register('email', { required: 'Email is required' })}
               />
               {errors.email && <p className="auth-error-text">{errors.email.message}</p>}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
             <div className="auth-input-container">
               <label htmlFor="phone" className="auth-input-label">Phone Number</label>
               <input
                 id="phone"
                 className={`auth-input-field ${errors.phone ? 'error' : ''}`}
                 placeholder="+91 98XXXXXX12"
                 {...register('phone', { required: 'Phone number is required' })}
               />
               {errors.phone && <p className="auth-error-text">{errors.phone.message}</p>}
             </div>

             <div className="auth-input-container">
               <label htmlFor="password" title="password" className="auth-input-label">Password</label>
               <div className="auth-password-wrap">
                 <input
                   id="password"
                   title="password"
                   type={showPassword ? 'text' : 'password'}
                   className={`auth-input-field ${errors.password ? 'error' : ''}`}
                   placeholder="Minimum 6 characters"
                   {...register('password', { 
                     required: 'Password is required',
                     minLength: { value: 6, message: 'Minimum 6 characters' }
                   })}
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
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
               <span className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Creating account...
               </span>
            ) : (
               <>{selectedRole === 'owner' ? 'Create Owner Account' : 'Create Finder Account'}</>
            )}
          </button>
        </form>

        <footer className="auth-footer">
          Already have an account? 
          <Link to="/login" className="auth-footer-link ml-2">
            Sign In <FiArrowRight className="inline ml-1" />
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default RegisterPage;
