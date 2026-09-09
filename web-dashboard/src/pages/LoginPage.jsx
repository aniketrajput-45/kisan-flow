import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Shield, Lock, Phone, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import GovHeader from '../components/GovHeader';
import TricolorStrip from '../components/TricolorStrip';
import Footer from '../components/Footer';

const LoginPage = () => {
  const [phone, setPhone] = useState('9876543211');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(phone, password);
      if (phone === '9876543212' || user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/officer');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : t.login.invalidCreds);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (targetPhone) => {
    setPhone(targetPhone);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6]">
      <GovHeader />
      <TricolorStrip />

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 gov-watermark relative">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden relative z-10">
          
          {/* Card Top Header */}
          <div className="bg-gradient-to-r from-[#0F2253] to-[#1E3A8A] text-white p-6 text-center border-b-2 border-[#FF9933]">
            <div className="inline-block p-2 bg-white/10 rounded-full border border-white/20 mb-2">
              <img src="/emblem.svg" alt="Emblem" className="h-10 w-auto brightness-200 mx-auto drop-shadow" />
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-wide">
              {t.login.title}
            </h1>
            <p className="text-xs text-blue-200 mt-0.5">
              {t.login.subtitle}
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 md:p-8">
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Phone Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.login.phoneLabel}:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4 text-[#1E3A8A]" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.login.phonePlaceholder}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1E3A8A] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.login.passLabel}:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4 text-[#1E3A8A]" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.login.passPlaceholder}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E3A8A] hover:bg-[#0F2253] text-white font-extrabold py-3 px-4 rounded text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 uppercase tracking-wider border border-[#0F2253]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{t.login.submitBtn}</span>
                    <ArrowRight className="w-4 h-4 text-[#FF9933]" />
                  </>
                )}
              </button>

            </form>

            {/* Quick Demo Accounts Selection */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                {t.login.quickLogin}:
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('9876543211')}
                  className={`p-2 rounded border text-left text-xs transition ${
                    phone === '9876543211'
                      ? 'border-[#1E3A8A] bg-blue-50/70 font-bold text-[#1E3A8A]'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>👮 {t.login.officerRole}</span>
                    {phone === '9876543211' && <CheckCircle2 className="w-3 h-3 text-blue-700" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{t.login.officerName}</div>
                  <div className="text-[9px] font-mono text-slate-400">9876543211</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('9876543212')}
                  className={`p-2 rounded border text-left text-xs transition ${
                    phone === '9876543212'
                      ? 'border-[#1E3A8A] bg-blue-50/70 font-bold text-[#1E3A8A]'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>👨‍💼 {t.login.adminRole}</span>
                    {phone === '9876543212' && <CheckCircle2 className="w-3 h-3 text-blue-700" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{t.login.adminName}</div>
                  <div className="text-[9px] font-mono text-slate-400">9876543212</div>
                </button>
              </div>
            </div>

            {/* Bottom Security Note */}
            <div className="mt-4 flex items-center justify-center space-x-2 text-[10px] text-slate-500">
              <Shield className="w-3 h-3 text-green-600" />
              <span>{t.login.securityNote}</span>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
