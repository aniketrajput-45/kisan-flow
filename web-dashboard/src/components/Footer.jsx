import React from 'react';
import { Shield, ExternalLink, PhoneCall } from 'lucide-react';
import TricolorStrip from './TricolorStrip';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto bg-[#0F172A] text-slate-300 text-xs border-t-4 border-[#1E3A8A]">
      <TricolorStrip />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800">
          
          {/* Col 1: Portal & Ministry */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <img src="/emblem.svg" alt="Emblem" className="h-6 w-auto brightness-200" />
              <span>{t.nav.portalName} — {t.nav.portalSubtitle}</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {t.footer.desc}
            </p>
            <div className="pt-2 flex items-center space-x-4 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-400" /> {t.footer.ssl}</span>
              <span>{t.footer.iso}</span>
            </div>
          </div>

          {/* Col 2: Important Mandi Links */}
          <div className="space-y-1.5 text-[11px]">
            <div className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 text-amber-400">
              {t.footer.quickLinks}
            </div>
            <ul className="space-y-1 text-slate-400">
              <li><a href="#rules" className="hover:text-amber-300 flex items-center gap-1">{t.footer.link1} <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li><a href="#moisture" className="hover:text-amber-300 flex items-center gap-1">{t.footer.link2} <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li><a href="#pfms" className="hover:text-amber-300 flex items-center gap-1">{t.footer.link3} <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li><a href="#mandi" className="hover:text-amber-300 flex items-center gap-1">{t.footer.link4} <ExternalLink className="w-2.5 h-2.5" /></a></li>
            </ul>
          </div>

          {/* Col 3: Support & Helpline */}
          <div className="space-y-1.5 text-[11px]">
            <div className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 text-amber-400">
              {t.footer.helpdesk}
            </div>
            <div className="space-y-1 text-slate-400">
              <div className="flex items-center gap-1.5 text-white font-medium">
                <PhoneCall className="w-3.5 h-3.5 text-green-400" />
                <span>{t.footer.tollFree}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Email: support.kisanflow@nic.in
              </div>
              <div className="text-[10px] text-slate-400">
                Control Room: +91 342 266 2101
              </div>
            </div>
          </div>

        </div>

        {/* Bottom NIC & Copyright notice */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[10px] gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">
              {t.footer.credits}
            </span>
          </div>
          <div className="text-slate-400">
            © 2026 {t.footer.copyright}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
