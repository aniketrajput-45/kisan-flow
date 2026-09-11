import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    dashboard: 'Dashboard',
    myPasses: 'My Passes',
    liveQueue: 'Live Queue',
    payments: 'Payments',
    bookSlot: 'Book Slot',
    logout: 'Logout',
    welcome: 'Namaste',
    welcomeSub: 'Welcome to KisanFlow Procurement & Live Queue Portal',
    activeBookingTitle: 'Active Procurement Token Pass',
    noActiveBooking: 'No Active Booking Token',
    noActiveBookingSub: 'Book a slot at your nearest procurement centre to receive an official token and QR pass.',
    bookSlotNow: 'Book Slot Now',
    tokenNumber: 'Token Number',
    crop: 'Crop',
    quantity: 'Quantity',
    centre: 'Procurement Centre',
    dateSlot: 'Date & Time Slot',
    status: 'Status',
    peopleAhead: 'People Ahead',
    estimatedWait: 'Est. Waiting Time',
    currentlyProcessing: 'Currently Processing Token',
    trackQueue: 'Track Live Queue',
    viewPassDetails: 'View QR Pass',
    paymentStatus: 'Payment Status',
    iveArrived: "I've Arrived at Centre",
    helpFaq: 'Help & FAQ',
    profile: 'Farmer Profile',
    notifications: 'Notifications',
    selectLanguage: 'Select Language',
    language: 'Language',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    myPasses: 'मेरे पास',
    liveQueue: 'लाइव कतार',
    payments: 'भुगतान',
    bookSlot: 'स्लॉट बुक करें',
    logout: 'लॉगआउट',
    welcome: 'नमस्ते',
    welcomeSub: 'किसानफ्लो खरीद और लाइव कतार पोर्टल में आपका स्वागत है',
    activeBookingTitle: 'सक्रिय खरीद टोकन पास',
    noActiveBooking: 'कोई सक्रिय बुकिंग टोकन नहीं',
    noActiveBookingSub: 'आधिकारिक टोकन और क्यूआर पास प्राप्त करने के लिए निकटतम खरीद केंद्र पर स्लॉट बुक करें।',
    bookSlotNow: 'अभी स्लॉट बुक करें',
    tokenNumber: 'टोकन संख्या',
    crop: 'फसल',
    quantity: 'मात्रा',
    centre: 'खरीद केंद्र',
    dateSlot: 'तिथि और समय स्लॉट',
    status: 'स्थिति',
    peopleAhead: 'आगे कतार में किसान',
    estimatedWait: 'अनुमानित प्रतीक्षा समय',
    currentlyProcessing: 'वर्तमान में प्रसंस्कृत टोकन',
    trackQueue: 'लाइव कतार ट्रैक करें',
    viewPassDetails: 'क्यूआर पास देखें',
    paymentStatus: 'भुगतान स्थिति',
    iveArrived: 'मैं केंद्र पहुँच गया हूँ',
    helpFaq: 'सहायता एवं सवाल',
    profile: 'किसान प्रोफ़ाइल',
    notifications: 'सूचनाएं',
    selectLanguage: 'भाषा चुनें',
    language: 'भाषा',
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    myPasses: 'আমার পাস',
    liveQueue: 'লাইভ সারি',
    payments: 'পেমেন্ট',
    bookSlot: 'স্লট বুক করুন',
    logout: 'লগআউট',
    welcome: 'নমস্তে',
    welcomeSub: 'কিসানফ্লো সংগ্রহ এবং লাইভ কিউ পোর্টালে স্বাগতম',
    activeBookingTitle: 'সক্রিয় সংগ্রহ টোকেন পাস',
    noActiveBooking: 'কোনো সক্রিয় বুকিং টোকেন নেই',
    noActiveBookingSub: 'অফিসিয়াল টোকেন এবং QR পাস পেতে নিকটস্থ সংগ্রহ কেন্দ্রে স্লট বুক করুন।',
    bookSlotNow: 'এখনই স্লট বুক করুন',
    tokenNumber: 'টোকেন নম্বর',
    crop: 'ফসল',
    quantity: 'পরিমাণ',
    centre: 'সংগ্রহ কেন্দ্র',
    dateSlot: 'তারিখ এবং সময় স্লট',
    status: 'অবস্থা',
    peopleAhead: 'সামনে অপেক্ষারত কৃষক',
    estimatedWait: 'আনুপাতিক অপেক্ষার সময়',
    currentlyProcessing: 'বর্তমানে প্রক্রিয়াধীন টোকেন',
    trackQueue: 'লাইভ সারি ট্র্যাক করুন',
    viewPassDetails: 'QR পাস দেখুন',
    paymentStatus: 'পেমেন্ট স্ট্যাটাস',
    iveArrived: 'আমি কেন্দ্রে পৌঁছেছি',
    helpFaq: 'সাহায্য ও প্রশ্ন',
    profile: 'কৃষক প্রোফাইল',
    notifications: 'বিজ্ঞপ্তি',
    selectLanguage: 'ভাষা নির্বাচন করুন',
    language: 'ভাষা',
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if not wrapped in provider
    return {
      lang: 'en',
      setLang: () => {},
      t: (key) => translations['en']?.[key] || key,
    };
  }
  return context;
};
