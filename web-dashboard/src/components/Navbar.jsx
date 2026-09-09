import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, User, Building2, Clock, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { lang, t } = useLanguage();
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      };
      const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
      setTime(now.toLocaleString(locale, options) + ' IST');
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <header className="bg-gradient-to-r from-[#0F2253] via-[#1E3A8A] to-[#1E40AF] text-white shadow-md border-b-2 border-[#FF9933]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Branding & Portal Name */}
        <div className="flex items-center space-x-3">
          <div className="bg-white/10 p-2 rounded border border-white/20 flex items-center justify-center">
            <span className="text-2xl" role="img" aria-label="grain">🌾</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg md:text-xl tracking-wide text-white drop-shadow-sm">
                {t.nav.portalName}
              </span>
              <span className="bg-[#FF9933] text-[#0F2253] text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                {t.nav.nodalBadge}
              </span>
            </div>
            <div className="text-xs text-blue-100 font-medium">
              {t.nav.portalSubtitle}
            </div>
          </div>
        </div>

        {/* Right: Officer Details, Centre badge, Clock & Logout */}
        <div className="flex items-center flex-wrap gap-3 text-xs">
          {/* Live IST Clock */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-black/25 px-2.5 py-1.5 rounded border border-white/10 text-blue-100">
            <Clock className="w-3.5 h-3.5 text-[#FF9933]" />
            <span className="font-mono text-[11px]">{time}</span>
          </div>

          {/* Centre Badge */}
          <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1.5 rounded border border-white/15 text-white">
            <Building2 className="w-3.5 h-3.5 text-green-300" />
            <span className="font-semibold">{t.nav.centreName}</span>
            <span className="bg-blue-900/80 text-[10px] px-1.5 py-0.5 rounded font-mono text-amber-300">
              BDW-01
            </span>
          </div>

          {/* User Profile info */}
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded border border-white/15">
            <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-200">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left leading-none">
              <div className="font-bold text-white text-[11px]">
                {user?.name || (lang === 'hi' ? 'सुरेश शर्मा' : 'Suresh Sharma')}
              </div>
              <div className="text-[10px] text-blue-200 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-green-400" />
                {user?.role === 'ADMIN' ? t.nav.adminRole : t.nav.officerRole}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center space-x-1 bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded border border-red-400/30 transition shadow-sm font-medium"
            title={t.nav.logout}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">{t.nav.logout}</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
