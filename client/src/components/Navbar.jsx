import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import { Sparkles, CreditCard, History, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, setPricingModalOpen } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to={isAuthenticated ? '/app' : '/'} className="flex items-center gap-2.5 group">
            <BrandLogo size="md" />
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition">
                Chat<span className="text-indigo-600">2</span>Excel<span className="text-indigo-600">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-1 font-mono">Autonomous Data Entry</span>
            </div>
          </Link>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to="/app"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isActive('/app')
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles size={13} className={isActive('/app') ? 'text-indigo-600' : 'text-slate-400'} />
            Workspace
          </Link>

          {isAuthenticated && (
            <Link
              to="/history"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isActive('/history')
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History size={13} />
              Exports
            </Link>
          )}

          <button
            onClick={() => setPricingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <CreditCard size={13} className="text-amber-500" />
            Pricing
          </button>
        </nav>

        {/* Right Section */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2.5">
            {/* Credit Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 font-medium font-mono text-[11px]">
                {user?.plan === 'pro_100' ? 'Unlimited' : `${user?.creditsRemaining ?? 0} Credits`}
              </span>
            </div>

            {/* Upgrade Button */}
            {user?.plan !== 'pro_100' && (
              <button
                onClick={() => setPricingModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/70 rounded-xl transition shadow-xs"
              >
                <CreditCard size={13} /> Upgrade
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition px-3 py-1.5 rounded-lg hover:bg-slate-50">
              Log in
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <span>Try Free</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

      </div>
    </header>
  );
}
