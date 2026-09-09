import React, { useState } from 'react';
import { Clock, AlertOctagon, CheckCircle2, Zap, DollarSign } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PaymentEscalation = ({ escalations, onForcePay, onSimulateDelay }) => {
  const { t } = useLanguage();
  const [processingId, setProcessingId] = useState(null);
  const [showSimulatedNotice, setShowSimulatedNotice] = useState(false);

  const handleForcePayClick = async (bookingId) => {
    setProcessingId(bookingId);
    await onForcePay(bookingId);
    setProcessingId(null);
  };

  const handleSimulateClick = () => {
    onSimulateDelay();
    setShowSimulatedNotice(true);
    setTimeout(() => setShowSimulatedNotice(false), 4000);
  };

  return (
    <div className="gov-card rounded-lg shadow-sm border border-slate-300 p-5 md:p-6 mb-6 bg-white">
      
      {/* Header with Title & WOW Feature 5 Simulate Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base md:text-lg font-bold text-[#0F2253] flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            {t.admin.escalationTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.admin.escalationDesc}
          </p>
        </div>

        {/* WOW Feature 5: Simulate 5-Day Delay Button */}
        <div>
          <button
            onClick={handleSimulateClick}
            className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-3.5 py-1.5 rounded text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 border border-amber-600"
            title="Inject delayed transactions (>5 days) to demonstrate admin escalation handling"
          >
            <Clock className="w-3.5 h-3.5 text-white" />
            <span>{t.admin.simulateBtn}</span>
          </button>
        </div>
      </div>

      {/* Simulated Notice Toast */}
      {showSimulatedNotice && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-400 text-amber-900 rounded text-xs flex items-center gap-2 animate-fadeIn">
          <Zap className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold">{t.admin.simulatedNotice}</span>
        </div>
      )}

      {/* Escalations Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 uppercase tracking-wider font-bold text-[11px]">
              <th className="py-3 px-4">{t.admin.colBookingId}</th>
              <th className="py-3 px-4">{t.admin.colFarmer}</th>
              <th className="py-3 px-4 text-center">{t.admin.colDaysPending}</th>
              <th className="py-3 px-4">{t.admin.colAmount}</th>
              <th className="py-3 px-4">{t.admin.colIssue}</th>
              <th className="py-3 px-4 text-center">{t.admin.colAction}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
            {escalations.map((p, idx) => {
              const isCredited = p.status === 'CREDITED';
              const isOverdue = p.days_pending >= 5;

              return (
                <tr 
                  key={p.id} 
                  className={`hover:bg-blue-50/50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-[#1E3A8A]">
                    #{p.id}
                    <div className="text-[10px] text-slate-400 font-sans font-normal">{p.centre_code}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{p.farmer_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">+91 {p.farmer_phone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {isCredited ? (
                      <span className="text-slate-400 font-normal">0</span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded font-extrabold text-xs inline-block ${
                        isOverdue 
                          ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.days_pending} days
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    <div className="text-[10px] text-slate-400 uppercase font-sans">{p.status}</div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs text-[11px] text-slate-600 leading-snug">
                    {p.reason}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {isCredited ? (
                      <span className="bg-green-100 text-green-800 border border-green-300 px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        {t.admin.paid}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleForcePayClick(p.id)}
                        disabled={processingId === p.id}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded text-[11px] shadow-xs flex items-center gap-1 mx-auto transition"
                        title="Force instantaneous credit clearance to farmer DBT account"
                      >
                        {processingId === p.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Zap className="w-3 h-3 text-amber-300" />
                        )}
                        <span>{t.admin.forcePayBtn}</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default PaymentEscalation;
