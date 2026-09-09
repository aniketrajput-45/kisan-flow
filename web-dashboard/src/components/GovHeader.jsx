import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const GovHeader = () => {
  const { lang, setLang, t } = useLanguage();
  const [fontSize, setFontSize] = useState('normal');

  return (
    <div className="bg-white border-b border-slate-200 text-slate-700 text-xs py-1.5 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: National Emblem & Ministry Details (Pure single language) */}
        <div className="flex items-center space-x-3">
          <img
            src="/emblem.svg"
            alt="National Emblem of India"
            className="h-9 w-auto object-contain drop-shadow-sm"
          />
          <div className="border-l border-slate-300 pl-3 leading-tight">
            <div className="font-bold text-slate-900 tracking-tight text-xs">
              {t.gov.govOfIndia}
            </div>
            <div className="text-[11px] text-slate-600 font-medium">
              {t.gov.ministry}
            </div>
            <div className="text-[10px] text-slate-500 hidden sm:block">
              {t.gov.dept}
            </div>
          </div>
        </div>

        {/* Right: Accessibility & Language Switcher */}
        <div className="flex items-center space-x-4 text-[11px]">
          <a
            href="#main-content"
            className="text-gov-navy hover:underline hidden lg:inline-block font-medium"
          >
            {t.gov.skipToMain}
          </a>

          <div className="h-3.5 w-px bg-slate-300 hidden lg:block"></div>

          {/* Font Size Selector */}
          <div className="flex items-center space-x-1 font-semibold text-slate-600">
            <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">{t.gov.textSize}:</span>
            <button
              onClick={() => setFontSize('small')}
              title="Decrease text size"
              className={`px-1.5 py-0.5 rounded border border-slate-300 text-[10px] hover:bg-slate-100 ${
                fontSize === 'small' ? 'bg-slate-200 font-bold text-slate-900' : ''
              }`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('normal')}
              title="Default text size"
              className={`px-1.5 py-0.5 rounded border border-slate-300 text-[10px] hover:bg-slate-100 ${
                fontSize === 'normal' ? 'bg-slate-200 font-bold text-slate-900' : ''
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              title="Increase text size"
              className={`px-1.5 py-0.5 rounded border border-slate-300 text-[10px] hover:bg-slate-100 ${
                fontSize === 'large' ? 'bg-slate-200 font-bold text-slate-900' : ''
              }`}
            >
              A+
            </button>
          </div>

          <div className="h-3.5 w-px bg-slate-300"></div>

          {/* Clean Language Switcher (Pill Style) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-300 text-[11px] font-medium">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded transition ${
                lang === 'en'
                  ? 'bg-[#1E3A8A] text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-2 py-0.5 rounded transition ${
                lang === 'hi'
                  ? 'bg-[#1E3A8A] text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GovHeader;
