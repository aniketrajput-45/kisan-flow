import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PaymentBreakdownBar = ({ stats }) => {
  const { t } = useLanguage();

  const recorded = stats?.recorded ?? 0;
  const initiated = stats?.initiated ?? 0;
  const processing = stats?.processing ?? 0;
  const credited = stats?.credited ?? 0;

  const total = recorded + initiated + processing + credited;

  return (
    <div className="gov-card rounded-lg shadow-sm border border-slate-300 p-5 mb-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <h3 className="text-xs md:text-sm font-bold text-[#0F2253] uppercase tracking-wider">
          {t.admin.paymentSummaryTitle}
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">
          Total Batched: {total} Payouts (₹20.79 Lakhs)
        </span>
      </div>

      {/* Progress Flow Steps */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        
        {/* Step 1: RECORDED */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            1. {t.admin.recorded}
          </div>
          <div className="text-xl font-extrabold text-slate-800 font-mono mt-1">
            {recorded}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scale J-Form Saved</div>
        </div>

        {/* Step 2: INITIATED */}
        <div className="p-3 bg-blue-50/70 rounded border border-blue-200 text-center">
          <div className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
            2. {t.admin.initiated}
          </div>
          <div className="text-xl font-extrabold text-blue-900 font-mono mt-1">
            {initiated}
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5">DBT Batch Formed</div>
        </div>

        {/* Step 3: PROCESSING */}
        <div className="p-3 bg-amber-50/70 rounded border border-amber-200 text-center">
          <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
            3. {t.admin.processing}
          </div>
          <div className="text-xl font-extrabold text-amber-900 font-mono mt-1">
            {processing}
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5">Bank Gateway Push</div>
        </div>

        {/* Step 4: CREDITED */}
        <div className="p-3 bg-emerald-50 rounded border border-emerald-300 text-center">
          <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            4. {t.admin.credited}
          </div>
          <div className="text-xl font-extrabold text-emerald-900 font-mono mt-1">
            {credited}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Farmer Account Credited</div>
        </div>

      </div>
    </div>
  );
};

export default PaymentBreakdownBar;
