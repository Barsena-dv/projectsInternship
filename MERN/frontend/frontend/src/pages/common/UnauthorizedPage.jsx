import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl items-center px-4">
      <section className="pnf-card w-full p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Unauthorized</h1>
        <p className="mt-2 text-sm text-slate-600">You do not have access to this page.</p>
        <Link className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline" to="/">
          Go Home
        </Link>
      </section>
    </div>
  );
};

export default UnauthorizedPage;
