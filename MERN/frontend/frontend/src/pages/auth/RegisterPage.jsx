import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/helpers';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'owner',
    },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await register(values);
      toast.success('Registration successful. Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-275 items-center px-4 py-6">
      <section className="pnf-card mx-auto w-full max-w-xl p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-slate-900">Create Account</h2>
        <p className="mt-1 text-sm text-slate-500">Register as owner or finder.</p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
            <input id="full_name" className="pnf-input" {...registerField('full_name', { required: 'Full name is required' })} />
            {errors.full_name ? <p className="mt-1 text-xs text-rose-600">{errors.full_name.message}</p> : null}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input id="email" type="email" className="pnf-input" {...registerField('email', { required: 'Email is required' })} />
            {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input id="phone" className="pnf-input" {...registerField('phone', { required: 'Phone is required' })} />
            {errors.phone ? <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p> : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              type="password"
              className="pnf-input"
              {...registerField('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
            />
            {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select id="role" className="pnf-input" {...registerField('role')}>
              <option value="owner">Owner</option>
              <option value="finder">Finder</option>
            </select>
          </div>

          <button type="submit" className="pnf-btn-primary mt-2 rounded-lg px-4 py-2 text-sm font-medium" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">Login</Link>
        </p>
      </section>
    </div>
  );
};

export default RegisterPage;
