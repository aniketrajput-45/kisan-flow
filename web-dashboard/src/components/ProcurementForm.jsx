import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, CheckCircle2, Scale, ShieldAlert, 
  Droplets, FileCheck, Send, Truck 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getCropStandard } from '../utils/mspRates';
import { officerService } from '../services/api';

const ProcurementForm = ({ booking, onSubmit, isSubmitting }) => {
  const { lang, t } = useLanguage();
  
  // Auto-read booked quantity from farmer's booking
  const bookedWeight = booking?.booked_quantity_kg || booking?.quantity_kg || 0;

  const [weightKg, setWeightKg] = useState(String(bookedWeight || ''));
  const [grade, setGrade] = useState('Grade A');
  const [moisturePct, setMoisturePct] = useState('11.2');
  const [bagsCount, setBagsCount] = useState('');
  const [fraudWarning, setFraudWarning] = useState(null);
  const [liveGovRate, setLiveGovRate] = useState(null);

  // Baseline standard from official catalogue
  const fallbackStandard = useMemo(() => {
    return getCropStandard(booking?.crop, grade);
  }, [booking?.crop, grade]);

  // Fetch live government rate in background
  useEffect(() => {
    let isCancelled = false;
    const fetchLiveRate = async () => {
      if (!booking?.crop) return;
      try {
        const liveData = await officerService.getMspRate(booking.crop, grade, booking.centre_state);
        if (!isCancelled && liveData?.rate_per_kg) {
          setLiveGovRate(liveData);
        }
      } catch {
        // Silent fallback
      }
    };

    fetchLiveRate();
    return () => {
      isCancelled = true;
    };
  }, [booking?.crop, grade, booking?.centre_state]);

  const effectiveRatePerKg = liveGovRate?.rate_per_kg || fallbackStandard.ratePerKg;
  const effectiveRatePerQtl = liveGovRate?.rate_per_quintal || fallbackStandard.ratePerQtl;
  const maxMoisture = liveGovRate?.max_moisture_pct || fallbackStandard.maxMoisturePct;

  // Auto-populate weight, bags, and safe moisture when booking loads
  useEffect(() => {
    if (bookedWeight > 0) {
      setWeightKg(String(bookedWeight));
      setBagsCount(String(Math.ceil(bookedWeight / 50)));
      setMoisturePct(String(Math.max(5, maxMoisture - 0.8).toFixed(1)));
    }
  }, [booking?.id, bookedWeight, maxMoisture]);

  // Auto-compute bags & weight variance
  useEffect(() => {
    const numWeight = parseFloat(weightKg);
    if (isNaN(numWeight) || numWeight <= 0) return;

    setBagsCount(String(Math.ceil(numWeight / 50)));

    if (bookedWeight > 0) {
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
    }
  }, [weightKg, bookedWeight, t]);

  // Auto-calculate Gross Payout: Weight * Effective Rate
  const calculatedPayout = (parseFloat(weightKg || 0) * effectiveRatePerKg).toFixed(2);

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

  const cropDisplay = lang === 'hi' ? fallbackStandard.nameHi : fallbackStandard.nameEn;

  return (
    <div className="gov-card rounded-lg shadow-sm border border-slate-300 overflow-hidden mb-8 bg-white animate-fadeIn">
      
      {/* Clean Header */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 flex items-center justify-between border-b border-[#0F2253]">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-amber-300" />
          <span className="font-bold text-sm md:text-base">
            {t.procurement.formTitle}
          </span>
        </div>
        <span className="bg-emerald-600 text-white text-xs font-mono font-bold px-2.5 py-0.5 rounded shadow-xs">
          {t.procurement.tokenTag}: {booking.token_number}
        </span>
      </div>

      <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ======================================================== */}
        {/* Left Column: Farmer & Booking Summary */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 bg-slate-50 rounded-lg p-5 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#1E3A8A]" />
                {lang === 'hi' ? 'किसान एवं स्लॉट विवरण' : 'Farmer & Booking Details'}
              </span>
              <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded border border-green-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                {t.procurement.arrivedStatus}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.farmerName}:</span>
                <span className="font-bold text-slate-900">{booking.farmer_name}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.mobile}:</span>
                <span className="font-mono font-semibold text-slate-800">
                  +91 {booking.farmer_phone}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.tokenTag}:</span>
                <span className="font-mono font-bold text-[#1E3A8A]">
                  {booking.token_number}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.crop}:</span>
                <span className="font-bold text-slate-900">
                  {cropDisplay}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.slot}:</span>
                <span className="font-semibold text-slate-700">
                  {booking.start_time?.slice(0, 5) || '10:00'} - {booking.end_time?.slice(0, 5) || '11:00'} hrs
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.expectedWeight}:</span>
                <span className="font-bold text-[#0F2253] font-mono">
                  {bookedWeight.toLocaleString('en-IN')} kg
                  <span className="text-xs text-slate-500 font-sans font-normal ml-1">
                    ({(bookedWeight / 100).toFixed(1)} {t.kpis.quintals})
                  </span>
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">{t.procurement.vehicleNo}:</span>
                <span className="font-mono font-bold text-slate-700">
                  {booking.vehicle_number || 'WB-39-B-8142'}
                </span>
              </div>

              <div className="flex justify-between py-1 bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-600 font-semibold">{lang === 'hi' ? 'लागू एमएसपी दर:' : 'Applicable MSP:'}</span>
                <span className="font-mono font-bold text-emerald-800">
                  ₹{effectiveRatePerKg.toFixed(2)}/kg
                  <span className="text-[11px] text-slate-500 font-normal ml-1 font-sans">
                    (₹{effectiveRatePerQtl.toLocaleString('en-IN')}/Qtl)
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
            {t.procurement.smsNotice}
          </div>
        </div>

        {/* ======================================================== */}
        {/* Right Column: Weighment & Quality Entry */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 bg-white rounded-lg p-5 border border-slate-200">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#1E3A8A]" />
              {lang === 'hi' ? 'तौल एवं गुणवत्ता प्रविष्टि' : 'Weighment & Quality Entry'}
            </span>
            <span className="text-xs text-emerald-700 font-semibold font-mono">
              ₹{effectiveRatePerKg.toFixed(2)}/kg
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Actual Weight */}
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
                    placeholder={String(bookedWeight || '')}
                    className="w-full pl-3 pr-12 py-2.5 bg-slate-50 border border-slate-300 rounded text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1E3A8A] focus:bg-white transition"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500 font-mono">
                    kg
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 font-mono">
                  {(parseFloat(weightKg || 0) / 100).toFixed(2)} {t.kpis.quintals}
                </div>
              </div>

              {/* Quality Grade */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  {t.procurement.cropGrade} <span className="text-red-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded text-xs md:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1E3A8A] focus:bg-white transition"
                >
                  <option value="Grade A">Grade A (Premium Quality)</option>
                  <option value="FAQ">FAQ (Fair Average Quality)</option>
                  <option value="Grade B">Grade B (Commercial)</option>
                </select>
                <div className="mt-1 text-[11px] text-slate-500">
                  Rate: ₹{effectiveRatePerKg.toFixed(2)}/kg
                </div>
              </div>

              {/* Moisture % */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-600" />
                    {t.procurement.moisture}
                  </span>
                  <span className={`text-[10px] ${parseFloat(moisturePct) > maxMoisture ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                    Limit: ≤ {maxMoisture}%
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="25"
                    value={moisturePct}
                    onChange={(e) => setMoisturePct(e.target.value)}
                    className={`w-full pl-3 pr-10 py-2 rounded text-sm font-mono font-bold text-slate-900 border ${
                      parseFloat(moisturePct) > maxMoisture 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-slate-300 bg-slate-50 focus:border-[#1E3A8A]'
                    }`}
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">%</span>
                </div>
                <div className={`mt-0.5 text-[10px] ${parseFloat(moisturePct) > maxMoisture ? 'text-red-700 font-semibold' : 'text-slate-500'}`}>
                  {parseFloat(moisturePct) > maxMoisture 
                    ? `Exceeds permissible limit of ${maxMoisture}%` 
                    : `Permissible limit for ${cropDisplay}`}
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
                  Standard 50 kg bags
                </div>
              </div>

            </div>

            {/* Fraud Alert if actual differs >10% */}
            {fraudWarning && typeof fraudWarning === 'object' && (
              <div className="p-3 bg-red-50 border border-red-300 rounded text-red-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{fraudWarning.title}: </span>
                  <span>{fraudWarning.message}</span>
                </div>
              </div>
            )}

            {/* Clean Total Payout Summary */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-md flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
                  {t.procurement.grossPayout}:
                </div>
                <div className="text-2xl font-black text-emerald-800 font-mono">
                  ₹{parseFloat(calculatedPayout).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right text-xs text-slate-600 font-mono">
                {weightKg || 0} kg × ₹{effectiveRatePerKg.toFixed(2)}/kg
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !weightKg || parseFloat(weightKg) <= 0}
                className="w-full bg-[#138808] hover:bg-[#0E6606] disabled:opacity-50 text-white font-bold py-3 px-6 rounded text-sm shadow-xs transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.procurement.submitting}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-300" />
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
