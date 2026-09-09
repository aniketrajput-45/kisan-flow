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
import { officerService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { RefreshCw } from 'lucide-react';

const OfficerDashboard = () => {
  const { t } = useLanguage();
  const [kpiData, setKpiData] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    loadKpi();
    handleSearchBooking('BDW-001');
  }, []);

  const loadKpi = async () => {
    try {
      const data = await officerService.getKpiData();
      setKpiData(data);
    } catch (err) {
      console.error('Failed to load KPIs', err);
    }
  };

  const handleSearchBooking = async (tokenOrQuery) => {
    setSearchLoading(true);
    setSearchError('');
    try {
      const booking = await officerService.lookupBooking(tokenOrQuery);
      setSelectedBooking(booking);
    } catch (err) {
      setSelectedBooking(null);
      setSearchError(typeof err === 'string' ? err : t.search.notFound);
    } finally {
      setSearchLoading(false);
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

      setKpiData(prev => prev ? ({
        ...prev,
        servedTokens: prev.servedTokens + 1,
        pendingTokens: Math.max(0, prev.pendingTokens - 1),
        procuredWeightTons: parseFloat((prev.procuredWeightTons + (procurementPayload.weight_kg / 1000)).toFixed(1)),
        availableBardanaBags: Math.max(0, prev.availableBardanaBags - (procurementPayload.bags_count || 100)),
      }) : null);

    } catch (err) {
      alert('Error: ' + (err.message || err));
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
