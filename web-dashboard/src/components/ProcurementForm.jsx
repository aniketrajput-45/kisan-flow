import React, { useState, useEffect } from 'react';
import { 
  User, CheckCircle2, Scale, ShieldAlert, 
  Droplets, FileCheck, Send, Truck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const MSP_RATE_PER_KG = 22.75; // ₹2,275 per quintal

const ProcurementForm = ({ booking, onSubmit, isSubmitting }) => {
  const { lang, t } = useLanguage();
  const [weightKg, setWeightKg] = useState('5000');
  const [grade, setGrade] = useState('Grade A');
  const [moisturePct, setMoisturePct] = useState('11.4');
  const [bagsCount, setBagsCount] = useState('100');
  const [fraudWarning, setFraudWarning] = useState(null);

  const bookedWeight = booking.booked_quantity_kg || 5000;

  // Fraud Check Engine
  useEffect(() => {
    const numWeight = parseFloat(weightKg);
    if (isNaN(numWeight) || numWeight <= 0) {
      setFraudWarning(t.procurement.fraudWarningLower);
      return;
    }

    const difference = Math.abs(numWeight - bookedWeight);
    const pctDiff = (difference / bookedWeight) * 100;

    if (pctDiff > 10) {
      const isLower = numWeight < bookedWeight;
      setFraudWarning({
        title: t.procurement.fraudTitle,
        message: `${isLower ? t.procurement.fraudWarningLower : t.procurement.fraudWarningHigher} (${numWeight.toLocaleString()} kg vs ${bookedWeight.toLocaleString()} kg - ${pctDiff.toFixed(1)}% variance).`,
      });
    } else {
      setFraudWarning(null);
    }

    if (numWeight > 0) {
      setBagsCount(String(Math.ceil(numWeight / 50)));
    }
  }, [weightKg, bookedWeight, t]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weightKg || parseFloat(weightKg) <= 0) return;

    onSubmit({
      booking_id: booking.booking_id || booking.id,
      weight_kg: parseFloat(weightKg),
      grade,
      moisture_pct: parseFloat(moisturePct) || 11.2,
      bags_count: parseInt(bagsCount, 10) || 100,
    });
  };

  const calculatedPayout = (parseFloat(weightKg || 0) * MSP_RATE_PER_KG).toFixed(2);

  // Clean crop display based on language
  const cropDisplay = booking.crop || (lang === 'hi' ? 'गेहूँ (Wheat)' : 'Wheat');

  return (
    <div className="gov-card rounded-lg shadow-md border border-slate-300 overflow-hidden mb-8 animate-fadeIn">
      
      {/* Header Strip */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#0F2253]">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-amber-300" />
          <span className="font-bold text-sm md:text-base">
            {t.procurement.formTitle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            {t.procurement.tokenTag}: {booking.token_number}
          </span>
        </div>
      </div>

      <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ======================================================== */}
        {/* PART A: Farmer Details (Read-only Card - Grey background) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 bg-slate-100 rounded-lg p-5 border border-slate-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-300 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#1E3A8A]" />
                SECTION A: VERIFIED FARMER DETAILS
              </span>
              <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded border border-green-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                {t.procurement.arrivedStatus}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Farmer Name */}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.farmerName}:</span>
                <span className="font-bold text-slate-900 text-sm">{booking.farmer_name}</span>
              </div>

              {/* Mobile */}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.mobile}:</span>
                <span className="font-mono font-semibold text-slate-800">
                  +91 {booking.farmer_phone} <span className="text-slate-400">| ****-{booking.farmer_aadhaar_last4 || '4821'}</span>
                </span>
              </div>

              {/* Token Number */}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.tokenTag}:</span>
                <span className="font-mono font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {booking.token_number}
                </span>
              </div>

              {/* Crop */}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.crop}:</span>
                <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  🌾 {cropDisplay}
                </span>
              </div>

              {/* Allotted Time Slot */}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.slot}:</span>
                <span className="font-semibold text-slate-700">
                  {booking.start_time?.slice(0, 5) || '10:00'} - {booking.end_time?.slice(0, 5) || '11:00'} hrs
                </span>
              </div>

              {/* Expected / Booked Quantity */}
              <div className="flex justify-between py-1 border-b border-slate-200 bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-600 font-semibold">{t.procurement.expectedWeight}:</span>
                <span className="font-bold text-[#0F2253] text-sm font-mono">
                  {bookedWeight.toLocaleString('en-IN')} kg
                  <span className="text-xs text-slate-500 font-sans ml-1">
                    ({(bookedWeight / 100).toFixed(0)} {t.kpis.quintals})
                  </span>
                </span>
              </div>

              {/* Vehicle Number */}
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" /> {t.procurement.vehicleNo}:
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {booking.vehicle_number || 'WB-39-B-8142'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900 leading-snug">
            💡 <em>{t.procurement.smsNotice}</em>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PART B: Officer Input Form (White Card) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 bg-white rounded-lg p-5 border border-slate-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#138808]" />
              SECTION B: SCALE WEIGHMENT & QUALITY
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {t.procurement.scaleId}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Input 1: Actual Weight (Kg) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  {t.procurement.actualWeight} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="5000"
                    className="w-full pl-3 pr-12 py-2.5 bg-slate-50 border-2 border-slate-300 rounded text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1E3A8A] focus:bg-white transition"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500 font-mono">
                    kg
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                  <span>{(parseFloat(weightKg || 0) / 100).toFixed(2)} {t.kpis.quintals}</span>
                  <span className="text-[#1E3A8A] cursor-pointer hover:underline" onClick={() => setWeightKg('5000')}>
                    ({t.procurement.setDemo})
                  </span>
                  <span className="text-red-600 cursor-pointer hover:underline" onClick={() => setWeightKg('3800')}>
                    ({t.procurement.testFraud})
                  </span>
                </div>
              </div>

              {/* Input 2: Crop Grade Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  {t.procurement.cropGrade} <span className="text-red-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded text-xs md:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1E3A8A] focus:bg-white transition"
                >
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="FAQ">FAQ</option>
                </select>
                <div className="mt-1 text-[11px] text-slate-500">
                  Admixture &lt; 2.0%
                </div>
              </div>

              {/* Moisture % */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  {t.procurement.moisture}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="5"
                    max="25"
                    value={moisturePct}
                    onChange={(e) => setMoisturePct(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">
                    %
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  {t.procurement.moistureHelp}
                </div>
              </div>

              {/* Jute Bags */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  {t.procurement.bardanaUsed}
                </label>
                <input
                  type="number"
                  value={bagsCount}
                  onChange={(e) => setBagsCount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                />
                <div className="mt-0.5 text-[10px] text-slate-500">
                  {t.procurement.bardanaHelp}
                </div>
              </div>

            </div>

            {/* Fraud Check Alert */}
            {fraudWarning && typeof fraudWarning === 'object' && (
              <div className="p-4 bg-red-50 border-2 border-red-500 rounded-md text-red-900 shadow-sm animate-shake">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-xs md:text-sm text-red-800 uppercase tracking-wide">
                      {fraudWarning.title}
                    </div>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">
                      {fraudWarning.message}
                    </p>
                    <div className="mt-2 text-[11px] bg-red-100 px-2 py-1 rounded border border-red-200 inline-block font-semibold text-red-900">
                      {t.procurement.fraudAudit}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live MSP Calculation Summary Card */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-300 rounded-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
                    {t.procurement.grossPayout}:
                  </div>
                  <div className="text-2xl font-black text-emerald-800 font-mono flex items-center">
                    ₹{parseFloat(calculatedPayout).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-600">
                  <div><strong className="font-mono">{t.procurement.rateInfo}</strong></div>
                  <div className="text-emerald-700 font-bold">{t.procurement.dbtInfo}</div>
                </div>
              </div>
            </div>

            {/* Big Green Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !weightKg || parseFloat(weightKg) <= 0}
                className="w-full bg-[#138808] hover:bg-[#0E6606] disabled:opacity-50 text-white font-extrabold py-3.5 px-6 rounded-md text-sm md:text-base shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 uppercase tracking-wider border-2 border-[#0E6606]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.procurement.submitting}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 text-amber-300" />
                    <span>{t.procurement.submitBtn}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
};

export default ProcurementForm;
