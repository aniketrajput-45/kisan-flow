import React, { useState } from 'react';
import { Server, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LiveQueueTable = ({ centres = [], queueAvailable = true }) => {
  const { t } = useLanguage();

  return (
    <div className="gov-card rounded-lg shadow-sm border border-slate-300 p-5 md:p-6 mb-6 bg-white">
      
      {/* Header with Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base md:text-lg font-bold text-[#0F2253] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]"></span>
            {t.admin.liveMandiTableTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time queue length & serving telemetry from edge mandi terminals
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border ${
            queueAvailable ? 'bg-green-50 text-green-800 border-green-300' : 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
          }`}>
            <Server className={`w-3.5 h-3.5 ${queueAvailable ? 'text-emerald-600' : 'text-amber-700 animate-pulse'}`} />
            <span>{queueAvailable ? 'Redis Queue Online' : 'Redis Queue Unavailable'}</span>
          </div>
        </div>
      </div>

      {/* Redis Degraded State Non-Blocking Banner */}
      {!queueAvailable && (
        <div className="mt-4 p-3.5 bg-amber-50 border-l-4 border-amber-500 rounded-r text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">
              {t.admin.queueUnavailableWarning || 'Live queue temporarily unavailable'}
            </div>
            <div className="text-[11px] text-amber-800 mt-0.5">
              Notice: Queue depth counters are marked unavailable. PostgreSQL authoritative procurement and payment ledgers continue functioning uninterrupted.
            </div>
          </div>
        </div>
      )}

      {/* Table with Zebra Striping */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 uppercase tracking-wider font-bold text-[11px]">
              <th className="py-3 px-4">{t.admin.colCentre}</th>
              <th className="py-3 px-4">{t.admin.colCode}</th>
              <th className="py-3 px-4">{t.admin.colQueue}</th>
              <th className="py-3 px-4">Currently Processing</th>
              <th className="py-3 px-4 text-center">{t.admin.colStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
            {centres.map((c, idx) => {
              const isEven = idx % 2 === 0;
              const qLen = c.queue_length;
              return (
                <tr 
                  key={c.centre_id || c.id || idx} 
                  className={`hover:bg-blue-50/50 transition ${isEven ? 'bg-white' : 'bg-slate-50/70'}`}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {c.centre_name || c.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#1E3A8A]">
                    {c.centre_code || c.code || `CNT-${c.centre_id}`}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {queueAvailable && qLen !== null && qLen !== undefined ? (
                      <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {qLen} farmers
                      </span>
                    ) : (
                      <span className="text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Unavailable
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                    {queueAvailable && c.currently_processing ? (
                      <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                        {c.currently_processing}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {queueAvailable ? (
                      <span className="bg-green-100 text-green-800 border border-green-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 font-bold">
                        Telemetry Degraded
                      </span>
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

export default LiveQueueTable;
