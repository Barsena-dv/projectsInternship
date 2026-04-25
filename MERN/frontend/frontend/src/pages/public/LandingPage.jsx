import { Link } from 'react-router-dom';
import { 
  FiMapPin, FiShield, FiTrendingUp, FiCheckCircle, 
   FiDollarSign, FiArrowRight, FiActivity
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
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-300/20 rounded-full mb-8 reveal">
                     <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                     <p className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">Trusted Lost and Found Network</p>
           </div>
           
           <h1 className="hero-title reveal delay-100">
                   Recover What Matters <br />
                   <span className="text-cyan-300">With Verified People and Secure Payments.</span>
           </h1>
           
           <p className="hero-subtitle reveal delay-200">
                   PostNFind connects owners and finders through structured requests, proof-based milestones,
                   and escrow-backed payouts so every recovery journey stays transparent.
           </p>

           <div className="flex flex-wrap items-center justify-center gap-6 reveal delay-300">
              <Link to="/register" className="landing-btn-primary group flex items-center gap-2">
                         Create Free Account <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="landing-btn-outline">
                         Sign In
              </Link>
           </div>

                <div className="landing-quick-stats reveal delay-400">
                   <div className="landing-quick-stat">
                      <span className="landing-quick-value">98%</span>
                      <span className="landing-quick-label">successful handoffs</span>
                   </div>
                   <div className="landing-quick-stat">
                      <span className="landing-quick-value">24M+</span>
                      <span className="landing-quick-label">rewards settled</span>
                   </div>
                   <div className="landing-quick-stat">
                      <span className="landing-quick-value">12k+</span>
                      <span className="landing-quick-label">active users</span>
                   </div>
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
               <h3 className="text-2xl font-black text-white mb-4">For Owners</h3>
               <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                  Create a recovery request, define your budget and evidence, and receive updates from verified finders working your case.
               </p>
               <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-amber-500" /> Guided request creation
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-amber-500" /> Evidence-first validation
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-amber-500" /> Escrow-secured payout flow
                  </li>
               </ul>
               <Link to="/register?role=owner" className="flex items-center gap-2 text-amber-500 font-black tracking-wider text-xs uppercase group-hover:translate-x-2 transition-transform">
                  Post Recovery Request <FiArrowRight />
               </Link>
            </article>

            {/* Finder Path */}
            <article className="landing-card border-sky-500/20 bg-sky-500/5 group hover:bg-sky-500/10 h-full reveal delay-200">
               <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 mb-8 transform transition-transform group-hover:-rotate-6 overflow-hidden">
                  <img src="/assets/finder-benefit.png" alt="Finder Benefit" className="w-full h-full object-cover opacity-80" />
               </div>
               <h3 className="text-2xl font-black text-white mb-4">For Finders</h3>
               <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                  Browse requests near your location, submit proof at each step, and receive guaranteed payouts for successful recoveries.
               </p>
               <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-sky-400" /> Clear assignment requirements
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-sky-400" /> Milestone-based reward releases
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <FiCheckCircle className="text-sky-400" /> Reputation and trust badges
                  </li>
               </ul>
               <Link to="/register?role=finder" className="flex items-center gap-2 text-sky-400 font-black tracking-wider text-xs uppercase group-hover:translate-x-2 transition-transform">
                  Start as Finder <FiArrowRight />
               </Link>
            </article>

         </div>
      </section>

      {/* Trust & Security Section */}
      <section id="security" className="landing-section">
         <div className="max-w-4xl mx-auto text-center mb-20 reveal">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Built for Trust at Every Step</h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto border-l-2 border-cyan-300 pl-6 text-left">
               Verified identities, documented progress, and escrow-backed settlements reduce risk for both owners and finders.
            </p>
         </div>

         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 reveal">
               <FiShield className="text-cyan-300 mb-6" size={32} />
               <h4 className="font-black text-white mb-2 uppercase tracking-widest">Escrow Security</h4>
               <p className="text-xs text-slate-500 leading-relaxed">
                  Owner funds remain protected in escrow and are released only when proof-based milestones are completed.
               </p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 reveal delay-100">
               <FiTrendingUp className="text-emerald-400 mb-6" size={32} />
               <h4 className="font-black text-white mb-2 uppercase tracking-widest">Performance Reputation</h4>
               <p className="text-xs text-slate-500 leading-relaxed">
                  Reliable completion history improves visibility and helps top performers get higher-value assignments.
               </p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 reveal delay-200">
               <FiActivity className="text-rose-400 mb-6" size={32} />
               <h4 className="font-black text-white mb-2 uppercase tracking-widest">Operational Oversight</h4>
               <p className="text-xs text-slate-500 leading-relaxed">
                  Admin activity logs and dispute workflows help resolve issues quickly and keep the platform fair.
               </p>
            </div>
         </div>
      </section>

      {/* Stats Proof */}
      <section id="results" className="landing-section border-t border-white/5">
         <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-12 reveal">
            <div>
               <p className="text-6xl font-black text-white tracking-tighter">98%</p>
               <p className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">Recovery Completion</p>
            </div>
            <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
            <div>
               <p className="text-6xl font-black text-white tracking-tighter">₹24M+</p>
               <p className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">Rewards Settled</p>
            </div>
            <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
            <div>
               <p className="text-6xl font-black text-white tracking-tighter">12k+</p>
               <p className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">Active Participants</p>
            </div>
            <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
            <div className="flex-1 text-right">
               <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-xs ml-auto">
                  Teams, students, and communities use PostNFind to improve recovery outcomes with less friction.
               </p>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="landing-section">
         <div className="max-w-7xl mx-auto p-12 md:p-24 rounded-[3rem] bg-gradient-to-br from-cyan-400 to-blue-700 shadow-2xl shadow-cyan-500/20 text-center relative overflow-hidden group reveal">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Ready to Present a Better Recovery Experience?</h2>
               <Link to="/register" className="inline-block px-12 py-5 bg-white text-sky-900 rounded-2xl font-black text-xl uppercase tracking-wider hover:scale-105 transition-all shadow-xl shadow-slate-900/40">
                  Start with PostNFind
               </Link>
            </div>
         </div>
      </section>
    </div>
  );
};

export default LandingPage;
