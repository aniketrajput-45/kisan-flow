import React, { useState } from 'react';
import { Search, QrCode, Sparkles, AlertCircle, Camera } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const TokenSearch = ({ onSearch, loading, error }) => {
  const { t } = useLanguage();
  const [tokenInput, setTokenInput] = useState('');
  const [showQrMock, setShowQrMock] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      onSearch(tokenInput.trim());
    }
  };

  const handleQuickSelect = (token) => {
    setTokenInput(token);
    onSearch(token);
  };

  return (
    <div className="gov-card rounded-lg shadow-sm border border-slate-300 p-5 md:p-6 mb-6 bg-white relative overflow-hidden">
      
      {/* Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base md:text-lg font-bold text-[#0F2253] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]"></span>
            {t.search.title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.search.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-blue-50 text-[#1E3A8A] font-semibold px-2.5 py-1 rounded border border-blue-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FF9933]" />
            {t.search.centreCode}: <strong className="font-mono">BDW-01</strong>
          </span>
        </div>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="mt-5">
        <div className="max-w-2xl mx-auto">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {t.search.inputLabel}:
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4 text-[#1E3A8A]" />
              </div>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={t.search.inputPlaceholder}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-md text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1E3A8A] focus:bg-white transition shadow-inner"
              />
            </div>

            {/* Primary Search Button */}
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="bg-[#1E3A8A] hover:bg-[#0F2253] disabled:opacity-50 text-white font-bold px-6 py-3 rounded-md text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition border border-[#0F2253]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="w-4 h-4 text-amber-300" />
              )}
              <span>{t.search.searchBtn}</span>
            </button>

            {/* Scan QR Button */}
            <button
              type="button"
              onClick={() => setShowQrMock(!showQrMock)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-3 rounded-md text-xs md:text-sm flex items-center justify-center gap-2 border border-slate-300 transition"
              title={t.search.scanQrBtn}
            >
              <Camera className="w-4 h-4 text-[#1E3A8A]" />
              <span className="hidden sm:inline">{t.search.scanQrBtn}</span>
            </button>
          </div>

          {/* QR Simulation Box */}
          {showQrMock && (
            <div className="mt-4 p-4 bg-blue-50/70 border border-blue-200 rounded-md text-xs text-slate-700 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded border border-blue-300">
                  <QrCode className="w-8 h-8 text-[#1E3A8A]" />
                </div>
                <div>
                  <div className="font-bold text-[#0F2253]">{t.search.qrActiveTitle}</div>
                  <div className="text-[11px] text-slate-500">
                    {t.search.qrActiveDesc}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleQuickSelect('BDW-001');
                  setShowQrMock(false);
                }}
                className="bg-[#138808] hover:bg-[#0E6606] text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm"
              >
                {t.search.scanSimulate}
              </button>
            </div>
          )}

          {/* Error Message if any */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default TokenSearch;
