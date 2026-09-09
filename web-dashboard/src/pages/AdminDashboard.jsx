import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import GovHeader from '../components/GovHeader';
import TricolorStrip from '../components/TricolorStrip';
import GovTicker from '../components/GovTicker';
import Footer from '../components/Footer';
import AdminKPIs from '../components/AdminKPIs';
import LiveQueueTable from '../components/LiveQueueTable';
import DisputeTable from '../components/DisputeTable';
import PaymentEscalation from '../components/PaymentEscalation';
import PaymentBreakdownBar from '../components/PaymentBreakdownBar';
import { adminService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { 
  Building2, MessageSquareWarning, AlertOctagon, 
  RefreshCw, Calendar, ShieldCheck 
} from 'lucide-react';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'disputes' | 'escalations'
  const [date, setDate] = useState('2026-09-10');
  const [stats, setStats] = useState(null);
  const [centres, setCentres] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, [date]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const overviewData = await adminService.getOverview(date);
      setStats(overviewData);
      setCentres(overviewData?.centres || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (procId) => {
    await adminService.resolveDispute(procId);
    const updated = await adminService.getDisputes();
    setDisputes(updated);
  };

  const handleForcePay = async (bookingId) => {
    await adminService.forcePay(bookingId);
    const updated = await adminService.getPaymentEscalations();
    setEscalations(updated);
  };

  const handleSimulateDelay = () => {
    const updated = adminService.simulateDelay();
    setEscalations(updated);
  };

  const activeDisputesCount = disputes.filter(d => d.status === 'DISPUTED').length;
  const overdueCount = escalations.filter(e => e.status !== 'CREDITED').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] text-slate-800">
      <GovHeader />
      <TricolorStrip />
      <Navbar />
      <GovTicker />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6">
        
        {/* District Title & Filters Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-300">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl md:text-2xl font-black text-[#0F2253]">
                {t.admin.title}
              </h1>
              <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-300 uppercase">
                DFSO Nodal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t.admin.subtitle}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Operational Date Filter */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 px-2.5 py-1.5 rounded text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="font-mono text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadAllData}
              disabled={loading}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#1E3A8A] ${loading ? 'animate-spin' : ''}`} />
              <span>{t.dashboard.refresh}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Strip */}
        <div className="mb-6 flex flex-wrap border-b border-slate-300 gap-1">
          
          {/* Tab 1: Overview & Queue */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-[#1E3A8A] text-[#1E3A8A] bg-white rounded-t-md shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t.admin.tabOverview}</span>
          </button>

          {/* Tab 2: SMS Disputes */}
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'disputes'
                ? 'border-[#1E3A8A] text-[#1E3A8A] bg-white rounded-t-md shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquareWarning className="w-4 h-4 text-red-600" />
            <span>{t.admin.tabDisputes}</span>
            {activeDisputesCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {activeDisputesCount}
              </span>
            )}
          </button>

          {/* Tab 3: Payment Escalations (>5 Days) */}
          <button
            onClick={() => setActiveTab('escalations')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'escalations'
                ? 'border-[#1E3A8A] text-[#1E3A8A] bg-white rounded-t-md shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-amber-600" />
            <span>{t.admin.tabEscalations}</span>
            {overdueCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {overdueCount}
              </span>
            )}
          </button>

        </div>

        {/* Tab 1: Overview, KPIs, Live Queue & Payments */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <AdminKPIs stats={stats} />
            <LiveQueueTable centres={centres} queueAvailable={stats?.queue_available !== false} />
            <PaymentBreakdownBar stats={stats?.payments} />
          </div>
        )}

        {/* Tab 2: SMS Disputes Panel */}
        {activeTab === 'disputes' && (
          <div className="space-y-6 animate-fadeIn">
            <DisputeTable
              disputes={disputes}
              onResolve={handleResolveDispute}
            />
          </div>
        )}

        {/* Tab 3: Payment Escalation Panel with WOW Feature 5 */}
        {activeTab === 'escalations' && (
          <div className="space-y-6 animate-fadeIn">
            <PaymentEscalation
              escalations={escalations}
              onForcePay={handleForcePay}
              onSimulateDelay={handleSimulateDelay}
            />
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
