import React from 'react';
import { Building2, Users, Scale, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AdminKPIs = ({ stats }) => {
  const { t } = useLanguage();

  const totalFarmers = stats?.farmers?.total ?? 0;
  const inQueueCount = stats?.bookings?.in_queue ?? 0;
  const totalProcuredKg = stats?.procurement?.total_weight_kg ?? 0;
  const totalProcuredTons = (totalProcuredKg / 1000).toFixed(1);
  const totalAmount = stats?.procurement?.total_amount ?? 0;
  const activeCentresCount = Array.isArray(stats?.centres) ? stats.centres.length : 0;

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
            {activeCentresCount}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-slate-600">Registered Farmers: {totalFarmers}</span>
            <span className="text-emerald-700 font-bold">Operational Centres</span>
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
            {inQueueCount}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-slate-600">Total Bookings Today: {stats?.bookings?.total ?? 0}</span>
            <span className="text-amber-700 font-semibold">In Live Queue</span>
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
            {totalProcuredTons} <span className="text-sm font-sans font-medium text-slate-500">{t.admin.tons}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-slate-600">{(totalProcuredKg / 100).toFixed(0)} {t.kpis.quintals}</span>
            <span className="text-emerald-700 font-bold">Completed: {stats?.procurement?.completed_count ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Card 4: Total Payout Amount */}
      <div className="gov-card rounded-lg p-4 border-l-4 border-l-purple-600 flex flex-col justify-between shadow-sm hover:shadow transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Total Procurement Payout
          </span>
          <div className="w-8 h-8 rounded bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl lg:text-2xl font-extrabold text-purple-900 font-mono">
            ₹{parseFloat(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-slate-600">Credited: {stats?.payments?.credited ?? 0}</span>
            <span className="text-purple-700 font-bold">Recorded: {stats?.payments?.recorded ?? 0}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminKPIs;
