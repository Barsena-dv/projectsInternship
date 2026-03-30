import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiArrowRight, FiShield, FiUserPlus } from 'react-icons/fi';
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

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await authRegister(values);
      toast.success('Identity created. Verifying registry connectivity...');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modern-layout pnf-dark-scrollbar">
      {/* Cinematic Glows */}
      <div className="auth-glow auth-glow-1" style={{ width: '800px', height: '800px', opacity: 0.15 }} />
      <div className="auth-glow auth-glow-2" style={{ bottom: '0', right: '0', opacity: 0.1 }} />

      <div className="auth-modern-card reveal max-w-[520px]">
        <header className="auth-modern-header">
          <Link to="/" className="auth-brand-pill bg-emerald-500 shadow-emerald-500/20">
            <FiUserPlus className="text-white" size={24} />
          </Link>
          <h1 className="auth-modern-title">Enroll in Registry</h1>
          <p className="auth-modern-subtitle">
            Create your global digital identifier to start posting discovery missions or tracking payouts.
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Premium Segmented Role Control */}
          <div className="role-segmented-control reveal delay-100">
            <div className="role-option">
              <input type="radio" id="role-owner" value="owner" className="role-radio" {...register('role')} />
              <label htmlFor="role-owner" className="role-label owner">I Loss Something (Owner)</label>
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
                 {...register('full_name', { required: 'Identity name required' })}
               />
               {errors.full_name && <p className="auth-error-text">{errors.full_name.message}</p>}
             </div>
             
             <div className="auth-input-container">
               <label htmlFor="email" className="auth-input-label">Identity Email</label>
               <input
                 id="email"
                 type="email"
                 className={`auth-input-field ${errors.email ? 'error' : ''}`}
                 placeholder="operator@postnfind.com"
                 {...register('email', { required: 'Primary email required' })}
               />
               {errors.email && <p className="auth-error-text">{errors.email.message}</p>}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
             <div className="auth-input-container">
               <label htmlFor="phone" className="auth-input-label">Secure Phone</label>
               <input
                 id="phone"
                 className={`auth-input-field ${errors.phone ? 'error' : ''}`}
                 placeholder="+91 XXXXX XXXXX"
                 {...register('phone', { required: 'Mobile identifier required' })}
               />
               {errors.phone && <p className="auth-error-text">{errors.phone.message}</p>}
             </div>

             <div className="auth-input-container">
               <label htmlFor="password" title="password" className="auth-input-label">Access Encryption</label>
               <input
                 id="password"
                 title="password"
                 type="password"
                 className={`auth-input-field ${errors.password ? 'error' : ''}`}
                 placeholder="••••••••"
                 {...register('password', { 
                   required: 'Encryption key required',
                   minLength: { value: 6, message: 'Minimum 6 entropy markers' }
                 })}
               />
               {errors.password && <p className="auth-error-text">{errors.password.message}</p>}
             </div>
          </div>

          <button type="submit" className={`auth-submit-btn ${selectedRole === 'owner' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-sky-500 shadow-sky-500/20'}`} disabled={loading}>
            {loading ? (
               <span className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Synchronizing Registry...
               </span>
            ) : (
               <>{selectedRole === 'owner' ? 'Deploy Discovery Mission' : 'Start Discovery Career'}</>
            )}
          </button>
        </form>

        <footer className="auth-footer">
          Already an Operator? 
          <Link to="/login" className="auth-footer-link ml-2">
            Signature Login <FiArrowRight className="inline ml-1" />
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default RegisterPage;
