import GlassCard from '../components/ui/GlassCard';

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary-blue/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-deep-indigo/5 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm mb-4 border border-gray-100">
                        <svg className="w-8 h-8 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.519 1.298-3.003 2.103-4.5M3 13V6a2 2 0 012-2h14a2 2 0 012 2v7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">{title}</h1>
                    {subtitle && <p className="text-text-secondary mt-2">{subtitle}</p>}
                </div>

                <GlassCard className="border-gray-100 shadow-xl shadow-gray-200/50 relative z-10">
                    {children}
                </GlassCard>

                <div className="text-center mt-8 text-sm text-text-secondary">
                    &copy; {new Date().getFullYear()} PostNFind. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
