import React from 'react';
import { Ticket, Scale, Package, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const KPIStrip = ({ kpiData }) => {
  const { t } = useLanguage();

  const {
    totalTokensToday = '—',
    servedTokens = '—',
    pendingTokens = '—',
    procuredWeightTons = '—',
    availableBardanaBags = '—',
    allocatedBardanaBags = '—',
    currentServingToken = '—',
  } = kpiData || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Card 1: Total Tokens Today (Blue) */}
      <div className="gov-card rounded p-4 border-l-4 border-l-[#0F2253] flex flex-col justify-between shadow-sm hover:shadow transition bg-white">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {t.kpis.tokensToday}
          </span>
          <div className="w-8 h-8 rounded bg-blue-50 text-[#1E3A8A] flex items-center justify-center border border-blue-200">
            <Ticket className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl lg:text-3xl font-extrabold text-[#0F2253] font-mono">
            {totalTokensToday}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span className="text-green-600 font-semibold">✓ {servedTokens} {t.kpis.served}</span>
            <span className="text-amber-600 font-semibold">⏳ {pendingTokens} {t.kpis.waiting}</span>
          </div>
        </div>
      </div>

      {/* Card 2: Procured Quantity (Green) */}
      <div className="gov-card rounded p-4 border-l-4 border-l-[#138808] flex flex-col justify-between shadow-sm hover:shadow transition bg-white">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {t.kpis.procuredQty}
          </span>
          <div className="w-8 h-8 rounded bg-green-50 text-[#138808] flex items-center justify-center border border-green-200">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl lg:text-3xl font-extrabold text-[#0E6606] font-mono">
            {procuredWeightTons} <span className="text-sm font-sans font-medium text-slate-500">{t.kpis.tons}</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span className="text-slate-600">{(procuredWeightTons * 10).toFixed(0)} {t.kpis.quintals}</span>
            <span className="text-green-700 font-semibold">{t.kpis.mspRate}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Available Bardana / Bags (Orange) -> WOW Feature 3 */}
      <div className="gov-card rounded p-4 border-l-4 border-l-[#FF9933] flex flex-col justify-between shadow-sm hover:shadow transition bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t.kpis.bardanaBags}
            </span>
            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-300">
              {t.kpis.stockBadge}
            </span>
          </div>
          <div className="w-8 h-8 rounded bg-amber-50 text-[#D97706] flex items-center justify-center border border-amber-200">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl lg:text-3xl font-extrabold text-[#B45309] font-mono">
            {availableBardanaBags.toLocaleString('en-IN')} <span className="text-xs font-sans font-medium text-slate-500">{t.kpis.bagsUnit}</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 border-t border-amber-100 pt-2">
            <span className="text-slate-600">Jute 50kg</span>
            <span className="text-amber-700 font-medium">{t.kpis.allocated}: {allocatedBardanaBags}</span>
          </div>
        </div>
      </div>

      {/* Auxiliary Card 4: Live Mandi Serving Lane */}
      <div className="gov-card rounded p-4 border-l-4 border-l-[#0F2253] flex flex-col justify-between shadow-sm hover:shadow transition bg-white">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {t.kpis.weighLane}
          </span>
          <div className="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
            <Activity className="w-4 h-4 animate-pulse text-green-600" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl lg:text-3xl font-extrabold text-[#1E3A8A] font-mono flex items-center gap-2">
            {currentServingToken}
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span className="text-slate-600">Dharmkanta</span>
            <span className="text-blue-700 font-semibold">{t.kpis.activeIntake}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default KPIStrip;
