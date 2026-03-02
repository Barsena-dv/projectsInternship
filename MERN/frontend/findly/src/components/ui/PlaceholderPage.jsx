import GlassCard from './GlassCard';

const PlaceholderPage = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <GlassCard className="max-w-md w-full border-dashed border-2 border-gray-300 bg-white/40">
                <div className="mb-4 text-primary-blue">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
                <p className="text-text-secondary">
                    This feature is currently under development. Please check back later.
                </p>
            </GlassCard>
        </div>
    );
};

export default PlaceholderPage;
