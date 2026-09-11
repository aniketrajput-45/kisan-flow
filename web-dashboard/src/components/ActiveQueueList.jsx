import React, { useState, useMemo } from 'react';
import { Users, Clock, ArrowRight, RefreshCw, CheckCircle2, UserCheck, ShieldCheck, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ActiveQueueList = ({ queue = [], loading = false, selectedBooking = null, onSelectBooking, onRefresh }) => {
  const { t } = useLanguage();
  const [selectedSlot, setSelectedSlot] = useState('ALL');
  const selectedId = selectedBooking?.id || selectedBooking?.booking_id;

  const formatSlotTime = (startTime, endTime) => {
    if (!startTime) return '09:00 - 11:00';
    const cleanStart = startTime.substring(0, 5);
    const cleanEnd = endTime ? endTime.substring(0, 5) : '';
    return cleanEnd ? `${cleanStart} - ${cleanEnd}` : cleanStart;
  };

  // Strictly filter out any completed bookings so processed farmers disappear from screen
  const activeQueue = useMemo(() => {
    return (queue || []).filter((item) => item.status !== 'COMPLETED');
  }, [queue]);

  // Compute live count of farmers per slot
  const slotStats = useMemo(() => {
    const stats = {};
    activeQueue.forEach((item) => {
      const slotLabel = formatSlotTime(item.start_time, item.end_time);
      stats[slotLabel] = (stats[slotLabel] || 0) + 1;
    });
    return stats;
  }, [activeQueue]);

  // Unique slot list
  const availableSlots = useMemo(() => {
    const defaultSlots = ['09:00 - 11:00', '11:00 - 13:00', '14:00 - 16:00', '16:00 - 18:00'];
    const dynamicSlots = Object.keys(slotStats);
    const combined = Array.from(new Set([...defaultSlots, ...dynamicSlots]));
    return combined.sort();
  }, [slotStats]);

  // Filter displayed queue by selected slot
  const displayedQueue = useMemo(() => {
    if (selectedSlot === 'ALL') return activeQueue;
    return activeQueue.filter((item) => formatSlotTime(item.start_time, item.end_time) === selectedSlot);
  }, [activeQueue, selectedSlot]);

  return (
    <div className="gov-card rounded-lg shadow-sm border border-slate-300 p-5 md:p-6 mb-6 bg-white relative">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded bg-blue-100 text-[#1E3A8A]">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-base md:text-lg font-black text-[#0F2253]">
              {t.liveQueue?.title || 'Live Gate Queue & Slot Breakdown'}
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {activeQueue.length} {t.liveQueue?.currentlyWaiting || 'Active in Queue'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live queue of farmers booked for today across procurement slots. Processed farmers are automatically removed.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Refresh queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1E3A8A] ${loading ? 'animate-spin' : ''}`} />
            <span>{t.dashboard?.refresh || 'Refresh Queue'}</span>
          </button>
        </div>
      </div>

      {/* Slot Breakdown Pills / Filter Bar */}
      <div className="mt-4 pt-1 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
          <Filter className="w-3.5 h-3.5 text-[#1E3A8A]" />
          <span>Filter by Slot (स्लॉट अनुसार किसान देखें):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedSlot('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedSlot === 'ALL'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <span>All Slots</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                selectedSlot === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {activeQueue.length}
            </span>
          </button>

          {availableSlots.map((slotTime) => {
            const count = slotStats[slotTime] || 0;
            const isSelected = selectedSlot === slotTime;
            return (
              <button
                key={slotTime}
                type="button"
                onClick={() => setSelectedSlot(slotTime)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : count > 0
                    ? 'bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] border border-blue-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{slotTime}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : count > 0
                      ? 'bg-blue-200 text-[#0F2253]'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Queue Body */}
      {loading && activeQueue.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1E3A8A] mb-2" />
          <p className="text-xs font-semibold">Loading live queue status...</p>
        </div>
      ) : displayedQueue.length === 0 ? (
        /* Empty State */
        <div className="py-10 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {selectedSlot === 'ALL'
              ? 'No farmers are currently waiting in the queue.'
              : `No farmers currently waiting in Slot (${selectedSlot}).`}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {selectedSlot === 'ALL'
              ? 'When a farmer books or arrives, their token will automatically appear here. As weighment completes, they are automatically removed.'
              : 'Switch to "All Slots" or select another slot above to view active farmers.'}
          </p>
        </div>
      ) : (
        /* Queue Table */
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-14 text-center">{t.liveQueue?.position || 'Seq'}</th>
                <th className="py-3 px-3">{t.liveQueue?.token || 'Token No.'}</th>
                <th className="py-3 px-3">{t.liveQueue?.farmer || 'Farmer & Contact'}</th>
                <th className="py-3 px-3">{t.liveQueue?.cropQuota || 'Crop & Quota'}</th>
                <th className="py-3 px-3">Slot Window</th>
                <th className="py-3 px-3">{t.liveQueue?.status || 'Gate Status'}</th>
                <th className="py-3 px-3 text-right">{t.liveQueue?.action || 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {displayedQueue.map((item, idx) => {
                const isItemActive =
                  selectedId &&
                  (String(item.id) === String(selectedId) || String(item.booking_id) === String(selectedId));
                const isServing = item.status === 'PROCESSING';

                return (
                  <tr
                    key={item.id || item.token_number || idx}
                    className={`transition-colors hover:bg-blue-50/40 ${
                      isItemActive ? 'bg-blue-50/80 font-medium' : isServing ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {/* Position */}
                    <td className="py-3 px-3 text-center">
                      {isServing ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          Serving
                        </span>
                      ) : (
                        <span className="inline-block w-6 h-6 leading-6 rounded-full bg-slate-100 border border-slate-300 font-bold text-slate-700 text-[11px]">
                          {idx + 1}
                        </span>
                      )}
                    </td>

                    {/* Token Number */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-sm text-[#0F2253]">
                        {item.token_number}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        ID: #{item.id}
                      </div>
                    </td>

                    {/* Farmer & Contact */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">
                        {item.farmer_name || 'Farmer'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.farmer_phone ? `+91 ${item.farmer_phone}` : '—'}
                      </div>
                    </td>

                    {/* Crop & Quota */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">
                        {item.crop || 'Wheat'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold">
                        {Number(item.quantity_kg || 0).toLocaleString('en-IN')} kg
                      </div>
                    </td>

                    {/* Slot Time */}
                    <td className="py-3 px-3 text-slate-700">
                      <div className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded border border-slate-200 font-semibold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatSlotTime(item.start_time, item.end_time)}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      {item.status === 'PROCESSING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping"></span>
                          <span>In Weighment</span>
                        </span>
                      ) : item.status === 'IN_QUEUE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          <span>In Queue</span>
                        </span>
                      ) : item.status === 'ARRIVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>At Gate</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          <span>Booked</span>
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-3 text-right">
                      {isItemActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-300">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active in Form</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectBooking(item)}
                          className={`text-xs font-bold px-3 py-1.5 rounded inline-flex items-center gap-1 transition shadow-xs cursor-pointer ${
                            isServing
                              ? 'bg-[#1E3A8A] hover:bg-[#0F2253] text-white'
                              : 'bg-white hover:bg-slate-100 text-[#1E3A8A] border border-[#1E3A8A]'
                          }`}
                        >
                          <span>{isServing ? 'Enter Weighment' : 'Process'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Slot & FIFO Queue Enforcement Active | DoCA Procurement Portal</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          Auto-refreshes every 6s • Processed farmers automatically clear
        </div>
      </div>
    </div>
  );
};

export default ActiveQueueList;
