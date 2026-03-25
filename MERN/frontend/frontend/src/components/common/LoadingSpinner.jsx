const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="pnf-card flex min-h-40 items-center justify-center p-6">
      <div className="flex items-center gap-3 text-slate-600">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span>{text}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
