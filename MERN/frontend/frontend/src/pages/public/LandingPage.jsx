import { Link } from 'react-router-dom';
import { 
  FiMapPin, FiShield, FiTrendingUp, FiCheckCircle, 
  FiDollarSign, FiSearch, FiArrowRight, FiActivity, FiBriefcase 
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { getRoleHomePath } from '../../contexts/AuthContext';
import useScrollReveal from '../../hooks/useScrollReveal';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  useScrollReveal();

  // If already logged in, redirect to respective dashboard
  if (isAuthenticated && user) {
     return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return (
    <div className="landing-wrapper">
      {/* Hero Section */}
      <section className="landing-hero relative overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none overflow-hidden flex items-center justify-center">
           <img 
             src="/assets/landing-hero.png" 
             alt="PostNFind Digital Grid" 
             className="w-full h-full object-cover scale-110 blur-sm"
           />
        </div>

        {/* Radiant Glows */}
        <div className="landing-glow top-[-200px] left-[-200px]" />
        <div className="landing-glow bottom-[-200px] right-[-200px]" style={{ animationDelay: '2s' }} />

        {/* Floating Objects (Simulated Icons for now) */}
        <div className="floating-object top-1/4 left-10 hidden lg:block text-slate-500">
          <FiMapPin size={40} />
        </div>
        <div className="floating-object bottom-1/4 left-20 hidden lg:block text-indigo-400" style={{ animationDelay: '1.5s' }}>
          <FiShield size={32} />
        </div>
        <div className="floating-object top-1/3 right-10 hidden lg:block text-amber-500" style={{ animationDelay: '0.8s' }}>
          <FiDollarSign size={48} />
        </div>

        <div className="landing-hero-content pnf-page-enter">
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8 reveal">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Global Discovery Registry v2.0</p>
           </div>
           
           <h1 className="hero-title reveal delay-100">
             Lose It. <br />
             <span className="text-indigo-400">Let the World Find It.</span>
           </h1>
           
           <p className="hero-subtitle reveal delay-200">
             Bridging the gap between the things you value and the people who discover them. 
             A decentralized, escrow-protected ecosystem for professional lost & found recovery.
           </p>

           <div className="flex flex-wrap items-center justify-center gap-6 reveal delay-300">
              <Link to="/register" className="landing-btn-primary group flex items-center gap-2">
                 Join the Registry <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="landing-btn-outline">
                 Member Login
              </Link>
           </div>
        </div>
      </section>

      {/* Dual Role Sections */}
      <section id="how-it-works" className="landing-section bg-slate-900/20">
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Owner Path */}
            <article className="landing-card border-amber-500/20 bg-amber-500/5 group hover:bg-amber-500/10 h-full reveal">
               <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-8 transform transition-transform group-hover:rotate-6 overflow-hidden">
                  <img src="/assets/owner-benefit.png" alt="Owner Benefit" className="w-full h-full object-cover opacity-80" />
               </div>
               <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wider">I Lost Something</h3>
               <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                  Post a discovery request with an escrowed reward. Our verified finders will begin tracking and surveying across the designated grid.
               </p>
               <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-amber-500" /> Professional Grade Tracking
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-amber-500" /> Forensic Evidence Verification
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-amber-500" /> 85% Refund Guarantee (Basic)
                  </li>
               </ul>
               <Link to="/register?role=owner" className="flex items-center gap-2 text-amber-500 font-black tracking-widest text-xs uppercase group-hover:translate-x-2 transition-transform">
                  Post a Request <FiArrowRight />
               </Link>
            </article>

            {/* Finder Path */}
            <article className="landing-card border-sky-500/20 bg-sky-500/5 group hover:bg-sky-500/10 h-full reveal delay-200">
               <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 mb-8 transform transition-transform group-hover:-rotate-6 overflow-hidden">
                  <img src="/assets/finder-benefit.png" alt="Finder Benefit" className="w-full h-full object-cover opacity-80" />
               </div>
               <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wider">I Want to Discover</h3>
               <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                  Join as a discovery specialist. Browse the global mission registry, complete verifications, and earn guaranteed rewards for your time and success.
               </p>
               <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-sky-400" /> Guaranteed Participation Fee
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-sky-400" /> High-Discovery Success Bonuses
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-sky-400" /> Tiered Trust Badges
                  </li>
               </ul>
               <Link to="/register?role=finder" className="flex items-center gap-2 text-sky-400 font-black tracking-widest text-xs uppercase group-hover:translate-x-2 transition-transform">
                  Start Discovering <FiArrowRight />
               </Link>
            </article>

         </div>
      </section>

      {/* Trust & Security Section */}
      <section id="security" className="landing-section">
         <div className="max-w-4xl mx-auto text-center mb-20 reveal">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter">The 3-Way Split Protocol</h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto border-l-2 border-indigo-500 pl-6 text-left">
               Our proprietary settlement engine ensures that every linkage is fair. We solve the trust gap by splitting rewards between finding fees, discovery bonuses, and platform protection.
            </p>
         </div>

         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 reveal">
               <FiShield className="text-indigo-400 mb-6" size={32} />
               <h4 className="font-black text-white mb-2 uppercase tracking-widest">Escrow Hold</h4>
               <p className="text-xs text-slate-500 leading-relaxed">
                  Funds are locked at the moment of engagement, ensuring finders are rewarded and owners are protected.
               </p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 reveal delay-100">
               <FiTrendingUp className="text-emerald-400 mb-6" size={32} />
               <h4 className="font-black text-white mb-2 uppercase tracking-widest">Success Multipliers</h4>
               <p className="text-xs text-slate-500 leading-relaxed">
                  Higher Trust Ratings unlock tiered rewards and success-based multipliers for elite discovery specialists.
               </p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 reveal delay-200">
               <FiActivity className="text-rose-400 mb-6" size={32} />
               <h4 className="font-black text-white mb-2 uppercase tracking-widest">Real-time Telemetry</h4>
               <p className="text-xs text-slate-500 leading-relaxed">
                  Administrative oversight and suspicious jump detection maintain the absolute integrity of every mission.
               </p>
            </div>
         </div>
      </section>

      {/* Stats Proof */}
      <section className="landing-section border-t border-white/5">
         <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-12 reveal">
            <div>
               <p className="text-6xl font-black text-white tracking-tighter">98%</p>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Discovery Precision</p>
            </div>
            <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
            <div>
               <p className="text-6xl font-black text-white tracking-tighter">₹24M+</p>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Rewards Settled</p>
            </div>
            <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
            <div>
               <p className="text-6xl font-black text-white tracking-tighter">12k+</p>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Linkages</p>
            </div>
            <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
            <div className="flex-1 text-right">
               <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-xs ml-auto">
                  Join the thousands of users securing their belongings in the global registry.
               </p>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="landing-section">
         <div className="max-w-7xl mx-auto p-12 md:p-24 rounded-[3rem] bg-gradient-to-br from-indigo-500 to-indigo-900 shadow-2xl shadow-indigo-500/30 text-center relative overflow-hidden group reveal">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">Ready to Restore?</h2>
               <Link to="/register" className="inline-block px-12 py-5 bg-white text-indigo-900 rounded-2xl font-black text-xl uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/40">
                  Deploy Registry Now
               </Link>
            </div>
         </div>
      </section>
    </div>
  );
};

export default LandingPage;
