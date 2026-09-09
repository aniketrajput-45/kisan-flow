import React, { useState } from 'react';
import { MessageSquareWarning, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DisputeTable = ({ disputes, onResolve }) => {
  const { t } = useLanguage();
  const [resolvingId, setResolvingId] = useState(null);

  const handleResolveClick = async (procId) => {
    setResolvingId(procId);
    await onResolve(procId);
    setResolvingId(null);
  };

  return (
    <div className="gov-card rounded-lg shadow-sm border border-slate-300 p-5 md:p-6 mb-6 bg-white">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-base md:text-lg font-bold text-[#0F2253] flex items-center gap-2">
          <MessageSquareWarning className="w-5 h-5 text-red-600" />
          {t.admin.disputeTitle}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t.admin.disputeDesc}
        </p>
      </div>

      {/* Disputes Table */}
      <div className="mt-4 overflow-x-auto">
        {disputes.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded border border-dashed border-slate-300">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="font-semibold text-slate-700">{t.admin.noDisputes}</div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 uppercase tracking-wider font-bold text-[11px]">
                <th className="py-3 px-4">{t.admin.colProcId}</th>
                <th className="py-3 px-4">{t.admin.colFarmer}</th>
                <th className="py-3 px-4">{t.admin.colCrop}</th>
                <th className="py-3 px-4">{t.admin.colIssue}</th>
                <th className="py-3 px-4 text-center">{t.admin.colStatusTag}</th>
                <th className="py-3 px-4 text-center">{t.admin.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {disputes.map((d, idx) => {
                const isResolved = d.status === 'RESOLVED';
                return (
                  <tr 
                    key={d.id} 
                    className={`hover:bg-blue-50/50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1E3A8A]">
                      #{d.id}
                      <div className="text-[10px] text-slate-400 font-sans font-normal">{d.timestamp}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{d.farmer_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">+91 {d.farmer_phone}</div>
                      <div className="text-[10px] text-slate-400">{d.centre_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{d.crop}</div>
                      <div className="text-slate-600 font-mono">{d.weight_kg.toLocaleString()} kg</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-[11px] text-slate-700 leading-snug">
                      <div className="p-2 bg-red-50/70 border border-red-200 rounded text-red-900">
                        {d.issue}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isResolved ? (
                        <span className="bg-green-100 text-green-800 border border-green-300 px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          {t.admin.resolved}
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 border border-red-300 px-2.5 py-1 rounded text-[10px] font-extrabold inline-flex items-center gap-1 shadow-xs animate-pulse">
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          {t.admin.disputed}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isResolved ? (
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Closed by DFSO
                        </span>
                      ) : (
                        <button
                          onClick={() => handleResolveClick(d.id)}
                          disabled={resolvingId === d.id}
                          className="bg-[#1E3A8A] hover:bg-[#0F2253] text-white px-3 py-1.5 rounded text-[11px] font-bold transition shadow-xs flex items-center gap-1 mx-auto"
                        >
                          {resolvingId === d.id ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>{t.admin.resolveBtn}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default DisputeTable;
