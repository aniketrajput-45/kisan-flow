import React, { useState } from 'react';
import { Server, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LiveQueueTable = ({ centres }) => {
  const { t } = useLanguage();
  const [redisOnline, setRedisOnline] = useState(true);

  return (
    <div className="gov-card rounded-lg shadow-sm border border-slate-300 p-5 md:p-6 mb-6 bg-white">
      
      {/* Header with Title & Redis Degraded Simulation Toggle */}
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
          {/* Redis Status / Simulate Failure Toggle (Req Section 15) */}
          <button
            onClick={() => setRedisOnline(!redisOnline)}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border transition ${
              redisOnline
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
            }`}
            title="Toggle between online Redis and degraded live telemetry mode"
          >
            <Server className={`w-3.5 h-3.5 ${redisOnline ? 'text-emerald-600' : 'text-amber-700 animate-pulse'}`} />
            <span>
              {redisOnline ? t.admin.queueDegradedToggle : 'Redis Degraded (Active)'}
            </span>
          </button>
        </div>
      </div>

      {/* Redis Degraded State Non-Blocking Banner (Section 15) */}
      {!redisOnline && (
        <div className="mt-4 p-3.5 bg-amber-50 border-l-4 border-amber-500 rounded-r text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">
              {t.admin.queueUnavailableWarning}
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
              <th className="py-3 px-4">{t.admin.colCapacity}</th>
              <th className="py-3 px-4">{t.admin.colQueue}</th>
              <th className="py-3 px-4">{t.admin.colAvgWait}</th>
              <th className="py-3 px-4 text-center">{t.admin.colStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
            {centres.map((c, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <tr 
                  key={c.code} 
                  className={`hover:bg-blue-50/50 transition ${isEven ? 'bg-white' : 'bg-slate-50/70'}`}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {c.name}
                    <div className="text-[10px] text-slate-400 font-normal">Lane Serving: {c.live_token}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#1E3A8A]">
                    {c.code}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {c.capacity} tokens/day
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {redisOnline ? (
                      <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {c.current_queue} farmers
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unavailable (—)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {redisOnline ? (
                      `${c.avg_wait_mins} mins`
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {redisOnline ? (
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold">
                        {c.status === 'NORMAL' && (
                          <span className="bg-green-100 text-green-800 border border-green-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            {t.admin.statusNormal}
                          </span>
                        )}
                        {c.status === 'MODERATE' && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            {t.admin.statusModerate}
                          </span>
                        )}
                        {c.status === 'CONGESTED' && (
                          <span className="bg-red-100 text-red-800 border border-red-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                            {t.admin.statusCongested}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                        Telemetry Paused
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
