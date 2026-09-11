const redisClient = require('../config/redis');

// Official Government of India MSP Rates & FCI Uniform Specifications (RMS 2025-26 & KMS 2024-25/25-26)
const GOV_OFFICIAL_MSP_CATALOG = {
  WHEAT: {
    name: 'Wheat (गेहूं)',
    perQuintal: 2425,
    perKg: 24.25,
    maxMoisture: 12.0,
    season: 'RMS 2025-26',
  },
  PADDY: {
    name: 'Paddy - Common (धान सामान्य)',
    perQuintal: 2300,
    perKg: 23.00,
    perQuintalGradeA: 2320,
    perKgGradeA: 23.20,
    maxMoisture: 17.0,
    season: 'KMS 2024-25',
  },
  MUSTARD: {
    name: 'Mustard / Rapeseed (सरसों)',
    perQuintal: 5950,
    perKg: 59.50,
    maxMoisture: 8.0,
    season: 'RMS 2025-26',
  },
  GRAM: {
    name: 'Gram / Chana (चना)',
    perQuintal: 5650,
    perKg: 56.50,
    maxMoisture: 12.0,
    season: 'RMS 2025-26',
  },
  BARLEY: {
    name: 'Barley (जौ)',
    perQuintal: 1980,
    perKg: 19.80,
    maxMoisture: 12.0,
    season: 'RMS 2025-26',
  },
  MAIZE: {
    name: 'Maize / Corn (मक्का)',
    perQuintal: 2225,
    perKg: 22.25,
    maxMoisture: 14.0,
    season: 'KMS 2024-25',
  },
  COTTON: {
    name: 'Cotton - Medium Staple (कपास)',
    perQuintal: 7121,
    perKg: 71.21,
    perQuintalGradeA: 7521,
    perKgGradeA: 75.21,
    maxMoisture: 8.0,
    season: 'KMS 2024-25',
  },
  SOYBEAN: {
    name: 'Soybean (सोयाबीन)',
    perQuintal: 4892,
    perKg: 48.92,
    maxMoisture: 12.0,
    season: 'KMS 2024-25',
  },
  GROUNDNUT: {
    name: 'Groundnut (मूंगफली)',
    perQuintal: 6783,
    perKg: 67.83,
    maxMoisture: 8.0,
    season: 'KMS 2024-25',
  },
  PULSES: {
    name: 'Tur / Arhar (तुअर / अरहर)',
    perQuintal: 7550,
    perKg: 75.50,
    maxMoisture: 10.0,
    season: 'KMS 2024-25',
  },
  BAJRA: {
    name: 'Bajra (बाजरा)',
    perQuintal: 2625,
    perKg: 26.25,
    maxMoisture: 12.0,
    season: 'KMS 2024-25',
  },
  JOWAR: {
    name: 'Jowar (ज्वार)',
    perQuintal: 3371,
    perKg: 33.71,
    perQuintalGradeA: 3421,
    perKgGradeA: 34.21,
    maxMoisture: 12.0,
    season: 'KMS 2024-25',
  },
  SUGARCANE: {
    name: 'Sugarcane FRP (गन्ना)',
    perQuintal: 340,
    perKg: 3.40,
    maxMoisture: 15.0,
    season: 'Sugar Season 2024-25',
  },
};

class MspService {
  /**
   * Normalizes arbitrary user/booking crop string to catalog key
   */
  normalizeCropKey(cropInput) {
    if (!cropInput) return 'WHEAT';
    const raw = String(cropInput).toUpperCase().trim();

    if (raw.includes('PADDY') || raw.includes('RICE') || raw.includes('धान')) return 'PADDY';
    if (raw.includes('MUSTARD') || raw.includes('सरसों') || raw.includes('RAPESEED')) return 'MUSTARD';
    if (raw.includes('GRAM') || raw.includes('CHANA') || raw.includes('चना')) return 'GRAM';
    if (raw.includes('COTTON') || raw.includes('कपास')) return 'COTTON';
    if (raw.includes('MAIZE') || raw.includes('CORN') || raw.includes('मक्का')) return 'MAIZE';
    if (raw.includes('SOYBEAN') || raw.includes('सोयाबीन')) return 'SOYBEAN';
    if (raw.includes('GROUNDNUT') || raw.includes('मूंगफली')) return 'GROUNDNUT';
    if (raw.includes('BARLEY') || raw.includes('जौ')) return 'BARLEY';
    if (raw.includes('BAJRA') || raw.includes('बाजरा')) return 'BAJRA';
    if (raw.includes('JOWAR') || raw.includes('ज्वार')) return 'JOWAR';
    if (raw.includes('PULSE') || raw.includes('TUR') || raw.includes('ARHAR') || raw.includes('तुअर')) return 'PULSES';
    if (raw.includes('SUGAR') || raw.includes('गन्ना')) return 'SUGARCANE';

    return 'WHEAT';
  }

  /**
   * Fetches live rate for a crop from Open Gov API (with automatic fallback to official CCEA gazette)
   */
  async getMspForCrop(cropInput, grade = 'Grade A', state = 'West Bengal') {
    const cropKey = this.normalizeCropKey(cropInput);
    const standard = GOV_OFFICIAL_MSP_CATALOG[cropKey] || GOV_OFFICIAL_MSP_CATALOG.WHEAT;

    const isGradeA = grade === 'Grade A' || grade === 'GRADE_A';
    let ratePerKg = isGradeA && standard.perKgGradeA ? standard.perKgGradeA : standard.perKg;
    let ratePerQuintal = isGradeA && standard.perQuintalGradeA ? standard.perQuintalGradeA : standard.perQuintal;
    let dataSource = 'GOV_OFFICIAL_CCEA';

    const cacheKey = `msp:${cropKey}:${grade}:${state || 'ALL'}`;

    // 1. Check Redis Cache
    try {
      if (redisClient && typeof redisClient.get === 'function') {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (cacheErr) {
      // Non-fatal
    }

    // 2. Optional: Attempt Live Fetch from data.gov.in if API key is provided
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    if (apiKey) {
      try {
        const commodityName = cropKey.charAt(0) + cropKey.slice(1).toLowerCase();
        const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&filters[commodity]=${encodeURIComponent(commodityName)}&limit=1`;

        const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
        if (response.ok) {
          const json = await response.json();
          if (json.records && json.records.length > 0 && json.records[0].modal_price) {
            const modalPrice = parseFloat(json.records[0].modal_price);
            if (modalPrice > 0) {
              ratePerQuintal = modalPrice;
              ratePerKg = parseFloat((modalPrice / 100).toFixed(2));
              dataSource = 'DATA_GOV_IN_LIVE';
            }
          }
        }
      } catch (fetchErr) {
        // Fallback safely to CCEA rates
        dataSource = 'GOV_OFFICIAL_CCEA';
      }
    }

    const result = {
      crop_key: cropKey,
      crop_name: standard.name,
      grade: grade,
      rate_per_kg: ratePerKg,
      rate_per_quintal: ratePerQuintal,
      max_moisture_pct: standard.maxMoisture,
      season: standard.season,
      source: dataSource,
      updated_at: new Date().toISOString(),
    };

    // Cache in Redis for 1 hour
    try {
      if (redisClient && typeof redisClient.set === 'function') {
        await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      }
    } catch (e) {
      // Non-fatal
    }

    return result;
  }

  /**
   * Returns complete catalog of supported crops
   */
  getAllStandards() {
    return GOV_OFFICIAL_MSP_CATALOG;
  }
}

module.exports = new MspService();
