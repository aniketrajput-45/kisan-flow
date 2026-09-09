import React from 'react';
import { CheckCircle2, Printer, X, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ReceiptModal = ({ receiptData, onClose, onNextFarmer }) => {
  const { lang, t } = useLanguage();
  if (!receiptData) return null;

  const { procurement, payment, booking } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  const procId = procurement?.id || '101';
  const totalAmount = procurement?.total_amount || (procurement?.weight_kg * 22.75);

  const cropName = lang === 'hi' 
    ? (booking?.crop?.includes('Paddy') ? 'धान' : 'गेहूँ')
    : (booking?.crop?.includes('Paddy') ? 'Paddy' : 'Wheat');

  const simulatedSmsMessage = lang === 'hi'
    ? `खरीद पावती विवरण:\nकिसान: ${booking?.farmer_name || 'Ramesh Kumar'}\nफसल: ${cropName} (${procurement?.grade || 'Grade A'})\nवजन: ${procurement?.weight_kg || '5000'} किग्रा\nकुल देय राशि: ₹${parseFloat(totalAmount).toLocaleString('en-IN')}\n\nपुष्टि हेतु 1 भेजें\nविवाद दर्ज करने हेतु 2 भेजें`
    : `Your procurement details:\nFarmer: ${booking?.farmer_name || 'Ramesh Kumar'}\nCrop: ${cropName} (${procurement?.grade || 'Grade A'})\nWeight: ${procurement?.weight_kg || '5000'} kg\nGross Amount: ₹${parseFloat(totalAmount).toLocaleString('en-IN')}\n\nReply 1 to CONFIRM\nReply 2 to DISPUTE`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-slate-300 w-full max-w-2xl overflow-hidden my-6">
        
        {/* Modal Top Bar */}
        <div className="bg-[#1E3A8A] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/emblem.svg" alt="Emblem" className="h-6 w-auto brightness-200" />
            <span className="font-bold text-sm">
              {t.receipt.modalTitle}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* Big Green Tick and Heading */}
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="w-14 h-14 rounded-full bg-green-100 border-2 border-green-500 text-green-600 flex items-center justify-center mx-auto mb-2 shadow-inner animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-900">
              {t.receipt.successTitle.replace('{id}', procId)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t.receipt.successSubtitle}
            </p>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              
              {/* Payment Status: RECORDED */}
              <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-300 text-[#1E3A8A] px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>{t.receipt.paymentStatus}: <strong className="uppercase">{payment?.status || 'RECORDED'}</strong></span>
              </div>

              {/* SMS Status: SENT TO FARMER */}
              <div className="flex items-center space-x-1.5 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm animate-pulse">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.receipt.smsStatus}: <strong className="uppercase">{t.receipt.sentToFarmer}</strong></span>
              </div>

            </div>
          </div>

          {/* Printable Receipt Block */}
          <div id="printable-receipt" className="mt-5 p-4 bg-slate-50 border border-slate-300 rounded-md text-xs space-y-3 font-sans">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-300 text-slate-600">
              <div>
                <span className="font-bold text-slate-800">{t.receipt.refNo}:</span>{' '}
                <span className="font-mono font-bold text-[#1E3A8A]">{payment?.reference_number || `PAY-2026-BDW-${procId}`}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">{t.receipt.dateTime}:</span>{' '}
                <span className="font-mono">
                  {new Date().toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { timeZone: 'Asia/Kolkata' })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-slate-700">
              <div>
                <span className="text-slate-400 block">{t.receipt.farmer}:</span>
                <strong className="text-slate-900 text-xs">{booking?.farmer_name || 'Ramesh Kumar'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">{t.receipt.mobile}:</span>
                <span className="font-mono font-bold text-slate-800">+91 {booking?.farmer_phone || '9876543210'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{t.receipt.centre}:</span>
                <strong className="text-slate-800">{lang === 'hi' ? 'बर्धमान केंद्रीय (BDW-01)' : 'Burdwan Central (BDW-01)'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">{t.receipt.cropGrade}:</span>
                <strong className="text-slate-900">{cropName} ({procurement?.grade || 'Grade A'})</strong>
              </div>
              <div>
                <span className="text-slate-400 block">{t.receipt.netWeight}:</span>
                <strong className="text-slate-900 font-mono text-xs">{procurement?.weight_kg || '5000'} kg ({(procurement?.weight_kg / 100 || 50).toFixed(1)} {t.kpis.quintals})</strong>
              </div>
              <div>
                <span className="text-slate-400 block">{t.receipt.mspRate}:</span>
                <span className="font-mono font-bold text-emerald-800">{t.procurement.rateInfo}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-300 flex items-center justify-between bg-white p-2.5 rounded border border-slate-200">
              <span className="font-bold text-slate-800 text-xs uppercase">
                {t.receipt.totalPayout}:
              </span>
              <span className="text-base md:text-lg font-black text-emerald-800 font-mono">
                ₹{parseFloat(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* SMS Simulation Card */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-md text-[11px] text-amber-900 flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-900 flex items-center justify-between">
                <span>{t.receipt.smsDispatchedTitle} (+91 {booking?.farmer_phone || '9876543210'}):</span>
                <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded font-mono">DoCA-SMS-GW</span>
              </div>
              <div className="font-mono text-[10px] bg-white p-2 rounded mt-1 border border-amber-200 text-slate-800 whitespace-pre-line leading-relaxed">
                {simulatedSmsMessage}
              </div>
              <p className="text-[10px] text-amber-800 mt-1">
                ℹ️ <em>{t.receipt.smsExplanation}</em>
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span>{t.receipt.printBtn}</span>
          </button>

          <button
            onClick={onNextFarmer}
            className="bg-[#1E3A8A] hover:bg-[#0F2253] text-white font-bold px-6 py-2.5 rounded text-xs flex items-center gap-2 transition shadow-sm"
          >
            <span>{t.receipt.nextFarmerBtn} ➔</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReceiptModal;
