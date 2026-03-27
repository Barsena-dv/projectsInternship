const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="pnf-panel flex min-h-40 items-center justify-center p-6">
      <div className="flex items-center gap-3 pnf-muted">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-(--pnf-primary) border-t-transparent" />
        <span>{text}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
