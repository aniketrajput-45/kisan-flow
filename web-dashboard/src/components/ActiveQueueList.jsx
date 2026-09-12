import React, { useState, useMemo } from 'react';
import { Users, Clock, ArrowRight, RefreshCw, CheckCircle2, UserCheck, ShieldCheck, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ActiveQueueList = ({
  queue = [],
  loading = false,
  selectedBooking = null,
  onSelectBooking,
  onRefresh,
  onMarkArrival,
}) => {
  const { t } = useLanguage();
  const [selectedSlot, setSelectedSlot] = useState('ALL');
  const [viewMode, setViewMode] = useState('ARRIVED'); // 'ARRIVED' (default: physically checked in) | 'ALL' (all scheduled)
  const selectedId = selectedBooking?.id || selectedBooking?.booking_id;

  const formatSlotTime = (startTimeOrItem, maybeEndTime) => {
    if (!startTimeOrItem) return '09:00 - 11:00';
    if (typeof startTimeOrItem === 'object') {
      if (startTimeOrItem.slot_time) return startTimeOrItem.slot_time;
      const start = startTimeOrItem.start_time ? String(startTimeOrItem.start_time).substring(0, 5) : '09:00';
      const end = startTimeOrItem.end_time ? String(startTimeOrItem.end_time).substring(0, 5) : '11:00';
      return `${start} - ${end}`;
    }
    const cleanStart = String(startTimeOrItem).substring(0, 5);
    const cleanEnd = maybeEndTime ? String(maybeEndTime).substring(0, 5) : '';
    return cleanEnd ? `${cleanStart} - ${cleanEnd}` : cleanStart;
  };

  // Strictly filter out any completed bookings so processed farmers disappear from screen
  const uncompletedList = useMemo(() => {
    return (queue || []).filter((item) => item.status !== 'COMPLETED');
  }, [queue]);

  const arrivedCount = useMemo(() => {
    return uncompletedList.filter((item) => item.status !== 'BOOKED').length;
  }, [uncompletedList]);

  const totalBookedCount = uncompletedList.length;

  // Active queue according to viewMode (default strictly arrived farmers)
  const activeQueue = useMemo(() => {
    if (viewMode === 'ALL') {
      return uncompletedList;
    }
    // Default: only farmers who have marked arrived at the mandi gate
    return uncompletedList.filter((item) => item.status !== 'BOOKED');
  }, [uncompletedList, viewMode]);

  // Compute live breakdown stats per slot (both arrived count and booked count)
  const slotBreakdown = useMemo(() => {
    const stats = {};
    const defaultSlots = ['09:00 - 11:00', '11:00 - 13:00', '14:00 - 16:00', '16:00 - 18:00'];
    defaultSlots.forEach((s) => {
      stats[s] = { arrived: 0, booked: 0 };
    });

    uncompletedList.forEach((item) => {
      const slotLabel = item.slot_time || formatSlotTime(item);
      if (!stats[slotLabel]) {
        stats[slotLabel] = { arrived: 0, booked: 0 };
      }
      stats[slotLabel].booked += 1;
      if (item.status !== 'BOOKED') {
        stats[slotLabel].arrived += 1;
      }
    });

    return stats;
  }, [uncompletedList]);

  // Unique slot list
  const availableSlots = useMemo(() => {
    const defaultSlots = ['09:00 - 11:00', '11:00 - 13:00', '14:00 - 16:00', '16:00 - 18:00'];
    const dynamicSlots = Object.keys(slotBreakdown);
    const combined = Array.from(new Set([...defaultSlots, ...dynamicSlots]));
    return combined.sort();
  }, [slotBreakdown]);

  // Filter displayed queue by selected slot
  const displayedQueue = useMemo(() => {
    if (selectedSlot === 'ALL') return activeQueue;
    return activeQueue.filter((item) => (item.slot_time || formatSlotTime(item)) === selectedSlot);
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
              {arrivedCount} Arrived at Gate
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Only farmers who have marked arrival at the mandi gate appear in the live queue. Booked farmers enter the queue upon check-in.
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

      {/* Mode Toggle: Arrived at Gate vs All Bookings */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('ARRIVED')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'ARRIVED'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Arrived at Gate (गेट पर उपस्थित)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                viewMode === 'ARRIVED' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {arrivedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('ALL')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'ALL'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>All Booked Slots (कुल बुकिंग)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                viewMode === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totalBookedCount}
            </span>
          </button>
        </div>

        {viewMode === 'ARRIVED' && (
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Showing only checked-in / arrived farmers
          </span>
        )}
      </div>

      {/* Slot Breakdown Pills / Filter Bar */}
      <div className="mt-3 pt-1 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
          <Filter className="w-3.5 h-3.5 text-[#1E3A8A]" />
          <span>Filter by Slot ({viewMode === 'ARRIVED' ? 'उपस्थित किसान' : 'सभी बुक किसान'}):</span>
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
              {viewMode === 'ARRIVED' ? arrivedCount : totalBookedCount}
            </span>
          </button>

          {availableSlots.map((slotTime) => {
            const stats = slotBreakdown[slotTime] || { arrived: 0, booked: 0 };
            const isSelected = selectedSlot === slotTime;
            const hasArrived = stats.arrived > 0;
            const hasBooked = stats.booked > 0;

            return (
              <button
                key={slotTime}
                type="button"
                onClick={() => setSelectedSlot(slotTime)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : hasArrived
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : hasBooked
                    ? 'bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] border border-blue-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{slotTime}</span>
                {viewMode === 'ARRIVED' ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : hasArrived
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {stats.arrived} Arrived
                    {stats.booked > stats.arrived && ` (${stats.booked} booked)`}
                  </span>
                ) : (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : hasBooked
                        ? 'bg-blue-200 text-[#0F2253]'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {stats.booked} Booked
                  </span>
                )}
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
              ? viewMode === 'ARRIVED'
                ? 'No farmers have marked arrival at the gate yet.'
                : 'No bookings scheduled for this date.'
              : viewMode === 'ARRIVED'
              ? `No farmers currently arrived for Slot (${selectedSlot}).`
              : `No bookings scheduled for Slot (${selectedSlot}).`}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {viewMode === 'ARRIVED'
              ? 'When a booked farmer reaches the mandi and marks arrival (via farmer app or gate desk), their token will immediately appear in this queue under their slot.'
              : 'Switch to "Arrived at Gate" to view only farmers physically present in the live queue.'}
          </p>
          {selectedSlot !== 'ALL' && slotBreakdown[selectedSlot]?.booked > 0 && viewMode === 'ARRIVED' && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setViewMode('ALL')}
                className="text-xs font-bold text-[#1E3A8A] hover:underline bg-blue-50 border border-blue-200 px-3 py-1 rounded"
              >
                View {slotBreakdown[selectedSlot]?.booked} booked farmer(s) scheduled for this slot →
              </button>
            </div>
          )}
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
                      {item.status === 'BOOKED' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {onMarkArrival && (
                            <button
                              type="button"
                              onClick={() => onMarkArrival(item.id || item.booking_id)}
                              className="text-[11px] font-bold px-2.5 py-1.5 rounded inline-flex items-center gap-1 transition bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                              title="Mark arrived at gate on behalf of farmer"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Gate Check-In</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectBooking(item)}
                            className="text-[11px] font-semibold px-2.5 py-1.5 rounded inline-flex items-center gap-1 transition bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer"
                          >
                            <span>Lookup</span>
                          </button>
                        </div>
                      ) : isItemActive ? (
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
