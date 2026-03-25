import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getRoleHomePath } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/helpers';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
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
    <div className="mx-auto flex min-h-dvh max-w-275 items-center px-4 py-6">
      <div className="grid w-full gap-6 md:grid-cols-2">
        <section className="pnf-card hidden p-8 md:block">
          <h1 className="text-4xl font-bold text-slate-900">PostNFind</h1>
          <p className="mt-4 text-slate-600">
            A lifecycle-driven lost item workflow platform for owners, finders, and admins.
          </p>
        </section>

        <section className="pnf-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
          <p className="mt-1 text-sm text-slate-500">Access your dashboard by role.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                id="email"
                type="email"
                className="pnf-input"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                id="password"
                type="password"
                className="pnf-input"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
            </div>

            <button
              type="submit"
              className="pnf-btn-primary w-full rounded-lg px-4 py-2 text-sm font-medium"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            New user?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:underline">
              Create account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
