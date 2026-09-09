import React from 'react';
import { Building2, Users, Scale, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AdminKPIs = ({ stats }) => {
  const { t } = useLanguage();

  const {
    active_centres = 3,
    farmers_in_queue = 58,
    total_procured_tons = 91.4,
    avg_wait_minutes = 18,
  } = stats || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Card 1: Active Centres */}
      <div className="gov-card rounded-lg p-4 border-l-4 border-l-[#1E3A8A] flex flex-col justify-between shadow-sm hover:shadow transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {t.admin.activeCentres}
          </span>
          <div className="w-8 h-8 rounded bg-blue-50 text-[#1E3A8A] flex items-center justify-center border border-blue-200">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl lg:text-3xl font-extrabold text-[#0F2253] font-mono">
            {active_centres}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-slate-600">Paschim Bardhaman</span>
            <span className="text-emerald-700 font-bold">100% Online</span>
          </div>
        </div>
      </div>

      {/* Card 2: Farmers in Queue */}
      <div className="gov-card rounded-lg p-4 border-l-4 border-l-[#D97706] flex flex-col justify-between shadow-sm hover:shadow transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {t.admin.farmersQueue}
          </span>
          <div className="w-8 h-8 rounded bg-amber-50 text-[#D97706] flex items-center justify-center border border-amber-200">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl lg:text-3xl font-extrabold text-[#B45309] font-mono">
            {farmers_in_queue}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-slate-600">Across 3 Mandis</span>
            <span className="text-amber-700 font-semibold">Active Tokens</span>
          </div>
        </div>
      </div>

      {/* Card 3: Total Procured Today */}
      <div className="gov-card rounded-lg p-4 border-l-4 border-l-[#138808] flex flex-col justify-between shadow-sm hover:shadow transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {t.admin.totalProcured}
          </span>
          <div className="w-8 h-8 rounded bg-green-50 text-[#138808] flex items-center justify-center border border-green-200">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl lg:text-3xl font-extrabold text-[#0E6606] font-mono">
            {total_procured_tons} <span className="text-sm font-sans font-medium text-slate-500">{t.admin.tons}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-slate-600">{(total_procured_tons * 10).toFixed(0)} {t.kpis.quintals}</span>
            <span className="text-emerald-700 font-bold">₹2,275/Qtl MSP</span>
          </div>
        </div>
      </div>

      {/* Card 4: Avg Queue Wait Time */}
      <div className="gov-card rounded-lg p-4 border-l-4 border-l-purple-600 flex flex-col justify-between shadow-sm hover:shadow transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {t.admin.avgWaitTime}
          </span>
          <div className="w-8 h-8 rounded bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl lg:text-3xl font-extrabold text-purple-900 font-mono">
            {avg_wait_minutes} <span className="text-sm font-sans font-medium text-slate-500">{t.admin.mins}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-slate-600">Dynamic Rolling ETA</span>
            <span className="text-purple-700 font-bold">Target &lt;20m</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminKPIs;
