import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Users, UserCheck, Clock, ShieldAlert, AlertTriangle, Play, CheckCircle2 } from 'lucide-react';

const LiveFarmerQueue = ({
  currentFarmer = null,
  nextFarmer = null,
  waitingFarmers = [],
  servedFarmers = [],
  dataUnavailable = false,
  onSelectFarmer = () => {},
  onMarkArrived = () => {},
  onStartProcessing = () => {},
  actionLoading = false,
  lastUpdated = null,
  fetchError = false,
}) => {
  const { t, lang } = useLanguage();

  const getCropDisplay = (farmer) => {
    if (!farmer) return '—';
    return farmer.crop || (lang === 'hi' ? 'गेहूँ (Wheat)' : 'Wheat');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
      
      {/* ========================================================= */}
      {/* LEFT COLUMN: CURRENT ACTIVE FARMER WORKSTATION            */}
      {/* ========================================================= */}
      <div className="lg:col-span-5 flex flex-col h-full">
        <div className="gov-card bg-white border border-[#0F2253] flex-1 flex flex-col">
          <div className="bg-[#0F2253] text-white px-4 py-3 border-b border-[#0F2253] flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#FF9933]" />
              Current Active Farmer Workstation
            </h2>
          </div>
          
          <div className="p-5 flex-1 flex flex-col">
            {currentFarmer ? (
              <div className="flex-1 flex flex-col">
                <div className="mb-4">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                    Demo Preview Mode
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {currentFarmer.farmer_name || 'Farmer Name'}
                  </div>
                  <div className="text-sm font-mono text-slate-600">
                    +91 {currentFarmer.farmer_phone || '9876543210'}
                  </div>
                  <div className="mt-2 inline-block px-3 py-1 bg-blue-50 text-[#0F2253] border border-blue-200 text-lg font-mono font-bold rounded">
                    {currentFarmer.token_number || currentFarmer.token || '—'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mt-4 border-t border-slate-200 pt-4 mb-6">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Crop / Variety</div>
                    <div className="font-semibold text-slate-800">{getCropDisplay(currentFarmer)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Booked Quantity</div>
                    <div className="font-semibold text-slate-800 font-mono">
                      {(currentFarmer.booked_quantity_kg || 5000).toLocaleString('en-IN')} kg
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Booking Slot</div>
                    <div className="font-semibold text-slate-800">
                      {currentFarmer.start_time?.slice(0,5) || '09:00'} - {currentFarmer.end_time?.slice(0,5) || '11:00'} hrs
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Current Status</div>
                    <div className="font-bold text-[#0F2253] bg-blue-100 px-2 py-0.5 rounded border border-blue-300 inline-block text-[11px] uppercase mt-0.5">
                      {currentFarmer.booking_status || currentFarmer.status || 'IN_QUEUE'}
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col gap-3">
                  {(currentFarmer.booking_status === 'BOOKED' || currentFarmer.status === 'BOOKED') && (
                    <button
                      onClick={() => onMarkArrived(currentFarmer)}
                      disabled={actionLoading}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2 uppercase tracking-wide text-sm transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {actionLoading ? 'Marking...' : 'Mark Arrived'}
                    </button>
                  )}

                  {(currentFarmer.booking_status === 'ARRIVED' || currentFarmer.status === 'ARRIVED' || currentFarmer.booking_status === 'IN_QUEUE' || currentFarmer.status === 'IN_QUEUE') && (
                    <button
                      onClick={() => onStartProcessing(currentFarmer)}
                      disabled={actionLoading}
                      className="w-full bg-[#138808] hover:bg-[#0E6606] text-white font-bold py-3 rounded flex items-center justify-center gap-2 uppercase tracking-wide text-sm transition"
                    >
                      <Play className="w-4 h-4 text-white" fill="currentColor" />
                      {actionLoading ? 'Starting...' : 'Start Processing'}
                    </button>
                  )}
                  
                  {(currentFarmer.booking_status === 'PROCESSING' || currentFarmer.status === 'PROCESSING') && (
                    <div className="text-center p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded">
                      Farmer is currently in Processing. Proceed to Quality & Weight Entry below.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <UserCheck className="w-12 h-12 text-slate-300 mb-3" />
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Active Farmer</div>
                <p className="text-xs text-slate-400 mt-2">Select a farmer from the queue or use manual lookup to begin processing.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: TODAY'S MANDI QUEUE                         */}
      {/* ========================================================= */}
      <div className="lg:col-span-7 flex flex-col h-full">
        <div className="gov-card bg-white border border-slate-300 flex-1 flex flex-col">
          <div className="bg-slate-100 text-slate-800 px-4 py-3 border-b border-slate-300 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0F2253]" />
              Today's Mandi Queue
            </h2>
            <div className="flex items-center gap-2">
              {fetchError ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Feed Unavailable
                </span>
              ) : dataUnavailable ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Feed Awaiting
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-green-700 bg-green-100 border border-green-300 px-2 py-0.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  LIVE {lastUpdated && `- ${lastUpdated.toLocaleTimeString()}`}
                </span>
              )}
            </div>
          </div>

          {dataUnavailable ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Live Procurement Queue</h3>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                ● Feed Status: Awaiting Queue Feed
              </div>
              <p className="text-xs text-slate-600 max-w-sm">
                No active queue records are currently broadcasted by the local terminal. Please use Manual Farmer Lookup to retrieve a specific booking.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              {/* Queue will render here when data is available */}
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Farmer</th>
                    <th className="py-2.5 px-3">Token</th>
                    <th className="py-2.5 px-3">Details</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingFarmers.length > 0 ? (
                    waitingFarmers.map((f, i) => (
                      <tr key={i} className="hover:bg-blue-50 cursor-pointer" onClick={() => onSelectFarmer(f)}>
                        <td className="py-3 px-3 font-bold text-slate-500">#{i+1}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{f.farmer_name}</td>
                        <td className="py-3 px-3 font-mono font-bold text-[#0F2253]">{f.token_number}</td>
                        <td className="py-3 px-3 text-slate-600 text-[10px]">
                          {getCropDisplay(f)} • {(f.booked_quantity_kg || 0).toLocaleString()} kg<br/>
                          {f.start_time?.slice(0,5)} - {f.end_time?.slice(0,5)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 uppercase border border-amber-300">
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-slate-400 text-xs font-semibold uppercase">
                        No farmers currently in queue
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default LiveFarmerQueue;
