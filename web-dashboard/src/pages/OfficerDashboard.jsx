import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import GovHeader from '../components/GovHeader';
import TricolorStrip from '../components/TricolorStrip';
import GovTicker from '../components/GovTicker';
import Footer from '../components/Footer';
import KPIStrip from '../components/KPIStrip';
import TokenSearch from '../components/TokenSearch';
import ProcurementForm from '../components/ProcurementForm';
import ReceiptModal from '../components/ReceiptModal';
import { officerService, queueService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { RefreshCw, CheckCircle2, Play, AlertTriangle } from 'lucide-react';

const OfficerDashboard = () => {
  const { t } = useLanguage();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    loadKpi();
    handleSearchBooking('BDW-001');
  }, []);

  const loadKpi = async () => {
    try {
      if (selectedBooking && (selectedBooking.id || selectedBooking.booking_id)) {
        const bId = selectedBooking.id || selectedBooking.booking_id;
        const qData = await queueService.getQueueStatus(bId);
        setQueueInfo(qData);
      }
    } catch (err) {
      console.warn('Queue info update failed:', err.message || err);
    }
  };

  const handleSearchBooking = async (tokenOrQuery) => {
    setSearchLoading(true);
    setSearchError('');
    try {
      const booking = await officerService.lookupBooking(tokenOrQuery);
      setSelectedBooking(booking);
      if (booking && (booking.id || booking.booking_id)) {
        try {
          const qData = await queueService.getQueueStatus(booking.id || booking.booking_id);
          setQueueInfo(qData);
        } catch {
          setQueueInfo(null);
        }
      }
    } catch (err) {
      setSelectedBooking(null);
      setQueueInfo(null);
      setSearchError(typeof err === 'string' ? err : t.search.notFound);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMarkArrived = async () => {
    if (!selectedBooking) return;
    const bId = selectedBooking.id || selectedBooking.booking_id;
    setActionLoading(true);
    try {
      const res = await queueService.arrive(bId);
      setQueueInfo(res);
      const updated = await officerService.lookupBooking(selectedBooking.token_number || selectedBooking.id);
      setSelectedBooking(updated);
    } catch (err) {
      alert('Mark Arrived Error: ' + err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartProcessing = async () => {
    if (!selectedBooking) return;
    const bId = selectedBooking.id || selectedBooking.booking_id;
    setActionLoading(true);
    try {
      const res = await queueService.startProcessing(bId);
      setQueueInfo(res);
      const updated = await officerService.lookupBooking(selectedBooking.token_number || selectedBooking.id);
      setSelectedBooking(updated);
    } catch (err) {
      alert('Start Processing Error: ' + err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcurementSubmit = async (procurementPayload) => {
    setIsSubmitting(true);
    try {
      const result = await officerService.recordProcurement(procurementPayload);
      setReceiptData({
        ...result,
        booking: selectedBooking,
      });

      // Refresh booking details after procurement
      const updated = await officerService.lookupBooking(selectedBooking.token_number || selectedBooking.id);
      setSelectedBooking(updated);
    } catch (err) {
      alert('Procurement Error: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextFarmer = () => {
    setReceiptData(null);
    if (selectedBooking?.token_number === 'BDW-001') {
      handleSearchBooking('BDW-002');
    } else if (selectedBooking?.token_number === 'BDW-002') {
      handleSearchBooking('BDW-003');
    } else {
      handleSearchBooking('BDW-001');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] text-slate-800">
      <GovHeader />
      <TricolorStrip />
      <Navbar />
      <GovTicker />

      {/* Main Container */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6">
        
        {/* Mandi Centre Title & Operations Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-300">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl md:text-2xl font-black text-[#0F2253]">
                {t.dashboard.title}
              </h1>
              <span className="bg-green-100 text-green-800 text-[11px] font-bold px-2 py-0.5 rounded border border-green-300">
                🔴 {t.dashboard.live}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t.dashboard.subtitle}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadKpi}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>{t.dashboard.refresh}</span>
            </button>
          </div>
        </div>

        {/* Section 1: KPI Strip */}
        <KPIStrip kpiData={kpiData} />

        {/* Section 2: Token Search & Verification */}
        <TokenSearch
          onSearch={handleSearchBooking}
          loading={searchLoading}
          error={searchError}
        />

        {/* Queue Operation Controls Bar for Officer */}
        {selectedBooking && (
          <div className="gov-card rounded-lg shadow-sm border border-slate-300 p-4 mb-6 bg-white flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Booking #{selectedBooking.id || selectedBooking.booking_id} Status:
              </div>
              <div className="text-sm font-extrabold text-[#0F2253] flex items-center gap-2 mt-0.5">
                <span className="px-2.5 py-0.5 rounded bg-blue-100 text-[#1E3A8A] border border-blue-300 font-mono">
                  {selectedBooking.booking_status || selectedBooking.status}
                </span>
                {queueInfo && queueInfo.queue_available === false && (
                  <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Live queue temporarily unavailable
                  </span>
                )}
                {queueInfo && queueInfo.queue_position && (
                  <span className="text-xs text-slate-600 font-semibold">
                    (Queue Position: #{queueInfo.queue_position})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(selectedBooking.booking_status === 'BOOKED' || selectedBooking.status === 'BOOKED') && (
                <button
                  type="button"
                  onClick={handleMarkArrived}
                  disabled={actionLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1.5 transition shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionLoading ? 'Marking...' : 'Mark Arrived'}</span>
                </button>
              )}

              {(selectedBooking.booking_status === 'ARRIVED' || selectedBooking.status === 'ARRIVED' || selectedBooking.booking_status === 'IN_QUEUE' || selectedBooking.status === 'IN_QUEUE') && (
                <button
                  type="button"
                  onClick={handleStartProcessing}
                  disabled={actionLoading}
                  className="bg-[#1E3A8A] hover:bg-[#0F2253] text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1.5 transition shadow-xs"
                >
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>{actionLoading ? 'Starting...' : 'Start Processing'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Procurement Entry Form */}
        {selectedBooking && (
          <ProcurementForm
            booking={selectedBooking}
            onSubmit={handleProcurementSubmit}
            isSubmitting={isSubmitting}
          />
        )}

      </main>

      {/* Section 4: Success Receipt Modal */}
      {receiptData && (
        <ReceiptModal
          receiptData={receiptData}
          onClose={() => setReceiptData(null)}
          onNextFarmer={handleNextFarmer}
        />
      )}

      <Footer />
    </div>
  );
};

export default OfficerDashboard;
