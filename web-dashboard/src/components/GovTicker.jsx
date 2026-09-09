import React from 'react';
import { Bell } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const GovTicker = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-[#FEF3C7] border-b border-[#FCD34D] text-[#92400E] px-4 py-1.5 text-xs flex items-center shadow-inner">
      <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider bg-[#F59E0B] text-white px-2.5 py-0.5 rounded text-[10px] mr-3 shrink-0 shadow-sm">
        <Bell className="w-3 h-3 animate-pulse" />
        <span>{t.ticker.notice}</span>
      </div>
      <div className="overflow-hidden whitespace-nowrap w-full">
        <div className="inline-block font-medium text-[11px] text-slate-800">
          🌾 {t.ticker.text}
        </div>
      </div>
    </div>
  );
};

export default GovTicker;
