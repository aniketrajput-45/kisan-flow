// Official Government of India MSP Rates & FCI Uniform Specifications (RMS 2025-26 & KMS 2024-25/25-26)
export const GOV_CROP_STANDARDS = {
  WHEAT: {
    nameEn: 'Wheat',
    nameHi: 'गेहूं (Wheat)',
    ratePerKg: 24.25,
    ratePerQtl: 2425,
    maxMoisturePct: 12.0,
    season: 'RMS 2025-26',
  },
  PADDY: {
    nameEn: 'Paddy / Rice',
    nameHi: 'धान (Paddy)',
    ratePerKg: 23.00, // Common
    ratePerKgGradeA: 23.20,
    ratePerQtl: 2300,
    ratePerQtlGradeA: 2320,
    maxMoisturePct: 17.0,
    season: 'KMS 2024-25',
  },
  MUSTARD: {
    nameEn: 'Mustard / Rapeseed',
    nameHi: 'सरसों (Mustard)',
    ratePerKg: 59.50,
    ratePerQtl: 5950,
    maxMoisturePct: 8.0,
    season: 'RMS 2025-26',
  },
  GRAM: {
    nameEn: 'Gram / Chana',
    nameHi: 'चना (Gram)',
    ratePerKg: 56.50,
    ratePerQtl: 5650,
    maxMoisturePct: 12.0,
    season: 'RMS 2025-26',
  },
  BARLEY: {
    nameEn: 'Barley',
    nameHi: 'जौ (Barley)',
    ratePerKg: 19.80,
    ratePerQtl: 1980,
    maxMoisturePct: 12.0,
    season: 'RMS 2025-26',
  },
  MAIZE: {
    nameEn: 'Maize / Corn',
    nameHi: 'मक्का (Maize)',
    ratePerKg: 22.25,
    ratePerQtl: 2225,
    maxMoisturePct: 14.0,
    season: 'KMS 2024-25',
  },
  COTTON: {
    nameEn: 'Cotton',
    nameHi: 'कपास (Cotton)',
    ratePerKg: 71.21,
    ratePerKgGradeA: 75.21,
    ratePerQtl: 7121,
    ratePerQtlGradeA: 7521,
    maxMoisturePct: 8.0,
    season: 'KMS 2024-25',
  },
  SOYBEAN: {
    nameEn: 'Soybean',
    nameHi: 'सोयाबीन (Soybean)',
    ratePerKg: 48.92,
    ratePerQtl: 4892,
    maxMoisturePct: 12.0,
    season: 'KMS 2024-25',
  },
  PULSES: {
    nameEn: 'Tur / Arhar Pulses',
    nameHi: 'दाल / तुअर (Pulses)',
    ratePerKg: 75.50,
    ratePerQtl: 7550,
    maxMoisturePct: 10.0,
    season: 'KMS 2024-25',
  },
  GROUNDNUT: {
    nameEn: 'Groundnut',
    nameHi: 'मूंगफली (Groundnut)',
    ratePerKg: 67.83,
    ratePerQtl: 6783,
    maxMoisturePct: 8.0,
    season: 'KMS 2024-25',
  },
  BAJRA: {
    nameEn: 'Bajra',
    nameHi: 'बाजरा (Bajra)',
    ratePerKg: 26.25,
    ratePerQtl: 2625,
    maxMoisturePct: 12.0,
    season: 'KMS 2024-25',
  },
  JOWAR: {
    nameEn: 'Jowar',
    nameHi: 'ज्वार (Jowar)',
    ratePerKg: 33.71,
    ratePerKgGradeA: 34.21,
    ratePerQtl: 3371,
    ratePerQtlGradeA: 3421,
    maxMoisturePct: 12.0,
    season: 'KMS 2024-25',
  },
  SUGARCANE: {
    nameEn: 'Sugarcane FRP',
    nameHi: 'गन्ना (Sugarcane)',
    ratePerKg: 3.40,
    ratePerQtl: 340,
    maxMoisturePct: 15.0,
    season: 'Sugar Season 2024-25',
  },
};

/**
 * Returns the official standard and effective rate for a crop string and selected grade
 */
export const getCropStandard = (cropString, grade = 'Grade A') => {
  if (!cropString) return GOV_CROP_STANDARDS.WHEAT;
  const raw = String(cropString).toUpperCase().trim();

  let key = 'WHEAT';
  if (raw.includes('PADDY') || raw.includes('RICE') || raw.includes('धान')) key = 'PADDY';
  else if (raw.includes('MUSTARD') || raw.includes('सरसों') || raw.includes('RAPESEED')) key = 'MUSTARD';
  else if (raw.includes('GRAM') || raw.includes('CHANA') || raw.includes('चना')) key = 'GRAM';
  else if (raw.includes('COTTON') || raw.includes('कपास')) key = 'COTTON';
  else if (raw.includes('MAIZE') || raw.includes('CORN') || raw.includes('मक्का')) key = 'MAIZE';
  else if (raw.includes('SOYBEAN') || raw.includes('सोयाबीन')) key = 'SOYBEAN';
  else if (raw.includes('BARLEY') || raw.includes('जौ')) key = 'BARLEY';
  else if (raw.includes('GROUNDNUT') || raw.includes('मूंगफली')) key = 'GROUNDNUT';
  else if (raw.includes('PULSE') || raw.includes('TUR') || raw.includes('तुअर') || raw.includes('ARHAR')) key = 'PULSES';
  else if (raw.includes('BAJRA') || raw.includes('बाजरा')) key = 'BAJRA';
  else if (raw.includes('JOWAR') || raw.includes('ज्वार')) key = 'JOWAR';
  else if (raw.includes('SUGAR') || raw.includes('गन्ना')) key = 'SUGARCANE';

  const item = GOV_CROP_STANDARDS[key] || GOV_CROP_STANDARDS.WHEAT;

  const isGradeA = grade === 'Grade A' || grade === 'GRADE_A';
  const effectiveRatePerKg = isGradeA && item.ratePerKgGradeA ? item.ratePerKgGradeA : item.ratePerKg;
  const effectiveRatePerQtl = isGradeA && item.ratePerQtlGradeA ? item.ratePerQtlGradeA : item.ratePerQtl;

  return {
    key,
    nameEn: item.nameEn,
    nameHi: item.nameHi,
    ratePerKg: effectiveRatePerKg,
    ratePerQtl: effectiveRatePerQtl,
    maxMoisturePct: item.maxMoisturePct,
    season: item.season,
  };
};
