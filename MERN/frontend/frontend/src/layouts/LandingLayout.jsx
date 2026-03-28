import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { FiMenu, FiX, FiShield, FiGithub, FiTwitter, FiGlobe } from 'react-icons/fi';
import '../styles/landing.css';

const LandingLayout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-wrapper">
      <nav className={`landing-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <FiShield className="text-white" size={18} />
           </div>
           <span className="text-xl font-black text-white tracking-tight uppercase">PostNFind</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
           <a href="#how-it-works" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">How it Works</a>
           <a href="#security" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Security</a>
           <Link to="/login" className="text-sm font-bold text-white hover:text-indigo-400 transition-colors">Sign In</Link>
           <Link to="/register" className="px-5 py-2 bg-indigo-500 rounded-xl text-sm font-black text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all">
              Join the Registry
           </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
           {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
           <div className="fixed inset-0 top-[80px] bg-slate-950 z-[90] flex flex-col p-8 gap-6 animate-in slide-in-from-top duration-300">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black text-white">How it Works</a>
              <a href="#security" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black text-white">Security</a>
              <div className="h-[1px] bg-white/5 my-4" />
              <Link to="/login" className="text-xl font-bold text-indigo-400">Sign In</Link>
              <Link to="/register" className="px-6 py-4 bg-indigo-500 rounded-2xl text-xl font-black text-white text-center">
                 Join Registry
              </Link>
           </div>
        )}
      </nav>

      <main>
        <Outlet />
      </main>

      {/* Modern Public Footer */}
      <footer className="landing-section bg-slate-950/50 border-t border-white/5 pb-20">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto">
            <div className="col-span-1 md:col-span-1">
               <div className="flex items-center gap-2 mb-6">
                  <FiShield className="text-indigo-500" size={24} />
                  <span className="text-xl font-black text-white tracking-widest">POSTNFIND</span>
               </div>
               <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  The global decentralized registry for lost valuables. Bridging the gap between recovery and discovery through trust.
               </p>
               <div className="flex gap-4">
                  <FiTwitter className="text-slate-500 hover:text-white cursor-pointer transition-colors" />
                  <FiGithub className="text-slate-500 hover:text-white cursor-pointer transition-colors" />
                  <FiGlobe className="text-slate-500 hover:text-white cursor-pointer transition-colors" />
               </div>
            </div>

            <div>
               <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">For Owners</h4>
               <ul className="space-y-4 text-sm text-slate-500 font-medium">
                  <li className="hover:text-amber-500 transition-colors cursor-pointer">Post Reward Request</li>
                  <li className="hover:text-amber-500 transition-colors cursor-pointer">Escrow Protection</li>
                  <li className="hover:text-amber-500 transition-colors cursor-pointer">Identity Verification</li>
               </ul>
            </div>

            <div>
               <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">For Finders</h4>
               <ul className="space-y-4 text-sm text-slate-500 font-medium">
                  <li className="hover:text-sky-500 transition-colors cursor-pointer">Browse Discovery Mission</li>
                  <li className="hover:text-sky-500 transition-colors cursor-pointer">Guaranteed Payouts</li>
                  <li className="hover:text-sky-500 transition-colors cursor-pointer">Trust Level Badges</li>
               </ul>
            </div>

            <div>
               <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">Platform</h4>
               <ul className="space-y-4 text-sm text-slate-500 font-medium">
                  <li className="hover:text-indigo-400 transition-colors cursor-pointer">Our Vision</li>
                  <li className="hover:text-indigo-400 transition-colors cursor-pointer">Security Protocol</li>
                  <li className="hover:text-indigo-400 transition-colors cursor-pointer">Dispute Resolution</li>
               </ul>
            </div>
         </div>
         
         <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">© 2026 POSTNFIND OPERATIONS GROUP. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">
               <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
               <span className="hover:text-white transition-colors cursor-pointer">Security Audit</span>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingLayout;
