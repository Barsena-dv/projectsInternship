
const GlassCard = ({ children, className = '', opacity = 'bg-white/70' }) => {
    return (
        <div className={`glass ${opacity} rounded-xl p-6 shadow-sm ${className}`}>
            {children}
        </div>
    );
};

export default GlassCard;
